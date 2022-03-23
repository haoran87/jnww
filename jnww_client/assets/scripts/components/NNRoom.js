cc.Class({
    extends: cc.Component,

    properties: {
        lblRoomNo: {
            default: null,
            type: cc.Label
        },
        _seats: [],
        _seats2: [],
        _timeLabel: null,
        _voiceMsgQueue: [],
        _lastPlayingSeat: null,
        _playingSeat: null,
        _lastPlayTime: null,
    },

    // use this for initialization
    onLoad: function () {
        if (cc.vv == null) {
            return;
        }
        cc.vv.room = this;
        this.addComponent("TimePointer");
    },
    start(){
        this.initView();
        this.initSeats();
        this.initEventHandlers();
    },
    initView: function () {
        var prepare = this.node.getChildByName("prepare");
        var seats = prepare.getChildByName("seats");
        for (var i = 0; i < seats.children.length; ++i) {
            this._seats.push(seats.children[i].getComponent("Seat"));
        }
        this.refreshBtns();
        this.lblRoomNo = cc.find("Canvas/infobar/Z_room_txt/New Label").getComponent(cc.Label);
        this._timeLabel = cc.find("Canvas/infobar/time").getComponent(cc.Label);
        this.lblRoomNo.string = cc.vv.gameNetMgr.roomId;

        var gameChild = this.node.getChildByName("game");
        for (var i = 0; i < 3; ++i) {
            var player_name = "player_" + i;
            var sideNode = gameChild.getChildByName(player_name);
            var seat = sideNode.getChildByName("seat");
            this._seats2.push(seat.getComponent("Seat"));
        }

        var btnWechat = cc.find("Canvas/prepare/btnWeichat");
        if (btnWechat) {
            cc.vv.utils.addClickEvent(btnWechat, this.node, "MJRoom", "onBtnWeichatClicked");
        }


    },
    clearDaily:function(){
        this.gameErr.getComponent(cc.Label).string = "1"
        cc.sys.localStorage.setItem("gameerr","1")
    },
    refreshBtns: function () {
        var prepare = this.node.getChildByName("prepare");
        var btnExit = prepare.getChildByName("btnExit");
        var btnDispress = prepare.getChildByName("btnDissolve");
        var btnWeichat = prepare.getChildByName("btnWeichat");
        var btnCopyRoom = prepare.getChildByName("btnCopyRoom");
        var isIdle = cc.vv.gameNetMgr.numOfGames == 0;

        btnExit.active = !cc.vv.gameNetMgr.isOwner() && isIdle;
        btnDispress.active = cc.vv.gameNetMgr.isOwner() && isIdle ;
        btnWeichat.active = isIdle;
        btnCopyRoom.active = isIdle;
    },

    initEventHandlers: function () {
        var self = this;
        this.node.on('new_user', function (data) {
            self.initSingleSeat(data);
        });
        this.node.on('user_state_changed', function (data) {
            console.log("user state change1111111111"+JSON.stringify(data))
            self.initSingleSeat(data);
        });

        this.node.on('game_begin', function (data) {
            self.refreshBtns();
            self.initSeats();
        });

        this.node.on('game_num', function (data) {
            self.refreshBtns();
        });


        this.node.on('game_over', function (data) {
            self.changeScore();
        });
        this.node.on('voice_msg', function (data) {
            var data = data;
            self._voiceMsgQueue.push(data);
            self.playVoice();
        });

        this.node.on('chat_push', function (data) {
            var data = data;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndex(idx);
            self._seats[localIdx].chat(data.content);
            self._seats2[localIdx].chat(data.content);
        });

        this.node.on('quick_chat_push', function (data) {
            var data = data;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndex(idx);

            var index = data.content;
            var info = cc.vv.chat.getQuickChatInfo(index);
            self._seats[localIdx].chat(info.content);
            self._seats2[localIdx].chat(info.content);

            cc.vv.audioMgr.playSFX(info.sound);
        });

        this.node.on('emoji_push', function (data) {
            var data = data;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndex(idx);
            self._seats[localIdx].emoji(data.content);
            self._seats2[localIdx].emoji(data.content);
        });

    },

    initSeats: function () {
        var seats = cc.vv.gameNetMgr.seats;
        for (var i = 0; i < seats.length; ++i) {
            this.initSingleSeat(seats[i]);
        }
    },

    initSingleSeat: function (seat) {
        var index = cc.vv.gameNetMgr.getLocalIndex(seat.seatindex);
        var isOffline = !seat.online;
        if (cc.vv.replayMgr.isReplay()) isOffline = false;
        var ready = seat.ready;
        if (cc.vv.replayMgr.isReplay()) {
            ready = false;
        }
        this._seats[index].setInfo(seat.name, seat.score);
        this._seats[index].setReady(ready);
        this._seats[index].setOffline(isOffline);
        this._seats[index].setID(seat.userid);
        this._seats[index].voiceMsg(false);

        this._seats2[index].setInfo(seat.name, seat.score);
        this._seats2[index].setReady(ready);
        this._seats2[index].setOffline(isOffline);
        this._seats2[index].setID(seat.userid);
        this._seats2[index].voiceMsg(false);
        this._seats2[index].refreshXuanPaiState();
    },

    changeScore: function () {
        var seats = cc.vv.gameNetMgr.seats;
        for (var i = 0; i < seats.length; i++) {
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
            this._seats2[localIndex].setInfo(seats[i].name, seats[i].score);
        }
    },
    onBtnSettingsClicked: function (event) {
        if(event.target.name == "btn_menu"){
            var menu = event.target;
            for(var i = 0 ; i<menu.children.length;i++){
                menu.children[i].active = true;
            }
        }
        if(event.target.name == "btn_menu_close"){
            var menu = event.target.parent;
            for(var i = 0 ; i<menu.children.length;i++){
                menu.children[i].active = false;
            }
        }
        if(event.target.name == "btn_settings"){
            cc.vv.popupMgr.showSettings();
        }
    },


    onBtnWeichatClicked: function () {
         if (cc.vv.gameNetMgr.conf.type == "ddz") {
            if(cc.vv.gameNetMgr.conf.quanId){
                var coStr = "房间号："+cc.vv.gameNetMgr.roomId+"\n 亲友圈 "+ cc.vv.gameNetMgr.maxNumOfGames+'局 '+ cc.vv.gameNetMgr.getWanfa()
            }
            else{
                var coStr = "房间号："+cc.vv.gameNetMgr.roomId+"\n"+ cc.vv.gameNetMgr.maxNumOfGames+'局 '+ cc.vv.gameNetMgr.getWanfa()
            }
            cc.vv.anysdkMgr.share("【旺旺棋牌-斗地主】", coStr,2);
        }

    },
    onBtnCopyRoomClicked: function () {
        if (cc.vv.gameNetMgr.conf.type == "ddz") {
           if(cc.vv.gameNetMgr.conf.quanId){
               var coStr = "【旺旺棋牌-斗地主】\n房间号："+cc.vv.gameNetMgr.roomId+"\n 亲友圈 "+ cc.vv.gameNetMgr.maxNumOfGames+'局 '+ cc.vv.gameNetMgr.getWanfa()
           }
           else{
               var coStr = "【旺旺棋牌-斗地主】\n房间号："+cc.vv.gameNetMgr.roomId+"\n"+ cc.vv.gameNetMgr.maxNumOfGames+'局 '+ cc.vv.gameNetMgr.getWanfa()
           }
           cc.vv.anysdkMgr.JsCopy(coStr)
       }
   },
    onBtnDissolveClicked: function () {
        cc.vv.alert.show("解散房间", "解散房间不扣房卡，是否确定解散？", function () {
            cc.vv.net.send("dispress");
        }, true);
    },

    onBtnExit: function () {
        cc.vv.net.send("exit");
    },

    playVoice: function () {
        if (this._playingSeat == null && this._voiceMsgQueue.length) {
            console.log("playVoice2");
            var data = this._voiceMsgQueue.shift();
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(idx);
            this._playingSeat = localIndex;
            this._seats[localIndex].voiceMsg(true);
            this._seats2[localIndex].voiceMsg(true);

            var msgInfo = JSON.parse(data.content);

            var msgfile = "voicemsg.amr";
            console.log(msgInfo.msg.length);
            cc.vv.voiceMgr.writeVoice(msgfile, msgInfo.msg);
            cc.vv.voiceMgr.play(msgfile);
            this._lastPlayTime = Date.now() + msgInfo.time;
        }
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        var minutes = Math.floor(Date.now() / 1000 / 60);
        if (this._lastMinute != minutes) {
            this._lastMinute = minutes;
            var date = new Date();
            var h = date.getHours();
            h = h < 10 ? "0" + h : h;

            var m = date.getMinutes();
            m = m < 10 ? "0" + m : m;
            if (this._timeLabel) {
                this._timeLabel.string = "" + h + ":" + m;
            }
        }

        if (this._lastPlayTime != null) {
            if (Date.now() > this._lastPlayTime + 200) {
                this.onPlayerOver();
                this._lastPlayTime = null;
            }
        } else {
            this.playVoice();
        }
    },


    onPlayerOver: function () {
        cc.vv.audioMgr.resumeAll();
        console.log("onPlayCallback:" + this._playingSeat);
        var localIndex = this._playingSeat;
        this._playingSeat = null;
        this._seats[localIndex].voiceMsg(false);
        this._seats2[localIndex].voiceMsg(false);
        console.log("播放语音结束")
    },

    onDestroy: function () {
        cc.vv.voiceMgr.stop();
    }
});