var crypto = require('../utils/crypto');
var express = require('express');
var db = require('../utils/db');
var http = require('../utils/http');
var app = express();


var hallIp = null;
var config = null;
var serverMap = {};

//设置跨域访问
app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By",' 3.2.1');
	res.header("Content-Type", "application/json;charset=utf-8");
	next();
});

app.get('/register_quan_gs',function(req,res){	
	var ip = req.ip;
	var clientip = req.query.clientip;
	var clientport = req.query.clientport;
	var httpPort = req.query.httpPort;
	var load = req.query.load;
	var id = clientip + ":" + clientport;
    var server_id = config.MATCH_SERVER_ID;


	if(serverMap[id]){
		var info = serverMap[id];
		if(info.clientport != clientport
			|| info.httpPort != httpPort
			|| info.ip != ip
		){
			console.log("duplicate gsid:" + id + ",addr:" + ip + "(" + httpPort + ")");
			http.send(res,1,"duplicate gsid:" + id);
			return;
		}
		info.load = load;
		http.send(res,0,"ok",{ip:ip});
		return;
	}
	serverMap[id] = {
		ip:ip,
		id:id,
		clientip:clientip,
		clientport:clientport,
		httpPort:httpPort,
		load:load
	};
	http.send(res,0,"ok",{ip:ip});
	console.log("game server registered.\n\tid:" + id + "\n\taddr:" + ip + "\n\thttp port:" + httpPort + "\n\tsocket clientport:" + clientport);

	var reqdata = {
		serverid:server_id,
        id:id,
		sign:crypto.md5(id+config.MATCH_PRI_KEY)
	};
	//获取服务器信息
	http.get(ip,httpPort,"/get_server_info",reqdata,function(ret,data){
		if(ret && data.errcode == 0){
			for(var i = 0; i < data.userroominfo.length; i += 2){
				var userId = data.userroominfo[i];
				var roomId = data.userroominfo[i+1];
			}
		}
		else{
			console.log(data.errmsg);
		}
	});
});

function chooseServer(){
	var serverinfo = null;
	for(var s in serverMap){
		var info = serverMap[s];
		if(serverinfo == null){
			serverinfo = info;			
		}
		else{
			if(serverinfo.load > info.load){
				serverinfo = info;
			}
		}
	}	
	return serverinfo;
};

exports.matchRoom = function(account,userId,chang,fnCallback){
    var serverinfo = chooseServer();
    if(serverinfo == null){
		fnCallback(101,null);
		return;
	}
   	db.get_gems(account,function(data){	
		if(data != null){
			var reqdata = {
				userid:userId,
				gems:data.gems,
				chang:chang,
				coins:data.coins,			
			};
			reqdata.sign = crypto.md5(userId  + data.gems + config.MATCH_PRI_KEY);
			http.get(serverinfo.ip,serverinfo.httpPort,"/match_room",reqdata,function(ret,data){
				if(ret){ 
					if(data.errcode == 0){
						fnCallback(0,data.roomid);
					}
					else{
						fnCallback(data.errcode,null);		
					}
					return;
				}
				fnCallback(102,null);
			});	
		}
		else{
			fnCallback(103,null);
		}
	});
}

exports.enterMatchRoom = function(userId,name,coins,roomid,testcoins,referee,fnCallback){
	console.log("进入pk房间")
	var reqdata = {
		userid:userId,
		name:name,
		roomid:roomid,
		coins:coins,
		testcoins:testcoins,
		referee:referee,
	};
	reqdata.sign = crypto.md5(userId + name + roomid + config.MATCH_PRI_KEY);
	var checkRoomIsRuning = function(serverinfo,roomid,callback){
		var sign = crypto.md5(roomid + config.MATCH_PRI_KEY);
		http.get(serverinfo.ip,serverinfo.httpPort,"/is_match_runing",{roomid :roomid,sign:sign},function(ret,data){
			if(ret){
				if(data.errcode == 0 && data.runing == true){
					callback(true);
				}
				else{
					callback(false);
				}
			}
			else{
				callback(false);
			}
		});
	}

	var enterRoomReq = function(serverinfo){
		http.get(serverinfo.ip,serverinfo.httpPort,"/enter_match_room",reqdata,function(ret,data){
			if(ret){
				if(data.errcode == 0){
					db.set_match_room_id_of_user(userId,roomid,function(ret){
						fnCallback(0,{
							ip:serverinfo.clientip,
							port:serverinfo.clientport,
							token:data.token
						});
					});
				}
				else{
					console.log(data.errmsg);
					fnCallback(data.errcode,null);
				}
			}
			else{
				fnCallback(-1,null);
			}
		});
	};

	var chooseServerAndEnter = function(serverinfo){
		serverinfo = chooseServer();
		if(serverinfo != null){
			enterRoomReq(serverinfo);
		}
		else{
			fnCallback(-1,null);					
		}
	}
     ///通过房间id获取 ip port
	db.get_match_room_addr(roomid,function(ret,ip,port){
		if(ret){
			var id = ip + ":" + port;//127.0.0.1:20000
			var serverinfo = serverMap[id];
			if(serverinfo != null){
				checkRoomIsRuning(serverinfo,roomid,function(isRuning){
					if(isRuning){
						enterRoomReq(serverinfo);
					}
					else{
						chooseServerAndEnter(serverinfo);
					}
				});
			}
			else{
				chooseServerAndEnter(serverinfo);
			}
		}
		else{
			console.log("匹配金币房间放回-2")
			fnCallback(-2,null);
		}
	});
};
exports.isServerOnline = function(ip,port,userId,callback){
	var id = ip + ":" + port;
	var serverInfo = serverMap[id];
	if(!serverInfo){
		callback(false);
		return;
	}
	var sign = crypto.md5(config.HEART_JUMP);
	http.get(serverInfo.ip,serverInfo.httpPort,"/ping",{sign:sign},function(ret,data){
		db.get_match_room_id_of_user(userId,function(matchRoomId){
			if(ret){
				var data = {
					isonline:ret,
					matchroomid:matchRoomId,
				}
				callback(data);
			}
			else{
				var data = {
					isonline:ret,
					matchroomid:matchRoomId,
				}
				callback(data);
			}
		})
		
	});
};

exports.start = function($config){
	config = $config;
	app.listen(config.MATCH_PORT,config.FOR_MATCH_IP);
	console.log("match service is listening on " + config.FOR_MATCH_IP + ":" + config.MATCH_PORT);
};