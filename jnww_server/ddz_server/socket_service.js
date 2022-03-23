var crypto = require('../utils/crypto');
var db = require('../utils/db');

var tokenMgr = require('./tokenmgr');
var roomMgr = require('./roommgr');
var userMgr = require('./usermgr');
var io = null;
exports.start = function (config, mgr) {
	io = require('socket.io')(config.CLIENT_PORT);
	io.sockets.on('connection', function (socket) {
		socket.on('login', function (data) {
			data = JSON.parse(data);
			if (socket.userId != null) {
				return;
			}
			var token = data.token;
			var roomId = data.roomid;
			var time = data.time;
			var sign = data.sign;
			//检查参数合法性
			if (token == null || roomId == null || sign == null || time == null) {
				socket.emit('login_result', {
					errcode: 1,
					errmsg: "invalid parameters"
				});
				return;
			}

			//检查参数是否被篡改
			var md5 = crypto.md5(roomId + token + time + config.ROOM_PRI_KEY);
			if (md5 != sign) {
				socket.emit('login_result', {
					errcode: 2,
					errmsg: "login failed. invalid sign!"
				});
				return;
			}
			//检查token是否有效
			if (tokenMgr.isTokenValid(token) == false) {
				console.log("token out of time");
				socket.emit('login_result', {
					errcode: 3,
					errmsg: "token out of time."
				});
				return;
			}
			//检查房间合法性
			var userId = tokenMgr.getUserID(token);
			var roomId = roomMgr.getUserRoom(userId);
			userMgr.bind(userId, socket);
			var roomInfo = roomMgr.getRoom(roomId);
			var seatIndex = roomMgr.getUserSeat(userId);
			socket.userId = userId;
			roomInfo.seats[seatIndex].ip = socket.handshake.address;
			socket.gameMgr = roomInfo.gameMgr;
			var userData = null;
			var seats = [];
			for (var i = 0; i < roomInfo.seats.length; ++i) {
				var rs = roomInfo.seats[i];
				var online = false;
				if (rs.userId > 0) {
					online = userMgr.isOnline(rs.userId);
				}
				seats.push({
					userid: rs.userId,
					ip: rs.ip,
					score: rs.score,
					name: rs.name,
					online: online,
					ready: rs.ready,
					seatindex: i,
					mapInfo: rs.mapInfo,
					holds: [],
				});
				if (userId == rs.userId) {
					userData = seats[i];
				}
			}
			//通知前端
			var ret = {
				errcode: 0,
				errmsg: "ok",
				data: {
					roomid: roomInfo.id,
					conf: roomInfo.conf,
					numofgames: roomInfo.numOfGames,
					seats: seats,
				}
			};
			var sc = JSON.stringify(ret);
			var scs = crypto.guan(sc);
			var scdata = {
				scs: scs
			};
			socket.emit('login_result', scdata);
			//通知其它客户端
			userMgr.broacastInRoom('new_user_comes_push', userData, userId, true); //20180116 修改
			console.log(userId+"  连接游戏服务器")
			//玩家上线，强制设置为TRUE
			if (userData.ready) { 
				socket.gameMgr.setReady(userId);
			}
			socket.emit('login_finished');
			userMgr.quanSend();
			if (roomInfo.dr != null) {
				var dr = roomInfo.dr;
				var ramaingTime = (dr.endTime - Date.now()) / 1000;
				var data = {
					time: ramaingTime,
					states: dr.states
				};
				userMgr.sendMsg(userId, 'dissolve_notice_push', data);
			}
		});
		socket.on('ready', function (data) {
			var userId = socket.userId;
			if (userId == null) {
				return;
			}
			var roomId = roomMgr.getUserRoom(userId);
			var roomInfo = roomMgr.getRoom(roomId);
			var seatIndex = roomMgr.getUserSeat(userId);
			var seat = roomInfo.seats[seatIndex];
			if(roomInfo.conf.quanId != -1 && seat.isFirstIn){
				// seat.isFirstIn = false;
				roomMgr.quanRoomInfo.push(roomInfo.conf.quanId)
			}
			socket.gameMgr.setReady(userId);
		});
		socket.on('doQdz', function (data) {
			var userId = socket.userId;
			if (userId == null) {
				return;
			}
			socket.gameMgr.doQiangdizhu(userId, data);
		});
		socket.on('show_qzd_btn', function (data) {
			var userId = socket.userId;
			if (userId == null) {
				return;
			}
			socket.gameMgr.showQzdBtn(userId);
		});
		socket.on('play', function (data) {
			var userId = socket.userId;
			if (userId == null) {
				return;
			}
			console.log("接收到出牌的消息 == ")
			var data = JSON.parse(data);
			socket.gameMgr.play(socket.userId, data);
		});

		socket.on("pokers_tip", function (data) {
			var userId = socket.userId;
			console.log("socket  userId === " + userId)
			if (userId == null) {
				return;
			}
			socket.gameMgr.tip(userId);
		});

		socket.on("get_user_mapInfo", function () {
			var userId = socket.userId;
			var roomId = roomMgr.getUserRoom(userId);
			var roomInfo = roomMgr.getRoom(roomId);
			var seats = roomInfo.seats;
			userMgr.sendMsg(userId, "return_user_mapInfo", {
				seats: seats
			})
		});

		socket.on("check_peep_rights", function (data) {
			var userId = socket.userId;
			db.get_user_data_by_userid(userId, function (uData) {
				if (uData) {
					if (uData.status == 2) {
						socket.gameMgr.doPeep(socket.userId, data);
					} else {
					}
				}
			})
		});
		socket.on('dipai', function (data) {
			var userId = socket.userId;
			if (userId == null) {
				return;
			}
			socket.gameMgr.doDiPai(userId, JSON.parse(data));
		});

		socket.on('other_dipai', function (data) {
			var userId = socket.userId;
			if (userId == null) {
				return;
			}
			socket.gameMgr.doOtherDipai(userId, JSON.parse(data));
		});
		socket.on('kaipai', function (data) {
			console.log('kaipai');
			var userId = socket.userId;
			if (userId == null) {
				return;
			}
			socket.gameMgr.doKaiPai(userId);
		});

		socket.on('opencard', function (data) {
			var userId = socket.userId;
			if (userId == null) {
				return;
			}
			socket.gameMgr.doOpenCard(socket.userId);
		});

		socket.on("shengyin", function (data) {
			var userId = socket.userId;
			userMgr.broacastInRoom("shengyin_broad", data, userId);
		});
		socket.on("game_reset", function (data) {
			var userId = socket.userId;
			userMgr.broacastInRoom("game_reset_push", {
				userId: userId
			}, userId);
		});


		//聊天
		socket.on('chat', function (data) {
			if (socket.userId == null) {
				return;
			}
			var chatContent = data;
			userMgr.broacastInRoom('chat_push', {
				sender: socket.userId,
				content: chatContent
			}, socket.userId, true);
		});

		//快速聊天
		socket.on('quick_chat', function (data) {
			if (socket.userId == null) {
				return;
			}
			var chatId = data;
			userMgr.broacastInRoom('quick_chat_push', {
				sender: socket.userId,
				content: chatId
			}, socket.userId, true);
		});

		//语音聊天
		socket.on('voice_msg', function (data) {
			if (socket.userId == null) {
				return;
			}
			console.log(data.length);
			userMgr.broacastInRoom('voice_msg_push', {
				sender: socket.userId,
				content: data
			}, socket.userId, true);
		});

		//表情
		socket.on('emoji', function (data) {
			if (socket.userId == null) {
				return;
			}
			var phizId = data;
			userMgr.broacastInRoom('emoji_push', {
				sender: socket.userId,
				content: phizId
			}, socket.userId, true);
		});

		//语音使用SDK不出现在这里

		//退出房间
		socket.on('exit', function (data) {
			var userId = socket.userId;
			if (userId == null) {
				return;
			}
			var roomId = roomMgr.getUserRoom(userId);
			if (roomId == null) {
				return;
			}
			if (socket.gameMgr.hasBegan(roomId)) {
				return;
			}
			roomMgr.exitRoom(userId);
		});

		//解散房间
		socket.on('dispress', function (data) {
			var userId = socket.userId;
			if (userId == null) {
				return;
			}
			var roomId = roomMgr.getUserRoom(userId);
			if (roomId == null) {
				return;
			}
			//如果游戏已经开始，则不可以
			if (socket.gameMgr.hasBegan(roomId)) {
				return;
			}
			//如果不是房主，则不能解散房间
			if (roomMgr.isCreator(roomId, userId) == false) {
				return;
			}
			userMgr.broacastInRoom('dispress_push', {}, userId, true);
			userMgr.kickAllInRoom(roomId,true);
			roomMgr.destroy(roomId,true);
		});

		// 申请解散房间
		socket.on('dissolve_request', function (data) {
			var userId = socket.userId;
			if (userId == null) {
				return;
			}
			var roomId = roomMgr.getUserRoom(userId);
			if (roomId == null) {
				return;
			}
			//如果游戏未开始，则不可以
			if (socket.gameMgr.hasBegan(roomId) == false) {
				return;
			}

			var ret = socket.gameMgr.dissolveRequest(roomId, userId);
			if (ret != null) {
				var dr = ret.dr;
				var ramaingTime = (dr.endTime - Date.now()) / 1000;
				var data = {
					time: ramaingTime,
					states: dr.states
				};
				userMgr.broacastInRoom('dissolve_notice_push', data, userId, true);
			}
		});

		socket.on('dissolve_agree', function (data) {
			var userId = socket.userId;

			if (userId == null) {
				return;
			}

			var roomId = roomMgr.getUserRoom(userId);
			if (roomId == null) {
				return;
			}

			var ret = socket.gameMgr.dissolveAgree(roomId, userId, true);
			if (ret != null) {
				var dr = ret.dr;
				var ramaingTime = (dr.endTime - Date.now()) / 1000;
				var data = {
					time: ramaingTime,
					states: dr.states
				};
				userMgr.broacastInRoom('dissolve_notice_push', data, userId, true);

				var doAllAgree = true;
				for (var i = 0; i < dr.states.length; ++i) {
					if (dr.states[i] == 0) {
						doAllAgree = false;
						break;
					}
				}
				if (doAllAgree) {
					socket.gameMgr.doDissolve(roomId);
				}
			}
		});

		socket.on('dissolve_reject', function (data) {
			var userId = socket.userId;

			if (userId == null) {
				return;
			}

			var roomId = roomMgr.getUserRoom(userId);
			if (roomId == null) {
				return;
			}

			var ret = socket.gameMgr.dissolveAgree(roomId, userId, false);
			if (ret != null) {
				userMgr.broacastInRoom('dissolve_cancel_push', {}, userId, true);
			}
		});

		//断开链接
		socket.on('disconnect', function (data) {
			var userId = socket.userId;
			var reason = data;
			console.log(userId+"断开连接的消息 == " + reason)
			if (!userId) {
				return;
			}
			if (reason == "server namespace disconnect") {
				userMgr.del(userId);
				socket.userId = null;
				return;
			} else {
				userMgr.del(userId);
				socket.userId = null;
				var data = {
					userid: userId,
					online: false
				};
				userMgr.broacastInRoom('user_state_push', data, userId);
			}
		});

		socket.on('game_ping', function (data) {
			var userId = socket.userId;
			if (!userId) {
				return;
			}
			socket.emit('game_pong');
			userMgr.sendMsg(userId, "change_self_mapInfo", {})
		});
		socket.on('do_change_self_mapInfo', function (data) {
			var userId = socket.userId;
			if (!userId) {
				return;
			}
			var roomId = roomMgr.getUserRoom(userId);
			if(!roomId)return
			var roomInfo = roomMgr.getRoom(roomId);
			if(!roomInfo)return;
			var seatIndex = roomMgr.getUserSeat(userId);
			var data = JSON.parse(data);
			roomInfo.seats[seatIndex].mapInfo = data.mapInfo;
			userMgr.broacastInRoom("change_other_mapinfo", {
				index: seatIndex,
				mapInfo: data.mapInfo
			}, userId, false);
		});
		socket.on('loginQuan', function (data) {
			var data = JSON.parse(data);
			if (socket.userId != null) {
				return;
			}
			socket.userId = data.userId;
			userMgr.quanbind(data.userId,socket)
			socket.emit('login_quan');
		});
		socket.on("request_to_quan",function(data){
			var data = JSON.parse(data);
			console.log("接收到申请消息 == "+data)
		})
	});

	console.log("game server is listening on " + config.CLIENT_PORT);
};