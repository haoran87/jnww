var mysql = require("mysql");
var crypto = require('./crypto');

var pool = null;

function nop(a, b, c, d, e, f, g) {

}

function query(sql, callback) {
    var t1 = process.uptime();
    pool.getConnection(function (err, conn) {
        if (err) {
            callback(err, null, null);
        } else {
            var t2 = process.uptime();
            conn.query(sql, function (qerr, vals, fields) {
                //释放连接
                conn.release();
                //事件驱动回调
                callback(qerr, vals, fields);
                var t3 = process.uptime();
                // console.log('<++++++++-------- ' + (t2 - t1) + ' ' + (t3 - t2) + ' ' + (t3 - t1) + ' ' + sql + '++++++++-------->');
            });
        }
    });
}

exports.init = function (config) {
    pool = mysql.createPool({
        host: config.HOST,
        user: config.USER,
        password: config.PSWD,
        database: config.DB,
        port: config.PORT,
    });
};

exports.is_account_exist = function (account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(false);
        return;
    }

    var sql = 'SELECT * FROM t_accounts WHERE account = "' + account + '"';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length > 0) {
                callback(true);
            } else {
                callback(false);
            }
        }
    });
};

exports.create_account = function (account, password, callback) {
    callback = callback == null ? nop : callback;
    if (account == null || password == null) {
        callback(false);
        return;
    }

    var psw = crypto.md5(password);
    var sql = 'INSERT INTO t_accounts(account,password) VALUES("' + account + '","' + psw + '")';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            if (err.code == 'ER_DUP_ENTRY') {
                callback(false);
                return;
            }
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};

exports.get_account_info = function (account, password, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT * FROM t_accounts WHERE account = "' + account + '"';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }

        if (password != null) {
            var psw = crypto.md5(password);
            if (rows[0].password == psw) {
                callback(null);
                return;
            }
        }

        callback(rows[0]);
    });
};

exports.is_user_exist = function (account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(false);
        return;
    }

    var sql = 'SELECT userid FROM t_users WHERE account = "' + account + '"';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            throw err;
        }

        if (rows.length == 0) {
            callback(false);
            return;
        }

        callback(true);
    });
};

exports.check_user_exist = function (userId, callback) {
    callback = callback == null ? nop : callback;
    if (userId == null) {
        callback(false);
        return;
    }
    var sql = 'SELECT * FROM t_users WHERE userid = ' + userId;
    console.log("check_user_exist == " + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            throw err;
        }
        if (rows.length == 0) {
            callback(false);
            return;
        }
        callback(true);
    });
};

exports.get_user_data = function (account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT * FROM t_users WHERE account = "' + account + '"';
    console.log("get_user_data  = " + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};

exports.get_user_data_by_userid = function (userid, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(null);
        return;
    }
    var sql = 'SELECT * FROM t_users WHERE userid = ' + userid;
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        if (rows.length == 0) {
            callback(null);
            return;
        }
        // rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};

/**增加玩家房卡 */
exports.add_user_gems = function (userid, gems, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(false);
        return;
    }

    var sql = 'UPDATE t_users SET gems = gems +' + gems + ' WHERE userid = ' + userid;
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            console.log(err);
            callback(false);
            return;
        } else {
            callback(rows.affectedRows > 0);
            return;
        }
    });
};

exports.add_user_treasure = function (userid, coins, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(false);
        return;
    }
    var sql = 'UPDATE t_users SET treasure = treasure +' + coins + ' WHERE userid = ' + userid;
    console.log("add_user_treasure == " + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            console.log(err);
            callback(false);
            return;
        } else {
            callback(rows.affectedRows > 0);
            return;
        }
    });
};




exports.get_gems = function (account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT gems,coins FROM t_users WHERE account = "' + account + '"';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }

        callback(rows[0]);
    });
};

exports.get_user_history = function (userId, callback) {
    callback = callback == null ? nop : callback;
    if (userId == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT history FROM t_users WHERE userid = "' + userId + '"';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            console.log("get_user_history err = "+err)
            callback(null);
        }
        else{
            if (rows.length == 0) {
                callback(null);
                return;
            }
            var history = rows[0].history;
            if (history == null || history == "") {
                callback(null);
            } else {
                console.log(history.length);
                history = JSON.parse(history);
                callback(history);
            }
        }
        
    });
};
exports.get_user_match_history = function (userId, callback) {
    callback = callback == null ? nop : callback;
    if (userId == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT cHistory FROM t_users WHERE userid = "' + userId + '"';
    console.log("get_user_match_history " + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        var history = rows[0].cHistory;
        if (history == null || history == "") {
            callback(null);
        } else {
            console.log(history.length);
            history = JSON.parse(history);
            callback(history);
        }
    });
};

exports.update_user_score = function (roomId, scoreList, table, callback) {
    callback = callback == null ? nop : callback;
    if (roomId == null || scoreList == null) {
        callback(false);
        return;
    }
    var sql = 'UPDATE ' + table + ' SET user_score0 = ' + scoreList[0] + ',user_score1 = ' + scoreList[1] + ',user_score2 = ' + scoreList[2]  + ' where id = ' + roomId;
    console.log("t_rooms update_user_score" + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            console.log("update_user_score" + err);
        }
        if (rows.length == 0) {
            callback(false);
            return;
        }
        callback(true);
    });
};

//更改玩家的金币数
exports.change_user_coins = function (userId, coins, callback) {
    callback = callback == null ? nop : callback;
    if (userId == null) {
        callback(null);
        return;
    }
    var sql = 'UPDATE t_users SET coins={0} WHERE userId={1}';
    sql = sql.format(coins, userId);
    console.log("change_user_coins == " + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            throw err;
        }
        callback(rows.affectedRows > 0);
    });
};

exports.change_user_testcoins = function (userId, coins, callback) {
    callback = callback == null ? nop : callback;
    if (userId == null) {
        callback(null);
        return;
    }
    var sql = 'UPDATE t_users SET testcoins={0} WHERE userId={1}';
    sql = sql.format(coins, userId);
    console.log("change_user_testcoins == " + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            throw err;
        }
        callback(rows.affectedRows > 0);
    });
};



exports.update_user_history = function (userId, history, callback) {
    callback = callback == null ? nop : callback;
    if (userId == null || history == null) {
        callback(false);
        return;
    }

    history = JSON.stringify(history);
    var sql = 'UPDATE t_users SET roomid = null, history = \'' + history + '\' WHERE userid = "' + userId + '"';

    console.log("update_user_history 的sql");
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }

        if (rows.length == 0) {
            callback(false);
            return;
        }

        callback(true);
    });
};
exports.update_user_match_history = function (userId, history, callback) {
    callback = callback == null ? nop : callback;
    if (userId == null || history == null) {
        callback(false);
        return;
    }

    history = JSON.stringify(history);
    var sql = 'UPDATE t_users SET  cHistory = \'' + history + '\' WHERE userid = "' + userId + '"';
    console.log("update_user_match_history 的sql");
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }

        if (rows.length == 0) {
            callback(false);
            return;
        }

        callback(true);
    });
};

