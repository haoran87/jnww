var crypto = require('../utils/crypto');
var express = require('express');
var db = require('../utils/db');
var http = require('../utils/http');
var room_service = require("./room_service");
var hallNetMgr = require("./hallNetMgr");

var app = express();
var config = null;

function check_account(req, res) {
	var account = req.query.account;
	var sign = req.query.sign;
	if (account == null || sign == null) {
		http.send(res, 1, "unknown error");
		return false;
	}
	return true;
}

//设置跨域访问
app.all('*', function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By", ' 3.2.1');
	res.header("Content-Type", "application/json;charset=utf-8");
	next();
});

app.get('/login', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}

	var ip = req.ip;
	if (ip.indexOf("::ffff:") != -1) {
		ip = ip.substr(7);
	}

	var account = req.query.account;
	db.get_game_version(function(ver){
		if(ver){
			db.get_user_data(account, function (data) {
				if (data == null) {
					http.send(res, 0, "ok");
					return;
				}
		
				var ret = {
					account: data.account,
					userid: data.userid,
					name: data.name,
					lv: data.lv,
					exp: data.exp,
					coins: data.coins,
					gems: data.gems,
					zhuans: data.zhuans,
					ip: ip,
					sex: data.sex,
					kong: data.kong, //判定是否有朋友圈权限
					referee: data.referee,
					//新添加
					roomid: data.roomid,
					commission: data.commission,
					ver:ver,
				};
				if (ret.roomid != null) {
					db.is_room_exist(ret.roomid, function (retval) {
						if (retval) {
		
						} else {
							//如果房间不在了，表示信息不同步，清除掉用户记录
							ret.roomid = null;
							db.set_room_id_of_user(data.userid, null);
						}
						http.send(res, 0, "ok", ret);
					});
				} else {
					http.send(res, 0, "ok", ret);
				}
			});
		}
		else{
			console.log("获取不到版本号")
		}
	})
	
});

app.get('/create_user', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	var account = req.query.account;
	var name = req.query.name;
	var coins = 0;
	var gems = 21;
	var testcoins = 200;
	console.log(name);

	db.is_user_exist(account, function (ret) {
		if (!ret) {
			db.create_user(account, name, coins, gems, 0, null, testcoins, function (ret) {
				if (ret == null) {
					http.send(res, 2, "system error.");
				} else {
					http.send(res, 0, "ok");
				}
			});
		} else {
			http.send(res, 1, "account have already exist.");
		}
	});
});

app.get('/create_private_room', function (req, res) {
	//验证参数合法性
	var data = req.query;
	console.log('data is ' + JSON.stringify(data));
	//验证玩家身份
	if (!check_account(req, res)) {
		return;
	}
	var account = data.account;
	data.account = null;
	data.sign = null;
	var conf = data.conf;
	var mapInfo = data.mapInfo;
	var quanId = data.quanId //== -1 ? null : data.quanId;
	var quanZhu = data.quanZhu;
	if (quanId != -1 && quanZhu != -1) {
		console.log("创建圈子房间")
		db.get_user_data_by_userid(quanZhu, function (qzData) {
			var ju = JSON.parse(conf).jushu;
			if (ju == 0) {
				var cost = 1;
			}
			if (ju == 1) {
				var cost = 2;
			}
			if (qzData.gems >= cost) {
				db.get_user_data(account, function (data) {
					if (data == null) {
						http.send(res, 1, "system error");
						return;
					}
					if (data.commission == 1) {
						http.send(res, 11, "没有游戏权限");
						return;
					}
					var userId = data.userid;
					var name = data.name;
					//验证玩家状态
					db.get_room_id_of_user(userId, function (rm) {
						if (rm.roomid != null) {
							http.send(res, -11, "user is playing in room now.");
							return;
						}
						if (rm.match_roomid != null) {
							http.send(res, -12, "user is playing in match room now.");
							return;
						}
						//创建房间
						room_service.createRoom(account, userId, conf, quanId, quanZhu, function (err, roomId) {
							if (err == 0 && roomId != null) {
								room_service.enterRoom(userId, name, roomId, mapInfo, function (errcode, enterInfo) {
									if (enterInfo) {
										var ret = {
											roomid: roomId,
											ip: enterInfo.ip,
											port: enterInfo.port,
											token: enterInfo.token,
											time: Date.now(),
										};
										ret.sign = crypto.md5(ret.roomid + ret.token + ret.time + config.ROOM_PRI_KEY);
										hallNetMgr.deleteQUL(quanId, userId);
										http.send(res, 0, "ok", ret);
										
									} else {
										http.send(res, errcode, "room doesn't exist.");
									}
								});

							} else {
								http.send(res, err, "create failed.");
							}
						});
					});
				});
			} else {
				http.send(res, 110, "quanzhu mei qian le ")
			}
		})
	} else {
		console.log("创建普通房间 " + quanId)
		db.get_user_data(account, function (data) {
			if (data == null) {
				http.send(res, 1, "system error");
				return;
			}
			if (data.commission == 1) {
				http.send(res, 11, "没有游戏权限");
				return;
			}
			var userId = data.userid;
			var name = data.name;
			//验证玩家状态
			db.get_room_id_of_user(userId, function (rm) {
				if (rm.roomid != null) {
					http.send(res, -11, "user is playing in room now.");
					return;
				}
				//创建房间
				room_service.createRoom(account, userId, conf, quanId, quanZhu, function (err, roomId) {
					if (err == 0 && roomId != null) {
						room_service.enterRoom(userId, name, roomId, mapInfo, function (errcode, enterInfo) {
							if (enterInfo) {
								var ret = {
									roomid: roomId,
									ip: enterInfo.ip,
									port: enterInfo.port,
									token: enterInfo.token,
									time: Date.now(),
								};
								ret.sign = crypto.md5(ret.roomid + ret.token + ret.time + config.ROOM_PRI_KEY);
								http.send(res, 0, "ok", ret);
							} else {
								http.send(res, errcode, "room doesn't exist.");
							}
						});
					} else {
						http.send(res, err, "create failed.");
					}
				});
			});
		});
	}

});

