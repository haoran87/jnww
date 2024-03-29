var client_service = require("./client_service");
var room_service = require("./room_service");
// var quan_service  = require('./quan_service');
var socket_service = require("./socket_service");

var configs = require(process.argv[2]);
var config = configs.hall_server();

var db = require('../utils/db');
db.init(configs.mysql());

client_service.start(config);
room_service.start(config);
// quan_service.start(config);
socket_service.start(config);