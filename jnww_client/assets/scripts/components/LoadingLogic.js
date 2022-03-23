cc.Class({
    extends: cc.Component,

    properties: {
        tipLabel: cc.Label,
        progress: cc.ProgressBar,
        _stateStr: '',
        _progress: 0.0,
        _isConnecting: false,
        _loadingImage: null,
    },
    onLoad: function () {
        cc.debug.setDisplayStats(false);//去左下角的显示数据
        if (!cc.sys.isNative && cc.sys.isMobile) {
            var cvs = this.node.getComponent(cc.Canvas);
            cvs.fitHeight = true;
            cvs.fitWidth = true;
        }
        this.initMgr();
        this.tipLabel.string = this._stateStr;
        this.checkVersion();
    },
    initMgr: function () {
        cc.vv = {};
        var UserMgr = require("UserMgr");
        cc.vv.userMgr = new UserMgr();

        var ReplayMgr = require("ReplayMgr");
        cc.vv.replayMgr = new ReplayMgr();

        cc.vv.http = require("HTTP");
        cc.vv.global = require("Global");
        cc.vv.net = require("Net");

        var GameNetMgr = require("GameNetMgr");
        cc.vv.gameNetMgr = new GameNetMgr();
        cc.vv.gameNetMgr.initHandlers();

        var QuanNetMgr = require("QuanNetMgr");
        cc.vv.QuanNetMgr = new QuanNetMgr();
        cc.vv.QuanNetMgr.initHandlers();

        var AnysdkMgr = require("AnysdkMgr");
        cc.vv.anysdkMgr = new AnysdkMgr();
        cc.vv.anysdkMgr.init();

        var VoiceMgr = require("VoiceMgr");
        cc.vv.voiceMgr = new VoiceMgr();
        cc.vv.voiceMgr.init();

        var AudioMgr = require("AudioMgr");
        cc.vv.audioMgr = new AudioMgr();
        cc.vv.audioMgr.init();

        var Utils = require("Utils");
        cc.vv.utils = new Utils();

        cc.args = this.urlParse();

        cc.vv.gameName = null;
        var ust = require("ust");
        cc.vv.ust = new ust();
        cc.vv.key = '~!@#$(*&^%$&$$@)';
        cc.vv.iv  = '#$%^#@&*(!@#*$#@';
        cc.vv.selectPokers = new Array();
        cc.vv.ishoutai = false;
        cc.vv.mapInfo = -1;
        cc.vv.pic = null;
        cc.vv.sendCardData = [];
        cc.vv.ver = "1.2.0000"
    },
    urlParse: function () {
        var params = {};
        if (window.location == null) {
            return params;
        }
        var name, value;
        var str = window.location.href; //取得整个地址栏
        var num = str.indexOf("?")
        str = str.substr(num + 1); //取得所有参数   stringvar.substr(start [, length ]

        var arr = str.split("&"); //各个参数放到数组里
        for (var i = 0; i < arr.length; i++) {
            num = arr[i].indexOf("=");
            if (num > 0) {
                name = arr[i].substring(0, num);
                value = arr[i].substr(num + 1);
                params[name] = value;
            }
        }
        return params;
    },
    checkVersion: function () {
        var self = this;
        var onGetVersion = function (ret) {
            if (ret.ver == null) {
                console.log("获取版本号错误");
            }
            else {
                cc.vv.SI = ret;
                if (ret.ver != cc.vv.ver) {
                    cc.vv.alert.show("提示", "软件版本低，点击重新下载！", function () {
                        var url = "http://houtai.17kuaileqp.com/fenxiang/index.html";
                        cc.sys.openURL(url);
                        cc.game.end();
                    })
                }
                else {
                    cc.director.preloadScene("hall");
                    // self.startPreloading();
                    self.onLoadComplete();
                }
            }
        };
        var xhr = null;
        var complete = false;
        var fnRequest = function () {
            self._isConnecting = true;
            self._stateStr = "";
            xhr = cc.vv.http.sendRequest("/get_serverinfo", null, function (ret) {
                if(ret){
                    xhr = null;
                    complete = true;
                    self._isConnecting = false;
                    self._stateStr = "";
                    self.tipLabel.string = self._stateStr;
                    onGetVersion(ret); 
                }
            });
            setTimeout(fn, 500);
        };

        var fn = function () {
            if (!complete) {
                if (xhr) {
                    xhr.abort();
                    self._stateStr = "";
                    setTimeout(function () {
                        fnRequest();
                    }, 500);
                } else {
                    fnRequest();
                }
            }
        };
        fn();
    },

    onBtnDownloadClicked: function () {
        cc.sys.openURL(cc.vv.SI.appweb);
    },
    startPreloading: function () {
        var self = this;
        this._stateStr = "";
        var loadTimer = null;
        // self.progress.node.active = true;
        // self.tipLabel.string = "0%";
        // self.progress.progress = 0;
        // cc.loader.loadResDir(
        //     "textures", 
        //     function () {
        //         console.log("加载资源总数 == "+this.totalCount)
        //             self._progress = this.completedCount / this.totalCount;
        //             if (loadTimer == null) {
        //                 loadTimer = setInterval(function () {
        //                     self.tipLabel.string = Math.floor(self._progress * 100) + "%";
        //                     self.progress.progress = self._progress;
        //                 }, 1);
        //             }
        //             if (self._progress == 1) {
        //                 clearInterval(loadTimer);
        //                 loadTimer = null;
        //             }
        //     },
        //     function (err, assets) {
        //         console.log("err =="+err)
        //         if(err == null){
        //             self.onLoadComplete();
        //         }
        //         else{
        //             self.tipLabel.string = "加载资源出错，请重新打开"
        //         } 
        //     }
        // );
    },

    onLoadComplete: function () {
        this._stateStr = "";
        // this.tipLabel.string = "100%";
        // this.progress.progress = 1;
        // cc.vv.anysdkMgr.getMapInfo();
        cc.director.loadScene("login");
        cc.loader.onComplete = null;
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        if (this._stateStr.length == 0) {
            return;
        }
        this.tipLabel.string = this._stateStr;
        if (this._isConnecting) {
            var t = Math.floor(Date.now() / 1000) % 4;
            for (var i = 0; i < t; ++i) {
                this.tipLabel.string += '.';
            }
        }
    }
});