app.get("/jiesan", function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	var data = req.query;
	var userId = data.userId;
	var roomId = data.roomId;
	var gems = data.gems;
	db.get_room_isStart(roomId, function (ret) {
		console.log("client jiesan" + ret);
		if (ret == 1) {
			http.send(res, 1, "game start");
		} else if (ret == 555) {
			http.send(res, 555, "room is not lived");
		} else if (ret == 2) {
			http.send(res, 2, "cannot find key");
		} else if (ret == 0) {}
	});
});

app.get('/enter_private_room', function (req, res) {
	var data = req.query;
	var roomId = data.roomid;
	if (roomId == null) {
		http.send(res, -1, "parameters don't match api requirements.");
		return;
	}
	if (!check_account(req, res)) {
		return;
	}

	var account = data.account;
	var mapInfo = data.mapInfo;
	db.get_user_data(account, function (data) {
		if (data == null) {
			http.send(res, -1, "system error");
			return;
		}
		if (data.commission == 1) {
			http.send(res, 11, "没有游戏权限");
			return;
		}
		var userId = data.userid;
		var name = data.name;
		var quans = JSON.parse(data.quan);
		if (data.roomid) {
			if (data.roomid != roomId) {
				var ret = {
					roomid: data.roomid
				};
				http.send(res, 66, "已经在另一个房里进行游戏", ret);
				return;
			} else {
				console.log("进入的房间相等 ===" + data.roomid);
			}
		}
		//验证玩家状态
		//todo
		//进入房间
		db.get_room_data(roomId, function (gData) {
			var haveright = false
			if (gData) {
				var quanId = gData.quanid;
				if (quanId != -1) {
					if (quans && quans.length > 0) {
						for (var j = 0; j < quans.length; j++) {
							if (quanId == quans[j]) {
								haveright = true;
								break;
							}
						}
					}
				} else if (quanId == -1) {
					haveright = true;
				}
				if (haveright) {
					room_service.enterRoom(userId, name, roomId, mapInfo, function (errcode, enterInfo) {
						if (enterInfo) {
							var ret = {
								roomid: roomId,
								ip: enterInfo.ip,
								port: enterInfo.port,
								token: enterInfo.token,
								time: Date.now()
							};
							ret.sign = crypto.md5(roomId + ret.token + ret.time + config.ROOM_PRI_KEY);
							if (quanId != -1) {
								hallNetMgr.deleteQUL(quanId, userId);
							}
							http.send(res, 0, "ok", ret);
						} else {
							http.send(res, errcode, "enter room failed.");
						}
					});
				} else {
					http.send(res, 123, "have not rights")
				}
			} else {
				http.send(res, 456, "房间不存在！")
				return;
			}


		})

	});
});

app.get('/get_history_list', function (req, res) {
	var data = req.query;
	if (!check_account(req, res)) {
		return;
	}
	var account = data.account;
	var quanId = data.quanId;
	console.log("获取的是圈子的战绩 == " + quanId)
	if (quanId && quanId != -1) {
		db.get_quan_history(quanId, function (qData) {
			console.log("获取圈历史记录 " + qData)
			if (qData) {
				var ghArr = [];
				for (var i = 0; i < qData.length; i++) {
					var his = JSON.parse(qData[i].history);
					ghArr.push(his);
				}
				console.log("gharr === " + ghArr)
				http.send(res, 0, "获取到了历史记录", {
					history: ghArr,
				});
			} else {
				http.send(res, 0, "没有历史记录", {
					history: null,
				});
			}
		})
	} else {
		db.get_user_data(account, function (data) {
			if (data == null) {
				http.send(res, -1, "system error");
				return;
			}
			var userId = data.userid;
			db.get_user_history(userId, function (hData) {
				if (hData && hData.length > 0) {
					var ghArr = [];
					var newData = [];
					var doNum = 0;
					for (var i = 0; i < hData.length; i++) {
						db.get_history(hData[i], function (gh) {
							if (gh) {
								var hy = JSON.parse(gh.history)
								ghArr.push(hy);
								newData.push(gh.uuid);
							}
							doNum++;
							if (doNum == hData.length) {
								if (newData.length < hData.length) {
									db.update_user_history(userId, newData)
								}
								if (ghArr.length == 0) {
									ghArr = null;
								}
								http.send(res, 0, "获取到了历史记录", {
									history: ghArr,
								});
							}
						})
					}

				} else {
					http.send(res, 0, "没有历史记录", {
						history: null,
					});
				}

			});
		});
	}
});


