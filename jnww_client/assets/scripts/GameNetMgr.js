cc.Class({
    extends: cc.Component,

    properties: {
        dataEventHandler: null,
        roomId: null,
        maxNumOfGames: 0,
        numOfGames: 0,
        seatIndex: -1,
        seats: null,
        conf: null, //房间配置
        gamestate: "",
        isOver: false,
        dissoveData: null,
        button: -1, //庄
        turn: -1,
        isNew: false,
        currentZhu: 0,
        currentMenzhu: 0,
        down_time: 0,
        iscf: false,
        pking: false,
        chang: -1,
        gameType: null,
        roundCount: 0,
        landLord: -1,
        gameTimes: 1,
        syncData: null,
        isFirstPoker: true,
        diPokers: null,
        difen: 0,
        gameTimer: false,
        gameDowntime: 0,
        lastPokerWraper: null,
        isPeep: false,
    },

    reset: function () {
        this.currentZhu = 0;
        this.currentMenzhu = 0;
        this.iscf = false;
        this.pking = false;
        this.button = -1;
        for (var i = 0; i < this.seats.length; ++i) {
            this.seats[i].ready = false;
            this.seats[i].qipai = false;
        }
    },

    clear: function () {
        this.dataEventHandler = null;
        if (this.isOver == null) {
            this.seats = null;
            this.roomId = null;
            this.maxNumOfGames = 0;
            this.numOfGames = 0;
        }
    },

    dispatchEvent: function (event, data) {
        if (this.dataEventHandler) {
            this.dataEventHandler.emit(event, data);
        }
    },
    //通过 userid获得自身座位号  
    getSeatIndexByID: function (userId) {
        if (this.seats) {
            for (var i = 0; i < this.seats.length; ++i) {
                var s = this.seats[i];
                if (s.userid == userId) {
                    return i;
                }
            }
        }
        return -1;
    },

    isOwner: function () {
        return this.seatIndex == 0;
    },
    isZhuang: function () {
        return this.seatIndex == this.button;
    },
    //通过uid获得座位数据
    getSeatByID: function (userId) {
        var seatIndex = this.getSeatIndexByID(userId);
        if(seatIndex == -1) return null
        var seat = this.seats[seatIndex];
        return seat;
    },

    getSelfData: function () {
        return this.seats[this.seatIndex];
    },

    getLocalIndex: function (index) {
        var ret = (index - this.seatIndex + 3) % 3;
        return ret;
    },
    isQiPai: function (index) {
        return this.seats[index].qipai;
    },
    //历史战绩
    prepareReplay: function (roomInfo, detailOfGame) {
        this.roomId = roomInfo.id;
        this.seats = roomInfo.seats;
        var baseInfo = detailOfGame.base_info;
        var scorelist = baseInfo.seat_score;
        for (var i = 0; i < this.seats.length; ++i) {
            var s = this.seats[i];
            s.seatindex = i;
            s.score = scorelist[i];
            s.holds = baseInfo.game_seats[i];
            if (cc.vv.userMgr.userId == s.userid) {
                this.seatIndex = i; //玩家自己的座位号
            }
        }
        if (this.seatIndex == -1) {
            this.seatIndex = 0;
        }
        this.conf = baseInfo.conf;
        this.button = baseInfo.button;
        this.numOfGames = baseInfo.index; //这里不用+1了
        this.maxNumOfGames = baseInfo.maxGames;
        if (this.conf.type == null) {
            this.conf.type == "ddz";
        }
    },

    getWanfa: function () {
        var conf = this.conf;
        if (conf && conf.maxGames != null) {
            var strArr = [];
            if (conf.max == 0) {
                strArr.push("三炸封顶");
            }
            if (conf.max == 1) {
                strArr.push("四炸封顶");
            }
            if (conf.max == 2) {
                strArr.push("炸弹不封顶")
            }
            return strArr.join(' ');
        }
        return '';
    },

    initHandlers: function () {
        var self = this;
        cc.vv.net.addHandler("login_result", function (data) {
            var scs = data.scs;
            var sc = cc.vv.ust.kai(scs);
            var data = JSON.parse(sc);
            if (data.errcode === 0) {
                var data = data.data;
                self.roomId = data.roomid;
                self.conf = data.conf;
                self.maxNumOfGames = data.conf.maxGames;
                self.numOfGames = data.numofgames;
                self.seats = data.seats;
                self.seatIndex = self.getSeatIndexByID(cc.vv.userMgr.userId);
                self.isOver = false;
                self.gamestate = "";
                self.dissoveData = null;
            } else {
                console.log("进入游戏 login_result  错误 " + data.errmsg);
            }
        });
        cc.vv.net.addHandler("login_finished", function (data) {
            console.log("login_finished");
            cc.vv.replayMgr._actionRecords = null
            cc.director.loadScene("niuniu");
        });
        cc.vv.net.addHandler("exit_result", function (data) {
            console.log("接收到exit_result消息");
            self.roomId = null;
            cc.vv.userMgr.coinRoom = null;
            self.turn = -1;
            self.dingque = -1;
            self.isDingQueing = false;
            self.seats = null;
        });
        cc.vv.net.addHandler("exit_notify_push", function (data) {
            console.log("接收到退出消息")
            var userId = data;
            var s = self.getSeatByID(userId);
            if (s) {
                s.userid = 0;
                s.name = "";
                self.dispatchEvent("user_state_changed", s);
            }
        });

        cc.vv.net.addHandler("dispress_push", function (data) {
            console.log("解散房间！！！")
            self.roomId = null;
            self.turn = -1;
            self.dingque = -1;
            self.isDingQueing = false;
            self.seats = null;
        });

        // cc.vv.net.addHandler("disconnect", function (data) {
        //     console.log("接收到到断开消息！！！"+  cc.vv.ishoutai)
        //     if(cc.vv.ishoutai)return;
        //     var curScene = cc.director.getScene().name;
        //     if(curScene == "hall"){
        //         console.log("hall断开连接"+cc.vv.net.ip)
        //         if(cc.vv.net.ip == "youxi.17kuaileqp.com:9998"){
        //             var arr = cc.vv.net.ip.split(':');
        //             var data = {
        //                 account: cc.vv.userMgr.account,
        //                 sign: cc.vv.userMgr.sign,
        //                 userId: cc.vv.userMgr.userId,
        //                 ip: arr[0],
        //                 port: arr[1],
        //             }
        //             cc.vv.http.sendRequest("/is_server_online", data, function(ret){
        //                if(ret.isonline){
        //                  self.connectGameServer(cc.vv.net.loginData)
        //                }
        //                else{
        //                     cc.game.restart();
        //                     cc.audioEngine.stopAll();  
        //                }
        //             });
                   
        //         }
        //        return;
        //     }
        //     else if(curScene == "niuniu"){
        //         console.log("gamenet断开连接")
        //         if (self.roomId == null) {
        //             cc.vv.QuanNetMgr.connectQuanServer();
        //         } else {
        //             if (self.isOver == false && !cc.vv.ishoutai) {
        //                 cc.vv.userMgr.oldRoomId = self.roomId;
        //                 self.dispatchEvent("reconnect");
        //             }
        //         }
        //     }
           
        // });
        cc.vv.net.addHandler("game_disconnect", function (data) {
            console.log("game_disconnect 接收到到断开消息！！！"+data.toHall)
            self.roomId = null;
            if(data.toHall){
                cc.vv.net.close();
                cc.vv.QuanNetMgr.connectQuanServer();
            }
        });
        cc.vv.net.addHandler("new_user_comes_push", function (data) {
            var seatIndex = data.seatindex;
            if (self.seats[seatIndex].userid > 0) {
                self.seats[seatIndex].online = true;
                console.log("离线登录");
            } else {
                data.online = true;
                self.seats[seatIndex] = data;
                console.log("self seats seatindex==" + self.seats[seatIndex].kanpai);
            }
            self.dispatchEvent('new_user', self.seats[seatIndex]);
        });

        cc.vv.net.addHandler("user_state_push", function (data) {
            if (self.seats) {
                var userId = data.userid;
                var seat = self.getSeatByID(userId);
                if(seat){
                    seat.online = data.online;
                    self.dispatchEvent('user_state_changed', seat);
                } 
            }

        });
        cc.vv.net.addHandler("user_ready_push", function (data) {
            console.log("ready push == " + data.userid)
            if (self.gamestate == "") {
                var userId = data.userid;
                var seat = self.getSeatByID(userId);
                if(seat){
                    seat.holds = [];
                    self.button = -1;
                    seat.ready = data.ready;
                    self.dispatchEvent('user_state_changed', seat);
                }
 
            }
        });

        cc.vv.net.addHandler("show_start_btn", function (data) {
            if (self.gamestate == "") {
                self.dispatchEvent('show_start_btn');
            }
        });

        //游戏局数
        cc.vv.net.addHandler("game_num_push", function (data) {
            self.numOfGames = data;
            self.difen = 0;
            self.dispatchEvent('game_num', data);
        });
        //游戏开始
        cc.vv.net.addHandler("game_begin_push", function (data) {
            console.log("game_begin::" + data);
            // for (var i = 0; i < self.seats.length; i++) {
            //     var s = self.seats[i];
            //     s.ready = false;
            // }
            self.numOfGames = data.gameIndex;
            // self.button = data;
            self.difen = 0;
            self.gamestate = "begin";
            self.dispatchEvent("game_begin", data);
            if (self.numOfGames == 1 && data.firstDeal) {
                var ips = {};
                for (var iii = 0; iii < self.seats.length; iii++) {
                    var ip = '';
                    if (self.seats[iii].ip) {
                        ip = self.seats[iii].ip.replace("::ffff:","");
                    }
                    if (ips[ip]) {
                        ips[ip].count++;
                    }
                    else {
                        ips[ip] = {};
                        ips[ip].name = [];
                        ips[ip].count = 1;
                    }
                    ips[ip].name.push(self.seats[iii].name);
                    // console.log('ips is ' + JSON.stringify(ips));
                }
                var str = '';
                for (var iii in ips) {
                    if (ips[iii].count) {
                        if (ips[iii].count > 1) {
                            str += ips[iii].name.join('、');
                            str += '的IP地址相同。\n';
                        }
                    }
                }
                if (str != '') {
                    cc.vv.alert.show('相同IP地址', '' + str);
                }
            }
        });
        cc.vv.net.addHandler("qiangdizhu", function (data) {
            self.gamestate = "qiangdizhu";
            self.doQiangdizhu(data);
        });
        
        cc.vv.net.addHandler("qiangdizhu_result_push", function (data) {
            self.gamestate = "play";
            self.turn = data.landlord;
            self.doQiangdizhuResult(data);
        });
       
        cc.vv.net.addHandler("play_success_all", function (data) {
            self.gamestate = "play";
            self.doPlaySuccess(data);
        });
        cc.vv.net.addHandler("notify_nextplayer_push", function (data) {
            self.gamestate = "play";
            self.doNotifyNext(data);
        });
        cc.vv.net.addHandler("spring_notify", function (data) {
            self.doSpringNotify(data);
        });
        cc.vv.net.addHandler("deal_pokers_again_tip", function (data) {
            self.dispatchEvent("deal_pokers_again_tip_do", data);
        });
        cc.vv.net.addHandler("game_over_push1", function (data) {
            self.gamestate = "";
            self.doGameOver(data);

        });
        cc.vv.net.addHandler("play_err", function (data) {
            self.dispatchEvent("play_err_do", data)
        });
        cc.vv.net.addHandler("show_tip_pokers", function (data) {
            self.dispatchEvent("show_tip_pokers_do", data)
        });
        //游戏异步
        cc.vv.net.addHandler("game_sync_push", function (data) {
            self.gamestate = data.state;
            self.landLord = data.landLord
            self.turn = data.turn;
            self.conf = data.conf;
            self.maxNumOfGames = data.conf.maxGames;
            self.numOfGames = data.numOfGames;
            self.gameTimes = data.gameTimes;
            self.isFirstPoker = data.isFirstPoker;
            self.diPokers = data.diPokers;
            self.difen = data.difen;
            self.gameDowntime = data.gameDowntime;
            self.gameTimer = data.gameTimer;
            self.lastPokerWraper = data.lastPokerWraper;
            for (var i = 0; i < 3; ++i) {
                var seat = self.seats[i];
                var sd = data.seats[i];
                seat.holds = sd.holds;
                seat.pokerNum = sd.pokerNum;
                seat.userid = sd.userId;
                seat.score = sd.score;
                seat.ispass = sd.ispass;
                seat.outPokers = sd.outPokers;
                seat.isqiang = sd.isqiang;
                if (cc.vv.userMgr.userId == sd.userid) {
                    self.seatIndex = i; //玩家自己的座位号
                }
                // seat.ready = false;
            }

        });
        cc.vv.net.addHandler("return_user_mapInfo", function (data) {
            self.dispatchEvent("show_user_mapInfo", data)
        })
        cc.vv.net.addHandler("change_self_mapInfo", function (data) {
            cc.vv.anysdkMgr.getMapInfo();
            cc.vv.net.send("do_change_self_mapInfo", {
                mapInfo: cc.vv.mapInfo
            })
        });
        cc.vv.net.addHandler("change_other_mapinfo", function (data) {
           self.seats[data.index].mapInfo = data.mapInfo;
        });
        //发牌
        cc.vv.net.addHandler("game_allholds_push", function (ret) {
            var scs = ret.scs;
            var sc = cc.vv.ust.kai(scs);
            var ret = JSON.parse(sc);
            var data = ret.allPokers;
            var button = ret.button;
            self.seats[self.seatIndex].holds = data;
            var cardData = [];
            for (var k = 0; k < 17; k++) {
                for (var i = 0; i < 3; i++) {
                    var temp = {};
                    temp.seatIndex = (button + i) % 3;
                    temp.cardIndex = k + 1;
                    if (temp.seatIndex == self.seatIndex) {
                        temp.pai = self.seats[self.seatIndex].holds[k];
                    } else {
                        temp.pai = 0;
                    }
                    cardData.push(temp);
                }
            }
            for (var j = 0; j < 3; j++) {
                var temp = {};
                temp.seatIndex = 4
                temp.cardIndex = j;
                temp.pai = 0
                cardData.push(temp)
            }
            cc.vv.sendCardData = cardData;
            self.dispatchEvent('game_allholds', data);
        });
        cc.vv.net.addHandler("game_down_time", function (data) {
            self.dispatchEvent("down_time", data);
        });
        cc.vv.net.addHandler("show_qzd_btn_do", function (data) {
            self.dispatchEvent("show_qzd_btn", data)
            self.dispatchEvent("down_time", data);
        });
        cc.vv.net.addHandler("game_over_to_ready", function (data) {
            self.dispatchEvent("do_over_ready");
        });
        cc.vv.net.addHandler("game_reset_push", function (data) {
            self.reset();
        });
        cc.vv.net.addHandler("chat_push", function (data) {
            self.dispatchEvent("chat_push", data);
        });
        cc.vv.net.addHandler("quick_chat_push", function (data) {
            self.dispatchEvent("quick_chat_push", data);
        });
        cc.vv.net.addHandler("emoji_push", function (data) {
            self.dispatchEvent("emoji_push", data);
        });

        cc.vv.net.addHandler("dissolve_notice_push", function (data) {
            console.log("dissolve_notice_push");
            console.log(data);
            self.dissoveData = data;
            self.dispatchEvent("dissolve_notice", data);
        });

        cc.vv.net.addHandler("dissolve_cancel_push", function (data) {
            self.dissoveData = null;
            self.dispatchEvent("dissolve_cancel", data);
        });

        cc.vv.net.addHandler("voice_msg_push", function (data) {
            self.dispatchEvent("voice_msg", data);
        });
        cc.vv.net.addHandler("do_peep_notify", function (data) {
            self.isPeep = data.isPeep;
            if (self.isPeep) {
                var holdsData = data.holdsData;
            }
            for (var i = 0; i < 3; i++) {
                if (i != self.seatIndex) {
                    if (self.isPeep) {
                        self.seats[i].holds = holdsData[i];
                    } else {
                        self.seats[i].holds = [];
                    }
                }
            }
            self.dispatchEvent("do_peep", data);
        });
    },
    doQiangdizhu: function (data) { // 要有抢地主数据
        this.difen = data.difen;
        this.dispatchEvent("qiangdizhu_do", data);
    },
    doQiangdizhuResult: function (data) { //要有抢地主结果数据
        console.log("qiangdizhu_result_push" + data);
        this.landLord = data.landlord;
        this.difen = data.difen;
        this.dispatchEvent("qiangdizhu_result_do", data);
    },
    doPlaySuccess: function (data) {
        console.log("play_success_all" + data);
        this.lastPokerWraper = data.lastPokerWraper;
        this.dispatchEvent("play_success_all_do", data);
    },
    doNotifyNext: function (data) {
        this.turn = data.turn;
        this.dispatchEvent("notify_nextplayer_do", data);
    },
    doSpringNotify: function (data) {
        this.dispatchEvent("spring_notify_do", data);
    },
    doGameOver: function (data) {
        var results = data.results;
        if (data.isAllOver) {
            this.isOver = true;
        }
        for (var i = 0; i < results.length; i++) {
            var userData = results[i];
            this.seats[i].score = userData.totalScore;
        }
        this.dispatchEvent("game_over_do", data)
        if (data.isAllOver) {
            this.dispatchEvent("game_end", results)
        }
    },
    connectGameServer: function (data) {
        cc.vv.net.ip = data.ip + ":" + data.port;
        console.log("gamenetmgr ip= " + cc.vv.net.ip);
        var self = this;
        var onConnectOK = function (netdata) {
            console.log("gamenetmgr onConnectOK"+netdata);
            var sd = {
                token: data.token,
                roomid: data.roomid,
                time: data.time,
                sign: data.sign,
            };
            cc.vv.net.loginData = null;
            cc.vv.net.send("login", sd);
        };

        var onConnectFailed = function () {
            console.log(" gamenetmgr failed.");
            cc.vv.wc.hide();
        };
        cc.vv.wc.show("正在进入房间");
        cc.vv.net.connect(onConnectOK, onConnectFailed);
    },
});