exports.check_kong_history = function (roomid, creator, createTime, callback) {
    callback = callback == null ? nop : callback;
    if (roomid == null || createTime == null || creator == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT * FROM t_kong_history WHERE roomid = ' + roomid + ' AND createTime = ' + createTime + ' AND creator = ' + creator;
    console.log("check_kong_history = " + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            console.log("check kong history" + err);
        }
        console.log("ddddddd = " + rows.length);
        if (rows.length == 0) {
            callback(true);
        } else if (rows.length > 0) {
            callback(false);
        }
    });
};


exports.update_kong_history = function (roomId, creator, history, createTime, callback) {
    callback = callback == null ? nop : callback;
    if (creator == null || history == null || roomId == null) {
        callback(false);
        return;
    }
    var hs = JSON.stringify(history);
    console.log("update_kong_history 的 history = " + history);
    var sql = "INSERT INTO t_kong_history(roomid,creator,history,store_time,createTime) VALUES({0},{1},'{2}',{3},{4})";
    sql = sql.format(roomId, creator, hs, Math.floor(Date.now() / 1000), createTime);
    console.log("update_kong_history 的sql = " + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            console.log("update_kong_history err = " + err);
        }
        callback(true);
    });
};

exports.delete_overtime_kong = function (creator, callback) {
    callback = callback == null ? nop : callback;
    if (creator == null) {
        callback(false);
        return;
    }
    var nowtime = Math.floor(Date.now() / 1000);
    console.log("删除空空房间当前时间  = " + nowtime);
    var sql = "DELETE FROM t_kong_history WHERE  {0} - store_time > 10800";
    sql = sql.format(nowtime);
    console.log("delete_overtime_kong sql == " + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            console.log("delete overtime kong history err = " + err);
        } else {
            callback(true);
        }
    });
};

exports.get_kong_history = function (creator, callback) {
    callback = callback == null ? nop : callback;
    if (creator == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT history FROM t_kong_history WHERE creator = ' + creator;
    console.log("get_kong_history = " + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            console.log("get kong history" + err);
        }
        console.log("ddddddd = " + rows.length);
        if (rows.length == 0) {
            callback(-2);
            return;
        }
        var data = [];
        for (var i = 0; i < rows.length; i++) {
            var hs = rows[i].history;
            data.push(hs);
        }
        callback(data);
    });
};

exports.get_games_of_room = function (room_uuid, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT game_index,create_time,result FROM t_games_archive WHERE room_uuid = "' + room_uuid + '"';
    console.log("get_games_of_room == "+sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }

        callback(rows);
    });
};

exports.get_detail_of_game_niuniu = function (room_uuid, index, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null || index == null) {
        callback(null);
        return;
    }
    var sql = 'SELECT base_info FROM t_games_archive WHERE room_uuid = "' + room_uuid + '" AND game_index = ' + index;
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        callback(rows[0]);
    });
};

exports.get_detail_of_game = function (room_uuid, index, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null || index == null) {
        callback(null);
        return;
    }
    index = Number(index) + 1;
    var sql = 'SELECT base_info,action_records FROM t_games_archive WHERE room_uuid = "' + room_uuid + '" AND game_index = ' + index;
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        callback(rows[0]);
    });
};

exports.create_user = function (account, name, coins, gems, sex, headimg, testcoins, callback) {
    callback = callback == null ? nop : callback;
    if (account == null || name == null || coins == null || gems == null) {
        callback(false);
        return;
    }
    if (headimg) {
        headimg = '"' + headimg + '"';
    } else {
        headimg = 'null';
    }
    name = crypto.toBase64(name);
    var sql = 'INSERT INTO t_users(account,name,coins,testcoins,gems,sex,headimg,RegisterDate) VALUES("{0}","{1}",{2},{3},{4},{5},{6},{7})';
    sql = sql.format(account, name, coins, testcoins, gems, sex, headimg, Math.floor(Date.now() / 1000));
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            throw err;
        }
        callback(true);
    });
};

exports.update_user_info = function (userid, name, headimg, sex, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(null);
        return;
    }

    if (headimg) {
        headimg = '"' + headimg + '"';
    } else {
        headimg = 'null';
    }
    name = crypto.toBase64(name);
    var sql = 'UPDATE t_users SET name="{0}",headimg={1},sex={2} WHERE account="{3}"';
    sql = sql.format(name, headimg, sex, userid);
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            throw err;
        }
        callback(rows);
    });
};

exports.update_user_money = function (account, coins, gems, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(null);
        return;
    }

    var sql = 'UPDATE t_users SET coins={0},gems={1} WHERE account="{2}"';
    sql = sql.format(coins, gems, account);
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            throw err;
        }
        callback(rows.affectedRows > 0);
    });
};

exports.get_user_base_info = function (userid, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(null);
        return;
    }
    var sql = 'SELECT name,sex,headimg FROM t_users WHERE userid={0}';
    sql = sql.format(userid);
    // console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            // throw err;
            console.log("get user base info err =="+err)
        }
        console.log("get user base info == "+userid)
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};

exports.is_room_exist = function (roomId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT * FROM t_rooms WHERE id = "' + roomId + '"';//t_rooms
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(rows.length > 0);
        }
    });
};

exports.is_matchroom_exist = function (roomId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT * FROM t_match_rooms WHERE id = "' + roomId + '"';
    console.log("is_matchroom_exist = " + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(rows.length > 0);
        }
    });
};

exports.cost_gems = function (userid, cost, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE t_users SET gems = gems -' + cost + ' WHERE userid = ' + userid;
    console.log("cost_gems == "+sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            console.log("cost_gems err == "+err)
        } else {
            callback(rows.affectedRows > 0);
        }
    });
};

exports.cost_user_treasure = function (userid, cost, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE t_users SET treasure = treasure -' + cost + ' WHERE userid = ' + userid;
    console.log("cost_user_treasure == " + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            console.log("减去财富 == " + rows);
            callback(true);
        }
    });
};

exports.tiqu_user_treasure = function (userid, cost, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE t_users SET treasure = treasure - ' + cost + ' , coins = coins + ' + cost + ' WHERE userid = ' + userid;
    console.log("tiqu_user_treasure == " + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            console.log(" 提取财富 =  " + rows);
            callback(true);
        }
    });
};

