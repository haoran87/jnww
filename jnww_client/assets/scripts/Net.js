if (window.io == null) {
    window.io = require("socket-io");
}

var Global = cc.Class({
    extends: cc.Component,
    statics: {
        ip: "",
        sio: null,
        netTimer: null,
        isPinging: false,
        fnDisconnect: null,
        loginData: null,
        handlers: {},
        addHandler: function (event, fn) { //gameNetMgr调用
            if (this.handlers[event]) {
                return;
            }
            var handler = function (data) {
                if (event != "disconnect" && typeof (data) == "string") {
                    data = JSON.parse(data);
                }
                fn(data);
            };

            this.handlers[event] = handler;
            if (this.sio) {
                this.sio.on(event, handler);
            }
        },
        connect: function (fnConnect, fnError) {
            var self = this;
            var opts = {
                'reconnection': false,
                'force new connection': true,
                'transports': ['websocket', 'polling']
            }
            this.sio = window.io.connect(this.ip, opts);
            this.sio.on('reconnect', function (data) {
                console.log("socket重连了！！")
                console.log(data)
                console.log(data.reason)
            });
            this.sio.on('connect', function () {
                console.log("socket连接成功 连接状态 == " + self.sio.connected)
                if (!self.sio.connected) {
                    self.sio.connected = true;
                }
                self.startHearbeat();
                fnConnect();
            });

            this.sio.on('disconnect', function (data) {
                if (self.sio.connected) {
                    self.sio.connected = false;
                }
                console.log(self.sio.connected + "  net 接收到断开连接的消息 " + cc.vv.net.ip)
                self.close(true);
            });
            this.sio.on('connect_error', function (data) {
                console.log("socketio 连接错误 " + data)
            });
            this.sio.on('connect_timeout', function (data) {
                console.log("socketio 连接超时" + data)
            });
            this.sio.on('game_pong', function () {
                self.lastRecieveTime = Date.now();
            });
            for (var key in this.handlers) {
                var value = this.handlers[key];
                if (typeof (value) == "function") {
                    this.sio.on(key, value);
                    // if (key == 'disconnect') {
                    //     this.fnDisconnect = value;
                    // } else {

                    // }
                }
            }
        },

        startHearbeat: function () {
            this.lastRecieveTime = Date.now();
            var self = this;
            if (!self.netTimer) {
                self.netTimer = setInterval(function () {
                    if (self.sio) {
                        console.log("游戏持续链接"+cc.sys.getNetworkType());
                        if (Date.now() - self.lastRecieveTime > 10000) {
                            self.close("超时断开连接");
                            self.hallTest()
                        } else if (cc.sys.getNetworkType() == 0) {
                            cc.vv.alert.show("提示", "检测到您的网络异常，需要重连", function () {
                                cc.game.restart();
                                cc.audioEngine.stopAll();
                            });
                            return;
                        } else {
                            self.ping();
                        }
                    } else {
                        if (!cc.vv.ishoutai) {
                            clearInterval(self.netTimer);
                            self.netTimer = null;
                            self.hallTest()
                        }
                    }
                }, 1000);
            }
        },
        send: function (event, data) {
            if (this.sio.connected) {
                if (data != null && (typeof (data) == "object")) {
                    data = JSON.stringify(data);
                }
                this.sio.emit(event, data);
            }
        },

        ping: function () {
            this.send('game_ping');
        },
        close: function () {
            console.log('net close '+cc.sys.getNetworkType());
            if (this.sio && this.sio.connected) {
                if (this.netTimer) {
                    clearInterval(this.netTimer);
                    this.netTimer = null;
                }
                this.sio.connected = false;
                this.sio.disconnect();
                this.sio = null;
            } else if (this.sio && this.sio.connected === false) {
                if (cc.sys.getNetworkType() == 0) {
                    cc.vv.alert.show("提示", "检测到您的网络异常，需要重连", function () {
                        cc.game.restart();
                        cc.audioEngine.stopAll();
                    });
                    return;
                } else {
                    var curScene = cc.director.getScene().name;
                    if (curScene == "hall") {
                        this.hallTest();
                    } else if (curScene == "niuniu") {
                        cc.find("Canvas/reconnect").active = true
                        this.test(function (ret) {
                            if (ret) {
                                var roomId = cc.vv.userMgr.oldRoomId;
                                if (roomId != null) {
                                    cc.vv.userMgr.oldRoomId = null;
                                    cc.vv.userMgr.enterRoom(roomId);
                                } else {
                                    cc.game.restart();
                                    cc.audioEngine.stopAll();
                                }
                            } else {
                                cc.find("Canvas/reconnect").active = false;
                                if (cc.vv.gameNetMgr.conf.type == "ddz") {
                                    cc.vv.alert.show("提示", "检测到您的网络异常，需要重连!", function () {
                                        cc.game.restart();
                                        cc.audioEngine.stopAll();
                                    })
                                }
                            }
                        });
                    }
                }
            }

        },
        hallTest: function () {
            var self = this;
            if (cc.sys.getNetworkType() == 0) {
                console.log(" hallTest 没有连接网络")
                cc.vv.alert.show("提示", "检测到您的网络异常，需要重连", function () {
                    cc.game.restart();
                    cc.audioEngine.stopAll();
                });
                return;
            }
            if (cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS) {
                var curScene = cc.director.getScene().name;
                console.log("大厅断开了网络 " + cc.vv.net.ip)
                if (curScene != "hall" || cc.vv.net.ip != cc.vv.http.hallNetIP) {
                    return;
                }
                cc.vv.http.sendRequest("/is_hall_online", {}, function (ret) {
                    if (ret) {
                        cc.vv.QuanNetMgr.connectQuanServer();
                    } else {
                        cc.game.restart();
                        cc.audioEngine.stopAll();
                    }
                });
            }
        },
        test: function (fnResult) {
            if (cc.sys.getNetworkType() == 0) {
                console.log("test 没有连接网络")
                cc.vv.alert.show("提示", "检测到您的网络异常，需要重连", function () {
                    cc.game.restart();
                    cc.audioEngine.stopAll();
                });
                return;
            }
            var fn = function (ret) {
                fnResult(ret.isonline);
            }
            var arr = this.ip.split(':');
            var data = {
                account: cc.vv.userMgr.account,
                sign: cc.vv.userMgr.sign,
                userId: cc.vv.userMgr.userId,
                ip: arr[0],
                port: arr[1],
            }
            if (cc.vv.gameNetMgr.conf.type == "ddz") {
                cc.vv.http.sendRequest("/is_server_online", data, fn);
            }
        },
    },
});