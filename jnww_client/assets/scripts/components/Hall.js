const Buffer = require("buffer").Buffer;
cc.Class({
    extends: cc.Component,

    properties: {
        lblName: cc.Label,
        lblGems: cc.Label,
        lblID: cc.Label,
        lblNotice: cc.Label,
        joinGameWin: cc.Node,
        joinFriendCircle: cc.Node,
        createRoomWin: cc.Node,
        settingsWin: cc.Node,
        helpWin: cc.Node,
        xiaoxiWin: cc.Node,
        mzWin: cc.Node,
        btnJoinGame: cc.Node,
        sprHeadImg: cc.Sprite,
        shareUI: cc.Node,
        gameName: null,
        isclicked: false,
        ver: cc.Label,
    },

    onShare: function () {
        cc.vv.audioMgr.playClicked();
        this.shareUI.active = true;
    },

    onLoad: function () {
        if (!cc.sys.isNative && cc.sys.isMobile) {
            var cvs = this.node.getComponent(cc.Canvas);
            cvs.fitHeight = true;
            cvs.fitWidth = true;
        }
        if (!cc.vv) {
            cc.director.loadScene("loading");
            return;
        }
        cc.vv.Hall = this;
        cc.find("Canvas/lay1/btn_create_room").active = true;
        var imgLoader = this.sprHeadImg.node.getComponent("ImageLoader");
        imgLoader.setUserID(cc.vv.userMgr.userId);
        cc.vv.utils.addClickEvent(this.sprHeadImg.node, this.node, "Hall", "onBtnClicked");
        this.addComponent("UserInfoShow");
        this.initButtonHandler("Canvas/right_bottom/btn_shezhi");
        this.initButtonHandler("Canvas/right_bottom/btn_help");
        this.initButtonHandler("Canvas/right_bottom/btn_waiter");
        this.initButtonHandler("Canvas/mianze");
        this.helpWin.addComponent("OnBack");
        this.xiaoxiWin.addComponent("OnBack");
        this.mzWin.addComponent("OnBack");
        // this.initLabels();
        // this.refreshNotice();
        // this.showHistory();
        // this.refreshInfo();
        cc.vv.audioMgr.playBGM("bgSound/hallbg");
        console.log("大厅加载了！！")
    },
    start(){
        this.initLabels();
        this.refreshNotice();
        this.showHistory();
        this.refreshInfo();
        cc.director.preloadScene("niuniu");
    },
    refreshInfo: function (do1) {
        var self = this;
        var onGet = function (ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                cc.vv.userMgr.ver = ret.ver;
                if (cc.vv.ver != cc.vv.userMgr.ver) {
                    cc.vv.alert.show("提示", "软件版本低，点击重新下载！", function () {
                        var url = "http://houtai.17kuaileqp.com/fenxiang/index.html";
                        cc.sys.openURL(url);
                        cc.game.end();
                    })
                } else {
                    this.ver.string = "ver 1.2.0010";
                }
                if (ret.gems != null) {
                    cc.vv.userMgr.gems = ret.gems;
                    this.lblGems.string = cc.vv.userMgr.gems;
                    cc.vv.userMgr.commission = ret.commission;
                    cc.vv.userMgr.lv = ret.lv;
                    cc.vv.userMgr.kong = ret.kong;
                    if (cc.vv.userMgr.lv == 2) {
                        cc.find("Canvas/adminButton/addGems").active = true;
                    } else if (cc.vv.userMgr.lv == 3) {
                        cc.find("Canvas/adminButton/addGems").active = true;
                        cc.find("Canvas/adminButton/deleteGems").active = true;
                        cc.find("Canvas/adminButton/admin").active = true;
                        cc.find("Canvas/adminButton/forbidGame").active = true;
                        cc.find("Canvas/adminButton/removeForbid").active = true;
                        cc.find("Canvas/adminButton/showAgent").active = true;
                        cc.find("Canvas/adminButton/hideAgent").active = true;
                    }

                }
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
        };
        cc.vv.http.sendRequest("/get_user_status", data, onGet.bind(this));
    },
    onBackCallback: function () {
        cc.vv.audioMgr.playClicked();
        cc.find("Canvas/lay1").active = true;
    },
    refreshNotice: function () {
        var self = this;
        var onGet = function (ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                this.lblNotice.string = ret.msg;
            }
        };

        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            type: "notice",
            version: null,
        };
        cc.vv.http.sendRequest("/get_message", data, onGet.bind(this));
    },
    refreshXiaoXi: function () {
        var self = this;
        var onGet = function (ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                var info = this.xiaoxiWin.getChildByName("info").getComponent(cc.Label);
                info.string = ret.msg;
                self.xiaoxiWin.active = true;
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            type: "xiaoxi",
            version: null,
        };
        cc.vv.http.sendRequest("/get_message", data, onGet.bind(this));
    },

    initButtonHandler: function (btnPath) {
        var btn = cc.find(btnPath);
        cc.vv.utils.addClickEvent(btn, this.node, "Hall", "onBtnClicked");
    },

    initLabels: function () {
        this.lblName.string = cc.vv.userMgr.userName;
        this.lblID.string = "ID:" + cc.vv.userMgr.userId;
    },

    onBtnClicked: function (event, customEventData) {
        cc.vv.audioMgr.playClicked();
        if (event.target.name == "btn_shezhi") {
            this.settingsWin.active = true;
        } else if (event.target.name == "btn_help") {
            this.helpWin.active = true;
        } else if (event.target.name == "btn_rules") {
            this.helpWinCoins.active = true;
        } else if (event.target.name == "btn_waiter") {
            this.refreshXiaoXi()
        } else if (event.target.name == "head") {
            cc.vv.anysdkMgr.getMapInfo();
            cc.vv.userinfoShow.show(cc.vv.userMgr.userName, cc.vv.userMgr.userId, this.sprHeadImg, cc.vv.userMgr.sex, cc.vv.userMgr.showIp,cc.vv.mapInfo);
        } else if (event.target.name == "mianze") {
            this.mzWin.active = true;
        } else if (event.target.name == "admin") {
            var url = "http://houtai.17kuaileqp.com/Admin/Login/index";
            cc.sys.openURL(url);
        } else if (event.target.name == "addGems") {
            var adminDo = cc.find("Canvas/adminDo");
            adminDo.getChildByName("title").getComponent(cc.Label).string = "加房卡";
            adminDo.getChildByName("userId").y = 38;
            adminDo.getChildByName("gemsNum").active = true;
            adminDo.doNum = customEventData;
            adminDo.active = true;
        } else if (event.target.name == "deleteGems") {
            var adminDo = cc.find("Canvas/adminDo");
            adminDo.getChildByName("title").getComponent(cc.Label).string = "减房卡";
            adminDo.getChildByName("userId").y = 38;
            adminDo.getChildByName("gemsNum").active = true;
            adminDo.doNum = customEventData;
            adminDo.active = true;
        } else if (event.target.name == "removeForbid") {
            var adminDo = cc.find("Canvas/adminDo");
            adminDo.getChildByName("title").getComponent(cc.Label).string = "解除限制";
            adminDo.getChildByName("userId").y = 0;
            adminDo.getChildByName("gemsNum").active = false;
            adminDo.doNum = customEventData;
            adminDo.active = true;
        } else if (event.target.name == "forbidGame") {
            var adminDo = cc.find("Canvas/adminDo");
            adminDo.getChildByName("title").getComponent(cc.Label).string = "禁止游戏";
            adminDo.getChildByName("userId").y = 0;
            adminDo.getChildByName("gemsNum").active = false;
            adminDo.doNum = customEventData;
            adminDo.active = true;
        } else if (event.target.name == "showAgent") {
            var adminDo = cc.find("Canvas/adminDo");
            adminDo.getChildByName("title").getComponent(cc.Label).string = "添加代理";
            adminDo.getChildByName("userId").y = 0;
            adminDo.getChildByName("gemsNum").active = false;
            adminDo.doNum = customEventData;
            adminDo.active = true;
        } else if (event.target.name == "hideAgent") {
            var adminDo = cc.find("Canvas/adminDo");
            adminDo.getChildByName("title").getComponent(cc.Label).string = "取消代理";
            adminDo.getChildByName("userId").y = 0;
            adminDo.getChildByName("gemsNum").active = false;
            adminDo.doNum = customEventData;
            adminDo.active = true;
        }

    },



    onJoinGameClicked: function () {
        cc.vv.audioMgr.playClicked();
        if (cc.vv.userMgr.commission == 1) {
            cc.vv.alert.show("提示", "你的号被禁止玩游戏了！");
            return;
        }
        this.joinGameWin.active = true;
    },
    onJoinCircleClicked: function () {
        cc.vv.audioMgr.playClicked();
        if (cc.vv.userMgr.commission == 1) {
            cc.vv.alert.show("提示", "你的号被禁止玩游戏了！");
            return;
        }
        if (cc.vv.quan && cc.vv.quan.node) {
            cc.vv.quan.initQuan()
            cc.vv.quan.getQuans(cc.vv.userMgr.userId);
            cc.vv.quan.getReMessage();
            // if (cc.vv.quan._quanTimer == null) {
            //     cc.vv.quan.setQuanTimer()
            // }
        }
        cc.vv.Hall.joinFriendCircle.active = true;
    },
    onReturnGameClicked: function () {
        cc.director.loadScene("niuniu");
    },

    onCreateRoomClicked: function () {
        cc.vv.audioMgr.playClicked();
        if (cc.vv.userMgr.commission == 1) {
            cc.vv.alert.show("提示", "你的号被禁止玩游戏了！");
            return;
        }
        if (cc.vv.gameNetMgr.roomId != null) {
            cc.vv.alert.show("提示", "房间已经创建!\n必须解散当前房间才能创建新的房间");
            return;
        }
        console.log("onCreateRoomClicked 111");
        this.createRoomWin.active = true;
        var btn_create = cc.find("Canvas/CreateRoom/btn_create");
        var interactable = btn_create.getComponent(cc.Button).interactable;
        if (!interactable) {
            btn_create.getComponent(cc.Button).interactable = true;
        }
        var intro = cc.find("Canvas/CreateRoom/intro");
        intro.getComponent(cc.Label).string = "游戏未开始解散房间不扣房卡";
        btn_create.active = true;
    },

    setGems: function (gems) {
        this.lblGems.getComponent(cc.Label).string += gems;
    },
    exitgame: function () {
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            cc.vv.audioMgr.playClicked();
            cc.vv.alert.show("提示", "是否确定退出登录？", function () {
                cc.game.end();
            }, true)
        }

    },
    newsEvents: function (event) {
        if (event.target.name == "copyNews") {
            var str = this.xiaoxiWin.getChildByName("info").getComponent(cc.Label).string
            console.log("复制消息" + str)
            cc.vv.anysdkMgr.JsCopy(str)
        } else if (event.target.name == "confirmNews") {
            this.xiaoxiWin.active = false;
        }
    },
    showHistory() {
        if (cc.vv.userMgr.showTip == 0) {
            cc.vv.userMgr.showTip = 1;
            cc.sys.localStorage.removeItem("quanHistory");
            cc.sys.localStorage.removeItem("roomInfo");
        }
        if (cc.sys.localStorage.getItem("roomInfo")) {
            var quanId = cc.sys.localStorage.getItem("quanHistory")
            if (!quanId) {
                quanId = -1;
            }
            cc.vv.userMgr.getHistoryList(quanId, function (data) {
                if (data == null) {
                    cc.vv.history.shrinkContent(0);
                    cc.vv.history._emptyTip.active = true;
                    cc.vv.history._history.active = true;
                    return;
                }
                data.sort(function (a, b) {
                    return b.time - a.time;
                });
                cc.vv.history._historyData = data;
                for (var i = 0; i < data.length; ++i) {
                    for (var j = 0; j < 3; ++j) {
                        var s = data[i].seats[j];
                        if (s.userid > 0) {
                            s.name = new Buffer(s.name, 'base64').toString();
                        }
                    }
                }
                if (cc.sys.localStorage.getItem("roomInfo")) {
                    var idx = cc.sys.localStorage.getItem("roomInfo");
                    cc.vv.history.getGameListOfRoom(Number(idx));
                    cc.vv.history._history.active = true;
                    cc.vv.history._emptyTip.active = false;
                } else {
                    cc.vv.history.initRoomHistoryList(data);
                }

                cc.sys.localStorage.setItem("quanHistory", quanId);
            });
        }
    },
    update: function (dt) {
        var x = this.lblNotice.node.x;
        x -= dt * 100;
        if (x + this.lblNotice.node.width < -1000) {
            x = 500;
        }
        this.lblNotice.node.x = x;
    },
});