//玩家游戏中扣分状态
exports.update_user_gamenum = function (userId, cost, num, callback) {
    callback = callback == null ? nop : callback;
    if (userId == null || userId <= 0) {
        callback(false);
        return;
    }
    var sql = 'SELECT pay FROM t_users WHERE userid = "' + userId + '"';
    console.log("ss pay" + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }
        var pay = rows[0].pay;
        if (pay == 0) {
            exports.cost_gems(userId, cost);
            console.log(pay + "expexpexp sss");
            var sql = 'UPDATE t_users SET pay = ' + num + ' WHERE userid = "' + userId + '"';
            console.log("uuu pay++" + sql);
            query(sql, function (err, rows, fields) {
                if (err) {
                    callback(false);
                    throw err;
                }

                if (rows.length == 0) {
                    callback(false);
                    return;
                }
                callback(true);
            });

        }
    });
};

exports.update_user_pay = function (userId, num, callback) {
    callback = callback == null ? nop : callback;
    if (userId == null) {
        callback(false);
        return;
    }
    var sql = 'UPDATE t_users SET pay = ' + num + ' WHERE userid = "' + userId + '"';
    console.log("uuu1111 pay++" + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }

        if (rows.length == 0) {
            callback(false);
            return;
        }
        callback(true);
    });
};


exports.set_room_id_of_user = function (userId, roomId, callback) {
    callback = callback == null ? nop : callback;
    if (roomId != null) {
        roomId = '"' + roomId + '"';
    }
    var sql = 'UPDATE t_users SET roomid = ' + roomId + ' WHERE userid = "' + userId + '"';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            console.log(err);
            callback(false);
            throw err;
        } else {
            callback(rows.length > 0);
        }
    });
};

// 更改房间表的userId
exports.set_userid_of_room = function (userid, roomId, userName , callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE t_rooms SET ' + userid + '= 0 , '+ userName + '= \'\' WHERE id=' + roomId;
    console.log(" set_userid_of_room 的" + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            console.log(err);
            callback(false);
            // throw err;
        } else {
            callback(rows.length > 0);
        }
    });
};



exports.get_room_id_of_user = function (userId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT roomid,match_roomid FROM t_users WHERE userid = "' + userId + '"';
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        } else {
            if (rows.length > 0) {
                callback(rows[0]);
            } else {
                callback(null);
            }
        }
    });
};

exports.get_game_version = function (callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT gameversion FROM t_game_version ';
    query(sql, function (err, rows, fields) {
        if (err) {
            console.log("获取版本号错误")
            callback(null);
           
        } else {
            if (rows.length > 0) {
                callback(rows[0].gameversion);
            } else {
                callback(null);
            }
        }
    });
};





exports.create_room = function (roomId, conf, ip, port, create_time, creator,quanId, callback) {
    callback = callback == null ? nop : callback;
    if(quanId){
        var sql = "INSERT INTO t_rooms(uuid,id,base_info,ip,port,create_time,creator,quanid) \
        VALUES('{0}','{1}','{2}','{3}',{4},{5},{6},'{7}')";
        var uuid = Date.now() + roomId;
        var baseInfo = JSON.stringify(conf);
        sql = sql.format(uuid, roomId, baseInfo, ip, port, create_time, creator,quanId);
    }
    else{
        var sql = "INSERT INTO t_rooms(uuid,id,base_info,ip,port,create_time,creator) \
    VALUES('{0}','{1}','{2}','{3}',{4},{5},{6})";
    var uuid = Date.now() + roomId;
    var baseInfo = JSON.stringify(conf);
    sql = sql.format(uuid, roomId, baseInfo, ip, port, create_time, creator);
    }
    console.log("create room sql =" + sql);
    query(sql, function (err, row, fields) {
        if (err) {
            callback(null);
            throw err;
        } else {
            callback(uuid);
        }
    });
};

exports.get_room_uuid = function (roomId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT uuid FROM t_rooms WHERE id = "' + roomId + '"';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        } else {
            callback(rows[0].uuid);
        }
    });
};

exports.update_seat_info = function (roomId, seatIndex, userId, icon, name, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE t_rooms SET user_id{0} = {1},user_icon{0} = "{2}",user_name{0} = "{3}" WHERE id = "{4}"';
    name = crypto.toBase64(name);
    sql = sql.format(seatIndex, userId, icon, name, roomId);
    console.log("update_seat_info == " + sql);
    query(sql, function (err, row, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};

exports.update_num_of_turns = function (roomId, numOfTurns, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE t_rooms SET num_of_turns = {0} WHERE id = "{1}"';
    sql = sql.format(numOfTurns, roomId);
    console.log(sql);
    query(sql, function (err, row, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};
//更改房间开始状态
exports.update_isStart = function (roomId, n, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE t_rooms SET isStart = ' + n + ' WHERE id =' + roomId;
    console.log("updat isstart" + sql);
    query(sql, function (err, row, fields) {
        if (err) {
            callback(false);
            console.log("update_isstart" + err);
        } else {
            callback(true);
        }
    });
};

exports.get_room_isStart = function (roomId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT isStart FROM t_rooms WHERE id = ' + roomId;
    console.log("get_room_isStart " + sql);
    query(sql, function (err, row, fields) {
        if (err) {
            callback(2);
            console.log("get_room_isStart " + err);
        } else {
            // console.log("db判断房间是否开始" + row.length);
            if (row.length == 0) {
                callback(555);
            } else if (row[0]) {
                console.log("db get_room_isStart " + row[0].isStart);
                callback(row[0].isStart);
            }


        }
    });
};

// /待开房间 查找有多少在这个房间的用户
exports.get_players_num = function (roomId, callback) {
    callback = callback == null ? nop : callback;
    var sql = "SELECT userid FROM t_users WHERE roomid = " + roomId;
    query(sql, function (err, rows, fields) {
        if (err) {
            console.log(err);
            callback(false);
            throw err;
        } else {
            callback(rows);
        }
    });
};


exports.update_next_button = function (roomId, nextButton, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE t_rooms SET next_button = {0} WHERE id = "{1}"';
    sql = sql.format(nextButton, roomId);
    console.log(sql);
    query(sql, function (err, row, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};

exports.get_room_addr = function (roomId, callback) {
    callback = callback == null ? nop : callback;
    if (roomId == null) {
        callback(false, null, null);
        return;
    }

    var sql = 'SELECT ip,port FROM t_rooms WHERE id = "' + roomId + '"';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false, null, null);
            throw err;
        }
        if (rows.length > 0) {
            callback(true, rows[0].ip, rows[0].port);
        } else {
            callback(false, null, null);
        }
    });
};

exports.get_room_data = function (roomId, callback) {
    callback = callback == null ? nop : callback;
    if (roomId == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT * FROM t_rooms WHERE id = "' + roomId + '"';
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        if (rows.length > 0) {
            rows[0].user_name0 = crypto.fromBase64(rows[0].user_name0);
            rows[0].user_name1 = crypto.fromBase64(rows[0].user_name1);
            rows[0].user_name2 = crypto.fromBase64(rows[0].user_name2);
            callback(rows[0]);
        } else {
            callback(null);
        }
    });
};

exports.delete_room = function (roomId, creator, gems, callback) {
    callback = callback == null ? nop : callback;
    if (roomId == null) {
        callback(false);
    }
    var sql = "DELETE FROM t_rooms WHERE id = '{0}'";
    sql = sql.format(roomId);
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
            // console.log("db 给房主补房卡=="+creator+"gems=="+gems)
            exports.add_user_gems(creator, gems);
        }
    });
};
exports.delete_match_room = function (roomId, creator, gems, callback) {
    callback = callback == null ? nop : callback;
    if (roomId == null) {
        callback(false);
    }
    var sql = "DELETE FROM t_match_rooms WHERE id = '{0}'";
    sql = sql.format(roomId);
    console.log("delete_match_room sql == " + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
            // console.log("db 给房主补房卡=="+creator+"gems=="+gems)
            exports.add_user_gems(creator, gems);
        }
    });
};

