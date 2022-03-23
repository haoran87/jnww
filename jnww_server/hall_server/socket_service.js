var crypto = require('../utils/crypto');
var db = require('../utils/db');
var hallNetMgr = require('./hallNetMgr');
var io = null;
exports.start = function (config) {
	console.log("qidong "+config.NET_PORT)
	io = require('socket.io')(config.NET_PORT);
	io.sockets.on('connection', function (socket) {
		socket.on('loginQuan', function (data) {
			var data = JSON.parse(data);
			if (socket.userId != null) {
				return;
			}
			socket.userId = data.userId;
			hallNetMgr.hallBind(data.userId, socket)
			socket.emit('login_quan');
		});
		socket.on("request_to_quan", function (data) {
			var data = JSON.parse(data);
			console.log("接收到申请消息 == " + data)
		});
		socket.on("change_user_gems", function (data) {
			hallNetMgr.changeUserGems(data)
		});
		socket.on("change_user_rights", function (data) {
			hallNetMgr.changeUserRights(data)
		});
		socket.on("join_quan_user_list",function(data){
			hallNetMgr.joinQUL(data,socket)
		});
		//断开链接
		socket.on('disconnect', function (data) {
			var userId = socket.userId;
			var reason = data;
			hallNetMgr.delHallList(data.userId, socket)
			console.log(userId + "  hall断开连接的消息 == " + reason)
		});
		socket.on('game_ping', function (data) {
			socket.emit('game_pong');
		});

	});
};