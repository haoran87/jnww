String.prototype.format = function (args) {
    if (arguments.length > 0) {
        var result = this;
        if (arguments.length == 1 && typeof (args) == "object") {
            for (var key in args) {
                var reg = new RegExp("({" + key + "})", "g");
                result = result.replace(reg, args[key]);
            }
        } else {
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[i] == undefined) {
                    return "";
                } else {
                    var reg = new RegExp("({[" + i + "]})", "g");
                    result = result.replace(reg, arguments[i]);
                }
            }
        }
        return result;
    } else {
        return this;
    }
};

cc.Class({
    extends: cc.Component,
    properties: {
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
        cc.vv.http.url = cc.vv.http.master_url;
        cc.vv.net.addHandler('push_need_create_role', function () {
            console.log("onLoad:push_need_create_role");
            cc.director.loadScene("createrole");
        });
        if (!cc.sys.isNative || cc.sys.os == cc.sys.OS_WINDOWS) {
            cc.find("Canvas/btn_yk").active = true;
        }
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, (event) => {
            switch (event.keyCode) {
                case cc.macro.KEY.back:
                    {
                        cc.vv.alert.show("提示", "是否确定退出登录？", function(){
                            cc.game.end();
                        }, true)
                    }
            }
        });
        if (cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS){
            cc.game.on(cc.game.EVENT_HIDE, function () {
                console.log("切换到后台 == ")
                var curScene = cc.director.getScene().name;
                if (cc.vv && !cc.vv.ishoutai) {
                    cc.vv.ishoutai = true;
                    if(cc.vv.net.netTimer){
                        clearInterval(cc.vv.net.netTimer);
                        cc.vv.net.netTimer = null;
                    }
                    if (cc.vv.net.sio && cc.vv.net.sio.connected) {
                        cc.vv.net.sio.connected = false;
                        cc.vv.net.sio.disconnect();
                        cc.vv.net.sio = null;
                    }
                }
            });
            cc.game.on(cc.game.EVENT_SHOW, function () {
                var curScene = cc.director.getScene().name;  
                console.log("切换到前台！！！")
                if (cc.vv && cc.vv.ishoutai) {
                    if(cc.sys.getNetworkType() == 0){
                        console.log("没有连接网络")
                        cc.vv.alert.show("提示", "检测到您的网络异常，需要重连", function () {
                            cc.game.restart();
                            cc.audioEngine.stopAll();
                        });
                        return;
                    }
                    cc.vv.ishoutai = false;
                    if (curScene == "hall") {
                        cc.vv.net.hallTest();
                    }else if(curScene == "niuniu"){ 
                        if(cc.vv.net.ip == cc.vv.http.gameNetIP){
                            cc.find("Canvas/reconnect").active = true;
                            cc.vv.net.test(function (ret) {
                                if (ret) {
                                    var roomId = cc.vv.gameNetMgr.roomId;
                                    console.log("后台转过来执行了0"+roomId)
                                    if (roomId != null) {
                                        cc.vv.gameNetMgr.roomId = null;
                                        cc.vv.userMgr.enterRoom(roomId);
                                    }
                                    else{
                                        console.log("后台转过来执行了1")
                                        cc.vv.QuanNetMgr.connectQuanServer();
                                        cc.find("Canvas/reconnect").active = false;
                                    }
                                }
                            });
                        }
                        else if(cc.vv.replayMgr.isReplay()){
                            
                        }
                        else{
                            console.log("游戏内的gamenet变了")
                            cc.game.restart();
                            cc.audioEngine.stopAll();
                        }
                    }
                    else {
                        return;
                    }
    
                }
    
            });
        }
      
    },

    
    onDestroy: function () {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, (event) => {
            switch (event.keyCode) {}
        });
    },
    start: function () {
        var account = cc.sys.localStorage.getItem("wx_account");
        var sign = cc.sys.localStorage.getItem("wx_sign");
        if (account != null && sign != null) {
            var ret = {
                errcode: 0,
                account: account,
                sign: sign
            }
            cc.vv.userMgr.onAuth(ret);
        }
    },

    onBtnQuickStartClicked: function () {
        cc.vv.audioMgr.playClicked(); 
        cc.vv.userMgr.guestAuth();  
    },

    onBtnWeichatClicked: function () {
        var self = this;
        var account = cc.sys.localStorage.getItem("wx_account");
        var sign = cc.sys.localStorage.getItem("wx_sign");
        if (account != null && sign != null)return;
        cc.vv.audioMgr.playClicked(); 
        cc.vv.anysdkMgr.login();  
    },
});