exports.create_game = function (room_uuid, index, base_info, callback) {
    // console.log(" 存储游戏的== " + base_info);
    callback = callback == null ? nop : callback;
    var sql = "INSERT INTO t_games(room_uuid,game_index,base_info,create_time) VALUES('{0}',{1},'{2}',unix_timestamp(now()))";
    sql = sql.format(room_uuid, index, base_info);
    console.log(" create_game sql === "+sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
        } else {
            callback(rows.insertId);
        }
    });
};

exports.delete_games = function (room_uuid, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null) {
        callback(false);
    }
    var sql = "DELETE FROM t_games WHERE room_uuid = '{0}'";
    sql = sql.format(room_uuid);
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};

exports.archive_games = function (room_uuid, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null) {
        callback(false);
    }
    var sql = "SELECT * FROM t_games_archive WHERE room_uuid = '{0}'";
    sql = sql.format(room_uuid);
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (rows.length > 0) {
            callback(false);
            return;
        }
        var sql = "INSERT INTO t_games_archive(SELECT * FROM t_games WHERE room_uuid = '{0}')";
        sql = sql.format(room_uuid);
        console.log(sql);
        query(sql, function (err, rows, fields) {
            if (err) {
                callback(false);
                // console.log('err is ' + JSON.stringify(err));
                throw err;
            } else {
                exports.delete_games(room_uuid, function (ret) {
                    callback(ret);
                });
            }
        });
    });
};

exports.update_game_action_records = function (room_uuid, index, actions, callback) {
    callback = callback == null ? nop : callback;
    var sql = "UPDATE t_games SET action_records = '" + actions + "' WHERE room_uuid = '" + room_uuid + "' AND game_index = " + index;
    // console.log("update_game_action_records sql  == "+sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};

exports.update_game_result = function (room_uuid, index, result, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null || result) {
        callback(false);
    }

    result = JSON.stringify(result);
    var sql = "UPDATE t_games SET result = '" + result + "' WHERE room_uuid = '" + room_uuid + "' AND game_index = " + index;
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};
exports.update_match_game_result = function (room_uuid, index, result, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null || result) {
        callback(false);
    }

    result = JSON.stringify(result);
    var sql = "UPDATE t_match_games SET result = '" + result + "' WHERE room_uuid = '" + room_uuid + "' AND game_index = " + index;
    console.log("update_match_game_result == " + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};

exports.get_message = function (type, version, callback) {
    callback = callback == null ? nop : callback;

    var sql = 'SELECT * FROM t_message WHERE type = "' + type + '"';

    if (version == "null") {
        version = null;
    }

    if (version) {
        version = '"' + version + '"';
        sql += ' AND version != ' + version;
    }

    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length > 0) {
                callback(rows[0]);
            } else {
                callback(null);
            }
        }
    });
};

//!!@@添加注册送房卡的数据库配置
exports.get_reg_gems = function (callback) {
    callback = callback == null ? nop : callback;
    var sql = "select conf_val from sys_config where conf_key = 'reg_send'";
    query(sql, function (err, rows, fields) {
        if (!err) {
            if (rows.length > 0) {
                callback(rows[0].conf_val);
            } else {
                console.log('!!!!!!!!can not find conf_val');
                callback(5);
            }
        } else {
            console.log('!!!!!!!!can not find conf_val');
            callback(5);
        }
    });
};

//玩家赠玩家房卡：
exports.zengsong = function (s_uid, d_uid, gold, callback) {
    callback = callback == null ? nop : callback;
    var sql = "select userid,gems from t_users WHERE userid = " + s_uid + " OR userid = " + d_uid;
    query(sql, function (err, rows, fields) {
        if (!err) {
            if (rows.length == 2) {
                for (var i = 0; i < rows.length; i++) {
                    if (rows[i].userid == s_uid) {
                        if (rows[i].gems >= gold) {
                            exports.cost_gems(s_uid, gold);
                            exports.add_user_gems(d_uid, gold);
                            exports.record_zengsong(s_uid, d_uid, gold);
                            var data = {
                                code: 200,
                                gems: rows[i].gems - gold,
                            };
                            callback(data);
                        } else {
                            callback({
                                code: 103
                            });
                        }
                        break;
                    }
                }

            } else if (rows.length == 1) {
                callback({
                    code: 102
                });
            }
        } else {
            callback({
                code: 101
            });
            console.log(err);
        }
    });
};
exports.zengsong_coins = function (s_uid, d_uid, coins, callback) {
    callback = callback == null ? nop : callback;
    var sql = "select treasure from t_users WHERE userid = " + s_uid;
    query(sql, function (err, rows, fields) {
        if (err) {
            callback({
                code: 6
            });
        } else {
            if (rows[0].treasure >= coins) {
                exports.cost_user_treasure(s_uid, coins);
                exports.add_user_treasure(d_uid, coins);
                exports.record_give_coins(s_uid, d_uid, coins);
                callback({
                    code: 1
                });
            } else {
                callback({
                    code: 4
                });
            }
        }
    });
};

exports.record_zengsong = function (s_uid, d_uid, gems, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'INSERT INTO t_give_gems(give_uid,giveto_uid,give_gems,give_time) VALUES({0},{1},{2},{3})';
    sql = sql.format(s_uid, d_uid, gems, Math.floor(Date.now() / 1000));
    query(sql, function (err, rows, fields) {
        if (!err) {
            console.log("赠送房卡记录添加成功");
        } else {
            console.log("添加赠送房卡记录错误");
        }
    });
};

