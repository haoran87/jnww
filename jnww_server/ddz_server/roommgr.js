var db = require('../utils/db');
var assert = require('assert');
var userMgr = require("./usermgr")
var fs = require("fs");
var logf = function (roomId, logContent) {
	fs.appendFile('log/' + roomId + '.log', '' + Date.now() + ' ' + logContent + '\r\n', function () { });
};

var rooms = {};
var creatingRooms = {};
var userLocation = {};
var totalRooms = 0;
var player_count = 3;
var JU_SHU = [8, 12, 18];
var JU_SHU_COST = [1, 2, 3];
exports.quanRoomInfo = [];
var ishuoqu = true;

//生成房间号
function generateRoomId() {
	var roomId = "";
	for (var i = 0; i < 6; ++i) {
		roomId += Math.floor(Math.random() * 10);
	}
	return roomId;
}
//实例化一个房间
function constructRoomFromDb(dbdata) {
	var roomInfo = {
		uuid: dbdata.uuid,
		id: dbdata.id,
		numOfGames: dbdata.num_of_turns,
		createTime: dbdata.create_time,
		nextButton: dbdata.next_button,//庄
		seats: new Array(player_count),
		conf: JSON.parse(dbdata.base_info),
		beginTimer: null,
		downTime: 3,
		rsList: [0, 0, 0, 0, 0, 0],
		gameDowntime:30,
		gameTimer:null,
	};
	roomInfo.gameMgr = require("./gamemgr_niuniu_lnna");
	var roomId = roomInfo.id;
	for (var i = 0; i < player_count; ++i) {
		var s = roomInfo.seats[i] = {};
		s.userId = dbdata["user_id" + i];
		s.score = dbdata["user_score" + i];
		s.name = dbdata["user_name" + i];
		s.ready = false;
		s.seatIndex = i;
		s.bombNum = 0;
		s.winNum = 0;
		s.loseNum = 0;
		s.djgNum = 0;
		s.isPeep = false;
		s.isFirstIn = s.userId > 0 ? false:true;
		if (s.userId > 0) {
			userLocation[s.userId] = {
				roomId: roomId,
				seatIndex: i
			};
		}
	}

	rooms[roomId] = roomInfo;
	totalRooms++;
	return roomInfo;
}
//创建房间 
exports.createRoom = function (creator, roomConf, gems, ip, port, quanId, quanZhu,callback) {
	if (roomConf == null || roomConf.type == null) {
		callback(1, null);
		return;
	}
	if (roomConf.jushu < 0 || roomConf.jushu >= JU_SHU.length) {
		callback(1, null);
		return;
	}
	var type = roomConf.type;
	var jushu = JU_SHU[roomConf.jushu];
	var cost = JU_SHU_COST[roomConf.jushu];
	var max = roomConf.max;
	var fee = roomConf.fee;
	
	if(quanZhu == -1){
		if (cost > gems) {
			callback(2222, null);
			return;
		}
	}

	var fnCreate = function () {
		var roomId = generateRoomId();
		if (rooms[roomId] != null || creatingRooms[roomId] != null) {
			fnCreate();
		}
		else {
			creatingRooms[roomId] = true;
			db.is_room_exist(roomId, function (ret) {
				if (ret) {
					delete creatingRooms[roomId];
					fnCreate();
				}
				else {
					var createTime = Math.ceil(Date.now() / 1000);
					var roomInfo = {
						uuid: "", //数据库指定uuid
						id: roomId,
						numOfGames: 0,//第几局
						createTime: createTime,
						nextButton: 0,
						seats: [],
						pokers: [],
						beginTimer: null,
						downTime: 3,
						rsList: [0, 0, 0, 0, 0, 0],
						gameTimer:null,
						gameDowntime:30,
						isFirst:true,
						conf: {
							type: type,
							difen: [1,2,3],
							maxGames: jushu,
							cost: cost,
							creator: creator,
							max: max,
							fee: fee,
							createTime: createTime,
							quanZhu:quanZhu,
							quanId:quanId,
						}
					};
					roomInfo.gameMgr = require("./gamemgr_niuniu_lnna");
					for (var i = 0; i < player_count; ++i) {
						roomInfo.seats.push({
							userId: 0,
							score: 0,
							name: "",
							ready: false,
							seatIndex: i,
							scoreList: [],
							bombNum:0,
							winNum:0,
							loseNum:0,
							djgNum:0,
							isFirstIn:true,
							isPeep:false,
						});
					}
					//写入数据库
					db.create_room(roomInfo.id, roomInfo.conf, ip, port, createTime, creator,quanId, function (uuid) {
						delete creatingRooms[roomId];
						if (uuid != null) {
							roomInfo.uuid = uuid;
							rooms[roomId] = roomInfo;//rooms对象
							totalRooms++;
							if (quanZhu != -1) {
								gems -= cost;
								db.cost_gems(quanZhu, cost,function(ret){
									exports.quanRoomInfo.push(quanZhu);
								});
							}
							callback(0, roomId, gems);
						}
						else {
							callback(3, null);
						}
					});
				}
			});
		}
	}
	fnCreate();
};
//删除房间
exports.destroy = function (roomId,backGems) {
	var roomInfo = rooms[roomId];
	if (roomInfo == null) {
		return;
	}
	for (var i = 0; i < player_count; ++i) {
		var userId = roomInfo.seats[i].userId;
		if (userId > 0) {
			delete userLocation[userId];
			db.set_room_id_of_user(userId, null);
		}
	}
	var conf = roomInfo.conf;
	if(conf.quanId != -1){
		exports.quanRoomInfo.push(conf.quanId);
		if (backGems && conf.quanZhu != -1) {
			var cost = conf.cost;
			db.cost_gems(conf.quanZhu,-cost,function(ret){
				if(ret){
					exports.quanRoomInfo.push(conf.quanZhu);
				}
				
			})
			
		}
	}
	delete rooms[roomId];
	totalRooms--;
	db.delete_room(roomId);
}


