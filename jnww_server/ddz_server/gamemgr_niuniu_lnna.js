var roomMgr = require("./roommgr");
var userMgr = require("./usermgr");
var db = require("../utils/db");
var crypto = require("../utils/crypto");
var assert = require('assert');
var http = require("../utils/http");
var pokerManager = require("./poker_manager");
var pm = new pokerManager();
var PokerPlayHelp = require('./poker_play');
var pph = new PokerPlayHelp();

exports.games = {};
var max_player_count = 3; //玩家人数
var gameSeatsOfUsers = {};
var fs = require("fs");
var logf = function (roomId, logContent) {
    fs.appendFile('log/' + roomId + '.log', '' + Date.now() + ' :: ' + logContent + '\r\n', function () {});
};
exports.gamePlayerList = [];
exports.setReady = function (userId, callback) {
    var roomId = roomMgr.getUserRoom(userId);
    if (roomId == null) {
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    }
    // 20180116 添加
    var game = exports.games[roomId];
    if (game == null) {
        roomMgr.setReady(userId, true);
        var seatIndex = roomMgr.getUserSeat(userId);
        var isFirstIn = roomInfo.seats[seatIndex].isFirstIn;
        console.log("是第一次吗   ="+isFirstIn)
        if(isFirstIn){
            roomInfo.seats[seatIndex].isFirstIn = false;
            userMgr.sendMsg(userId,"return_user_mapInfo",{seats:roomInfo.seats})
        }
    }
    if (game == null) {
        if (roomInfo.seats.length == max_player_count) {
            var ready_count = 0;
            var exist_player_count = 0;
            for (var i = 0; i < roomInfo.seats.length; ++i) {
                var s = roomInfo.seats[i];
                if (s.ready == true) {
                    ready_count++;
                }
                if (s.userId > 0) {
                    exist_player_count++;
                }
            }
            if (ready_count == 3) {
                if (ready_count == exist_player_count) {
                    if(roomInfo.beginTimer){
                        clearInterval(roomInfo.beginTimer);
                        roomInfo.beginTimer = null;
                    }
                    if(!exports.games[roomId]){
                        exports.begin(roomId, true);
                    }
                } 
            }

        }
    } else {
        var data = {
            state: game.state,
            landLord: game.lastGrabIndex,
            turn: game.turn,
            conf: roomInfo.conf,
            numOfGames: roomInfo.numOfGames,
            diPokers: game.diPokers,
            gameTimes: game.gameTimes,
            isFirstPoker: game.isFirstPoker,
            difen: game.difen,
            gameTimer: false,
            gameDowntime: 0,
            lastPokerWraper: game.lastPokerWraper,
        };
        if (roomInfo.gameTimer) {
            data.gameTimer = true;
            data.gameDowntime = roomInfo.gameDowntime;
        }
        data.seats = [];
        // var seatData = null;
        for (var i = 0; i < max_player_count; ++i) {
            var sd = game.gameSeats[i];
            var s = {};
            s.userId = sd.userId;
            // s.holds = sd.holds;
            s.holds = [];
            s.pokerNum = sd.holds.length;
            s.score = roomInfo.seats[i].score;
            s.ispass = sd.ispass;
            s.outPokers = sd.outPokers;
            // s.isjiabei = sd.isjiabei;
            s.isqiang = sd.isqiang;
            s.mapInfo = roomInfo.seats[i].mapInfo;
            if (sd.userId == userId) {
                // seatData = sd;
                s.holds = sd.holds;
            }
            data.seats.push(s);
        }
        //同步整个信息给客户端
        userMgr.sendMsg(userId, 'game_sync_push', data);
    }
};
// 判断游戏进行中
exports.isGameRunning = function (roomId) {
    var game = exports.games[roomId];
    if (game) {
        return true;
    }
    return false;
};
//开始新的一局
exports.begin = function (roomId, add) {
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    }
    if (roomInfo.numOfGames > roomInfo.conf.maxGames) return;
    if (add) {
        roomInfo.numOfGames++;
        if(roomInfo.conf.quanId != -1){
            roomMgr.quanRoomInfo.push(roomInfo.conf.quanId);
        }
    }
    var game = {
        conf: roomInfo.conf,
        roomInfo: roomInfo,
        roomId: roomId,
        gameIndex: roomInfo.numOfGames, //游戏局数
        button: 0,
        pokers: new Array(52),
        gameSeats: new Array(max_player_count),
        state: "",
        qiangzhuangNum: 0,
        xiazhuNum: 0,
        opencardNum: 0,
        z: false, //20180131 添加
        pkShow: false,
        playerIndexs: [],
        down_time: 20,
        diPokers: null, //地主牌
        lastPokers: null,
        lastPokerWraper: null,
        isFirstPoker: null, //第一手牌
        lastGrabIndex: -1, //最后抢地主的序号
        passCount: 0, //不抢的次数
        remainCount: 3, //剩余抢地主次数
        tipPokers: null, //提示要显示的牌s
        landlordPlayNum: 0,
        farmerPlayNum: 0,
        gameTimes: 1,
        winner: null,
        difen: 0,
        playAni: false,
        bombNum: 0,
        tipNum: 0,
        actionList: [],
        ispp:false,
    };

    // 20170122 添加
    if (roomInfo.numOfGames == 1) {
        db.update_isStart(roomId, 1);
    }
    var seats = roomInfo.seats;
    for (var i = 0; i < max_player_count; ++i) {
        seats[i].isWaiting = false; //20180116 添加
        var data = game.gameSeats[i] = {};
        data.game = game;
        data.seatIndex = i;
        data.userId = seats[i].userId;
        data.gems = seats[i].gems; //!!20171120
        data.name = seats[i].name; //20480310 添加；
        data.sex = seats[i].sex;
        data.holds = [];
        data.score = 0;
        data.difen = 0;
        data.opencard = 0;
        data.xiazhu = 0; //玩家下注
        data.isFailure = false;
        data.paixing = "";
        data.spList = []; //20180508 添加
        data.pump = 0;
        data.isqiang = -1;
        data.ispass = false;
        data.outPokers = null;
        data.managed = false;
        data.isqiang = -1;
        if (data.userId > 0) {
            data.isGamePlayer = true; // 20180116 添加s
            gameSeatsOfUsers[data.userId] = data;
            exports.gamePlayerList.push(data.userId);
            game.playerIndexs.push(i);
        }
    }
    exports.games[roomId] = game;
    deal(game);
    if(game.gameIndex == 1){
        game.button = roomMgr.getUserSeat(roomInfo.conf.creator);
        roomInfo.nextButton = game.button;
    }
    else{
        roomInfo.nextButton = (roomInfo.nextButton + 1) % 3;
        game.button = roomInfo.nextButton;
    }
    game.turn = game.button
    construct_game_base_info(game)
    for (var i = 0; i < seats.length; ++i) {
        //开局时，通知前端必要的数据
        var s = seats[i];
        if (s.userId > 0) {
            var sData = {
                allPokers: game.gameSeats[i].holds, //allPokers,
                button: game.button
            };
            var sc = JSON.stringify(sData);
            var scs = crypto.guan(sc);
            var scdata = {
                scs: scs
            };
            userMgr.sendMsg(s.userId, 'game_allholds_push', scdata);
            userMgr.sendMsg(s.userId, 'game_begin_push', {
                button: game.button,
                gameIndex: game.gameIndex,
                firstDeal:add,
            });
        }
    }
    if(roomInfo.gameTimer == null){
        roomInfo.gameDowntime = 30;
        roomInfo.gameTimer = setInterval(function(){
            if(roomInfo.gameDowntime > 0){
                roomInfo.gameDowntime--;    
            }  
            if(roomInfo.gameDowntime == 0 && !game.playAni){
                // var player = game.gameSeats[game.turn];
            //     if(game.state == "qiangdizhu"){
            //         console.log("抢地主  放弃")
            //         if(game.difen < 3){
            //             var tdata = {isqiang:3}
            //         }
            //         else{
            //             var tdata = {isqiang:5}
            //         }
            //          tdata = JSON.stringify(tdata) 
            //         exports.doQiangdizhu(player.userId,tdata)
            //         player.managed = true;
            //     }
                // if(game.state == "play"){
                //     if(game.isFirstPoker){
                //         var holds = game.gameSeats[game.turn].holds;
                //         holds.sort(function(a,b){
                //             return a.sortValue - b.sortValue;
                //         })
                //         var pl = [holds[0]];
                //         var tdata = {
                //             pokerList:pl,
                //             ispass: false,
                //         }
                //     }
                //     else{
                //         var tdata = {
                //             ispass: true,
                //         }  
                //     }
                //     exports.play(game.gameSeats[game.turn].userId,tdata);
                // }
            } 
        },1000)
    }
    game.state = "qiangdizhu";
};
exports.showQzdBtn = function(userId){
    var roomId = roomMgr.getUserRoom(userId);
    var game = exports.games[roomId];
    var roomInfo = game.roomInfo;
    userMgr.sendMsg(userId,"show_qzd_btn_do",{
        downTime: roomInfo.gameDowntime,
        turn: game.turn
    })
};
exports.doQiangdizhu = function (userId, data) {
    var data = JSON.parse(data);
    var roomId = roomMgr.getUserRoom(userId);
    var game = exports.games[roomId];
    if (roomMgr.getUserSeat(userId) != game.turn) {
        console.log("还没轮到你！");
        return;
    }
    var roomInfo = game.roomInfo;
    var isqiang = data.isqiang;
    var ss = game.gameSeats[game.turn];
    ss.isqiang = isqiang;
    var sex = ss.sex;
    var difens = game.conf.difen;
    var tab = null
    var after = null
    var qData = {};
    if (sex == 2) {
        tab = "f_"
    } else {
        tab = "m_"
    }
    if (isqiang == 3) {
        after = "bujiao";
        game.remainCount--;
    }
    if (isqiang == 4) {
        after = "jiabei";
        // ss.isjiabei = true;
        game.remainCount--;
    }
    if (isqiang == 5) {
        after = "bujiabei";
        game.remainCount--;
    }
    if (isqiang < 3) {
        var difen = difens[isqiang];
        console.log("选择的底分 ==== " + difen)
        game.difen = difen;
        var aList = ["fen1", "fen2", "fen3"]
        if (difen <= 3) {
            var num = difen - 1;
            after = aList[num];
        } else {
            after = "jiao"
        }
        game.lastGrabIndex = game.turn;
        game.remainCount--;
    }
    var soundType = tab + after;
    qData.soundType = soundType;
    qData.name = after;
    qData.isqiang = isqiang;
    var lastIndex = game.turn;
    qData.lastIndex = lastIndex;
    // userMgr.broacastInRoom("qiangdizhu_sound", qData, userId, true);
    if (game.remainCount == 0) {
        if (game.lastGrabIndex == -1) {
            var delay = 1000;
            if (roomInfo.gameTimer) {
                clearInterval(roomInfo.gameTimer);
                roomInfo.gameTimer = null;
                roomInfo.gameDowntime = 30;
            }
            userMgr.broacastInRoom("deal_pokers_again_tip", {
                delay: delay,
                index:game.turn,
            }, userId, true);
            setTimeout(function () {
                exports.begin(roomId, false);
            }, delay)
        } else {
            qiangResult(game,qData)
        }
        return;
    }
    var np = (game.turn + 1) % 3; //下一个抢牌的
    var sd = game.gameSeats[np];
    var userId = sd.userId;
    game.turn = np;
    qData.turn = game.turn;
    qData.difen = game.difen;
    userMgr.broacastInRoom("qiangdizhu", qData, userId, true);
    var qiangdizhuInfo = {
        type:1,
        data:qData,
    }
    game.actionList.push(qiangdizhuInfo);
    roomInfo.gameDowntime = 30;
    userMgr.broacastInRoom("game_down_time", {
        downTime: roomInfo.gameDowntime,
        turn: game.turn
    }, game.gameSeats[game.turn].userId, true);
};

