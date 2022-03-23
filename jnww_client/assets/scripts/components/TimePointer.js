cc.Class({
    extends: cc.Component,

    properties: {
        _timeLabel: null,
        _clock: null,
        _startDown: null,
        _startLabel: null,
        _time: 0,
        _type: null,
        _userId: null,
        _clockList: null,
    },

    // use this for initialization
    onLoad: function () {
        cc.vv.timepointer = this;
        var self = this;
        this._clockList = [];
        for (var i = 0; i < 3; i++) {
            var player_name = "player_" + i;
            var player = this.node.getChildByName("game").getChildByName(player_name);
            var clock = player.getChildByName("clock");
            this._clockList[this._clockList.length] = clock;
        }
       
        this.node.on("down_time", function (data) {
            console.log("定时器加载中1")
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(data.turn);
            self._clock = self._clockList[localIndex];
            self._timeLabel = self._clock.getChildByName("timeLabel").getComponent(cc.Label);
            self._time = data.downTime;
        });
        if (cc.vv.gameNetMgr.gameTimer) {
            console.log("定时器加载中2")
            cc.vv.gameNetMgr.gameTimer = false;
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(cc.vv.gameNetMgr.turn);
            self._clock = self._clockList[localIndex];
            self._timeLabel = self._clock.getChildByName("timeLabel").getComponent(cc.Label);
            self._time = cc.vv.gameNetMgr.gameDowntime;
        }
    },

    initPointer: function (num) {
        if (cc.vv == null) {
            return;
        }
        if (num == 1) {
            this._clock.active = true;
            this._startDown.active = false;
        } else {
            this._clock.active = false;
            this._startDown.active = true;
        }
    },
    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        if (this._time > 0) {
            this._time -= dt;
            var pre = "";
            if (this._time <= 0) {
                this._time = 0;
                // this._clock.active = false;
                // this._startDown.active = false;
            }

            var t = Math.ceil(this._time);
            if (t < 10) {
                pre = "0";
            }
            if (this._clock.active) {
                this._timeLabel.string = pre + t;
            }
            // else if (this._startDown.active) {
            //     this._startLabel.string = pre + t;
            // }
        }
    },
});