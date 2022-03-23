cc.Class({
    extends: cc.Component,

    properties: {
        _reconnect: null,
        _lblTip: null,
        _loadingImage: null,
        _lastPing: 0,
    },

    onLoad: function () {
        this._reconnect = cc.find("Canvas/reconnect");
        this._loadingImage = cc.find("Canvas/reconnect/loading_image");
        var self = this;
        var fnTestServerOn = function () {
            cc.vv.net.test(function (ret) {
                if (ret) {
                    var roomId = cc.vv.userMgr.oldRoomId;
                    if (roomId != null) {
                        cc.vv.userMgr.oldRoomId = null;
                        cc.vv.userMgr.enterRoom(roomId);
                    }
                    else{
                        cc.game.restart();
                        cc.audioEngine.stopAll();
                    }
                } else{
                    self._reconnect.active = false;
                    if (cc.vv.gameNetMgr.conf.type == "ddz") {
                        cc.vv.alert.show("提示", "检测到您的网络异常，需要重连", function () {
                            cc.game.restart();
                            cc.audioEngine.stopAll();
                        })
                    } 
                }
            });
        }

        var fn = function (data) {
            self.node.off('reconnect', fn);
            self._reconnect.active = true;
            fnTestServerOn();
        };
        this.node.on('reconnect', fn);
    },
    update: function (dt) {
        if (this._reconnect.active) {
            this._loadingImage.angle = this._loadingImage.angle - dt * 45;
        }
    },
});