//在线房间总数
exports.getTotalRooms = function () {
	return totalRooms;
}
//通过房间id ，获得房间
exports.getRoom = function (roomId) {
	return rooms[roomId];
};
//房主
exports.isCreator = function (roomId, userId) {
	var roomInfo = rooms[roomId];
	if (roomInfo == null) {
		return false;
	}
	return roomInfo.conf.creator == userId;
};
exports.isQuan = function (roomId) {
	var roomInfo = rooms[roomId];
	if (roomInfo == null) {
		return false;
	}
	var conf = roomInfo.conf
	if(conf.quanId){
		return true;
	}
	else{
		return false;
	}
};
exports.isQuanZhu = function (roomId,userId) {
	var roomInfo = rooms[roomId];
	if (roomInfo == null) {
		return false;
	}
	var conf = roomInfo.conf
	return conf.quanZhu == userId;
};
exports.getConf = function(roomId){
	var roomInfo = rooms[roomId];
	if (roomInfo == null) {
		return null;
	}
	 return roomInfo.conf;
}
// exports.is
//进入房间
exports.enterRoom = function (roomId, userId, userName,mapInfo, callback) {
	var fnTakeSeat = function (room, gems, lv,sex) { 
		if (exports.getUserRoom(userId) == roomId) {
			//已存在
			for (var i = 0; i < player_count; i++) {
				var seat = room.seats[i];
				if (seat.userId == userId) {
					seat.gems = gems;
					seat.lv = lv;
					seat.sex = sex;
					seat.mapInfo = mapInfo;
					break;
				}
			}
			return 0;
		}
		if (room.conf.fee == 1) {
			if (gems < room.conf.cost) {
				return 2222;
			}
		}
		for (var i = 0; i < player_count; ++i) {
			var seat = room.seats[i];
			if (seat.userId <= 0) {
				seat.userId = userId;
				seat.name = userName;
				seat.gems = gems;//!!20171120 	
				seat.lv = lv; // 20180131 添加
				seat.mapInfo = mapInfo;
				seat.sex = sex;
				userLocation[userId] = {
					roomId: roomId,
					seatIndex: i
				};
				db.update_seat_info(roomId, i, seat.userId, "", seat.name);
				//正常
				return 0;
			}
		}
		//房间已满
		return 1;
	}
	var room = rooms[roomId];
	db.get_user_data_by_userid(userId, function (data) {
		if (room) {
			var ret = fnTakeSeat(room, data.gems, data.lv,data.sex);    //去除lv
			callback(ret);
		}
		else {
			db.get_room_data(roomId, function (dbdata) {
				if (dbdata == null) {
					callback(2);
				}
				else {
					room = constructRoomFromDb(dbdata);
					var ret = fnTakeSeat(room, data.gems, data.lv,data.sex);
					callback(ret);
				}
			});
		}
	});
};
exports.setReady = function (userId, value) {
	var roomId = exports.getUserRoom(userId);
	if (roomId == null) {
		return;
	}
	var room = exports.getRoom(roomId);
	if (room == null) {
		return;
	}

	var seatIndex = exports.getUserSeat(userId);
	if (seatIndex == null) {
		return;
	}

	var s = room.seats[seatIndex];
	s.ready = value;
	userMgr.broacastInRoom('user_ready_push', { userid: userId, ready: true }, userId, true);
}