app.get('/get_games_of_room', function (req, res) {
	var data = req.query;
	var uuid = data.uuid;
	if (uuid == null) {
		http.send(res, -1, "parameters don't match api requirements.");
		return;
	}
	if (!check_account(req, res)) {
		return;
	}
	db.get_games_of_room(uuid, function (data) {
		http.send(res, 0, "ok", {
			data: data
		});
	});
});

app.get('/get_detail_of_game', function (req, res) {
	var data = req.query;
	var uuid = data.uuid;
	var index = data.index;
	if (uuid == null || index == null) {
		http.send(res, -1, "parameters don't match api requirements.");
		return;
	}
	if (!check_account(req, res)) {
		return;
	}
	db.get_detail_of_game(uuid, index, function (data) {
		http.send(res, 0, "ok", {
			data: data
		});
	});
});

app.get('/get_user_status', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	var account = req.query.account;
	db.get_game_version(function(ver){
		db.get_user_data(account, function (data) {
			if (data != null) {
				http.send(res, 0, "ok", {
					gems: data.gems,
					coins: data.coins,
					commission: data.commission,
					lv: data.lv,
					kong: data.kong,
					ver:ver,
				});
			} else {
				http.send(res, 1, "get user info failed.");
			}
		});
	})
	
});

app.get('/get_message', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	var type = req.query.type;

	if (type == null) {
		http.send(res, -1, "parameters don't match api requirements.");
		return;
	}

	var version = req.query.version;
	db.get_message(type, version, function (data) {
		if (data != null) {
			http.send(res, 0, "ok", {
				msg: data.msg,
				version: data.version
			});
		} else {
			http.send(res, 1, "get message failed.");
		}
	});
});
app.get('/get_coins', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	var account = req.query.account;
	console.log("获取金币 /get_coins")
	db.get_user_data(account, function (data) {
		if (data != null) {
			http.send(res, 0, "ok", {
				coins: data.coins,
				testcoins: data.testcoins
			});
		} else {
			http.send(res, 1, "get message failed.");
		}
	});
});
app.get('/change_user_gems', function (req, res) {
	var data = req.query
	var gems = Number(data.gems);
	db.get_user_data_by_userid(data.cUid, function (cuData) {
		if (cuData) {
			var giveto_name = cuData.name;
			db.get_user_data_by_userid(data.dUid, function (duData) { //duid赠送者
				if (duData) {
					if (duData.lv == 2 || duData.lv == 3) {
						var give_name = duData.name;
						if (gems < 0) { //减少玩家的房卡
							console.log(gems + "  ddkjfdjf == " + cuData.gems)
							if (gems + cuData.gems < 0) {
								http.send(res, 2, "该玩家的房卡不够 ");
								return;
							}
						}
						if (gems > 0) { //增加玩家房卡；
							if (duData.gems - gems < 0) {
								http.send(res, 3, "你的房卡不够了")
								return;
							}
						}

						db.cost_gems(data.cUid, -gems, function (ret) {
							if (ret) {
								db.cost_gems(data.dUid, gems, function (ret1) {
									if (ret1) {
										var dGems = duData.gems - gems;
										db.add_give_gems_record(data.cUid, data.dUid, gems, giveto_name, give_name)
										http.send(res, 0, "操作成功!", {
											dGems: dGems
										})
									}
								})
							}
						})
					} else {
						http.send(res, 5, "你的代理权限被取消了")
					}

				} else {

				}

			})
		} else {
			http.send(res, 1, "该玩家不存在")
		}
	})
});
app.get('/change_user_rights', function (req, res) {
	var data = req.query
	var doNum = data.doNum;
	db.get_user_data_by_userid(data.cUid, function (cuData) {
		if (cuData) {
			if (cuData.lv == 3) {
				http.send(res, 3, "该玩家为管理员，无法设置他的权限")
				return;
			}
			if (doNum == 3 || doNum == 4) {
				if (doNum == 3) { //解除禁止
					var rights = 0
					if (cuData.commission == 0) {
						http.send(res, 2, "玩家游戏权限是开通的")
						return;
					}
				} else if (doNum == 4) { //禁止游戏
					var rights = 1
					if (cuData.commission == 1) {
						http.send(res, 2, "玩家游戏权限是关闭的")
						return;
					}
				}
				db.update_user_rights(data.cUid, rights, function (ret) {
					if (ret) {
						http.send(res, 0, "更改玩家游戏权限成功")
					}
				})
			}
			if (doNum == 5 || doNum == 6) {
				if (doNum == 6) { //隐藏代理权限
					var rights = 1
					var kong = 0;
					if (cuData.lv == 1 && cuData.kong == 0) {
						http.send(res, 2, "玩家没有代理权限！")
						return;
					}
				} else if (doNum == 5) { //开放代理权限
					var rights = 2
					var kong = 1;
					if (cuData.lv == 2 && cuData.kong == 1) {
						http.send(res, 2, "玩家代理权限已开放")
						return;
					}
				}
				db.update_user_rights(data.cUid, rights, kong, doNum, function (ret) {
					if (ret) {
						db.is_ht_exist(data.cUid, function (he) {
							if (he) {
								db.change_user_ht_status(data.cUid, kong, function (cht) {
									if (cht) {
										console.log("更改后台成功")
										http.send(res, 0, "更改玩家游戏权限成功")
									}
								})
							} else {
								var str = "111111encypt"
								var secret = crypto.md5(crypto.md5(str.trim()))
								if (doNum == 5) {
									db.add_user_in_ht(data.cUid, secret, function (aht) {
										if (aht) {
											db.add_user_ht_access(aht, function (ha) {
												if (ha) {
													console.log("添加后台数据成功" + aht)
													http.send(res, 0, "更改玩家游戏权限成功")
												}
											})


										}
									})
								}
							}
						})

					}
				})
			}

		} else {
			http.send(res, 1, "该玩家不存在")
		}
	})
});
app.get('/get_commission_num', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	var account = req.query.account;
	db.get_user_data(account, function (data) {
		if (data != null) {
			http.send(res, 0, "ok", {
				commission: data.commission
			});
		} else {
			http.send(res, 1, "get commission failed.");
		}
	});
});



