cc.Class({
    extends: cc.Component,
    properties: {
        account: null,
        userId: null,
        userName: null,
        lv: 0,
        exp: 0,
        coins: 0,
        gems: 0,
        sign: 0,
        ip: "",
        showIp: "", //20180109 添加
        sex: 0,
        permits: [],
        roomData: null,
        oldRoomId: null,
        kong: 0,
        referee: 0,
        coinRoom: null,
        bankNum: 0,
        testcoins: 0,
        commission: 0,
        showTip:0,
        ver:null,
    },

    guestAuth: function () {
        var account = cc.args["account"];
        if (account == null) {
            account = cc.sys.localStorage.getItem("account");
        }

        if (account == null) {
            account = Date.now();
            cc.sys.localStorage.setItem("account", account);
        }

        cc.vv.http.sendRequest("/guest", {
            account: account
        }, this.onAuth);
    },

    onAuth: function (ret) {
        var self = cc.vv.userMgr;
        if (ret.errcode !== 0) {
            console.log(ret.errmsg);
        } else {
            self.account = ret.account;
            self.sign = ret.sign;
            cc.vv.http.url = "http://" + cc.vv.SI.hall;
            self.login();
        }
    },

    login: function () {
        var self = this;
        var onLogin = function (ret) {
            if (ret.errcode != 0) {
                console.log(ret.errmsg);
            } else {
                if (!ret.userid) {
                    if (cc.sys.os == cc.sys.OS_ANDROID) {
                        cc.sys.localStorage.removeItem("wx_account");
                        cc.sys.localStorage.removeItem("wx_sign");
                        cc.director.loadScene("login");
                    }
                    if (cc.sys.os == cc.sys.OS_IOS) {
                        cc.sys.localStorage.removeItem("wx_account");
                        cc.sys.localStorage.removeItem("wx_sign");
                        cc.director.loadScene("login")
                    } else {
                        cc.director.loadScene("createrole");
                    }
                } else {
                    self.account = ret.account;
                    self.userId = ret.userid;
                    self.userName = ret.name;
                    self.lv = ret.lv;
                    self.exp = ret.exp;
                    self.coins = ret.coins;
                    self.gems = ret.gems;
                    self.roomData = ret.roomid;
                    self.sex = ret.sex;
                    self.ip = ret.ip;
                    self.kong = ret.kong;
                    self.referee = ret.referee;
                    self.testcoins = ret.testcoins;
                    self.commission = ret.commission;
                    self.showIp = self.ip;
                    self.ver = ret.ver;
                    if(self.ver != cc.vv.ver){
                        if (cc.vv.ver != cc.vv.userMgr.ver) {
                            cc.vv.alert.show("提示", "软件版本低，点击重新下载！", function () {
                                var url = "http://houtai.17kuaileqp.com/fenxiang/index.html";
                                cc.sys.openURL(url);
                                cc.game.end();
                            })
                        } 
                        return;
                    }
                    if(self.roomData){
                        cc.vv.userMgr.enterRoom(self.roomData);
                        self.roomData = null;
                    }
                    else{
                        cc.vv.QuanNetMgr.connectQuanServer();
                    }   
                }
            }
        };
        cc.vv.http.sendRequest("/login", {
            account: this.account,
            sign: this.sign,
        }, onLogin);
    },

    create: function (name) {
        var self = this;
        var onCreate = function (ret) {
            if (ret.errcode != 0) {
                console.log(ret.errmsg);
            } else {
                self.login();
            }
        };
        var data = {
            account: this.account,
            sign: this.sign,
            name: name
        };
        cc.vv.http.sendRequest("/create_user", data, onCreate);
    },

    enterRoom: function (roomId, isHall) {
        var self = this;
        var onEnter = function (ret) {
            if (ret.errcode != 0) {
                cc.vv.wc.hide();
                if (ret.errcode == -1) {
                    setTimeout(function () {
                        self.enterRoom(roomId,isHall);
                    }, 5000);
                } else if (ret.errcode == 66) {
                    cc.vv.alert.show("提示", "已在房卡模式游戏 房间号：" + ret.roomid);
                } else if (ret.errcode == 77) {
                    cc.vv.alert.show("提示", "已在金币模式游戏");
                } else if (ret.errcode == 123) {
                    cc.vv.alert.show("提示", "你不是这个圈子里的人");
                } else if (ret.errcode == 456) {
                    var curScene = cc.director.getScene().name;
                    if (curScene == "hall") {
                       cc.vv.alert.show("提示", "房间不存在");
                    }else if(curScene == "niuniu"){
                        cc.vv.QuanNetMgr.connectQuanServer();
                    }
                } else if (ret.errcode == 11) {
                    cc.vv.userMgr.commission = 1;
                    cc.vv.alert.show("提示", "你的号被禁止玩游戏了！");
                } 
                else if (ret.errcode == 4) {
                    cc.vv.alert.show("提示", "房间已满！！");
                } else {
                    cc.vv.QuanNetMgr.connectQuanServer();
                }
            } else {
                if (cc.vv.quan && cc.vv.quan._quanId) {
                    cc.vv.quan.onCloseQuan();
                    cc.vv.quan._quanId = null;
                    cc.vv.quan._quanZhu = null;
                    cc.vv.quan = null;
                }
                if(isHall){
                    cc.vv.net.close()
                    cc.vv.net.loginData = ret;
                    cc.vv.gameNetMgr.connectGameServer(ret);
                }
                else{
                    cc.vv.gameNetMgr.connectGameServer(ret);
                }
              
            }
        };
       cc.vv.anysdkMgr.getMapInfo();
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            roomid: roomId,
            mapInfo: cc.vv.mapInfo,
        };
        cc.vv.wc.show("正在进入房间" + roomId);
        cc.vv.http.sendRequest("/enter_private_room", data, onEnter);
    },

    getHistoryList: function (quanId,callback) {
        console.log("usermgr 是获取的什么战绩"+quanId)
        var self = this;
        var onGet = function (ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                console.log("获取到了战绩"+ret.history);
                if (callback != null) {
                    callback(ret.history);
                }
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            quanId:quanId,
        };
        cc.vv.http.sendRequest("/get_history_list", data, onGet);
    },
    getGamesOfRoom: function (uuid, callback) {
        var self = this;
        var onGet = function (ret) {
            if (ret.errcode != 0) {
                console.log(ret.errmsg);
            } else {
                console.log(ret.data);
                callback(ret.data);
            }
        };

        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            uuid: uuid,
        };
        cc.vv.http.sendRequest("/get_games_of_room", data, onGet);
    },
    getDetailOfGame: function (uuid, index, callback) {
        var self = this;
        var onGet = function (ret) {
            if (ret.errcode != 0) {
                console.log(ret.errmsg);
            } else {
                console.log(ret.data);
                callback(ret.data);
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            uuid: uuid,
            index: index-1,
        };
        cc.vv.http.sendRequest("/get_detail_of_game", data, onGet);
    },
    getUserLocation:function(mapInfo){
        console.log("mapinfo == "+mapInfo)
        if(!mapInfo || mapInfo == -1){
            var address = "获取不到地址数据"
        }
        else{
            var mapInfo = JSON.parse(mapInfo);
            var address = ""+mapInfo.country+mapInfo.province+mapInfo.city+mapInfo.district;
            if(address == ""){
                address = "定位权限关闭，请到手机设置中开启！"
            }
        }
        return address;
    },

});