var crypto = require('../utils/crypto');
var express = require('express');
var db = require('../utils/db');
var http = require("../utils/http");

var app = express();
var hallAddr = "";

function send(res,ret){
	var str = JSON.stringify(ret);
	res.send(str)
}

var config = null;

exports.start = function(cfg){
	config = cfg;
	hallAddr = config.HALL_IP  + ":" + config.HALL_CLIENT_PORT;
	app.listen(config.CLIENT_PORT);
	console.log("account server is listening on " + config.CLIENT_PORT);
}

//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

app.get('/register',function(req,res){
	var account = req.query.account;
	var password = req.query.password;

	var fnFailed = function(){
		send(res,{errcode:1,errmsg:"account has been used."});
	};

	var fnSucceed = function(){
		send(res,{errcode:0,errmsg:"ok"});	
	};

	db.is_user_exist(account,function(exist){
		if(exist){
			db.create_account(account,password,function(ret){
				if (ret) {
					fnSucceed();
				}
				else{
					fnFailed();
				}
			});
		}
		else{
			fnFailed();
			console.log("account has been used.");			
		}
	});
});

app.get('/get_version',function(req,res){
	var ret = {
		version:config.VERSION,
	}
	send(res,ret);
});

app.get('/get_serverinfo',function(req,res){
	db.get_game_version(function(ver){
		var ret = {
			version:config.VERSION,
			hall:hallAddr,
			appweb:config.APP_WEB,
			ver:ver,
		}
		send(res,ret);
	})
	
});

app.get('/guest',function(req,res){
	var account = "guest_" + req.query.account;
	var sign = crypto.md5(account + req.ip + config.ACCOUNT_PRI_KEY);
	var ret = {
		errcode:0,
		errmsg:"ok",
		account:account,
		halladdr:hallAddr,
		sign:sign
	}
	send(res,ret);
});

app.get('/auth',function(req,res){
	var account = req.query.account;
	var password = req.query.password;

	db.get_account_info(account,password,function(info){
		if(info == null){
			send(res,{errcode:1,errmsg:"invalid account"});
			return;
		}

        var account = "vivi_" + req.query.account;
        var sign = get_md5(account + req.ip + config.ACCOUNT_PRI_KEY);
        var ret = {
            errcode:0,
            errmsg:"ok",
            account:account,
            sign:sign
        }
        send(res,ret);
	});
});
var appInfo = {
	Android:{
		appid : "wx33fe6985d2c1f969",
		secret: "96ac04a06c6393df1d600a0492f6cb55",
	},
	iOS:{
		appid : "wx33fe6985d2c1f969",
		secret: "96ac04a06c6393df1d600a0492f6cb55",
	}
};
function get_access_token(code,os,callback){
	var info = appInfo[os];
	if(info == null){
		callback(false,null);
	}
	var data = {
		appid:info.appid,
		secret:info.secret,
		code:code,
		grant_type:"authorization_code"
	};
	http.get2("https://api.weixin.qq.com/sns/oauth2/access_token",data,callback,true);
}

function get_state_info(access_token,openid,callback){
	var data = {
		access_token:access_token,
		openid:openid
	};

	http.get2("https://api.weixin.qq.com/sns/userinfo",data,callback,true);
}

function create_user(account,name,sex,headimgurl,callback){
	var coins = 0;
	var gems = 0;
	var testcoins = 200;
    
    console.log('create_user');
    
    //!!@@添加注册送房卡的数据库配置
    db.get_reg_gems(function(ret) {
        gems = ret;
        console.log('gems is ' + gems);
    
        db.is_user_exist(account,function(ret){
            if(!ret){
				console.log('gems is ' + gems);
				console.log('testcoins is ' + testcoins);
                db.create_user(account,name,coins,gems,sex,headimgurl,testcoins,function(ret){
                    callback();
                });
            }
            else{
                console.log('exist');
                db.update_user_info(account,name,headimgurl,sex,function(ret){
                    callback();
                });
            }
        });
    });
};
app.get('/wechat_auth',function(req,res){
	var code = req.query.code;
	var os = req.query.os;
	console.log("安卓微信登录 == "+code)
	console.log("安卓微信登录 == "+os)
	if(code == null || code == "" || os == null || os == ""){
		return;
	}
	console.log("微信登录 == "+os);
	get_access_token(code,os,function(suc,data){
		if(suc){
			var access_token = data.access_token;
			var openid = data.openid;
			get_state_info(access_token,openid,function(suc2,data2){
				if(suc2){
                    if (!data2.openid || !data2.nickname || !data2.headimgurl) {
                        console.log('data2 is ' + JSON.stringify(data2));
                        send(res,{errcode:-1,errmsg:"unkown err."});
                        return;
                    }
					var openid = data2.openid;
					var nickname = data2.nickname;
					var sex = data2.sex;
					var headimgurl = data2.headimgurl;
					var account = "wx_" + openid;
					create_user(account,nickname,sex,headimgurl,function(){
						var sign = crypto.md5(account + req.ip + config.ACCOUNT_PRI_KEY);
					    var ret = {
					        errcode:0,
					        errmsg:"ok",
					        account:account,
					        halladdr:hallAddr,
					        sign:sign
						};
						if(!data2.headimgurl){
							ret.image = 0;
							send(res,ret)
						}
						else{
							db.get_user_data(account,function(uData){
								http.get3(headimgurl,uData.userid,function(eData){
									if(eData){
										ret.image = 1;
										send(res, ret);
									}
									else{
										ret.image = 0;
										send(res,ret)
									}
								})
							})	
						}
						
					});						
				}
			});
		}
		else{
			send(res,{errcode:-1,errmsg:"unkown err."});
		}
	});
});

app.get('/base_info',function(req,res){
	var userid = req.query.userid;
	db.get_user_base_info(userid,function(data){
		var ret = {
	        errcode:0,
	        errmsg:"ok",
			name:data.name,
			sex:data.sex,
	        headimgurl:data.headimg
	    };
	    send(res,ret);
	});
});