function qiangResult(game,qData) {
    var index = game.lastGrabIndex;
    game.turn = index;
    var dp = game.diPokers;
    var landlord = game.gameSeats[index];
    for (var i = 0; i < dp.length; i++) {
        if (dp[i]) {
            landlord.holds.push(dp[i]);
        }
    }
    var userId = landlord.userId
    game.isFirstPoker = true;
  
    var data = {
        landlord: game.turn,
        isFirstPoker: game.isFirstPoker,
        dizhuPokers: dp,
        gameTimes: game.gameTimes,
        difen: game.difen,
        qData:qData,
    }
    userMgr.broacastInRoom("qiangdizhu_result_push", data, userId, true);
    game.state = "play";
    var qiangResultInfo = {
        type:2,
        data:data,
    }
    game.actionList.push(qiangResultInfo);
    var roomInfo = game.roomInfo;
    roomInfo.gameDowntime = 30;
    userMgr.broacastInRoom("game_down_time", {
        downTime: roomInfo.gameDowntime,
        turn: game.turn
    }, game.gameSeats[game.turn].userId, true);
};
exports.play = function (userId, data) {
    // console.log("玩家 " + userId + " 要出的牌 == " + data.pokerList)
    console.log("jie收到play！！！！！！！！！！！！")
    var roomId = roomMgr.getUserRoom(userId);
    var game = exports.games[roomId];
    if(game.ispp) return;
    game.ispp = true;
    var player = gameSeatsOfUsers[userId];
    if (player.seatIndex != game.turn) {
        // userMgr.sendMsg(userId, "play_err", {
        //     msg: "还不到你出牌"
        // })
        console.log("轮不到你出牌呢")
        game.ispp = false;
        return
    }
    var pl = data.pokerList;
    var ispass = data.ispass;
    var seats = game.gameSeats;
    player.ispass = ispass;
    if (pl) {
        player.outPokers = pl;
    } else {
        player.outPokers = "buchu";
    }
   
    if (game.isFirstPoker) {
        console.log("玩家先出的牌")
        if (!pl || pl.length == 0) {
            console.log("玩家没有选择要出的牌 == ")
            userMgr.sendMsg(userId, "play_err", {
                msg: "选择你要出的牌"
            })
            game.ispp = false;
            return
        }
        try {
            var pw = pph.getPokerWraper(pl); //获取牌型
            console.log('pw : ' + JSON.stringify(pw));
            game.lastPokerWraper = pw;
        } catch (err) {
            userMgr.sendMsg(userId, "play_err", {
                msg: err
            });
            console.log("获取牌型出错 = " + err);
            game.ispp = false;
            return;
        }
        deletePokers(player.holds, pl);
        playSuccess(game, player, ispass, pl, command, true);
    } else {
        if (ispass) {
            console.log("玩家选择不出牌！")
            var preIndex = (game.turn + 2) % 3;
            var prePlayer = game.gameSeats[preIndex];
            var command = false;
            if (prePlayer.ispass) {
                command = true;
                game.lastPokerWraper = null;
            }
            playSuccess(game, player, ispass, pl, command, false);
        } else {
            console.log("玩家要跟牌")
            if (!pl || pl.length == 0) {
                userMgr.sendMsg(userId, "play_err", {
                    msg: "选择你要出的牌！"
                })
                game.ispp = false;
                return;
            }
            try {
                var result = game.lastPokerWraper.follow(pl);
                if (!result.canFollow) {
                    userMgr.sendMsg(userId, "play_err", {
                        msg: "牌不够大！"
                    })
                    game.ispp = false;
                    return;
                }
                game.lastPokerWraper = result.targetPokerWraper;

            } catch (err) {
                userMgr.sendMsg(userId, "play_err", {
                    msg: err
                })
                console.log(err);
                game.ispp = false;
                return;
            }
            //是否已出完牌
            deletePokers(player.holds, pl);
            playSuccess(game, player, ispass, pl, false, false);
            console.log('剩余牌数量： ' + player.holds.length);
        }

    }
};
exports.tip = function (userId) {
    console.log("tiptiptip.userid"+userId)
    var roomId = roomMgr.getUserRoom(userId);
    var game = exports.games[roomId];
    if(game.ispp) return;
    var player = gameSeatsOfUsers[userId];
    if(game.turn != player.seatIndex) return;
    var holds = player.holds;
    var holdsMap = {};
    var lpw = game.lastPokerWraper;
    if(!lpw) return;
    console.log("tip 时 game.tipPokers == "+game.tipPokers.length)
    if (game.tipNum == 0 && game.tipPokers.length == 0) {
        var kbArr = [];
        // var evArr = [];
        for (var i = 0; i < holds.length; i++) {
            var p = holds[i];
            var v = pm.getCardValue(p);
            if (!holdsMap[v]) {
                holdsMap[v] = 1;
                // evArr.push(holds[i]);
            } else {
                holdsMap[v]++;
            }
            if (v == 16 || v == 17) {
                kbArr.push(holds[i]);
            }
        }
        // console.log("holdsmapholdsmap == " + JSON.stringify(holdsMap))
        var leadValue = lpw.leadValue;
        var size = lpw.size;
        var type = lpw.type;
        var isbb = false;
        if (kbArr.length == 2) {
            console.log("有王炸")
            isbb = true;
        }
        if (lpw.pokerType == "bomb") {
            console.log("要管的牌型是 == 炸弹" + lpw.leadValue)
            if (leadValue == 16) {
                console.log("出王炸 管不上");
                exports.play(userId, {
                    ispass: true
                })
                return;
            }
            for (var key in holdsMap) {
                if (Number(key) > Number(leadValue) && holdsMap[key] == 4) {
                    console.log("能管上普通炸弹" + key)
                    updateTipPokers(game, holds, userId, Number(key), 4, 4);
                }
            }
            if (isbb) {
                game.tipPokers.push(kbArr);
            }
        }
        if (lpw.pokerType == "one") {
            console.log("要管的牌型是 == 单牌")
            for (var key in holdsMap) {
                if (Number(key) > Number(leadValue) && holdsMap[key] == 1) {
                    console.log("单张 又能管住的牌 == " + key);
                    updateTipPokers(game, holds, userId, Number(key), 1, size);
                }
            }
            for (var key in holdsMap) {
                if (Number(key) > Number(leadValue) && holdsMap[key] > 1 && holdsMap[key] < 4) {
                    console.log("单张 又能管住的牌22 == " + key);
                    updateTipPokers(game, holds, userId, Number(key), 1, size);
                }
            }
            bombDo(game, holds, userId, kbArr, holdsMap);
        };
        if (lpw.pokerType == "pair") {
            console.log("要管的牌型是 == 对子")
            for (var key in holdsMap) {
                if (Number(key) > Number(leadValue) && holdsMap[key] == 2) {
                    updateTipPokers(game, holds, userId, Number(key), 2, size);
                }
            }
            for (var key in holdsMap) {
                if (Number(key) > Number(leadValue) && holdsMap[key] > 2 && holdsMap[key] < 4) {
                    updateTipPokers(game, holds, userId, Number(key), 2, size);
                }
            }
            bombDo(game, holds, userId, kbArr, holdsMap);
        }
        if (lpw.pokerType == "three") {
            console.log("要管的牌型是 == 三带x")
            var thKey = [];
            var singleArr = [];
            var doubleArr = [];
            var threeArr = [];
            var sumArr = [];
            for (var key in holdsMap) {
                if (Number(key) > Number(leadValue) && holdsMap[key] == 3) {
                    thKey.push(key);
                }
                if (holdsMap[key] == 1) {
                    singleArr.push(key);

                }
                if (holdsMap[key] == 2) {
                    doubleArr.push(key);

                }
                if (holdsMap[key] == 3) {
                    threeArr.push(key);
                }
            }
            if (singleArr.length > 1) {
                singleArr.sort(function (a, b) { //从小到大
                    return a - b;
                })

            }
            sumArr = sumArr.concat(singleArr);
            if (doubleArr.length > 1) {
                doubleArr.sort(function (a, b) { //从小到大
                    return a - b;
                })

            }
            sumArr = sumArr.concat(doubleArr);
            if (threeArr.length > 1) {
                threeArr.sort(function (a, b) { //从小到大
                    return a - b;
                })

            }
            sumArr = sumArr.concat(threeArr)
            console.log("满足三带的 thkey == " + thKey)
            if (thKey.length > 0) {
                var tempArr = []
                for (var i = 0; i < thKey.length; i++) {
                    var aa = []
                    var key = thKey[i];
                    for (var j = 0; j < holds.length; j++) {
                        var poker = holds[j];
                        if (pm.getCardValue(poker) == Number(key)) {
                            aa.push(poker);
                        }
                        if (aa.length == 3) {
                            tempArr.push(aa);
                            break;
                        }
                    }
                }
                if (size == 3) {
                    for (var i = 0; i < thKey.length; i++) {
                        var key = thKey[i];
                        console.log("满足三带的 key == " + key)
                        updateTipPokers(game, holds, userId, Number(key), 3, size);
                    }
                }
                if (size == 4) {
                    var evArr = [];
                    for (var n = 0; n < sumArr.length; n++) {
                        var sk = sumArr[n];
                        for (var i = 0; i < holds.length; i++) {
                            var poker = holds[i];
                            if (Number(sk) == pm.getCardValue(poker)) {
                                evArr.push(poker);
                                break;
                            }
                        }
                    }
                    for (var e = 0; e < evArr.length; e++) {
                        var ev = pm.getCardValue(evArr[e]);
                        for (var o = 0; o < tempArr.length; o++) {
                            var bb = tempArr[o];
                            var tv =pm.getCardValue(bb[0]);
                            if (ev != tv) {
                                var tt = bb.concat(evArr[e]);
                                if (tt.length == size) {
                                    game.tipPokers.push(tt);
                                }
                            }
                        }

                    }

                }
                if (size == 5) {
                    var edArr = [];
                    sumArr = doubleArr.concat(threeArr);
                    for (var n = 0; n < sumArr.length; n++) {
                        var sk = sumArr[n];
                        var dd = [];
                        for (var i = 0; i < holds.length; i++) {
                            var poker = holds[i];
                            if (Number(sk) == pm.getCardValue(poker)) {
                                dd.push(poker);
                                if (dd.length == 2) {
                                    edArr.push(dd);
                                    break;
                                }

                            }
                        }
                    }
                    console.log("从刑获得双数元素 == " + edArr)
                    for (var e = 0; e < edArr.length; e++) {
                        var ed = pm.getCardValue(edArr[e][0]);
                        for (var o = 0; o < tempArr.length; o++) {
                            var bb = tempArr[o];
                            var tv = pm.getCardValue(bb[0]);
                            if (ed != tv) {
                                var tt = bb.concat(edArr[e]);
                                console.log("ttttttt === " + tt)
                                if (tt.length == size) {
                                    game.tipPokers.push(tt);
                                }
                            }
                        }

                    }
                }
            }
            bombDo(game, holds, userId, kbArr, holdsMap);
        }
        if (lpw.pokerType == "four") {
            var fKey = [];
            var singleArr = [];
            var doubleArr = [];
            var threeArr = [];
            var sumArr = [];
            for (var key in holdsMap) {
                if (Number(key) > Number(leadValue) && holdsMap[key] == 4) {
                    fKey.push(key);
                }
                if (holdsMap[key] == 1) {
                    singleArr.push(key);
                }
                if (holdsMap[key] == 2) {
                    doubleArr.push(key);
                }
                if (holdsMap[key] == 3) {
                    threeArr.push(key);
                }
            }
            singleArr.sort(function (a, b) {
                return a - b;
            })
            doubleArr.sort(function (a, b) {
                return a - b;
            })
            threeArr.sort(function (a, b) {
                return a - b;
            })
            if (fKey.length > 0) {
                var tempArr = []
                for (var i = 0; i < fKey.length; i++) {
                    var aa = []
                    var key = fKey[i];
                    for (var j = 0; j < holds.length; j++) {
                        var poker = holds[j];
                        if (pm.getCardValue(poker) == Number(key)) {
                            aa.push(poker);
                        }
                        if (aa.length == 4) {
                            tempArr.push(aa);
                            break;
                        }
                    }
                }
                if (type == "daa" || type == "db") {
                    console.log("四带 === " + type)
                    var efArr = [];
                    if (singleArr.length > 1) {
                        for (var i = 0; i < singleArr.length - 1; i++) {
                            var aa = [];
                            aa.push(singleArr[i]);
                            aa.push(singleArr[i + 1]);
                            efArr.push(aa);
                        }
                    }
                    if (doubleArr.length >= 1) {
                        for (var i = 0; i < doubleArr.length; i++) {
                            var aa = [];
                            aa.push(doubleArr[i]);
                            aa.push(doubleArr[i]);
                            efArr.push(aa);
                        }
                    }
                    if (threeArr.length >= 1) {
                        for (var i = 0; i < threeArr.length; i++) {
                            var aa = [];
                            aa.push(threeArr[i]);
                            aa.push(threeArr[i]);
                            efArr.push(aa);
                        }
                    }
                    if (singleArr.length > 0 && doubleArr.length > 0) {
                        for (var i = 0; i < singleArr.length; i++) {
                            var sg = singleArr[i];
                            for (var j = 0; j < doubleArr.length; j++) {
                                var aa = [];
                                aa.push(sg);
                                aa.push(doubleArr[j]);
                                efArr.push(aa);
                            }
                        }
                    }
                    if (singleArr.length > 0 && threeArr.length > 0) {
                        for (var i = 0; i < singleArr.length; i++) {
                            var sg = singleArr[i];
                            for (var j = 0; j < threeArr.length; j++) {
                                var aa = [];
                                aa.push(sg);
                                aa.push(threeArr[j]);
                                efArr.push(aa);
                            }
                        }
                    }
                    if (efArr.length > 0) {
                        var ttArr = [];
                        for (var i = 0; i < efArr.length; i++) {
                            var ef = efArr[i];
                            var bb = [];
                            for (var j = 0; j < holds.length; j++) {
                                var poker = holds[j];
                                if (Number(ef[0]) == pm.getCardValue(poker)|| Number(ef[1]) == pm.getCardValue(poker)) {
                                    bb.push(poker);
                                    if (bb.length == 2) {
                                        ttArr.push(bb);
                                        break;
                                    }
                                }
                            }
                        }
                        console.log("四带整合22222 = " + ttArr)
                        for (var i = 0; i < ttArr.length; i++) {
                            var tt = ttArr[i];
                            for (var k = 0; k < tempArr.length; k++) {
                                var temp = tempArr[k];
                                var newArr = temp.concat(tt);
                                if (newArr.length == size) {
                                    game.tipPokers.push(newArr);
                                }
                            }
                        }
                    }
                }
                if (type == "dbb") {
                    var efArr = [];
                    if (doubleArr.length > 1) {
                        for (var i = 0; i < doubleArr.length - 1; i++) {
                            var aa = [];
                            aa.push(doubleArr[i]);
                            aa.push(doubleArr[i]);
                            aa.push(doubleArr[i + 1]);
                            aa.push(doubleArr[i + 1]);
                            efArr.push(aa);
                        }
                    }
                    if (doubleArr.length > 0 && threeArr.length > 0) {
                        for (var i = 0; i < doubleArr.length; i++) {
                            for (var j = 0; j < threeArr.length; j++) {
                                var aa = [];
                                aa.push(doubleArr[i]);
                                aa.push(doubleArr[i]);
                                aa.push(threeArr[j]);
                                aa.push(threeArr[j]);
                                efArr.push(aa);
                            }

                        }
                    }
                    if (threeArr.length > 1) {
                        for (var i = 0; i < threeArr.length - 1; i++) {
                            var aa = [];
                            aa.push(threeArr[i]);
                            aa.push(threeArr[i]);
                            aa.push(threeArr[i + 1]);
                            aa.push(threeArr[i + 1]);
                            efArr.push(aa);
                        }
                    }
                    if (efArr.length > 0) {
                        var ttArr = [];
                        for (var i = 0; i < efArr.length; i++) {
                            var ef = efArr[i];
                            var bb = [];
                            var aa = [];
                            for (var j = 0; j < holds.length; j++) {
                                var poker = holds[j];
                                if (Number(ef[0]) == pm.getCardValue(poker) && bb.length < 2) {
                                    bb.push(poker);
                                }
                                if (Number(ef[2]) == pm.getCardValue(poker) && aa.length < 2) {
                                    aa.push(poker);
                                }
                                if (bb.length == 2 && aa.length == 2) {
                                    var newArr = bb.concat(aa);
                                    ttArr.push(newArr);
                                    break;
                                }
                            }
                        }
                        for (var i = 0; i < ttArr.length; i++) {
                            var tt = ttArr[i];
                            for (var k = 0; k < tempArr.length; k++) {
                                var temp = tempArr[k];
                                var newArr = temp.concat(tt);
                                if (newArr.length == size) {
                                    game.tipPokers.push(newArr);
                                }
                            }
                        }
                    }
                }
            }
            bombDo(game, holds, userId, kbArr, holdsMap);
        }
        if (lpw.pokerType == "row") {
            var rowMax = Number(leadValue) + Number(size) - 1
            console.log("要管的牌型是 == 顺子" + rowMax)
            if (rowMax < 14) {
                var len = 14 - rowMax;
                for (var j = 0; j < len; j++) {
                    var addNum = j + 1;
                    var isRow = true;
                    for (var b = 0; b < size; b++) {
                        var key = Number(leadValue) + addNum + b;
                        if (!holdsMap[key]) {
                            isRow = false;
                            break
                        }
                    }
                    console.log("是否有相应的顺子 == " + isRow)
                    if (isRow) {
                        var tempArr = [];
                        for (var b = 0; b < size; b++) {
                            var key = Number(leadValue) + addNum + b;
                            console.log("kkdkdkdk = " + key);
                            for (var i = 0; i < holds.length; i++) {
                                var poker = holds[i];
                                if (Number(key) == pm.getCardValue(poker)) {
                                    tempArr.push(poker);
                                    break;
                                }
                            }
                            if (tempArr.length == size) {
                                game.tipPokers.push(tempArr);
                            }
                        }
                    }
                }
            }
            bombDo(game, holds, userId, kbArr, holdsMap);
        }
        if (lpw.pokerType == "multiPair") {
            var mpMax = Number(leadValue) + Number(size / 2) - 1
            if (mpMax < 14) {
                var len = 14 - mpMax;
                for (var j = 0; j < len; j++) {
                    var addNum = j + 1;
                    var isMp = true;
                    for (var b = 0; b < size / 2; b++) {
                        var key = Number(leadValue) + addNum + b;
                        // console.log("这个key --  " + key)
                        // console.log("这个key --  " + holdsMap[key])
                        if (!holdsMap[key] || holdsMap[key] < 2) {
                            isMp = false;
                            break
                        }
                    }
                    if (isMp) {
                        var tempArr = [];
                        for (var b = 0; b < size / 2; b++) {
                            var key = Number(leadValue) + addNum + b;
                            var pp = []
                            for (var i = 0; i < holds.length; i++) {
                                var poker = holds[i];
                                if (Number(key) == pm.getCardValue(poker) && pp.length < 2) {
                                    pp.push(poker);
                                    if (pp.length == 2) {
                                        tempArr = tempArr.concat(pp);
                                        break;
                                    }
                                }
                            }
                            if (tempArr.length == size) {
                                game.tipPokers.push(tempArr);
                            }
                        }
                    }
                }
            }
            bombDo(game, holds, userId, kbArr, holdsMap);
        }
        if (lpw.pokerType == "plane") {
            console.log("要管的牌时 == 飞机"+type)
            var cNum = getAlpNum("c", type);
            var plMax = Number(leadValue) + cNum - 1;
            var max = 14 - cNum;
            // var cArr = {};
            console.log("飞机 plmax == " + plMax)
            if (plMax <= max) {
                var aNum = getAlpNum("a", type);
                var bNum = getAlpNum("b", type);
                var cArr = [];
                var cPlane = [];
                for (var key in holdsMap) {
                    if (holdsMap[key] >= 3 && Number(key) > plMax && Number(key) < 15) {
                        cArr.push(key);
                    }
                }
                cArr.sort(function (a, b) {
                    return a - b;
                })
                console.log("飞机 carr == " + cArr)
                if (cArr.length >= cNum) {
                    var len = cArr.length - cNum + 1;
                    for (var k = 0; k < len; k++) {
                        var cTemp = [];
                        cTemp.push(cArr[k]);
                        for (var b = 1; b < cNum; b++) {
                            if (cArr[k + b] - cArr[k + b - 1] != 1) {
                                break;
                            } else {
                                cTemp.push(cArr[k + b])
                                if (cTemp.length == cNum) {
                                    cPlane.push(cTemp);
                                }
                            }

                        }
                    }
                }
                console.log("cPlane ====== " + cPlane.length + "   " + cPlane)
                if (cPlane.length > 0) {
                    var singleArr = [];
                    var doubleArr = [];
                    var threeArr = [];
                    var fourArr = [];
                    for (var key in holdsMap) {
                        if (holdsMap[key] == 2) {
                            doubleArr.push(key);
                        }
                        if (holdsMap[key] == 1) {
                            singleArr.push(key);
                        }
                        if (holdsMap[key] == 3) {
                            threeArr.push(key);
                        }
                        if (holdsMap[key] == 4) {
                            fourArr.push(key);
                        }
                    }
                    if (singleArr.length > 1) {
                        arrSort(singleArr, 1);
                    }
                    if (doubleArr.length > 1) {
                        arrSort(doubleArr, 1);
                    }
                    if (threeArr.length > 1) {
                        arrSort(threeArr, 1);
                    }
                    if (fourArr.length > 1) {
                        arrSort(fourArr, 1);
                    }
                    var tempArr = [];
                    for (var i = 0; i < cPlane.length; i++) {
                        var cp = cPlane[i];
                        var cpTemp = [];
                        for (var j = 0; j < cp.length; j++) {
                            var ccp = cp[j];
                            var ccpTemp = [];
                            for (var b = 0; b < holds.length; b++) {
                                var poker = holds[b];
                                if (Number(ccp) == pm.getCardValue(poker) && ccpTemp.length < 3) {
                                    ccpTemp.push(poker);
                                    if (ccpTemp.length == 3) {
                                        cpTemp = cpTemp.concat(ccpTemp);
                                        break;
                                    }
                                }
                            }
                        }
                        if (cpTemp.length == cNum * 3) {
                            tempArr.push(cpTemp);
                        }
                    }
                    if(tempArr.length > 0){
                        if (aNum == 0 && bNum == 0) {
                            game.tipPokers = tempArr;
                        }
                        if (cNum > bNum && (aNum > 0 || bNum > 0)) {
                            var tempHolds = []
                            if (singleArr.length > 0) {
                                for (var i = 0; i < singleArr.length; i++) {
                                    var sp = singleArr[i];
                                    for (var j = 0; j < holds.length; j++) {
                                        var poker = holds[j];
                                        if (Number(sp) == pm.getCardValue(poker)) {
                                            tempHolds.push(poker);
                                        }
                                    }
    
                                }
                            }
                            if (doubleArr.length > 0) {
                                for (var i = 0; i < doubleArr.length; i++) {
                                    var dp = doubleArr[i];
                                    var dpTemp = [];
                                    for (var j = 0; j < holds.length; j++) {
                                        var poker = holds[j];
                                        if (Number(dp) == pm.getCardValue(poker) && dpTemp.length < 2) {
                                            dpTemp.push(poker);
                                            if (dpTemp.length == 2) {
                                                tempHolds = tempHolds.concat(dpTemp);
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            if (threeArr.length > 0) {
                                for (var i = 0; i < threeArr.length; i++) {
                                    var dp = threeArr[i];
                                    var dpTemp = [];
                                    for (var j = 0; j < holds.length; j++) {
                                        var poker = holds[j];
                                        if (Number(dp) == pm.getCardValue(poker) && dpTemp.length < 2) {
                                            dpTemp.push(poker);
                                            if (dpTemp.length == 2) {
                                                tempHolds = tempHolds.concat(dpTemp);
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            if (fourArr.length > 0) {
                                for (var i = 0; i < fourArr.length; i++) {
                                    var dp = fourArr[i];
                                    var dpTemp = [];
                                    for (var j = 0; j < holds.length; j++) {
                                        var poker = holds[j];
                                        if (Number(dp) == pm.getCardValue(poker) && dpTemp.length < 2) {
                                            dpTemp.push(poker);
                                            if (dpTemp.length == 2) {
                                                tempHolds = tempHolds.concat(dpTemp);
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            // console.log("配角牌总数 == "+tempHolds.length+"  "+JSON.stringify(tempHolds))
                            var tempLen = aNum + bNum * 2;
                            // console.log("真正配角的个数 == "+tempLen)
                            if(tempHolds.length >= tempLen){
                                for(var k = 0 ; k < tempHolds.length ; k++){
                                    var st = tempHolds[k];
                                    var otArr = tempHolds.slice(k+1);
                                    if(otArr.length+1 < tempLen){
                                        break
                                    }
                                    else{
                                        for(var n = 0 ; n < otArr.length ; n++){
                                            var ot = [];
                                            var newot = otArr.slice(n+1);
                                            if(newot.length+1 >= tempLen - 1){
                                                ot.push(st);
                                                for(var b = 0 ; b < tempLen - 1 ; b++){
                                                    ot.push(otArr[n+b])
                                                }
                                                if(ot.length == tempLen){
                                                    console.log("每次获取的配角个数 == "+ot.length +"  "+JSON.stringify(ot))
                                                    for(var e = 0 ; e < tempArr.length ; e++){
                                                        var eta = tempArr[e];
                                                        console.log("comparearr === "+compareArr(eta,ot))
                                                        if(compareArr(eta,ot)){   
                                                            var newArr = eta.concat(ot)
                                                            if(newArr.length == size){
                                                                game.tipPokers.push(newArr);
                                                            }
                                                           
                                                        }
                                                    }
                                                }
                                            }
                                            
                                        }
                                    }
                                }
                            }
                           
    
                        }
                        if (cNum == bNum) {
                            var tempHolds = [];
                            if (doubleArr.length > 0) {
                                for (var i = 0; i < doubleArr.length; i++) {
                                    var dp = doubleArr[i];
                                    var dpTemp = [];
                                    for (var j = 0; j < holds.length; j++) {
                                        var poker = holds[j];
                                        if (Number(dp) == pm.getCardValue(poker) && dpTemp.length < 2) {
                                            dpTemp.push(poker);
                                            if (dpTemp.length == 2) {
                                                tempHolds.push(dpTemp);
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            if (threeArr.length > 0) {
                                for (var i = 0; i < threeArr.length; i++) {
                                    var dp = threeArr[i];
                                    var dpTemp = [];
                                    for (var j = 0; j < holds.length; j++) {
                                        var poker = holds[j];
                                        if (Number(dp) == pm.getCardValue(poker) && dpTemp.length < 2) {
                                            dpTemp.push(poker);
                                            if (dpTemp.length == 2) {
                                                tempHolds.push(dpTemp);
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            if (fourArr.length > 0) {
                                for (var i = 0; i < fourArr.length; i++) {
                                    var dp = fourArr[i];
                                    var dpTemp = [];
                                    for (var j = 0; j < holds.length; j++) {
                                        var poker = holds[j];
                                        if (Number(dp) == pm.getCardValue(poker) && dpTemp.length < 2) {
                                            dpTemp.push(poker);
                                            if (dpTemp.length == 2) {
                                                tempHolds.push(dpTemp);
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            var tempLen = bNum;
                            for(var k = 0 ; k < tempHolds.length ; k++){
                                var st = tempHolds[k];
                                var otArr = tempHolds.slice(k+1);
                                if(otArr.length+1 < tempLen){
                                    break
                                } else {
                                    for (var n = 0; n < otArr.length; n++) {
                                        var ot = [];
                                        var newot = otArr.slice(n+1);
                                        if(newot.length+1 >= tempLen - 1){
                                            ot.push(st);
                                            for(var b = 0 ; b < tempLen - 1 ; b++){
                                                ot.push(otArr[n+b])
                                            }
                                            if(ot.length == tempLen){
                                                 var otTmep = []
                                                for(var y = 0 ; y < ot.length ; y++){
                                                   otTmep = otTmep.concat(ot[y]);
                                                }
                                                for(var e = 0 ; e < tempArr.length ; e++){
                                                    var eta = tempArr[e];
                                                    console.log("comparearr === "+compareArr(eta,otTmep))
                                                    if(compareArr(eta,otTmep)){   
                                                        var newArr = eta.concat(otTmep)
                                                        if(newArr.length == size){
                                                            game.tipPokers.push(newArr);
                                                        }
                                                       
                                                    }
                                                }
                                            }
                                        }
                                        
                                    }
                                }
                            }
                        }
                    }
                   
                }
            }
            bombDo(game, holds, userId, kbArr, holdsMap);
        }
    }
    if (game.tipPokers.length > 0) {
        var tipPokers = game.tipPokers[game.tipNum]
        userMgr.sendMsg(userId, "show_tip_pokers", {
            tipPokers: tipPokers
        });
    } else if (game.tipPokers.length == 0) {
        exports.play(userId, {
            ispass: true
        })
    }
    game.tipNum++;
    if (game.tipNum >= game.tipPokers.length) {
        game.tipNum = 0;
    }
    return;

};

function updateTipPokers(game, holds, userId, value, len, size) {
    var tempArr = [];
   
    pm.sortNum_big(holds)
    var pNum = 0;
    for (var i = 0; i < holds.length; i++) {
        var poker = holds[i];
        if (pm.getCardValue(poker) == value && pNum < len) {
            pNum++;
            tempArr.push(poker);
        } else if (pNum == len) {
            break;
        }
    }

    console.log("排序后 玩家手里的牌 == " + size);
    if (tempArr.length == size) {
        game.tipPokers.push(tempArr);
        // userMgr.sendMsg(userId, "show_tip_pokers", {
        //     tipPokers: game.tipPokers
        // });
    }
    console.log("排序后 玩家手里的牌 == " + game.tipPokers.length);
}

function bombDo(game, holds, userId, kbArr, holdsMap) {
    for (var key in holdsMap) {
        if (holdsMap[key] == 4) {
            updateTipPokers(game, holds, userId, Number(key), 4, 4);
        }
    }
    if (kbArr.length == 2) {
        game.tipPokers.push(kbArr);
    }
};

function arrSort(arr, num) {
    if (num == 1) { //从小到大
        arr.sort(function (a, b) {
            return a - b;
        })
    }
    if (num == 2) { //从大到小
        arr.sort(function (a, b) {
            return b - a;
        })
    }
};
function compareArr(arr1,arr2){
    for(var u = 0 ; u < arr2.length ; u++){
        var a = arr2[u];
        console.log("数组比较 == "+a)
        var ishave = false
        for(var o = 0 ; o < arr1.length ; o++){
            var b = arr1[o];
            if(pm.getCardValue(a) == pm.getCardValue(b)){
                ishave = true;
                break;
            }
        }
        if(ishave){
            return false;
        }
    }
    return true;
}
function getAlpNum(alp, str) {
    var re = new RegExp(alp, "ig");
    if (re.test(str)) {
        return str.match(re).length; //有 g 全局搜索 
    }
    return 0;
}

function gameover(game, userId, forceEnd) {
    var roomId = roomMgr.getUserRoom(userId);
    if (roomId == null) {
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    }
    if (roomInfo.gameTimer) {
        clearInterval(roomInfo.gameTimer);
        roomInfo.gameTimer = null;
        roomInfo.gameDowntime = 30;
    }
    var results = [];
    var dbresult = [0, 0, 0];//存储游戏每局数
    if (game) {
        if (!forceEnd) {
            calculateResult(game);
        }
        var seats = game.gameSeats;
        var holdsList = [];
        for (var k = 0; k < seats.length; k++) {
            var rs = roomInfo.seats[k];
            var sd = seats[k];
            holdsList.push(sd.holds);
            rs.ready = false;
            rs.score += sd.score;
            dbresult[k] = sd.score;
            if (sd.score > 0) {
                rs.winNum++
                if (sd.score > rs.djgNum) {
                    rs.djgNum = sd.score
                }
            } else if (sd.score < 0) {
                rs.loseNum++
            }
            roomInfo.rsList[k] = rs.score;
            var userData = {
                userId: sd.userId,
                seatIndex: k,
                score: sd.score,
                totalScore: rs.score,
                holds: sd.holds,
                isqiang: sd.isqiang,
                winNum: rs.winNum,
                loseNum: rs.loseNum,
                djgNum: rs.djgNum,
                bombNum: rs.bombNum,
            }
            results.push(userData);
            delete gameSeatsOfUsers[sd.userId];
        }
        var isAllOver = false;
        if (game.gameIndex == game.conf.maxGames || forceEnd) {
            isAllOver = true;
        }
        var overData = {
            results: results,
            isAllOver: isAllOver,
            forceEnd: forceEnd,
            gameTimes: game.gameTimes,
        }
        userMgr.broacastInRoom("game_over_push1", overData, userId, true);
        var overInfo = {
            type:6,
            data:overData,
        }
        game.actionList.push(overInfo)
        // roomInfo.nextButton = game.winner?game.winner.seatIndex:0;
        delete exports.games[game.roomId];
        if (!forceEnd) {
            store_game(game, function (ret) {
                db.update_next_button(roomId,game.button);
                db.update_game_result(roomInfo.uuid, game.gameIndex, dbresult);
                db.update_num_of_turns(roomId, roomInfo.numOfGames);
                db.update_user_score(roomId, roomInfo.rsList, "t_rooms");
                var str = JSON.stringify(game.actionList);
                db.update_game_action_records(roomInfo.uuid, game.gameIndex, str);
                if (roomInfo.conf.quanZhu == -1 && roomInfo.numOfGames == 1) {
                    var cost = game.conf.cost;
                    var fee = game.conf.fee;
                    if (fee == 0) {
                        db.cost_gems(game.conf.creator, cost)
                    } 
                }
            })
        }
        if (isAllOver) {
            // if(roomInfo.numOfGames == 1 && !forceEnd){
            //     store_history(roomInfo)
            // }
            var isBigOne = true;
            if(roomInfo.numOfGames > 1){
                isBigOne = false;
                store_history(roomInfo)
            }
            setTimeout(function () {
                db.archive_games(roomInfo.uuid)
                userMgr.kickAllInRoom(roomId,false);
                roomMgr.destroy(roomId,isBigOne);
            }, 3000)
        }
        else{
            if(roomInfo.beginTimer == null){
                roomInfo.downTime = 15;
                roomInfo.beginTimer = setInterval(function(){
                    roomInfo.downTime--;
                    if(roomInfo.downTime == 0){
                        clearInterval(roomInfo.beginTimer)
                        roomInfo.beginTimer = null;
                        var seats = roomInfo.seats;
                       for(var k = 0 ; k < seats.length ; k++){
                           var s = seats[k];
                           if(!s.ready){
                               userMgr.sendMsg(s.userId,"game_over_to_ready",{})
                           }
                       }
                    }
                },1000)
            }
        }
    } else {
        var seats = roomInfo.seats;
        for (var k = 0; k < seats.length; k++) {
            var rs = seats[k];
            rs.ready = false;
            roomInfo.rsList[k] = rs.score;
            var userData = {
                userId: rs.userId,
                seatIndex: k,
                score: 0,
                totalScore: rs.score,
                holds: [],
                winNum: rs.winNum,
                loseNum: rs.loseNum,
                djgNum: rs.djgNum,
                bombNum: rs.bombNum,
            }
            results.push(userData);
        }
        if (forceEnd) {
            var overData = {
                results: results,
                isAllOver: true,
                forceEnd: forceEnd,
                gameTimes: 0,
            }
            userMgr.broacastInRoom("game_over_push1", overData, userId, true);
            delete exports.games[roomId];
            store_history(roomInfo)
            setTimeout(function () {
                db.archive_games(roomInfo.uuid)
                userMgr.kickAllInRoom(roomId,false);
                roomMgr.destroy(roomId,false);
            }, 3000)
        }
    }
};
function playSuccess(game, player, ispass, pokerList, command, playType) {
    game.tipNum = 0;
    if (pokerList && pokerList.length > 1) {
        var sumArr = [];
        var plMap = {};
        var fArr = [];
        var tArr = [];
        var dArr = [];
        var sArr = [];
        for (var i = 0; i < pokerList.length; i++) {
            var p = pokerList[i];
            var v = pm.getCardValue(p);
            if (!plMap[v]) {
                plMap[v] = 1;
            } else {
                plMap[v]++;
            }
        }
        for (var key in plMap) {
            if (plMap[key] == 4) {
                fArr.push(key);
            }
            if (plMap[key] == 3) {
                tArr.push(key);
            }
            if (plMap[key] == 2) {
                dArr.push(key);
            }
            if (plMap[key] == 1) {
                sArr.push(key);
            }
        }
        var tCallback = function (arr) {
            var tempArr = [];
            for (var j = 0; j < arr.length; j++) {
                var v = Number(arr[j]);
                for (var i = 0; i < pokerList.length; i++) {
                    pm.getCardValue(pokerList[i])
                    if ( pm.getCardValue(pokerList[i]) == v)[
                        tempArr.push(pokerList[i])
                    ]
                }
            }
          
            pm.sortNum_big(tempArr)
            return tempArr;
        }
        if (fArr.length > 0) {
            fArr = tCallback(fArr);
            sumArr = sumArr.concat(fArr);
        }
        if (tArr.length > 0) {
            tArr = tCallback(tArr);
            sumArr = sumArr.concat(tArr);
        }
        if (dArr.length > 0) {
            dArr = tCallback(dArr);
            sumArr = sumArr.concat(dArr);
        }
        if (sArr.length > 0) {
            sArr = tCallback(sArr);
            sumArr = sumArr.concat(sArr);
        }
        pokerList = sumArr;
    }
    var type = null;
    var soundType = "guo";
    if (!ispass) {
        type = game.lastPokerWraper.pokerType;
        soundType = game.lastPokerWraper.type
        if (type == "bomb") {
            game.bombNum++;
            game.roomInfo.seats[player.seatIndex].bombNum++;
            if (game.lastPokerWraper.type == "aa") {
                type = "rocket";
            }
            if (game.conf.max == 0 && game.bombNum <= 3) {
                game.gameTimes *= 2;
            }
            if (game.conf.max == 1 && game.bombNum <= 4) {
                game.gameTimes *= 2;
            }
            if (game.conf.max == 2) {
                game.gameTimes *= 2;
            }
        }
        if (type == "one" || type == "pair") {
            soundType = game.lastPokerWraper.type + "_" + pm.getCardValue(game.lastPokerWraper.srcList[0]);
        }
        if (type == "four" && game.lastPokerWraper.type == "db") {
            soundType = "daa";
        }
        if (type == "plane") {
            soundType = "ccc";
            if (getAlpNum("a", game.lastPokerWraper.type) > 0 || getAlpNum("b", game.lastPokerWraper.type) > 0) {
                soundType = "cccab";
            }
        }
        if (player.seatIndex == game.lastGrabIndex) {
            game.landlordPlayNum++;
        } else {
            game.farmerPlayNum++;
        }
    }
    console.log("此时出牌的声音 == " + soundType)
    var roomMsg = {
        userId:player.userId,
        index: game.turn,
        num: player.holds.length,
        pokerList: pokerList,
        ispass: ispass,
        pokerType: type,
        soundType: soundType,
        sex: player.sex,
        gameTimes: game.gameTimes,
        lastPokerWraper: game.lastPokerWraper,
    }
    userMgr.broacastInRoom("play_success_all", roomMsg, player.userId, true);
    var psaInfo = {
        type:3,
        data:roomMsg,
    }
    game.actionList.push(psaInfo);
    if (!pokerList) {
        pokerList = null;
    }
    var delay = 0;
    if (player.holds.length > 0) {
        if (type == "bomb" || type == "plane" || type == "row" || type == "rocket" || type == "multiPair") {
            delay = 2000;
            game.playAni = true;
        }
        notifyNextPlayer(game, pokerList, command, ispass, playType)
        // setTimeout(function () {
           
        // }, delay)
    } else {
        game.winner = player;
        delay = 500;
        if (type == "bomb" || type == "plane" || type == "row" || type == "rocket" || type == "multiPair") delay = 2000;
        if ((game.landlordPlayNum > 0 && game.farmerPlayNum == 0) || (game.landlordPlayNum == 1 && game.farmerPlayNum >= 1)) {
            // delay += 2000
            game.gameTimes *= 2;
            var springData = {
                aniType: "spring",
                gameTimes: game.gameTimes,
            }
            setTimeout(function () {
                userMgr.broacastInRoom("spring_notify", springData, player.userId, true);
            }, delay)
            var springInfo = {
                type:5,
                data:springData,
            }
            game.actionList.push(springInfo)
            delay += 2000;
        }
        setTimeout(function () {
            gameover(game, player.userId);
        }, delay)
    }

}
function notifyNextPlayer(game, pokerList, command, ispass, playType) {
    // 通知下一家出牌
    var lastIndex = game.turn;
    var nextIndex = (game.turn + 1) % 3;
    var seats = game.gameSeats;
    var nextPlayer = seats[nextIndex];
    var userId = nextPlayer.userId;
    game.turn = nextIndex;
    game.lastPokers = pokerList;
    game.isFirstPoker = command;
    var roomMsg = {
        index: lastIndex,
        pokerList: pokerList,
        playType: playType,
        command: command,
        turn: game.turn,
        num: seats[lastIndex].holds.length,
        ispass: ispass,
    }
    console.log("turnturn == "+game.turn);
    userMgr.broacastInRoom("notify_nextplayer_push", roomMsg, userId, true)
    var nnpInfo = {
        type:4,
        data:roomMsg,
    }
    game.actionList.push(nnpInfo);
    var roomInfo = game.roomInfo;
    if (game.playAni) {
        game.playAni = false;
    }
    game.ispp = false;
    game.tipPokers = [];
    roomInfo.gameDowntime = 30;
    userMgr.broacastInRoom("game_down_time", {
        downTime: roomInfo.gameDowntime,
        turn: game.turn
    }, game.gameSeats[game.turn].userId, true);
}

function deletePokers(a, b) { // 差集 a - b  a 是玩家手里的牌  b是玩家刚出的牌
    var map = {};
    for (var i = 0; i < b.length; i++) {
        var poker = b[i];
        var name = pm.getCardName(poker)
        console.log("shanchu "+name)
        map[name] = poker;
    }
    var flag = true;
    while (flag) {
        var index = -1;
        for (var i = 0; i < a.length; i++) {
            var poker = a[i];
            var name = pm.getCardName(poker)
            if (map[name]) {
                index = i;
                flag = true;
                break;
            }
        }
        if (index == -1)
            flag = false;
        else
            a.splice(index, 1);
    }
}

///游戏结束 forceEnd 强制解散

function store_history(roomInfo) {
    var seats = roomInfo.seats;
    var history = {
        uuid: roomInfo.uuid,
        id: roomInfo.id,
        // chang: roomInfo.conf.chang,
        time: Math.ceil(Date.now() / 1000),
        seats: new Array(max_player_count)
    };

    for (var i = 0; i < seats.length; ++i) {
        var rs = seats[i];
        var hs = history.seats[i] = {};
        hs.userid = rs.userId;
        if (!rs.name) {
            rs.name = '';
        }
        hs.name = crypto.toBase64(rs.name);
        hs.score = rs.score;
    }
    db.store_history(roomInfo.uuid,history,roomInfo.conf.quanId,function(sh){
        if(sh){
            for (var i = 0; i < seats.length; ++i) {
                var s = seats[i];
                store_single_history(s.userId, roomInfo.uuid);
            }
        }
    })
   
}

function store_single_history(userId, uuid) {
    db.get_user_history(userId, function (data) {
        if (data == null) {
            data = [];
        }
        console.log("玩家历史记录长度 == " + data.length);
        while (data.length >= 20) {
            data.shift();
        }
        data.push(uuid);
        db.update_user_history(userId, data);
    });
}

//gameIndex 游戏局数 
function store_game(game, callback) {
    db.create_game(game.roomInfo.uuid, game.gameIndex, game.baseInfoJson, callback); 
}

//洗牌
function shuffle(game) {
    var cardListData = zjhLogic.CardListData;
    console.log("牌的长度，" + cardListData);
    var len = cardListData.length;
    for (var i = 0; i < len; i++) {
        game.pokers[i] = cardListData[i];
    }
    zjhLogic.shuffle(game.pokers);
    console.log("pokers===" + game.pokers);
}
//发牌
function deal(game) {
    //每人5张
    var seats = game.gameSeats;
    var pokerList = pm.genAllPokers();
    var p1List = new Array(); //玩家0，1，2的牌
	var p2List = new Array();
	var p3List = new Array();
    var p4List = new Array(); //抢地主的三张牌
    var pokerMap = [];
	for (var i = 0; i < 17; i++) {
		p1List.push(pokerList[i]);
    }
    pokerMap.push(p1List);
	for (var i = 17; i < 34; i++) {
		p2List.push(pokerList[i]);
    }
    pokerMap.push(p2List);
	for (var i = 34; i < 51; i++) {
		p3List.push(pokerList[i]);
    }
    pokerMap.push(p3List);
	for (var i = 51; i < 54; i++) {
		p4List.push(pokerList[i]);
    }
    pokerMap.push(p4List);
    // var pokerMap = pm.testPokers(); //测试用；
    for (var i = 0; i < seats.length; i++) {
        seats[i].holds = pokerMap[i];
    }
    game.diPokers = pokerMap[3];
}
//判斷游戲開始
exports.hasBegan = function (roomId) {
    var game = exports.games[roomId];
    if (game != null) {
        return true;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo != null) {
        return roomInfo.numOfGames > 0;
    }
    return false;
};

//构建基本数据
function construct_game_base_info(game) {
    var baseInfo = {
        type: "ddz",
        button: game.button,//谁先叫地主
        index: game.gameIndex,
        conf: game.conf,
        maxGames: game.conf.maxGames,
        roomId: game.roomId,
        game_seats: new Array(max_player_count),
        seat_score: new Array(max_player_count),
        seat_id: new Array(max_player_count),
        seat_name: new Array(max_player_count),
        time: Date.parse(new Date()),
    };
    console.log("baseinfo de roomid*******=" + baseInfo.roomId);
    for (var i = 0; i < max_player_count; ++i) {
        baseInfo.game_seats[i] = game.gameSeats[i].holds;
        baseInfo.seat_score[i] = game.roomInfo.seats[i].score;//保存分数
        baseInfo.seat_id[i] = game.gameSeats[i].userId;
        baseInfo.seat_name[i] = game.gameSeats[i].name;
    }
    game.baseInfoJson = JSON.stringify(baseInfo);
}

var dissolvingList = []; //解散房間列表

exports.doDissolve = function (roomId) {
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return null;
    }
    var d = roomInfo.seats[0].userId;
    if (roomInfo.seats[0].userId == 0) {
        for (var i = 0; i < roomInfo.seats.length; i++) {
            if (roomInfo.seats[i].userId > 0) {
                d = roomInfo.seats[i].userId;
            }
        }
    }
    var game = exports.games[roomId];
    gameover(game, d, true)
};

exports.dissolveRequest = function (roomId, userId) {
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return null;
    }

    if (roomInfo.dr != null) {
        return null;
    }

    var seatIndex = roomMgr.getUserSeat(userId);
    if (seatIndex == null) {
        return null;
    }

    roomInfo.dr = {
        endTime: Date.now() + 60000 * 3,
        states: [],
    };

    var rs = roomInfo.seats;
    for (var i = 0; i < rs.length; i++) {
        if (rs[i].userId > 0) {
            roomInfo.dr.states[i] = 0;
        }
    }

    roomInfo.dr.states[seatIndex] = 1;

    dissolvingList.push(roomId);
    return roomInfo;
};
///同意 或者拒绝
exports.dissolveAgree = function (roomId, userId, agree) {
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return null;
    }

    if (roomInfo.dr == null) {
        return null;
    }

    var seatIndex = roomMgr.getUserSeat(userId);
    if (seatIndex == null) {
        return null;
    }

    if (agree) {
        roomInfo.dr.states[seatIndex] = 2;
    } else {
        roomInfo.dr = null;
        var idx = dissolvingList.indexOf(roomId);
        if (idx != -1) {
            dissolvingList.splice(idx, 1);
        }
    }
    return roomInfo;
};

function update() {
    for (var i = dissolvingList.length - 1; i >= 0; i--) {
        var roomId = dissolvingList[i];
        var roomInfo = roomMgr.getRoom(roomId);
        if (roomInfo != null && roomInfo.dr != null) {
            if (Date.now() > roomInfo.dr.endTime) {
                exports.doDissolve(roomId);
                dissolvingList.splice(i, 1);
            }
        } else {
            dissolvingList.splice(i, 1);
        }
    }
}
setInterval(update, 1000);

function calculateResult(game) {
    var winner = game.winner;
    var seats = game.gameSeats;
    var roomInfo = game.roomInfo;
    var difen = game.difen;

    if (winner.seatIndex == game.lastGrabIndex) {
        console.log("是地主赢了")
        for (var i = 0; i < seats.length; i++) {
            if (i != game.lastGrabIndex) {
                var resultScore = difen * game.gameTimes
                if (seats[i].isqiang == 4) {
                    resultScore *= 2;
                }
                seats[i].score -= resultScore;
                winner.score += resultScore;
            }
        }
    } else {
        console.log("是农民赢了")
        for (var i = 0; i < seats.length; i++) {
            if (i != game.lastGrabIndex) {
                var resultScore = difen * game.gameTimes
                if (seats[i].isqiang == 4) {
                    resultScore *= 2;
                }
                seats[i].score += resultScore;
                game.gameSeats[game.lastGrabIndex].score -= resultScore;
            }
        }
    }
}

exports.getCardString = function (s, includeDiPai) {
    var content = '';
    var scoreAndType = tdkLogic.calcScoreAndType(s.holds, includeDiPai);
    var type = scoreAndType.type;
    if (type >= 5) {
        content = '五张通吃';
    } else if (type == 4) {
        content = '四张通吃';
    } else {
        content = '总分：' + scoreAndType.score;
    }
    return content;
};

exports.doPeep = function (userId,data) {
    var data = JSON.parse(data);
    console.log("此时客户端传过来的isPeep == "+data.isPeep)
    var roomId = roomMgr.getUserRoom(userId);
    var game = exports.games[roomId];
    var player = gameSeatsOfUsers[userId];
    if (!game || !player) {
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    var seatIndex = roomMgr.getUserSeat(userId);
    var isPeep = data.isPeep;
    var holdsData = [];
    if (!isPeep) {
        for (var i = 0; i < 3; i++) {
            pm.sortNum_big(game.gameSeats[i].holds)
            holdsData.push(game.gameSeats[i].holds);
        }
    }
    
    var  peepData = {
        isPeep:!isPeep,
        userId:userId,
        holdsData:holdsData,
        diPokers:game.diPokers,
        state: game.state,
    }
    roomInfo.seats[seatIndex].isPeep = !isPeep
    userMgr.sendMsg(userId,"do_peep_notify",peepData)
};
// exports.doOtherDipai = function (userId, data) {
//     var seatIndex = roomMgr.getUserSeat(userId);
//     var seatData = gameSeatsOfUsers[userId];
//     if (!seatData) {
//         return;
//     }
//     var game = seatData.game;
//     data.show = !data.show;
//     var data = {
//         show: data.show,
//     };
//     userMgr.sendMsg(userId, 'game_other_dipai', data);
// };