app.get('/is_server_online', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	var ip = req.query.ip;
	var port = req.query.port;
	room_service.isServerOnline(ip, port, function (isonline) {
		var ret = {
			isonline: isonline
		};
		http.send(res, 0, "ok", ret);
	});
});

app.get("/is_hall_online", function (req, res) {
	console.log("接收到了 isHalline请求")
	var ret = {
		isonline: true
	};
	http.send(res, 0, "ok", ret);
});

app.get('/share_gift', function (req, res) {

	if (!check_account(req, res)) {
		return;
	}
	var data = req.query;
	var gems = 2;
	var mydate = new Date();
	db.share_gift(data.user_id, gems, function (ret) {
		if (ret == 200) {
			http.send(res, ret, "分享赠房卡成功", {
				code: ret
			});
		} else if (ret == 201) {
			http.send(res, ret, "今天已经分享过房卡了", {
				code: ret
			});
		} else if (ret == 202) {
			http.send(res, ret, "系统错误", {
				code: ret
			});
		}
	});

});

app.get('/zengsong_gems', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	console.log('zengsong房卡 user_id is ' + req.query.s_uid + " " + req.query.d_uid);
	var data = req.query;
	db.zengsong(data.s_uid, data.d_uid, data.gold, function (ret) {
		console.log("check_userId 返回数据" + ret.code);
		if (ret.code == 200) {
			var d = {
				gems: ret.gems,
			};
			http.send(res, ret.code, "ok", d)
		} else {
			http.send(res, ret.code, "failed")
		}
	})
});

app.get('/present_other_gift', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	console.log('zengsong金币 user_id is ' + req.query.s_uid + " " + req.query.d_uid);
	var data = req.query;
	db.get_user_data_by_userid(data.d_uid, function (ret) {
		if (ret) {
			db.zengsong_coins(data.s_uid, data.d_uid, data.gold, function (zz) {
				if (zz.code == 1) {
					http.send(res, 0, "成功！");
				} else {
					http.send(res, ret.code, "失败！");
				}
			});
		} else {
			http.send(res, 5, "该被赠送Id不存在");
		}
	})

});
app.get('/draw_self_balance', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	console.log('tiqu金币 user_id is ' + req.query.s_uid);
	var data = req.query;
	db.get_user_data_by_userid(data.s_uid, function (nn) {
		if (nn) {
			if (nn.treasure - data.gold >= 0) {
				db.tiqu_user_treasure(data.s_uid, data.gold, function (tt) {
					if (tt) {
						console.log("tttttt111");
						db.record_tiqu_coins(data.s_uid, data.gold, function (rr) {
							if (rr) {
								http.send(res, 0, "ok");
							} else {
								http.send(res, 3, "没存");
							}
						})
					} else {
						console.log("tttttt222");
						http.send(res, 1, "没减");
					}
				})
			} else {
				http.send(res, 555, "钱不够");
			}
		} else {
			http.send(res, 3333, "每获取到玩家的数据");
		}
	})

});