exports.record_give_coins = function (s_uid, d_uid, coins, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'INSERT INTO t_give_coins(give_uid,giveto_uid,give_coins,give_time) VALUES({0},{1},{2},{3})';
    sql = sql.format(s_uid, d_uid, coins, Math.floor(Date.now() / 1000));
    query(sql, function (err, rows, fields) {
        if (!err) {
            console.log("赠送金币记录添加成功");
            callback(true);
        } else {
            console.log("添加赠送金币记录失败");
            callback(false);
        }
    });
};
exports.record_tiqu_coins = function (s_uid, coins, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'INSERT INTO t_qu_coins(give_uid,give_coins,give_time) VALUES({0},{1},{2})';
    sql = sql.format(s_uid, coins, Math.floor(Date.now() / 1000));
    query(sql, function (err, rows, fields) {
        if (!err) {
            console.log("提取金币记录添加成功");
            callback(true);
        } else {
            console.log("提取金币记录失败");
            callback(false);
        }
    });
};

exports.share_gift = function (userId, gems, callback) {
    callback = callback == null ? nop : callback;
    var sql = "select * from t_gift WHERE user_id = " + userId;
    query(sql, function (err, rows, fields) {
        if (!err) {
            if (rows.length == 0) {
                exports.insert_t_gift(userId, gems);
                console.log("新分享用户");
                callback(200);
            } else if (rows.length == 1) {
                console.log("上次赠送礼物的时间" + rows[0].gift_date + "  " + rows[0].is_send);
                var is_send = rows[0].is_send;
                var gift_date = rows[0].gift_date * 1000;
                var myDate = new Date();
                gift_date = new Date(gift_date);
                var y1 = gift_date.getFullYear();
                var y2 = myDate.getFullYear();
                var m1 = gift_date.getMonth();
                var m2 = myDate.getMonth();
                var d1 = gift_date.getDate();
                var d2 = myDate.getDate();
                var miu1 = gift_date.getMinutes();
                var miu2 = myDate.getMinutes();
                if (is_send == 0) {
                    if (y1 == y2 && m1 == m2 && d1 == d2) {
                        console.log("已经分享过了");
                        callback(201);
                    } else {
                        callback(200);
                        rows[0].send_num += 1;
                        exports.add_user_gems(userId, gems);
                        exports.update_t_gift(userId, rows[0].send_num);
                    }
                }
            }
        } else {
            callback(202);
            console.log("获取t_gift 数据错误" + err);
        }
    });
};

exports.insert_t_gift = function (userId, gems, callback) {
    callback = callback == null ? nop : callback;
    var myDate = new Date();

    var sql = 'INSERT INTO t_gift(user_id,gift_date,gift_time,send_num,is_send) VALUES({0},{1},{2},{3},{4})';
    sql = sql.format(userId, myDate.getTime() / 1000, Math.floor(Date.now() / 1000), 1, 0);
    query(sql, function (err, rows, fields) {
        if (!err) {
            console.log("添加分享赠送成功");
            exports.add_user_gems(userId, gems);
        } else {
            console.log("添加分享赠送失败" + err);
        }
    });
};

exports.update_t_gift = function (userId, num, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE t_gift SET gift_date = {0},send_num = {1} WHERE user_id = {2}';
    // name = crypto.toBase64(name);
    sql = sql.format(Date.now() / 1000, num, userId);
    console.log("update_t_gift" + sql);
    query(sql, function (err, row, fields) {
        if (err) {
            // callback(false);
            console.log("更改分享赠送失败" + err);
        } else {
            // callback(true);
            console.log("更改分享赠送成功");
        }
    });
};

exports.check_referee_exist = function (id, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT * FROM admin_users where level = 2 and id = ' + id;
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length == 1) {
                callback(true);
            } else {
                callback(false);
            }
        }
    });
};
exports.add_user_referee = function (account, referee, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE t_users SET referee = ' + referee + ' WHERE account = "' + account + '"';
    console.log("add_user_referee == " + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            console.log("rrrfffdddd = " + JSON.stringify(rows.affectedRows));
            if (rows.affectedRows > 0) {
                callback(true);
            } else {
                callback(false);
            }
        }
    });
};

//t_match_rooms
exports.get_all_match_rooms = function (callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT id FROM t_match_rooms';
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        } else {
            if (rows.length > 0) {
                callback(rows);
            } else {
                callback(null);
            }
        }
    });
};
exports.get_match_room_id_of_user = function (userId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT match_roomid FROM t_users WHERE userid = "' + userId + '"';
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        } else {
            if (rows.length > 0) {
                callback(rows[0].match_roomid);
            } else {
                callback(null);
            }
        }
    });
};
exports.matchroom_is_exist = function (roomid, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT * FROM t_match_rooms WHERE id = "' + roomid + '"';
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        } else {
            if (rows.length > 0) {
                callback(true);
            } else {
                callback(null);
            }
        }
    });
};
exports.create_match_room = function (roomId, conf, ip, port, create_time, callback) {
    callback = callback == null ? nop : callback;
    var sqlmr = "select winup,losedown,windown,winnum from t_mark_rule where id = 1";
    query(sqlmr, function (err, rows, fields) {
        if (!err) {
            if (rows.length > 0) {

                var sql = "INSERT INTO t_match_rooms(uuid,id,base_info,ip,port,create_time,winup,losedown,windown,winnum) \
                VALUES('{0}','{1}','{2}','{3}',{4},{5},{6},{7},{8},{9})";
                var uuid = Date.now() + roomId;
                var baseInfo = JSON.stringify(conf);
                sql = sql.format(uuid, roomId, baseInfo, ip, port, create_time, rows[0].winup, rows[0].losedown, rows[0].windown, rows[0].winnum);
                console.log(sql);
                query(sql, function (err, row, fields) {
                    if (err) {
                        callback(null);
                        throw err;
                    } else {
                        callback(uuid);
                    }
                });

            } else {
                console.log('create_room null');
                callback(null);
            }
        } else {
            console.log('create_room null');
            callback(null);
        }
    });
};

exports.set_match_room_id_of_user = function (userId, match_roomId, callback) {
    callback = callback == null ? nop : callback;
    if (match_roomId != null) {
        match_roomId = '"' + match_roomId + '"';
    }
    var sql = 'UPDATE t_users SET match_roomId = ' + match_roomId + ' WHERE userid = "' + userId + '"';
    console.log("玩家房间信息更为null == " + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            console.log(err);
            callback(false);
            throw err;
        } else {
            callback(rows.length > 0);
        }
    });
};
exports.clear_users_match_roomid = function (callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE t_users SET match_roomId = Null WHERE match_roomId is Not Null';
    console.log("clear_users_match_roomid  == " + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            console.log(err);
            callback(false);
            throw err;
        } else {
            callback(rows.length > 0);
        }
    });
};

exports.get_match_room_addr = function (match_roomId, callback) {
    callback = callback == null ? nop : callback;
    if (match_roomId == null) {
        callback(false, null, null);
        return;
    }

    var sql = 'SELECT ip,port FROM t_match_rooms WHERE id = "' + match_roomId + '"';
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false, null, null);
            throw err;
        }
        if (rows.length > 0) {
            callback(true, rows[0].ip, rows[0].port);
        } else {
            callback(false, null, null);
        }
    });
};

