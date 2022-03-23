//游戏 niuniu
var pokerLogic = require('NiuniuLogic');
cc.Class({
    extends: cc.Component,
    properties: {
        gameRoot: {
            default: null,
            type: cc.Node
        },
        prepareRoot: {
            default: null,
            type: cc.Node
        },
        cardBg: {
            default: null,
            type: cc.SpriteFrame
        },
        gameTimes: {
            default: null,
            type: cc.Label
        },
        _playerList: [], //玩家节点
        _dnList: [], //玩家手牌正面节点
        _replayList: [],
        _seatList: [], //gameroot玩家座位信息 
        _readySp: cc.Node, ///准备 
        _gamecount: cc.Label, //游戏局数
        _game_result: cc.Node, //游戏结果
        _timeId: null, //计时器
        _huangKuangList: [],
        _zongDifen: cc.Label,
        pokerNode: {
            default: null,
            type: cc.Node
        },
        pokerPrefab: {
            default: null,
            type: cc.Prefab
        },
        _diNode: null,
        _btnPosition: null,
        pokerAtlas: {
            default: null,
            type: cc.SpriteAtlas
        },
        showAtlas: {
            default: null,
            type: cc.SpriteAtlas
        },
        _lanNum: 0,
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
        cc.vv.game = this;
        this.addComponent("GameResult");
        this.addComponent("NNRoom");
        this.addComponent("Chat");
        this.addComponent("ReplayCtrl");
        this.addComponent("PopupMgr");
        this.addComponent("ReConnect");
        this.addComponent("Voice");
        this.addComponent("UserInfoShow");
        this.addComponent("TimePointer");
        this.addComponent("distance");
        this.addComponent("notice");
        console.log("游戏游戏加载！！")
    },
    start(){
        this.initView();
        this.initEventHandlers();
        cc.vv.audioMgr.playBGM("bgSound/gamebg");
        this.node.on(cc.Node.EventType.TOUCH_START, this.onNodeTouch, this);
        this._lastRound = cc.find('Canvas/game/lastRound'); //20180208 修改
        this._lastRound.active = false;
        this._btnPosition = cc.find("Canvas/btn_position");
        this._btnPosition.on("click", this.getUserPosition, this)
        if (cc.vv.gameNetMgr.gamestate == "" && !cc.vv.gameNetMgr.seats[cc.vv.gameNetMgr.seatIndex].ready && !cc.vv.replayMgr.isReplay()) { //cc.vv.gameNetMgr.numOfGames == 0
            this.readyCallback();
        }
        if (cc.vv.replayMgr.isReplay()) {
            this.replayInit();
        }
        this.initSendCard();
        this.sync();
        cc.director.preloadScene("hall");
    },
    onNodeTouch: function (event) {
        if (cc.vv.selectPokers.length > 0) {
            var touches = event.getTouches();
            var touchLoc = touches[0].getLocation();
            var touchStart = this.pokerNode.convertToNodeSpace(touchLoc)
            var myNodeScript = this.pokerNode.getComponent('MyNodeScript');
            myNodeScript._getCardForTouch(touchStart,touchLoc)
        }
    },
    initView: function () {
        //搜索需要的子节点
        this.gameRoot.active = false;
        this.prepareRoot.active = true;
        var gameChild = this.node.getChildByName("game");
        this._gamecount = this.node.getChildByName('gamecount').getComponent(cc.Label);

        for (var i = 0; i < 3; ++i) {
            var player_name = "player_" + i;
            var player = gameChild.getChildByName(player_name);
            this._playerList[this._playerList.length] = player;
            var dn = player.getChildByName("displayNode");
            this._dnList[this._dnList.length] = dn;
            dn.active = false;
            var rpNode = player.getChildByName("replayNode");
            this._replayList[this._replayList.length] = rpNode;
            rpNode.active = false;

            var seat = player.getChildByName("seat");
            this._seatList[this._seatList.length] = seat;
            //金币场金币
            var huang_kuang = player.getChildByName("huang_kuang");
            this._huangKuangList[this._huangKuangList.length] = huang_kuang;
            huang_kuang.active = false;

        }
        //准备
        // var seat = cc.vv.gameNetMgr.getSeatByID(cc.vv.userMgr.userId);
        var seat = cc.vv.gameNetMgr.seats[cc.vv.gameNetMgr.seatIndex];
        this._readySp = this.node.getChildByName("readySp");
        this._readySp.on('click', this.readyCallback, this);
        this._readySp.active = true && !seat.ready;

        var zongDifen = this.gameRoot.getChildByName("zongDifen");
        this._zongDifen = zongDifen.getComponent(cc.Label);
        this._zongDifen.string = "底分:0";

        this._diNode = this.gameRoot.getChildByName("di_pokers");

        this.initWanfaLabel();
        this.initGameRound();
        this._game_result = this.node.getChildByName("game_result");
        this._game_result.active = false;

    },
    getUserPosition: function () {
        cc.vv.net.send("get_user_mapInfo")
    },
    zuobiCallback: function (event) {
        var show = false;
        var seats = cc.vv.gameNetMgr.seats;
        for (var i = 0; i < 3; i++) {
            if (seats[i].userId <= 0) continue;
            var seatIndex = seats[i].seatindex;
            var local_index = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
            if (local_index != 0 && this._holdList_1[local_index] && seats[i].holds.length > 0) {
                var card0 = this._holdList_1[local_index].getChildByName('card_0');
                if (card0) {
                    var card = card0.getComponent('Poker');
                    if (card) {
                        show = (card.getLogicId() == 0) ? false : true;
                    }
                    break;
                }
            }

        }
        cc.vv.net.send('other_dipai', {
            show: show
        });
    },

    //游戏局数
    initGameRound: function () {
        if (cc.vv.gameNetMgr.conf.type == "ddz") {
            this._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames;
        } else {
            this._gamecount.string = "";
        }
    },
    //20180502 添加
    lastRoundCallback: function (event) {
        if (this._lastRoundData) {
            this._lastRound.active = true; //有数据才显示
            this._lastRound.getComponent('lastRound').setData(this._lastRoundData);
        }
    },

    //玩法 
    initWanfaLabel: function () {
        var wanfa = cc.find("Canvas/infobar/wanfa").getComponent(cc.Label);
        wanfa.string = cc.vv.gameNetMgr.getWanfa();
    },

    //新玩家加入
    newPlayerEnter: function (seatIndex) {
        var local_index = this.getLocalIndex(seatIndex);
        this._playerList[seatIndex].active = true;
    },
    initEventHandlers: function () {
        cc.vv.gameNetMgr.dataEventHandler = this.node;
        //初始化事件监听器
        var self = this;
        this.node.on('game_begin', function (data) {
            console.log("从谁那开始抢地主 == " + data)
            var data = data;
            var turn = data.button;
            self.onGameBeign(turn);
            self.initGameRound()
        });
        this.node.on("qiangdizhu_do", function (data) {
            var data = data;
            var lastIndex = data.lastIndex;
            var lastLocal = cc.vv.gameNetMgr.getLocalIndex(lastIndex);
            var qdzBtn = self.node.getChildByName("qdzBtn");
            var jiabei = self.node.getChildByName("jiabei");
            if (lastLocal == 0) {
                qdzBtn.active = false;
                jiabei.active = false;
            }
            var audioUrl = "ddz/qdzSound/" + data.soundType + "";
            cc.vv.audioMgr.playSFX(audioUrl);
            self.addSprite(self._dnList[lastLocal], data.name)
            if (data.isqiang == 4) {
                self._playerList[lastLocal].getChildByName("jiabei_logo").active = true;
            }
            self._zongDifen.string = "底分:" + data.difen;
            if(cc.vv.sendCardData.length == 0){
                if(!cc.vv.replayMgr.isReplay()){
                    self.showQzdBtn(data.turn);
                }
                self.changeTimer(data.turn);
            }
         
        });
        this.node.on("qiangdizhu_result_do", function (data) {
            var qData = data.qData;
            if (qData) {
                var lastIndex = qData.lastIndex;
                var lastLocal = cc.vv.gameNetMgr.getLocalIndex(lastIndex);

                var audioUrl = "ddz/qdzSound/" + qData.soundType + "";
                cc.vv.audioMgr.playSFX(audioUrl);
                self.addSprite(self._dnList[lastLocal], qData.name)
                if (qData.isqiang == 4) {
                    self._playerList[lastLocal].getChildByName("jiabei_logo").active = true;
                }
            }
            var index = data.landlord;
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(index);
            self.showDizhuInfo(index, data.dizhuPokers)
            if (localIndex == 0) {
                self.showPlayButton(data.isFirstPoker);
                var dn = self._dnList[localIndex];
                dn.destroyAllChildren();
            }
            var myNodeScript = self.pokerNode.getComponent('MyNodeScript');
            myNodeScript.pokerAllDown();
            self._zongDifen.string = "底分:" + data.difen;
            self.changeTimer(index);
        });
        this.node.on("play_success_all_do", function (data) {
            var data = data;
            if (data.userId == cc.vv.gameNetMgr.seats[cc.vv.gameNetMgr.seatIndex].userid) {
                var ispass = data.ispass
                self.hidePlayButton();
                var holds = cc.vv.gameNetMgr.seats[cc.vv.gameNetMgr.seatIndex].holds;
                if (!ispass) {
                    self.removePokers(holds, data.pokerList);
                    if (cc.vv.replayMgr.isReplay()) {
                        var reNode = self._replayList[0];
                        self.showOutPokers(holds, reNode, 0);
                    } else {
                        var myNodeScript = self.pokerNode.getComponent('MyNodeScript');
                        myNodeScript.displayPokers(holds, self.pokerAtlas);
                    }
                    if (cc.vv.selectPokers.length > 0) {
                        cc.vv.selectPokers.splice(0, cc.vv.selectPokers.length);
                    }
                } else {
                    if (cc.vv.selectPokers.length > 0) {
                        var myNodeScript = self.pokerNode.getComponent('MyNodeScript');
                        myNodeScript.pokerAllDown();
                    }
                }

            }
            self.gameTimes.string = "当前倍数 x" + data.gameTimes
            var li = cc.vv.gameNetMgr.getLocalIndex(data.index);
            if (li != 0) {
                self.showOthersPokers(data.num, li);
                if (cc.vv.replayMgr.isReplay() || cc.vv.gameNetMgr.isPeep) {
                    var hh = cc.vv.gameNetMgr.seats[data.index].holds;
                    if (!data.ispass) {
                        self.removePokers(hh, data.pokerList);
                        var reNode = self._replayList[li];
                        self.showOutPokers(hh, reNode, li);
                    }
                }
            }
            self.updateOutPokers(data);
            if (!data.ispass && data.pokerType) {
                var aniType = data.pokerType;
                var aniNode = self.gameRoot.getChildByName(aniType)
                if (aniNode) {
                    setTimeout(function () {
                        aniNode.getComponent(cc.Animation).play(aniType);
                        var audioUrl = "ddz/ani/" + aniType + "";
                        cc.vv.audioMgr.playSFX(audioUrl);
                    }, 500)

                }

            }
        });
        this.node.on('game_allholds', function (data) {
           self.pokerNode.destroyAllChildren();
            self.tempPL = null;
            self.deal2();
        });

        this.node.on("notify_nextplayer_do", function (data) {
            var data = data;
            var turn = data.turn;
            var lastIndex = data.index;
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(turn);
            if (localIndex == 0) {
                self.showPlayButton(data.command)
            }
            self.changeTimer(turn);
            var dn = self._dnList[localIndex];
            dn.destroyAllChildren();
        });
        this.node.on("game_over_do", function (data) {
            var data = data;
            cc.vv.popupMgr.closeAll()
            self.doGameOver(data);
        });
        this.node.on("spring_notify_do", function (data) {
            var aniType = data.aniType;
            var aniNode = self.gameRoot.getChildByName(aniType)
            self.gameTimes.string = "当前倍数 x" + data.gameTimes;
            if (aniNode) {
                aniNode.getComponent(cc.Animation).play(aniType);
                var audioUrl = "ddz/ani/" + aniType + "";
                cc.vv.audioMgr.playSFX(audioUrl);
            }
        });
        this.node.on("play_err_do", function (data) {
            var data = data;
            cc.vv.notice.tip(data.msg);
        })
        this.node.on("show_tip_pokers_do", function (data) {
            var data = data;
            var myNodeScript = self.pokerNode.getComponent('MyNodeScript');
            myNodeScript.showTipPokers(data.tipPokers);
        });
        this.node.on("game_shuohua", function (data) {
            self.turnSeat(data);

        });
        this.node.on("do_peep", function (data) {
            self.doPeep(data);
        });
        this.node.on("do_over_ready", function (data) {
            self._lastRound.active = false;
            self.readyCallback();
        })
        this.node.on("deal_pokers_again_tip_do", function (data) {
            var msg = "将重新发牌！";
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(data.index)
            var player = self._playerList[localIndex];
            player.getChildByName("clock").active = false;
            self.dispalyErr(msg, data.delay);
        });
        this.node.on("user_exit_changed", function (data) {
            var seatData = data;
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatData.seatindex);
            self._holdList_1[localIndex].active = false;
            self._huangKuangList[localIndex].active = false;
        });
        this.node.on("show_start_btn", function (data) {
            self._readySp.active = true;
            if (cc.vv.gameNetMgr.conf.type == "kxmsz_match") {
                var btnWechat = cc.find("Canvas/prepare/btnWeichat");
                var btnExit = cc.find("Canvas/prepare/btnExit");
                btnWechat.active = true;
                btnExit.active = true;
                self.gameRoot.active = false;
                self.prepareRoot.active = true;

            }

        });
        this.node.on("show_qzd_btn",function(data){
            self.showQzdBtn(data.turn),
            self.changeTimer(data.turn);
        });

    },
    showQzdBtn:function(turn){
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(turn)
        // var qdzBtn = this.node.getChildByName("qdzBtn");
        // qdzBtn.active = false;
        // var childs = qdzBtn.children;
        // for (var i = 0; i < childs.length; i++) {
        //     childs[i].getComponent(cc.Button).interactable = true;
        // }
        // if (localIndex == 0) {
        //     qdzBtn.active = true;

        // }
        if(localIndex == 0){
            var qdzBtn = this.node.getChildByName("qdzBtn");
            var jiabei = this.node.getChildByName("jiabei");
            var childs = qdzBtn.children;
            var difens = cc.vv.gameNetMgr.conf.difen;
            for (var i = 0; i < difens.length; i++) {
                if (cc.vv.gameNetMgr.difen >= difens[i]) {
                    childs[i].getComponent(cc.Button).interactable = false;
                }
                else{
                    childs[i].getComponent(cc.Button).interactable = true;
                }
            }
            if (cc.vv.gameNetMgr.difen < 3) {
                qdzBtn.active = true;
            } else {
                jiabei.active = true;
            }
        }
        
    },

    doGameOver: function (data) {
        var self = this;
        var sdList = data.results;
        var isAllOver = data.isAllOver;
        var forceEnd = data.forceEnd;
        var gameTimes = data.gameTimes;
        for (var i = 0; i < sdList.length; i++) {
            var userData = sdList[i]
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
            var player = this._playerList[localIndex];
            if (localIndex != 0) {
                var holds = userData.holds;
                if (holds.length > 0) {
                    pokerLogic.sortNum_big(holds);
                    var ud = {
                        index: i,
                        pokerList: holds,
                        ispass: false,
                    }
                    this.updateOutPokers(ud);
                }

            } else {
                cc.vv.selectPokers = [];
                if (!forceEnd) {
                    this._lastRound.getComponent('lastRound').changeData(userData, gameTimes);

                }
            }
            player.getChildByName("clock").active = false;
            player.getChildByName("seat").getChildByName("score").getComponent(cc.Label).string = userData.totalScore;
        }
        if (!isAllOver) {
            // setTimeout(function () {
            //     self._readySp.active = true;
            // }, 2000)
        } else {
            setTimeout(function () {
                self._game_result.active = true;
            }, 3000)
        }

    },
    dispalyErr: function (msg, delayTime) {
        var tip = this.node.getChildByName("err_tip")
        tip.getComponent(cc.Label).string = msg;
        tip.active = true;
        if (!delayTime) {
            var delayTime = 500;
        };
        setTimeout(() => {
            tip.active = false;
        }, delayTime);
    },
    updateOutPokers: function (data) {
        var lastIndex = data.index;
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(lastIndex);
        var pokerList = data.pokerList;
        var dn = this._dnList[localIndex];
        if (data.ispass) {
            dn.destroyAllChildren();
            this.addSprite(dn, "buchu");
        } else {
            this.showOutPokers(pokerList, dn, localIndex)
        }
        if (data.soundType) {
            if (data.sex == 2) {
                var audioUrl = "ddz/girl/" + data.soundType + "";
            } else {
                var audioUrl = "ddz/boy/" + data.soundType + "";
            }
            cc.vv.audioMgr.playSFX(audioUrl);
        }

    },
    addSprite: function (displayNode, sname) {
        displayNode.active = true;
        var SpriteNode = new cc.Node();
        console.log("add sprite =="+sname)
        SpriteNode.addComponent(cc.Sprite).spriteFrame = this.showAtlas.getSpriteFrame(sname);
        SpriteNode.setScale(2, 2);
        displayNode.addChild(SpriteNode);
    },
    showOutPokers: function (pokerList, dNode, index) {
        dNode.destroyAllChildren();
        var gap = 50; //牌间隙
        var startx = 0 //开始x坐标
        if (index == 0) {
            startx = pokerList.length / 2;
        }
        if (index == 1) {
            startx = pokerList.length - 1;
        }

        for (var i = 0; i < pokerList.length; i++) {
            var poker = pokerList[i];
            var pokerName = pokerLogic.getCardName(poker);
            var pokerSprite = cc.instantiate(this.pokerPrefab);
            pokerSprite.getComponent(cc.Sprite).spriteFrame = this.pokerAtlas.getSpriteFrame(pokerName);
            if (cc.vv.replayMgr.isReplay() && index == 0 && dNode.name == "replayNode") {
                gap = 100
                pokerSprite.setScale(1.6, 1.6);
            }
            dNode.addChild(pokerSprite);
            var x = (-startx) * gap + i * gap;
            pokerSprite.setPosition(x, 0);
        }
        dNode.active = true;
    },
    showPlayButton: function (data) {
        if (cc.vv.replayMgr.isReplay()) return;
        if (cc.vv.gameNetMgr.turn != cc.vv.gameNetMgr.seatIndex) return;
        var guo = this.gameRoot.getChildByName("passBtn");
        var chu = this.gameRoot.getChildByName("playBtn");
        var tip = this.gameRoot.getChildByName("tipBtn");
        guo.active = true;
        chu.active = true;
        tip.active = true;
        if (data) {
            guo.active = false;
            tip.active = false;
            chu.x = 0;
        } else {
            chu.x = 350;
        }
    },
    hidePlayButton: function (data) {
        var guo = this.gameRoot.getChildByName("passBtn");
        var chu = this.gameRoot.getChildByName("playBtn");
        var tip = this.gameRoot.getChildByName("tipBtn");
        guo.active = false;
        chu.active = false;
        tip.active = false;
        this._playerList[0].getChildByName("clock").active = false;
    },
    showDizhuInfo: function (index, dizhuPokers) {
        var data = cc.vv.gameNetMgr.getLocalIndex(index);
        var holds = cc.vv.gameNetMgr.seats[index].holds;
        this._playerList[data].getChildByName("dz_logo").active = true;
        var pList = this._diNode.children;
        for (var i = 0; i < pList.length; i++) {
            if (data == 0) {
                holds.push(dizhuPokers[i]);
            } else if (cc.vv.replayMgr.isReplay() || cc.vv.gameNetMgr.isPeep) {
                holds.push(dizhuPokers[i]);
            }
            var p = pokerLogic.getCardName(dizhuPokers[i])
            pList[i].getComponent(cc.Sprite).spriteFrame = this.pokerAtlas.getSpriteFrame(p);
        }
        var myNodeScript = this.pokerNode.getComponent('MyNodeScript');
        pokerLogic.sortNum_big(holds);
        if (data == 0) {
            if (!cc.vv.replayMgr.isReplay()) {
                myNodeScript.displayPokers(holds, this.pokerAtlas);
            }
        } else {
            this.showOthersPokers(20, data);
            if (cc.vv.replayMgr.isReplay() || cc.vv.gameNetMgr.isPeep) {
                var reNode = this._replayList[data];
                this.showOutPokers(holds, reNode, data);
            }
        }
        myNodeScript.pokerAllDown();
    },
    play: function (data) {
        if (cc.vv.gameNetMgr.turn != cc.vv.gameNetMgr.seatIndex) {
            this.hidePlayButton();
            return;
        }
        if (cc.vv.selectPokers.length == 0) {
            cc.vv.notice.tip("请选择要出的牌！")
            return
        }
        var data = {
            pokerList: cc.vv.selectPokers,
            ispass: false,
        }
        cc.vv.net.send("play", data)
    },
    guo: function () {
        if (cc.vv.gameNetMgr.turn != cc.vv.gameNetMgr.seatIndex) {
            this.hidePlayButton();
            return;
        }
        var myNodeScript = this.pokerNode.getComponent('MyNodeScript');
        myNodeScript.pokerAllDown();
        var data = {
            ispass: true,
        }
        cc.vv.net.send("play", data)
    },
    tip: function (event) {
        console.log("执行了tiptip")
        cc.vv.net.send("pokers_tip")
    },
    showOthersPokers: function (num, index) {
        var pn = this._playerList[index].getChildByName("poker_num")
        pn.getChildByName("num").getComponent(cc.Label).string = num;
        if (!pn.active) {
            pn.active = true && !cc.vv.replayMgr.isReplay();
        }

    },
    removePokers: function (a, b) { // 差集 a - b
        var map = {};
        for (var i = 0; i < b.length; i++) {
            var poker = b[i];
            var pname = pokerLogic.getCardName(poker)
            map[pname] = poker;
        }
        var flag = true;
        while (flag) {
            var index = -1;
            for (var i = 0; i < a.length; i++) {
                var poker = a[i];
                var pname = pokerLogic.getCardName(poker)
                if (map[pname]) {
                    index = i;
                    flag = true;
                    break;
                }
            }

            if (index == -1)
                flag = false;
            else
                var dp = a.splice(index, 1);
        }
    },
    replayInit: function () {
        var seats = cc.vv.gameNetMgr.seats;
        this.prepareRoot.active = false;
        this.gameRoot.active = true;
        this._readySp.active = false;
        this._btnPosition.active = false;
        cc.find("Canvas/btn_voice").active = false;
        for (var i = 0; i < seats.length; i++) {
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
            var localPokers = seats[i].holds;

            pokerLogic.sortNum_big(localPokers);
            var reNode = this._replayList[localIndex];

            this.showOutPokers(localPokers, reNode, localIndex);
            reNode.active = true;

            var pn = this._playerList[localIndex].getChildByName("poker_num");
            if (pn) {
                pn.active = false;
            }

        }
    },

    sync: function (data) {
        var self = this;
        var state = cc.vv.gameNetMgr.gamestate;
        if (state == "") return;
        if (cc.vv.replayMgr.isReplay()) return;
        var myNodeScript = this.pokerNode.getComponent('MyNodeScript');

        var seats = cc.vv.gameNetMgr.seats;
        var turn = cc.vv.gameNetMgr.turn;
        var turnLocal = cc.vv.gameNetMgr.getLocalIndex(turn);
        var landLord = cc.vv.gameNetMgr.landLord;
        this.prepareRoot.active = false;
        this.gameRoot.active = true;
        this._readySp.active = false;
        this._diNode.active = true;
        this.gameTimes.string = "当前倍数 x" + cc.vv.gameNetMgr.gameTimes;
        this._zongDifen.string = "底分:" + cc.vv.gameNetMgr.difen;
        this.changeTimer(cc.vv.gameNetMgr.turn);
        var tdata = [];

        for (var i = 0; i < seats.length; i++) {
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
            if (localIndex == 0) {
                var localPokers = seats[i].holds;
                pokerLogic.sortNum_big(localPokers);
            } else {
                var pokerNum = seats[i].pokerNum;
                this.showOthersPokers(pokerNum, localIndex)
            }
            if (state == "play" && i != turn) {
                console.log(" outpokers ==== " + seats[i].outPokers)
                var outPokers = seats[i].outPokers;
                if (outPokers != null && outPokers) {
                    var data = {
                        index: i,
                        pokerList: outPokers,
                        ispass: seats[i].ispass,
                    }
                    tdata.push(data);
                }
            }
            if (seats[i].isqiang == 4) {
                this._playerList[localIndex].getChildByName("jiabei_logo").active = true;
            }
            if (state == "qiangdizhu" && seats[i].isqiang != -1) {
                var nameArr = ["fen1", "fen2", "fen3", "bujiao", "jiabei", "bujiabei"];
                var name = nameArr[seats[i].isqiang];
                this.addSprite(this._dnList[localIndex], name)
            }
        }
        if (state == "qiangdizhu") {
            if (cc.vv.gameNetMgr.landLord != -1) {
            }
            if (turnLocal == 0) {
                cc.vv.selectPokers = [];
                this.showQzdBtn(turn)
                
            }
        }
        if (state == "play") {
            var pList = this._diNode.children;
            var diPokers = cc.vv.gameNetMgr.diPokers;
            setTimeout(function () {

            }, 100)
            var lordIndex = cc.vv.gameNetMgr.getLocalIndex(landLord);
            var player = self._playerList[lordIndex];
            var dzLogo = player.getChildByName("dz_logo");
            dzLogo.active = true;
            if (turnLocal == 0) {
                if (cc.vv.selectPokers.length > 0) {
                    cc.vv.selectPokers.splice(0, cc.vv.selectPokers.length);
                }
                this.showPlayButton(cc.vv.gameNetMgr.isFirstPoker)
            }

        }
        setTimeout(function () {
            myNodeScript.displayPokers(localPokers, self.pokerAtlas);
            if (state == "play") {
                for (var i = 0; i < pList.length; i++) {
                    var p = pokerLogic.getCardName(diPokers[i])
                    pList[i].getComponent(cc.Sprite).spriteFrame = self.pokerAtlas.getSpriteFrame(p);
                }
                if (tdata.length > 0) {
                    for (var j = 0; j < tdata.length; j++) {
                        self.updateOutPokers(tdata[j]);
                    }
                }
            }

        }, 100)
    },
    onGameBeign: function (data) {
        if (cc.vv.gameNetMgr.gamestate == "") {
            return;
        } else if (cc.vv.gameNetMgr.gamestate == "begin") {
            this.gameRoot.active = true;
            this.prepareRoot.active = false;
            this._zongDifen.string = "底分:0"
            this.gameTimes.string = "当前倍数 x1"
            for (var i = 0; i < 3; i++) {
                this._dnList[i].destroyAllChildren()
            }
        }
    },

    //发起准备
    readyCallback: function (event) {
        console.log("玩家点准备了 == " + cc.vv.gameNetMgr.gamestate)
        if (cc.vv.gameNetMgr.gamestate != "") {
            this._readySp.active = false;
            return;
        }
        this.clear();
        this._readySp.active = false;
        cc.vv.net.send(("ready"));
    },
    clear: function () {
        for (var i = 0; i < 3; i++) {
            this._dnList[i].active = false;
        }
        if (this._timeId) {
            clearInterval(this._timeId);
            this._timeId = null;
        }
        this._diNode.active = false;
        for (var j = 0; j < 3; j++) {
            var player = this._playerList[j];
            var dzLogo = player.getChildByName("dz_logo");
            dzLogo.active = false;
            var jiabeiLogo = player.getChildByName("jiabei_logo");
            jiabeiLogo.active = false;
            var poker_num = player.getChildByName("poker_num")
            var dn = this._dnList[j];
            dn.destroyAllChildren();
            if (poker_num) {
                poker_num.active = false;
            }
            player.getChildByName("show").active = false;
            if (cc.vv.gameNetMgr.isPeep) {
                var reNode = this._replayList[j];
                reNode.active = false;
                reNode.destroyAllChildren();
            }
        }
        if (cc.vv.gameNetMgr.gamestate == "") {
            this.gameRoot.getChildByName("pokers").destroyAllChildren();
            cc.vv.selectPokers.splice(0, cc.vv.selectPokers.length);
        }
        this.gameTimes.string = "";
        this._zongDifen.string = "";
        cc.vv.gameNetMgr.isPeep = false;
    },

    onDestroy: function () {
        if (cc.vv) {
            cc.vv.gameNetMgr.clear();
        }
    },

    getLocalIndex: function (index) {
        var ret = (index - cc.vv.gameNetMgr.seatIndex + 6) % 6;
        return ret;
    },
    initSendCard: function () {
        //创建并添加节点
        this._sendCard = new cc.Node();
        this.gameRoot.getChildByName("scp").addChild(this._sendCard);
        this._sendCard.active = false;
        this._sendCard.setScale(0);
        this._sendNum = 0;
        var self = this;
        self._sendCard.addComponent(cc.Sprite).spriteFrame = this.cardBg;
    },
    deal2: function () {
        var self = this;
        if (!this.tempPL) {
            this.tempPL = [];
            var pList = self._diNode.children;
            for (var j = 0; j < pList.length; j++) {
                pList[j].active = false;
            }
        }
        if (cc.vv.sendCardData[0]) {
            var temp = cc.vv.sendCardData[0];
            cc.vv.sendCardData.splice(0, 1);
            var audioUrl = "other/deal";
            cc.vv.audioMgr.playSFX(audioUrl);
            this.sendCard(temp.seatIndex, temp.cardIndex, temp.pai, function () {
                self.deal2();
            });
        } else {
            var holds = cc.vv.gameNetMgr.seats[cc.vv.gameNetMgr.seatIndex].holds;
            pokerLogic.sortNum_big(holds);
            var myNodeScript = self.pokerNode.getComponent('MyNodeScript');
            myNodeScript.displayPokers(holds, self.pokerAtlas);
            this.tempPL = null;
            cc.vv.net.send("show_qzd_btn")
        }
    },
    sendCard: function (seatIndex, cardIndex, cardData, callback) {
        var self = this;
        var scale = 0.5;
        if (seatIndex == 4) {
            var pos = this._diNode;
        } else {
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
            if (localIndex == 0) {
                scale = 0.8;
            }
            var pos = this._playerList[localIndex].getChildByName("poker_num");
        }
        var pt = pos.getPosition();
        pt = pos.convertToWorldSpaceAR(cc.v2(0, 0));
        pt = cc.v2(pt.x - 640, pt.y - 360); //360
        this.sendCardAnimation(cc.v2(0, 0), pt, scale, function () { //40 ...170
            if(seatIndex == 4){
                var pList = self._diNode.children;
                self._diNode.active = true;
                pList[cardIndex].getComponent(cc.Sprite).spriteFrame = self.cardBg;
                pList[cardIndex].active = true;
            }
            else{
                if (localIndex == 0) {
                    self.tempPL.push(cardData);
                    var myNodeScript = self.pokerNode.getComponent('MyNodeScript');
                    myNodeScript.displayPokers(self.tempPL, self.pokerAtlas);
                } else {
                    self.showOthersPokers(cardIndex, localIndex);
                }
            }
            if (callback) {
                callback();
            }

        });
    },
    sendCardAnimation: function (from, to, scale, callback) {
        this._sendCard.stopAllActions(); //!!
        this._sendCard.setPosition(from);
        this._sendCard.active = true;
        var action = cc.sequence(
            // cc.delayTime(0.01),
            cc.moveTo(0.01, to.x, to.y),
            // cc.scaleTo(0.05, scale, scale),
            cc.callFunc(function (target) {
                target.active = false;
                if (callback) {
                    callback();
                }
            }, this, null)
        );
        this._sendCard.runAction(action);
    },

    changeTimer: function (turn) {
        var self = this;
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(turn);
        for (var i = 0; i < this._huangKuangList.length; i++) {
            this._huangKuangList[i].active = false;
            this._playerList[i].getChildByName("clock").active = false;
        }
        this._huangKuangList[localIndex].active = true;
        this._playerList[localIndex].getChildByName("clock").active = true && !cc.vv.replayMgr.isReplay();
        let shanguang = this._huangKuangList[localIndex].getComponent("shanguang");
        shanguang.setOriginal();
    },

    jiaodizhuCallback: function (event, customEventData) {
        var isqiang = customEventData;
        this.node.getChildByName("qdzBtn").active = false;
        this.node.getChildByName("jiabei").active = false;
        cc.vv.net.send("doQdz", {
            isqiang: isqiang,
        });
    },

    sendPeep: function () {
        if (cc.vv.replayMgr.isReplay()) return;
        cc.vv.net.send("check_peep_rights", {
            isPeep: cc.vv.gameNetMgr.isPeep
        });
    },
    doPeep: function (data) {
        var seats = cc.vv.gameNetMgr.seats;
        var pList = this._diNode.children;
        var dizhuPokers = data.diPokers;
        var state = data.state;
        if (cc.vv.gameNetMgr.isPeep) {
            for (var i = 0; i < 3; i++) {
                if (i != cc.vv.gameNetMgr.seatIndex && seats[i].userid > 0 && seats[i].holds.length > 0) {
                    var holds = seats[i].holds;
                    var localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
                    var reNode = this._replayList[localIndex];
                    this.showOutPokers(holds, reNode, localIndex);
                }
                if (state == "qiangdizhu") {
                    var p = pokerLogic.getCardName(dizhuPokers[i])
                    pList[i].getComponent(cc.Sprite).spriteFrame = this.pokerAtlas.getSpriteFrame(p);
                }
            }
        } else {
            for (var i = 0; i < 3; i++) {
                var localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
                var reNode = this._replayList[localIndex];
                reNode.destroyAllChildren();
                reNode.active = false;
                if (state == "qiangdizhu") {
                    pList[i].getComponent(cc.Sprite).spriteFrame = this.cardBg;
                }
            }
        }
    },
    // update: function (dt) {
    // }
});