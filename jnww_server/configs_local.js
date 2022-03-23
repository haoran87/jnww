var HALL_IP = "127.0.0.1";
var HALL_CLIENT_PORT = 9011;
var HALL_ROOM_PORT = 9012;
var HALL_MATCH_PORT = 9014;

var ACCOUNT_PRI_KEY = "^&*#$%()@";
var ROOM_PRI_KEY = "~!@#$(*&^%$&";
var MATCH_PRI_KEY = "~!@#$(*&^%$&##)";
var HEART_JUMP = "~!@#$(*&^%$&##@@#)";

var LOCAL_IP = 'localhost';

exports.mysql = function () {
	return {
		HOST: '127.0.0.1',
		USER: 'root',
		PSWD: 'mengdou2017',
		DB: 'zyyl',
		PORT: 3306,
	}
}

//账号服配置
exports.account_server = function () {
	return {
		CLIENT_PORT: 9010,
		HALL_IP: HALL_IP,
		HALL_CLIENT_PORT: HALL_CLIENT_PORT,
		ACCOUNT_PRI_KEY: ACCOUNT_PRI_KEY,
		DEALDER_API_IP: LOCAL_IP,
		DEALDER_API_PORT: 12581,
		VERSION: '20161227',
		APP_WEB: 'http://houtai.17kuaileqp.com/fenxiang/index.html',
	};
};

//大厅服配置
exports.hall_server = function () {
	return {
		HALL_IP: HALL_IP,
		CLIENT_PORT: HALL_CLIENT_PORT,
		FOR_ROOM_IP: LOCAL_IP,
		ROOM_PORT: HALL_ROOM_PORT,
		FOR_MATCH_IP: LOCAL_IP,
		MATCH_PORT: HALL_MATCH_PORT,
		ACCOUNT_PRI_KEY: ACCOUNT_PRI_KEY,
		ROOM_PRI_KEY: ROOM_PRI_KEY,
		MATCH_PRI_KEY: MATCH_PRI_KEY,
		HEART_JUMP: HEART_JUMP,
		GAME_SERVER_ID: "001",
		MATCH_SERVER_ID: "002",
		NET_PORT:9997,
	};
};

//游戏服配置
exports.game_server = function () {
	return {
		SERVER_ID: "001",
		//暴露给大厅服的HTTP端口号
		HTTP_PORT: 9013,
		//HTTP TICK的间隔时间，用于向大厅服汇报情况
		HTTP_TICK_TIME: 5000,
		//大厅服IP
		HALL_IP: LOCAL_IP,
		FOR_HALL_IP: LOCAL_IP,
		//大厅服端口
		HALL_PORT: HALL_ROOM_PORT,
		//与大厅服协商好的通信加密KEY
		ROOM_PRI_KEY: ROOM_PRI_KEY,
		//心跳
		HEART_JUMP: HEART_JUMP,
		//暴露给客户端的接口
		CLIENT_IP: HALL_IP,
		CLIENT_PORT: 10000,
	};
};
//比赛服配置
exports.quan_server = function () {
	return {
		SERVER_ID: "002",
		//暴露给大厅服的HTTP端口号
		HTTP_PORT: 9015,
		//HTTP TICK的间隔时间，用于向大厅服汇报情况
		HTTP_TICK_TIME: 5000,
		//大厅服IP
		HALL_IP: LOCAL_IP,
		FOR_HALL_IP: LOCAL_IP,
		//大厅服端口
		HALL_PORT: HALL_MATCH_PORT,
		//与大厅服协商好的通信加密KEY
		MATCH_PRI_KEY: MATCH_PRI_KEY,
		//心跳
		HEART_JUMP: HEART_JUMP,
		//暴露给客户端的接口
		CLIENT_IP: HALL_IP,
		CLIENT_PORT: 9999,
	};
};