exports.get_mark_rule = function (callback) {
    callback = callback == null ? nop : callback;
    var sqlmr = "select winup,losedown,windown,winnum from t_mark_rule where id = 1";
    query(sqlmr, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        } else {
            callback(rows[0]);
        }
    });

};
exports.get_user_mark = function (userid, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT gems,wlstate,winnum FROM t_mark_user WHERE userid = ' + userid;
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        if (rows.length == 0) {
            callback(null);
            return;
        }
        callback(rows[0]);
    });
};

exports.get_match_room_data = function (match_roomId, callback) {
    callback = callback == null ? nop : callback;
    if (match_roomId == null) {
        callback(null);
        return;
    }

    var sql = 'SELECT * FROM t_match_rooms WHERE id = "' + match_roomId + '"';
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        if (rows.length > 0) {
            rows[0].user_name0 = crypto.fromBase64(rows[0].user_name0);
            rows[0].user_name1 = crypto.fromBase64(rows[0].user_name1);
            rows[0].user_name2 = crypto.fromBase64(rows[0].user_name2);
            rows[0].user_name3 = crypto.fromBase64(rows[0].user_name3);
            rows[0].user_name4 = crypto.fromBase64(rows[0].user_name4);
            rows[0].user_name5 = crypto.fromBase64(rows[0].user_name5);
            callback(rows[0]);
        } else {
            callback(null);
        }
    });
};