app.get('/get_commission', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	console.log('提取佣金 ' + req.query.account);
	var data = req.query;
	var account = data.account;
	var num = data.num;
	db.get_user_data(account, function (ret) {
		var commission = ret.commission;
		if (commission >= num) {
			db.get_user_commission(account, num, function (result) {
				if (result) {
					http.send(res, 0, "提取成功")
				} else {
					http.send(res, 5, "提取失败")
				}
			})
		} else {
			http.send(res, 2, "提取佣金超额")
		}
	})
});


app.get('/in_self_balance', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	console.log('tiqu金币 user_id is ' + req.query.s_uid);
	var data = req.query;
	var gold = -data.gold;
	console.log("从账户转入到背包" + gold)
	db.get_user_data_by_userid(data.s_uid, function (nn) {
		if (nn) {
			console.log("从账户转入玩家数据" + nn.coins)
			if (nn.coins + gold >= 0) {
				db.tiqu_user_treasure(data.s_uid, gold, function (tt) {
					if (tt) {
						console.log("iiiii11")
						db.record_tiqu_coins(data.s_uid, gold, function (rr) {
							if (rr) {
								http.send(res, 0, "okiiii");
							} else {
								http.send(res, 3, "ii没zhuaru");
							}
						});
					} else {
						console.log("iiiii222");
						http.send(res, 1, "iiii没减");
					}
				})
			} else {
				http.send(res, 555, "钱不够");
			}

		} else {
			http.send(res, 3333, "每获取到玩家的数据");
		}
	})

});



app.get('/add_referee_id', function (req, res) {
	if (!check_account(req, res)) {
		return;
	}
	console.log('要添加的代理id == ' + req.query.referee);
	var data = req.query;
	db.check_referee_exist(data.referee, function (rr) {
		if (rr) {
			db.add_user_referee(data.account, data.referee, function (ret) {
				if (ret) {
					http.send(res, 0, "代理添加成功");
				} else {
					http.send(res, 2, "代理添加失败");
				}
			})
		} else {
			// db.check_user_exist(data.referee,function(uu){//佣金添加玩家id
			// 	if(uu){
			// 		db.add_user_referee(data.account,data.referee,function(ret){
			// 			if(ret){
			// 				http.send(res,0,"代理添加成功")
			// 			}
			// 			else{
			// 				http.send(res,2,"代理添加失败")
			// 			}
			// 		})
			// 	}
			// 	else{
			// 		http.send(res,1,"代理不存在")
			// 	}
			// })
			http.send(res, 1, "代理不存在");
		}
	})

});
app.get("/create_quan", function (req, res) {
	var data = req.query;
	var creator = data.userId;
	var quanName = data.quanName;
	console.log("接收到创建圈子的消息 == " + creator)
	db.is_quan_exist(quanName, false, function (ret) {
		if (ret) {
			http.send(res, 4, "name have exist")
		} else {
			var generateQuanId = function () {
				console.log("一直执行这个函数")
				var quanId = "";
				for (var i = 0; i < 7; ++i) {
					quanId += Math.floor(Math.random() * 10);
				}
				db.is_quan_exist(false, quanId, function (ee) {
					if (ee) {
						generateQuanId();
					} else {
						db.create_quan(quanName, quanId, creator, function (qq) {
							if (qq) {
								console.log("创建圈子成功！！" + quanId);
								var retData = {
									id: quanId,
								}
								add_user_in_quan(res, quanId, creator, retData)

							} else {
								console.log("创建圈子失败");
								http.send(res, 1, "create quan fail");
							}
						})
					}
				})
			}
			generateQuanId();
		}
	});
});