exports.isReady = function (userId) {
	var roomId = exports.getUserRoom(userId);
	if (roomId == null) {
		return;
	}

	var room = exports.getRoom(roomId);
	if (room == null) {
		return;
	}

	var seatIndex = exports.getUserSeat(userId);
	if (seatIndex == null) {
		return;
	}

	var s = room.seats[seatIndex];
	return s.ready;
}
exports.getRoomsInfo = function(){
	if(exports.quanRoomInfo.length > 0 && ishuoqu){
		var data = [];
		ishuoqu = false
		for(var key in exports.quanRoomInfo){
			if(typeof(exports.quanRoomInfo[key]) == "string"){
				data.push(exports.quanRoomInfo[key])
			}
			if(data.length == exports.quanRoomInfo.length){
				exports.quanRoomInfo = [];
				ishuoqu = true;
			}
		}
		console.log("ee   tt  "+data)
		return data
	}
	else{
		return []
	}
}

exports.getUserRoom = function (userId) {
	var location = userLocation[userId];
	if (location != null) {
		return location.roomId;
	}
	return null;
};

// 20180116 
exports.isGameRunning = function (roomId) {
	// 房间开始    20180116 修改
	var room = rooms[roomId];
	var begin = room.gameMgr.isGameRunning(roomId);
	return begin;
}

exports.getUserSeat = function (userId) {
	var location = userLocation[userId];
	if (location != null) {
		return location.seatIndex;
	}
	return null;
};

exports.getUserLocations = function () {
	return userLocation;
};

exports.exitRoom = function (userId) {
	var location = userLocation[userId];
	if (location == null) return;
	var roomId = location.roomId;
	var seatIndex = location.seatIndex;
	var room = rooms[roomId];
	if (room == null || seatIndex == null) {
		return;
	}
	userMgr.broacastInRoom('exit_notify_push', userId, userId, false);
	userMgr.sendMsg(userId,"exit_result");
	userMgr.gameDdisconnect(userId,true);
	var seat = room.seats[seatIndex];
	seat.userId = 0;
	seat.name = "";
	seat.ready = false;
	var user_id = "user_id" + seatIndex;
	var user_name = "user_name" + seatIndex;
	
	delete userLocation[userId];
	db.set_room_id_of_user(userId, null);
	db.set_userid_of_room(user_id, roomId , user_name);
	if(room.conf.quanId != -1){
		seat.isFirstIn = true;
		exports.quanRoomInfo.push(room.conf.quanId)
	}
	
};