exports.is_match_room_exist = function (roomId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT * FROM t_match_rooms WHERE id = "' + roomId + '"';
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(rows.length > 0);
        }
    });
};
exports.delete_match_room = function (match_roomId, callback) {
    callback = callback == null ? nop : callback;
    if (match_roomId == null) {
        callback(false);
    }
    var sql = "DELETE FROM t_match_rooms WHERE id = '{0}'";
    sql = sql.format(match_roomId);
    console.log(sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};
exports.update_match_seat_info = function (roomId, seatIndex, userId, icon, name, coins, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE t_match_rooms SET user_id{0} = {1},user_icon{0} = "{2}",user_name{0} = "{3}",user_score{0} = {5} WHERE id = "{4}"';
    name = crypto.toBase64(name);
    sql = sql.format(seatIndex, userId, icon, name, roomId, coins);
    //console.log(sql);
    query(sql, function (err, row, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};

exports.update_num_of_turns_match = function (roomId, numOfTurns, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE t_match_rooms SET num_of_turns = {0} WHERE id = "{1}"';
    sql = sql.format(numOfTurns, roomId);
    //console.log(sql);
    query(sql, function (err, row, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};
exports.update_next_button_match = function (roomId, nextButton, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE t_match_rooms SET next_button = {0} WHERE id = "{1}"';
    sql = sql.format(nextButton, roomId);
    //console.log(sql);
    query(sql, function (err, row, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};
exports.clear_match_room = function (callback) {
    callback = callback == null ? nop : callback;
    var sql = 'DELETE FROM t_match_rooms';
    console.log("clear_match_room sql == " + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};

// exports.update_seat_info = function (roomId, seatIndex, userId, icon, name, callback) {
//     callback = callback == null ? nop : callback;
//     var sql = 'UPDATE t_match_rooms SET user_id{0} = {1},user_icon{0} = "{2}",user_name{0} = "{3}" WHERE id = "{4}"';
//     name = crypto.toBase64(name);
//     sql = sql.format(seatIndex, userId, icon, name, roomId);
//     console.log("update_seat_info sql == "+sql);
//     query(sql, function (err, row, fields) {
//         if (err) {
//             callback(false);
//             throw err;
//         } else {
//             callback(true);
//         }
//     });
// };
//金币模式抽水
exports.pump = function (userid, winscore, pumpscore, tcomm, callback) {
    console.log("pump *** " + userid + "   " + winscore + "  " + pumpscore);
    callback = callback == null ? nop : callback;
    var agentid = 0;
    var sqls = 'SELECT referee FROM t_users WHERE userid = {0}';
    sqls = sqls.format(userid);
    query(sqls, function (err, rows, fields) {
        if (!err && rows.length > 0) {
            agentid = rows[0].referee;

            if (agentid > 0 && agentid < 1000) {
                var ag_pump = (pumpscore * 0.4).toFixed(3);
                var gf_pump = (pumpscore * 0.4 - tcomm).toFixed(3);
                var sag_pump = (pumpscore * 0.2).toFixed(3);

                console.log("pump === " + ag_pump + "  " + gf_pump + "  " + sag_pump);

                var sqli = 'INSERT INTO admin_user_score(agentid,userid,winscore,ag_pump,gf_pump,sag_pump) VALUES({0},{1},{2},{3},{4},{5})';
                sqli = sqli.format(agentid, userid, winscore, ag_pump, gf_pump, sag_pump);
                console.log("pump sqli == " + sqli);
                query(sqli, function (err, rows, fields) {
                    if (err) {
                        callback(false);
                        throw err;
                    } else {
                        callback(true);
                    }
                });

                var sqlu = 'UPDATE admin_users SET day_pump = day_pump + {0},pump_user = pump_user + {1},pump_gf = pump_gf + {2}  WHERE id = {3}'; //给官方gf_pump 0.4  pump_user代理自己收益  day_pump代理今日收益 
                sqlu = sqlu.format(ag_pump, ag_pump, gf_pump, agentid);

                console.log("pump sqlu == " + sqlu);
                query(sqlu, function (err, rows, fields) {
                    if (err) {
                        callback(false);
                        throw err;
                    } else {
                        callback(true);
                    }
                });

                var ref_id = 0;
                var sqlss = 'SELECT ref_id FROM admin_users WHERE id = ' + agentid + '';
                console.log("pump sqlss == " + sqlss);
                query(sqlss, function (err, rows, fields) {
                    if (!err && rows.length > 0) {
                        ref_id = rows[0].ref_id;
                        if (ref_id != 0) {
                            var sqlua = 'UPDATE admin_users SET pump_agent = pump_agent + {0} WHERE id = {1}'; //有上级代理ref_id 20%给上级 pump_agent 代理返给的20%的收益
                            sqlua = sqlua.format(sag_pump, ref_id);
                            console.log("pump sqlua == " + sqlua);
                            query(sqlua, function (err, rows, fields) {
                                if (err) {
                                    callback(false);
                                    throw err;
                                } else {
                                    callback(true);
                                }
                            });

                        } else {
                            // var sqlu = 'UPDATE admin_users SET pump_wgf = pump_wgf + {0} WHERE id = {1}';
                            // sqlu = sqlu.format(sag_pump, agentid);
                            var sqlu = 'UPDATE admin_users SET day_pump = day_pump + {0},pump_user = pump_user + {1},pump_wgf = pump_wgf + {2}  WHERE id = {3}'; //没有上级代理：20%返回给代理自己pump_user
                            sqlu = sqlu.format(sag_pump, sag_pump, sag_pump, agentid);
                            console.log("pump sqlu == " + sqlu);
                            query(sqlu, function (err, rows, fields) {
                                if (err) {
                                    callback(false);
                                    throw err;
                                } else {
                                    callback(true);
                                }
                            });
                        }
                    }
                });

            } else {
                var gf_pump = pumpscore - tcomm;
                var sqli = 'INSERT INTO admin_user_score(agentid,userid,winscore,ag_pump,gf_pump,sag_pump) VALUES({0},{1},{2},{3},{4},{5})';
                sqli = sqli.format(agentid, userid, winscore, 0, gf_pump, 0);
                console.log("pump agentid == 0 时  sqli == " + sqli);
                query(sqli, function (err, rows, fields) {
                    if (err) {
                        callback(false);
                        throw err;
                    } else {
                        callback(true);
                    }
                });
            }

        }
    });

};

exports.update_user_commission = function (userId, commission, rid, callback) {
    callback = callback == null ? nop : callback;
    var sqlu = 'UPDATE t_users SET commission = commission + {0}  WHERE userid = {1}';
    sqlu = sqlu.format(commission, userId);
    query(sqlu, function (err, rows, fields) {
        if (err) {
            callback(false);
            console.log("更新玩家佣金出错");
            throw err;
        } else {
            var sqln = "INSERT INTO t_commission_record(agent_id,user_id,commission,game_time) VALUES({0},{1},{2},{3})";
            sqln = sqln.format(userId, rid, commission, Math.floor(Date.now() / 1000));
            query(sqln, function (err, rows, fields) {
                if (err) {
                    callback(false);
                    console.log("佣金存储出错");
                    throw err;
                } else {
                    callback(true);
                }
            });
        }
    });
};

exports.get_user_commission = function (account, commission, callback) {
    callback = callback == null ? nop : callback;
    var sqlu = 'UPDATE t_users SET commission = commission - {0} , coins = coins + {2} WHERE account = "{1}"';
    sqlu = sqlu.format(commission, account, commission);
    console.log("get_user_commission == " + sqlu);
    query(sqlu, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};
exports.get_quan_data = function(quanId,callback){
    callback = callback == null ? nop : callback;
    var sql = "select * from t_quan where id = "+quanId;
    // console.log("get_quan_data sql = "+sql)
    query(sql,function(err,rows,fields){
        if(err){
            console.log("get_quan_data err == "+err);
            callback(false);
        }
        else{
            // console.log("get_quan_data row === "+rows.length+"   "+JSON.stringify(rows))
            if(rows.length >0){
                callback(rows[0]);
            }
            else{
                callback(null)
            }
        }
    })
};
exports.is_quan_exist = function(name,quanId,callback){
    callback = callback == null ? nop : callback;
    if(name){
        var sql = "select * from t_quan where nickname = '"+name+"'";
    }
    if(quanId){
        var sql = "select * from t_quan where id = "+quanId;
    }
    console.log("is_quan_exist == "+sql);
    query(sql,function(err,rows,fields){
        if(err){
            console.log("is_quan_exist == "+err);
        }
        else{
            callback(rows.length > 0);
        }
    })
},
exports.create_quan = function (quanName,quanId,creator, callback) {
    callback = callback == null ? nop : callback;
    var sql = "INSERT INTO t_quan(id,nickname,creator,createtime) \
    VALUES('{0}','{1}',{2},{3})";
    sql = sql.format(quanId, quanName, creator, Math.floor(Date.now() / 1000));
    console.log("create_quan sql =" + sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        } else {
            callback(true);
        }
    });
};
exports.update_quan_quan = function(quan,quanId,callback){
    callback = callback == null ? nop : callback;
    if(quan.length > 0){
        var quan = JSON.stringify(quan);
        var sqlu = 'UPDATE t_quan SET quan = \''+ quan + '\' where id = '+quanId;
    }
    else{
        var sqlu = 'UPDATE t_quan SET quan = null where id = '+quanId;
    }
  
    console.log("update_quan_quan sql =="+sqlu)
    query(sqlu,function(err,rows,fields){
        if(err){
            console.log("update_quan_quan"+err)
        }
        else{
            console.log("把玩家添加的圈子里成功")
            callback(true)
        }
    })
};
exports.update_user_quan = function(quan,userId,callback){
    callback = callback == null ? nop : callback;
    if(quan && quan.length > 0){
        var quan = JSON.stringify(quan);
        var sql = 'UPDATE t_users SET  quan = \'' + quan + '\' WHERE userid = "' + userId + '"';
    }
    else{
        var sql = 'UPDATE t_users SET  quan = null WHERE userid = "' + userId + '"';
    }
    // var sqlu = 'UPDATE t_users SET quan = '+ quan + ' where userid = '+userId;
  
    console.log("update_user_quan sql =="+sql)
    query(sql,function(err,rows,fields){
        if(err){
            console.log("update_user_quan"+err)
        }
        else{
            console.log("把玩家添加的圈子里成功22")
            callback(true)
        }
    })
};
exports.get_quan_zhuos = function(quanId,callback){
    callback = callback == null ? nop : callback;
    var sql = "select * from t_rooms where quanid = "+quanId;
    query(sql,function(err,rows,fields){
        if(err){
            console.log("get_quan_zhuos err = "+err)
            callback(false);
        }
        else{
            callback(rows);
        }
    })
};
exports.get_quan_message = function(quanId,userId,callback){
    callback = callback == null ? nop : callback;
    var sql = "select * from t_quan_message where quanid = "+quanId+" and applicant = "+userId;
    console.log("get_quan_message sql == "+sql);
    query(sql,function(err,rows,fields){
        if(err){
            console.log("get_quan_message err = "+err)
            callback(false);
        }
        else{
            callback(rows);
        }
    })
}
exports.update_user_quan_message = function(quanId,userId,creator,quanName,uname,aaa,callback){
    callback = callback == null ? nop : callback;
    // var quan = JSON.stringify(quan);
    // var sqlu = 'UPDATE t_users SET quan = '+ quan + ' where userid = '+userId;
    if(aaa == 1){
        var sql = 'INSERT INTO t_quan_message (quanid,applicant,creator,rtime,quanname,altname)\
        VALUES("' + quanId + '",' + userId + ' , '+ creator+' , '+Math.floor(Date.now() / 1000)+',"'+ quanName +'","'+ uname +'")';
    }
    else if(aaa == 2){
        var sql = 'INSERT INTO t_quan_message (quanid,applicant,creator,rtime,quanname,status,altname)\
        VALUES("' + quanId + '",' + userId + ' , '+ creator+' , '+Math.floor(Date.now() / 1000)+',"'+ quanName +'",'+4+',"'+uname+'")';
    }
    console.log("update_user_quan_message =="+sql)
    query(sql,function(err,rows,fields){
        if(err){
            console.log("update_user_quan"+err)
            callback(false)
        }
        else{
            console.log("圈子信息申请成功")
            callback(true)
        }
    })
};
exports.get_re_message = function(userId,kong,callback){
    callback = callback == null ? nop : callback;
    if(kong == 1){
        var sql = "select * from t_quan_message where (creator = "+ userId+" and (status = 0 or status = 4) ) or (applicant = "+ userId +" and status <> 8)";
    }
    else{
        var sql = "select * from t_quan_message where  applicant = "+userId +" and status <> 8";
    }
    console.log("get_re_message == "+sql);
    query(sql,function(err,rows,fields){
        if(err){
            console.log("get_re_message err ="+err)
        }
        else{
            callback(rows);
        }
    })
};
exports.change_quan_message_status = function(userId,isRe,status,quanId,callback){
    callback = callback == null ? nop : callback;
    if(isRe == 1){
        var sql = "update t_quan_message set status = 8 where applicant = "+ userId +" and (status = 1 or status = 2 or status = 5 or status = 6)";
    }   
    else if(isRe == 0){
        var sql = "update t_quan_message set status = "+status+" where applicant = "+ userId +" and status = 0 and quanid = "+quanId;
    }
    else if(isRe == 2){
        var sql = "update t_quan_message set status = "+ status +" where applicant = "+ userId +" and quanid = "+quanId;
    }
    else if(isRe == 4){
        var sql = "update t_quan_message set status = "+status+" where applicant = "+ userId +" and status = 4 and quanid = "+quanId;
    }
    console.log("change_quan_message_status sql = "+sql)
    query(sql,function(err,rows,fields){
        if(err){
            console.log("change_quan_message_status err ="+err);
        }
        else{
            console.log("rowsrows == "+JSON.stringify(rows))
            console.log("rowsrows111 == "+rows.affectedRows)
            callback(rows.affectedRows >= 1);
        }
    })
};
exports.delete_quan = function(quanId,callback){
    callback = callback == null ? nop : callback;
    var sql = "DELETE FROM t_quan WHERE id = "+quanId;
    console.log("delete quan == "+sql);
    query(sql,function(err,rows,fields){
        if(err){
            console.log("delete_quan err =="+err);
            callback(null);
        }
        else{
            callback(rows.affectedRows >= 1)
        }
    })
};
exports.store_history = function (uuid, history,quanid, callback) {
    callback = callback == null ? nop : callback;
    if (uuid == null || history == null ) {
        callback(false);
        return;
    }
    history = JSON.stringify(history);
    var store_time = Math.ceil(Date.now() / 1000);
    var sql = 'INSERT INTO t_history(uuid,history,quanid,storetime) VALUES("' + uuid + '",\'' + history + '\',"'+ quanid +'","'+ store_time +'")';
    console.log("store_history == "+sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            console.log("store_history err == "+err)
            callback(false);
        } else {
            callback(true);
        }
    });
};
exports.get_history = function (uuid, callback) {
    callback = callback == null ? nop : callback;
    if (uuid == null) {
        callback(null);
        return;
    }
    var sql = 'SELECT * FROM t_history WHERE uuid = "' + uuid + '"';
    console.log("get_history sql == "+sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            console.log("get_history err = "+err)
            callback(null);
        }
        else{
            if (rows.length == 0) {
                callback(null);
                return;
            }
            callback(rows[0]);
        }
        
    });
};
exports.get_quan_history = function (quanId, callback) {
    callback = callback == null ? nop : callback;
    if (!quanId) {
        callback(null);
        return;
    }
    var sql = 'SELECT * FROM t_history WHERE quanid = "' + quanId + '"';
    console.log("get_quan_history sql == "+sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            console.log("get_quan_history err = "+err)
            callback(null);
        }
        else{
            console.log("获取圈历史记录数目 == "+rows.length)
            if (rows.length == 0) {
                callback(null);
                return;
            }
            callback(rows);
        }
        
    });
};
exports.update_user_rights = function (userid, rights,kong, doNum, callback) {
    callback = callback == null ? nop : callback;
    if(doNum == 3 || doNum == 4){
        var sql = 'UPDATE t_users SET commission = ' + rights + ' WHERE userid = ' + userid;
    }   
    else if(doNum == 5 || doNum == 6){
        var sql = 'UPDATE t_users SET lv = ' + rights + ',kong = '+ kong +' WHERE userid = ' + userid;
    }
    console.log("update_user_rights  == "+sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            console.log("cost_gems err == "+err)
        } else {
            callback(rows.affectedRows > 0);
        }
    });
};
exports.add_give_gems_record = function (toid, giveid,gemsnum,giveto_name,give_name, callback) {
    callback = callback == null ? nop : callback;
    if (toid == null || gemsnum == null | giveid == null ) {
        callback(false);
        return;
    }
    var store_time = Math.ceil(Date.now() / 1000);
    var sql = 'INSERT INTO t_give_gems(giveto_uid,give_uid,give_gems,give_time) VALUES(' + toid + ',' + giveid + ','+ gemsnum +','+ store_time +')';
    console.log("add_give_gems_record == "+sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            console.log("add_give_gems_record err == "+err)
            callback(false);
        } else {
            callback(true);
        }
    });
};
exports.is_ht_exist = function (userId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT * FROM admin_users WHERE userid = ' + userId ;
    console.log("is_ht_exist == "+sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(rows.length > 0);
        }
    });
};
exports.change_user_ht_status = function (userid, status, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE admin_users SET status = ' + status + ' WHERE userid = ' + userid;
    console.log("change_user_ht_status  == "+sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            callback(false);
            console.log("change_user_ht_status  err == "+err)
        } else {
            callback(rows.affectedRows > 0);
        }
    });
};
exports.add_user_in_ht = function (userId, secret,callback) {
    callback = callback == null ? nop : callback;
    var sql = 'INSERT INTO admin_users(userid,username,password,level,status,add_id) VALUES(' + userId + ',' + userId + ',"'+ secret +'",'+2+','+1+','+88+')';
    console.log("add_give_gems_record == "+sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            console.log("add_give_gems_record err == "+err)
            callback(false);
        } else {
            callback(rows.insertId);
        }
    });
};
exports.add_user_ht_access = function (agentId,callback) {
    callback = callback == null ? nop : callback;
    var sql = 'INSERT INTO admin_auth_group_access (uid,group_id) VALUES(' + agentId + ',' + 3 + ')';
    console.log("add_user_ht_access == "+sql);
    query(sql, function (err, rows, fields) {
        if (err) {
            console.log("add_user_ht_access err == "+err)
            callback(false);
        } else {
            callback(true);
        }
    });
};
exports.query = query;