var add_user_in_quan = function (res, quanId, userId, retData) {
	db.get_user_data_by_userid(userId, function (uData) {
		var uInfo = {
			userId: uData.userid,
			name: uData.name,
		}
		var uQuan = uData.quan;
		if (uQuan == null) {
			var uQuan = [];
			uQuan.push(quanId);
		} else {
			uQuan = JSON.parse(uQuan);
			uQuan.push(quanId);
		}
		console.log("uquan ======" + uQuan)
		db.update_user_quan(uQuan, userId, function (result) {
			if (result) {
				db.get_quan_data(quanId, function (qData) {
					if (qData.quan || qData.quan == null) {
						var nickname = qData.nickname;
						if (qData.quan == null) {
							var qq = [];
							qq.push(uInfo);
						} else {
							var qq = JSON.parse(qData.quan);
							qq.push(uInfo);
						}
						db.update_quan_quan(qq, quanId, function (rsu) {
							if (rsu) {
								var tData = [];
								var tempQuan = [];
								var checkNum = 0;
								for (var i = 0; i < uQuan.length; i++) {
									var uquanId = uQuan[i];
									db.get_quan_data(uquanId, function (qData2) {
										if (qData2) {
											var quanInfo = {
												id: qData2.id,
												name: qData2.nickname,
												num: JSON.parse(qData2.quan).length,
												creator: qData2.creator,
												creattime: qData2.creattime,
											}
											tData.push(quanInfo);
											tempQuan.push(qData2.id);
										}
										checkNum++;
										if (checkNum == uQuan.length) {
											if (tempQuan.length < uQuan.length) {
												db.update_user_quan(tempQuan, userId)
											}
											retData.data = tData;
											var str = "用户:" + crypto.fromBase64(uInfo.name) + "(ID:" + uInfo.userId + ")已成功加入\n亲友圈:" + nickname + "(ID:" + quanId + ")";
											hallNetMgr.sendToUser(uInfo.userId,"add_user_in_quan")
											http.send(res, 0, str, retData);
										}
									})
								}

							}
						})
					} else {
						console.log("没有获取到圈数据")
					}
				})
			}

		})

	})
};
var delete_user_from_quan = function (res, quanId, userId, retData) {
	db.get_user_data_by_userid(userId, function (uData) {
		var uQuan = uData.quan;
		if (uQuan) {
			uQuan = JSON.parse(uQuan);
			for (var i = 0; i < uQuan.length; i++) {
				var qid = uQuan[i];
				if (qid == quanId) {
					uQuan.splice(i, 1);
					break;
				}
			}
		}
		console.log("uquan ======" + uQuan)
		db.update_user_quan(uQuan, userId, function (result) {
			if (result) {
				db.get_quan_data(quanId, function (qData) {
					if (qData.quan || qData.quan == null) {
						if (qData.quan) {
							var qq = JSON.parse(qData.quan);
							for (var j = 0; j < qq.length; j++) {
								var uid = qq[j].userId;
								if (userId == uid) {
									qq.splice(j, 1);
									break;
								}
							}
						}
						db.update_quan_quan(qq, quanId, function (rsu) {
							if (rsu) {
								var tData = [];
								var tempQuan = [];
								var checkNum = 0;
								if (uQuan && uQuan.length > 0) {
									for (var i = 0; i < uQuan.length; i++) {
										var uqid = uQuan[i];
										db.get_quan_data(uqid, function (qData) {
											if (qData) {
												var quanInfo = {
													id: qData.id,
													name: qData.nickname,
													num: JSON.parse(qData.quan).length,
													creator: qData.creator,
													creattime: qData.creattime,
												}
												tData.push(quanInfo);
												tempQuan.push(qData.id);
											}
											checkNum++;
											if (checkNum == uQuan.length) {
												if (tempQuan.length < uQuan.length) {
													db.update_user_quan(tempQuan, userId)
												}
												retData.data = tData;
												retData.quans = tempQuan;
												http.send(res, 0, "同意退出！", retData);
											}
										})
									}
								} else {
									retData.data = tData;
									retData.quans = tempQuan;
									http.send(res, 0, "同意退出！", retData);
								}

							}
						})
					} else {
						console.log("没有获取到圈数据")
					}
				})
			}

		})

	})
};
app.get("/get_quans", function (req, res) {
	var userId = req.query.userId;
	db.get_user_data_by_userid(userId, function (uData) {
		if (uData.commission == 1) {
			http.send(res, 11, "没有游戏权限")
			return;
		}
		if (uData) {
			var lv = uData.lv;
			var kong = uData.kong;
			if (uData.quan) {
				var quan = JSON.parse(uData.quan);
				// console.log("要获取的圈子信息" + quan)
				var tData = [];
				var tempQuan = [];
				var checkNum = 0;
				for (var i = 0; i < quan.length; i++) {
					var quanId = quan[i];
					db.get_quan_data(quanId, function (qData) {
						// console.log("fjdfjldjl == "+JSON.stringify(qData))
						checkNum++;
						if (qData) {
							var quanInfo = {
								id: qData.id,
								name: qData.nickname,
								num: JSON.parse(qData.quan).length,
								creator: qData.creator,
								createtime: qData.createtime,
							}
							tData.push(quanInfo);
							tempQuan.push(qData.id);
						}
						if (checkNum == quan.length) {
							if (tempQuan.length < quan.length) {
								db.update_user_quan(tempQuan, userId)
							}
							if (tData.length > 1) {
								tData.sort(function (a, b) {
									return a.createtime - b.createtime;
								})
							}
							http.send(res, 0, "get quan info ok", {
								data: tData,
								kong: kong,
								lv: lv,
							})
						}
					})
				}
			} else {
				http.send(res, 4, "is not have quans", {
					data: [],
					kong: kong,
					lv: lv,
				})
			}
		}

	})
});
app.get("/get_zhuos", function (req, res) {
	var quanId = req.query.quanId;
	db.get_quan_data(quanId, function (qData) {
		if (qData) {
			var quanName = qData.nickname;
			db.get_user_data_by_userid(qData.creator, function (uData) {
				var gems = uData.gems;
				db.get_quan_zhuos(quanId, function (ret) {
					console.log("获取的桌" + ret.length);
					if (ret) {
						http.send(res, 0, "have zhuo", {
							zhuos: ret,
							quanName: quanName,
							gems: gems,
							quanZhu: qData.creator,
						})
					} else {
						http.send(res, 1, "have not zhuo")
					}
				})
			})
		}
	})

});
app.get("/request_to_quan", function (req, res) {
	var quanId = req.query.quanId;
	var userId = req.query.userId;
	var isok = req.query.isok;
	db.get_user_data_by_userid(userId, function (ruData) {
		if (ruData) {
			var uName = ruData.name;
			db.get_quan_data(quanId, function (qData) {
				if (qData) {
					var creator = qData.creator;
					var quanName = qData.nickname;
					if (isok == 2) {
						db.get_quan_message(quanId, userId, function (mData) {
							if (mData && mData.length > 0) {
								if (mData[0].status == 0) {
									http.send(res, 111, "已经申请加入,请等待");
									return;
								}
								if (mData[0].status == 2) {
									http.send(res, 222, "申请加入被拒绝");
									return;
								}
								if (mData[0].status == 1) {
									http.send(res, 333, "申请加入同意了");
									return;
								}
								db.change_quan_message_status(userId, 2, 0, quanId, function (cd) {
									if (cd) {
										hallNetMgr.sendToUser(creator, "request_to_quan_result", {
											msg: "申请加入提交成功！"
										})
										http.send(res, 0, "申请加入提交成功！")
									}
								})
							} else {
								db.update_user_quan_message(quanId, userId, creator, quanName, uName, 1, function (qm) {
									if (qm) {
										hallNetMgr.sendToUser(creator, "request_to_quan_result", {
											msg: "申请加入提交成功！"
										})
										http.send(res, 0, "add success")
									} else {

									}
								})
							}

						})
						return
					}
					if (isok == 4) {
						var retData = {
							id: quanId,
						}
						delete_user_from_quan(res, quanId, userId, retData)
						return;
					}
					db.get_user_data_by_userid(userId, function (uData) {
						if (uData.quan) {
							var quans = JSON.parse(uData.quan);
							for (var i = 0; i < quans.length; i++) {
								if (quanId == quans[i]) {
									http.send(res, 2, "user is in quan")
									return;
								}
							}
						}
						db.get_quan_message(quanId, userId, function (mData) {
							console.log("圈的信息")
							if (mData && mData.length > 0) {
								if (mData[0].status == 0) {
									http.send(res, 3, "waitting for result")
									return;
								}
							}
							http.send(res, 0, " ok ", {
								quanName: quanName
							});

						})

					})
				} else {
					http.send(res, 4, "quan is not exist")
				}
			})
		}
	})

});
app.get("/get_re_message", function (req, res) {
	var userId = req.query.userId;
	var mesArr = [];
	db.get_user_data_by_userid(userId, function (uData) {
		db.get_re_message(userId, uData.kong, function (mData) {
			if (mData) {
				if (mData.length > 1) {
					mData.sort(function (a, b) {
						return a.rtime - b.rtime;
					})
				}
				http.send(res, 0, "get re message ok", {
					mData: mData
				})
			} else {
				http.send(res, 1, "get re message err");
			}
		})
	})
});
app.get("/change_quan_message_status", function (req, res) {
	var userId = req.query.userId;
	db.change_quan_message_status(userId, 1, 8, null, function (cData) {
		if (cData) {
			http.send(res, 0, "change ok")
		} else {
			http.send(res, 1, "change fail")
		}
	})
});
app.get("/answer_re_quan", function (req, res) {
	var result = req.query.result;
	var info = req.query.quanInfo;
	info = JSON.parse(info);
	if (info.status == 4) {
		var isRe = 4;
		var stt = 5;
		if (result == 0) { //拒绝
			stt = 6;
		}
	} else if (info.status == 0) {
		var isRe = 0;
		var stt = 1;
		if (result == 0) { //拒绝
			stt = 2;
		}
	}
	db.change_quan_message_status(info.applicant, isRe, stt, info.quanid, function (cData) {
		if (cData) {
			if (result == 0) {
				http.send(res, 0, "已拒绝玩家 " + info.altname + "(ID:" + info.applicant + ") 请求")
				hallNetMgr.sendToUser(info.applicant, "request_to_quan_result")
			} else {
				var retData = {
					id: info.quanid,
				}
				if (info.status == 4) { //对申请退出处理
					console.log("对申请退出的做出处理")
					delete_user_from_quan(res, info.quanid, info.applicant, retData)
				} else { //对申请加入处理
					add_user_in_quan(res, info.quanid, info.applicant, retData)
					hallNetMgr.sendToUser(info.applicant, "request_to_quan_result", {
						code: 1
					})
				}
				// http.send(res,0,"已同意玩家请求")
			}
		} else {
			http.send(res, 1, "未找到相应请求数据")
		}
	})
});
app.get("/get_quan_member", function (req, res) {
	var quanId = req.query.quanId;
	db.get_quan_data(quanId, function (qData) {
		if (qData) {
			var ret = {
				mData: qData.quan,
			}
			http.send(res, 0, "获取数据成功", ret)
		} else {
			http.send(res, 1, "获取数据失败", ret)
		}
	})
});
app.get("/clear_quan_members", function (req, res) {
	var quanId = req.query.quanId;
	var mems = req.query.memberArr;
	mems = JSON.parse(mems);
	console.log("要删除额人 == " + mems[0]);
	console.log("要删除圈子 == " + quanId);
	db.get_quan_data(quanId, function (gData) {
		if (gData) {
			var quans = JSON.parse(gData.quan);
			// var tp = [];
			for (var k = 0; k < mems.length; k++) {
				for (var i = 0; i < quans.length; i++) {
					console.log("mems ==" + mems[k] + "quans == " + quans[i].userId)
					if (mems[k] == quans[i].userId) {
						quans.splice(i, 1);
						break;
					}
				}
			}
			console.log("踢出后 全是== " + quans)
			db.update_quan_quan(quans, quanId, function (qq) {
				if (qq) {
					var ee = 0;
					var pl = function () {
						console.log("踢出的玩家 == " + mems[ee]);
						db.get_user_data_by_userid(mems[ee], function (uData) {
							if (uData) {
								var quan = JSON.parse(uData.quan);
								console.log("把玩家删除圈" + quan)
								if (quan) {
									for (var e = 0; e < quan.length; e++) {
										if (quan[e] == quanId) {
											quan.splice(e, 1);
											break;
										}
									}
									db.update_user_quan(quan, mems[ee], function (uuq) {
										if (uuq) {
											hallNetMgr.sendToUser(mems[ee], "clear_user_from_quan", {
												quanId: quanId
											})
											ee++;
											if (ee < mems.length) {
												pl();
											} else {
												http.send(res, 0, "删除圈成员成功")
												return;
											}
										}
									})
								} else {
									ee++;
									if (ee < mems.length) {
										pl();
									} else {
										http.send(res, 0, "删除圈成员成功")
										return;
									}
								}

							}
						})
					}
					pl();
				}
			})
		}
	})
});
app.get("/delete_quan", function (req, res) {
	var quanId = req.query.quanId;
	var userId = req.query.userId;
	console.log("要删的圈子 == " + quanId);
	db.get_quan_data(quanId, function (qData) {
		if (qData) {
			var mems = JSON.parse(qData.quan);
			if (qData.creator == userId) {
				db.delete_quan(quanId, function (dq) {
					if (dq) {
						var ee = 0;
						var doFun = function () {
							var userId = mems[ee].userId
							db.get_user_data_by_userid(userId, function (uData) {
								if (uData) {
									var quan = JSON.parse(uData.quan);
									if (quan) {
										for (var e = 0; e < quan.length; e++) {
											if (quan[e] == quanId) {
												quan.splice(e, 1);
												break;
											}
										}
										db.update_user_quan(quan, userId, function (uuq) {
											if (uuq) {
												ee++;
												hallNetMgr.sendToUser(userId, "clear_user_from_quan", {
													quanId: quanId
												})
												if (ee < mems.length) {
													doFun();
												} else {
													http.send(res, 0, "删除圈子成功")
													return;
												}
											}
										})
									} else {
										ee++;
										if (ee < mems.length) {
											doFun();
										} else {
											http.send(res, 0, "删除圈子成功")
											return;
										}
									}

								}
							});
						}
						doFun();
					} else {
						http.send(res, 3, "删除圈子失败")
					}
				})
			} else {
				http.send(res, 2, "不是圈主")
			}
		} else {
			http.send(res, 1, "圈子不存在")
		}
	})
});
app.get("/add_quan_members", function (req, res) {
	var quanId = req.query.quanId;
	var addId = req.query.addId;
	db.get_user_data_by_userid(addId, function (uData) {
		if (uData) {
			var retData = {
				uName: uData.name,
			}
			var quans = JSON.parse(uData.quan);
			var isIn = false;
			if (quans && quans.length > 0) {
				for (var k = 0; k < quans.length; k++) {
					if (quans[k] == quanId) {
						isIn = true;
						break;
					}
				}
			}
			if (!isIn) {
				db.get_quan_data(quanId, function (qData) {
					if (qData) {
						add_user_in_quan(res, quanId, addId, retData)
					} else {
						http.send(res, 2, "圈子不存在")
					}
				})
			} else {
				http.send(res, 3, "玩家已经在这个圈子了")
			}
		} else {
			http.send(res, 1, "该玩家不存在")
		}
	})
});
app.get("/check_map_info", function (res, req) {
	var mapinfo = req.query.mapInfo;
	console.log("玩家获取到的地理位置信息 == " + mapinfo)
})
exports.start = function ($config) {
	config = $config;
	app.listen(config.CLIENT_PORT);
	console.log("client service is listening on port " + config.CLIENT_PORT);
};