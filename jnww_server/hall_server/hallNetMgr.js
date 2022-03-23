var db = require('../utils/db');
var rs = require("./room_service");
var crypto = require('../utils/crypto');
var quanList = {};
var HallList = {};
exports.hallBind = function (userId, socket) {
	if (HallList[userId] && HallList[userId].handshake.address != socket.handshake.address) {
		HallList[userId].disconnect(true);
		HallList[userId] = socket;
	} else {
		HallList[userId] = socket;
	}
};
exports.hallSend = function () {
	for (var key in HallList) {
		if (HallList[key]) {
			HallList[key].emit("hello")
		}

	}
};

exports.delHallList = function (userId) {
	if (HallList[userId]) {
		HallList[userId].disconnect(true);
		delete HallList[userId];
	}
};
exports.sendToUser = function (userId, event, data) {
	console.log(userId + "   lianjie ==   " + HallList[userId])
	if (HallList[userId]) {
		HallList[userId].emit(event, data)
	} else {
		console.log("玩家没有连接上")
	}

};
exports.changeUserGems = function (data) {
	var data = JSON.parse(data);
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
								exports.sendToUser(data.dUid, "change_user_gems_result", {
									msg: "该玩家的房卡不够"
								})
								return;
							}
						}
						if (gems > 0) { //增加玩家房卡；
							if (duData.gems - gems < 0) {
								exports.sendToUser(data.dUid, "change_user_gems_result", {
									msg: "你的房卡不够了"
								})
								return;
							}
						}

						db.cost_gems(data.cUid, -gems, function (ret) {
							if (ret) {
								var cGems = cuData.gems + gems;
								exports.sendToUser(data.cUid, "change_user_gems_result", {
									msg: "操作成功",
									code: 3,
									dGems: cGems
								})
								db.cost_gems(data.dUid, gems, function (ret1) {
									if (ret1) {
										var dGems = duData.gems - gems;
										db.add_give_gems_record(data.cUid, data.dUid, gems, giveto_name, give_name)
										exports.sendToUser(data.dUid, "change_user_gems_result", {
											msg: "操作成功",
											code: 2,
											dGems: dGems
										})
									}
								})
							}
						})
					} else {
						exports.sendToUser(data.dUid, "change_user_gems_result", {
							msg: "你的代理权限被取消了",
							code: 1
						})
					}

				} else {

				}

			})
		} else {
			exports.sendToUser(data.dUid, "change_user_gems_result", {
				msg: "该玩家不存在"
			})
		}
	})
};

exports.changeUserRights = function (data) {
	var data = JSON.parse(data);
	var doNum = data.doNum;
	db.get_user_data_by_userid(data.cUid, function (cuData) {
		if (cuData) {
			if (cuData.lv == 3) {
				exports.sendToUser(data.dUid, "change_user_rights_result", {
					msg: "该玩家为管理员，无法设置他的权限"
				})
				return;
			}
			if (doNum == 3 || doNum == 4) {
				if (doNum == 3) { //解除禁止
					var rights = 0
					var msg = "开通"
					if (cuData.commission == 0) {
						exports.sendToUser(data.dUid, "change_user_rights_result", {
							msg: "玩家游戏权限是开通的"
						})
						return;
					}
				} else if (doNum == 4) { //禁止游戏
					var rights = 1
					var msg = "禁止"
					if (cuData.commission == 1) {
						exports.sendToUser(data.dUid, "change_user_rights_result", {
							msg: "玩家游戏权限是关闭的"
						})
						return;
					}
				}
				db.update_user_rights(data.cUid, rights, function (ret) {
					if (ret) {
						exports.sendToUser(data.dUid, "change_user_rights_result", {
							msg: msg + "玩家游戏权限成功"
						})
						return;
					}
				})
			}
			if (doNum == 5 || doNum == 6) {
				if (doNum == 6) { //隐藏代理权限
					var rights = 1
					var kong = 0;
					var msg = "禁止"
					if (cuData.lv == 1 && cuData.kong == 0) {
						exports.sendToUser(data.dUid, "change_user_rights_result", {
							msg: "玩家没有代理权限！"
						})
						return;
					}
				} else if (doNum == 5) { //开放代理权限
					var rights = 2
					var kong = 1;
					var msg = "开通"
					if (cuData.lv == 2 && cuData.kong == 1) {
						exports.sendToUser(data.dUid, "change_user_rights_result", {
							msg: "玩家代理权限已开放"
						})
						return;
					}
				}
				db.update_user_rights(data.cUid, rights, kong, doNum, function (ret) {
					if (ret) {
						db.is_ht_exist(data.cUid, function (he) {
							if (he) {
								db.change_user_ht_status(data.cUid, kong, function (cht) {
									if (cht) {
										exports.sendToUser(data.dUid, "change_user_rights_result", {
											msg: msg + "玩家代理权限成功"
										})
										exports.sendToUser(data.cUid, "change_user_rights_result", {
											msg: msg + "玩家代理权限成功",
											code: rights
										})
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
													exports.sendToUser(data.dUid, "change_user_rights_result", {
														msg: msg + "玩家代理权限成功"
													})
													exports.sendToUser(data.cUid, "change_user_rights_result", {
														msg: msg + "玩家代理权限成功",
														code: rights
													})
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
			exports.sendToUser(data.dUid, "change_user_rights_result", {
				msg: msg + "该玩家不存在"
			})
		}
	})
};
exports.joinQUL = function (data, socket) {
	var data = JSON.parse(data);
	var quanId = data.quanId;
	var userId = data.userId;
	console.log("quan信息表 == " + quanList[quanId])
	if (!quanList[quanId]) {
		quanList[quanId] = {};
	}
	console.log("quan信息表2 == " + quanList[quanId])
	var quan = quanList[quanId];
	quan[userId] = true;
};
exports.deleteQUL = function (quanId, userId) {
	var quan = quanList[quanId]
	if (quan) {
		delete quan[userId];
	}
};
exports.broastToQuan = function (data) {
	for (var i = 0; i < data.length; i++) {
		if (data[i].length == 7) {
			var quanId = data[i]
			var quan = quanList[quanId]
			if (quan) {
				for (var key in quan) {
					console.log(quan[key]+"quanquan ==" + key)
					if (quan[key] && HallList[key]) {
						console.log("发送圈消息")
						HallList[key].emit("update_quan_info", {
							quanId: quanId
						})
					}
				}
			}
		}
		else{
			var userId = data[i];
			exports.sendToUser(userId,"update_quanzhu_gems")
		}
	}
}
setInterval(() => {
	rs.get_rooms_info()
}, 100);