cc.Class({
    extends: cc.Component,

    properties: {

        _isCapturing: false,
    },

    onLoad: function () {},

    init: function () {
        this.IOS_Wechat_API = "WXApiManager";
        this.IOS_Util_API = "UtilApi";
        this.IOS_AMap_API = "AMapManager";
        this.ANDROID_LibyxTools_API = "org/cocos2dx/javascript/LibyxTools";
        this.ANDROID_AMap_API = "org/cocos2dx/javascript/AMapManager";
        this.ANDROID_XL_API = "org/cocos2dx/javascript/MainActivity";
    },

    login: function () {
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            console.log("安卓微信登录！！")
            jsb.reflection.callStaticMethod(this.ANDROID_LibyxTools_API, "WX_OnLogin", "()V");

        } else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(this.IOS_Wechat_API, "doAuthLogin");
        } else {
            console.log("platform:" + cc.sys.os + " dosn't implement share.");
        }
    },

    share: function (title, desc) {
        cc.vv.shareType = 10;
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(this.ANDROID_LibyxTools_API, "WX_ShareToWx", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V", cc.vv.SI.appweb, title, desc);
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(this.IOS_Wechat_API, "WX_ShareToWx:title:description:", cc.vv.SI.appweb, title, description);
        } else {
            console.log("platform:" + cc.sys.os + " dosn't implement share.");
            this.onShareResp(0);
        }
    },
    // 分享到好友群
    shareFriendZone: function (title, desc) {
        console.log("分享到好友圈111 ")
        cc.vv.shareType = 20;
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            console.log("分享到好友圈222 ")
            jsb.reflection.callStaticMethod(this.ANDROID_LibyxTools_API, "WX_ShareToWxQzone", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V", cc.vv.SI.appweb, title, desc);
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(this.IOS_Wechat_API, "WX_ShareToWxQzone:title:description:", cc.vv.SI.appweb, title, description);
        } else {
            console.log("platform:" + cc.sys.os + " dosn't implement share.");
            this.onShareResp(0);
        }
    },

    shareResult: function (type) {
        if (this._isCapturing) {
            return;
        }
        var self = this;
        this._isCapturing = true;
        var node = cc.find("Canvas/game_result");
        var fn = function (fullPath) {
            if (jsb.fileUtils.isFileExist(fullPath)) {
                var height = 100;
                var scale = height / node.height;
                var width = Math.floor(node.width * scale);
                if (cc.sys.os == cc.sys.OS_ANDROID) {
                    jsb.reflection.callStaticMethod(self.ANDROID_LibyxTools_API, "WX_ShareImg", "(Ljava/lang/String;II)V", fullPath, width, height);

                } else if (cc.sys.os == cc.sys.OS_IOS) {
                    jsb.reflection.callStaticMethod(self.IOS_Wechat_API, "shareIMG:width:height:", fullPath, width, height);
                } else {
                    console.log("platform:" + cc.sys.os + " dosn't implement share.");
                }
                self._isCapturing = false;
            } else {
                tryTimes++;
                if (tryTimes > 10) {
                    console.log("time out...");
                    return;
                }
                setTimeout(fn, 50);
            }
        }
        let width = Math.floor(node.width);
        let height = Math.floor(node.height);
        if (CC_JSB) {
            let fileName = "result_share.jpg";
            let fullPath = jsb.fileUtils.getWritablePath() + fileName;
            if (jsb.fileUtils.isFileExist(fullPath)) {
                jsb.fileUtils.removeFile(fullPath);
            }
            let cameraNode = new cc.Node();
            cameraNode.parent = node;
            let camera = cameraNode.addComponent(cc.Camera);
            camera.cullingMask = 0xffffffff;
            let texture = new cc.RenderTexture();
            let gl = cc.game._renderContext;
            texture.initWithSize(width, height, gl.STENCIL_INDEX8);
            camera.targetTexture = texture;
            camera.render(node);
            let data = texture.readPixels();
            //以下代码将截图后默认倒置的图片回正
            let picData = new Uint8Array(width * height * 4);
            let rowBytes = width * 4;
            for (let row = 0; row < height; row++) {
                let srow = height - 1 - row;
                let start = Math.floor(srow * width * 4);
                let reStart = row * width * 4;
                // save the piexls data
                for (let i = 0; i < rowBytes; i++) {
                    picData[reStart + i] = data[start + i];
                }
            }
            //保存图片
            jsb.saveImageData(picData, width, height, fullPath);
            node.removeChild(camera);
            setTimeout(fn(fullPath), 50);
        }


    },

    onLoginResp: function (code) {
        var fn = function (ret) {
            if (ret.errcode == 0) {
                cc.sys.localStorage.setItem("wx_account", ret.account);
                cc.sys.localStorage.setItem("wx_sign", ret.sign);
            }
            cc.vv.userMgr.onAuth(ret);
        }
        cc.vv.http.sendRequest("/wechat_auth", {
            code: code,
            os: cc.sys.os
        }, fn);
    },
    wechatLoginResp: function (code) {
        var fn = function (ret) {
            if (ret.errcode == 0) {
                cc.sys.localStorage.setItem("wx_account", ret.account);
                cc.sys.localStorage.setItem("wx_sign", ret.sign);
            }
            cc.vv.userMgr.onAuth(ret);
        }
        cc.vv.http.sendRequest("/wechat_auth", {
            code: code,
            os: cc.sys.os
        }, fn);
    },

    onShareResp: function (resp) {
        var shareUI = cc.find('Canvas/shareUI');
        if (shareUI) {
            shareUI.active = false;
        }
        if (resp == 0) {
            var onGetResult = function (ret) {
                if (true) { //cc.vv.iOSPassed
                    if (cc.vv.shareType == 20) {
                        console.log("分享增房卡执行了");
                        if (ret.errcode == 200) {
                            cc.vv.alert.show('提示', '分享成功，恭喜您获得系统赠送的 2 张房卡！');
                            cc.vv.Hall.setGems(2);
                        } else if (ret.errcode == 201) {
                            cc.vv.alert.show('提示', '分享成功，您今天已经获得过房卡了。');
                        } else if (ret.errcode == 202) {
                            cc.vv.alert.show('提示', '系统错误');
                        }

                    } else {
                        // cc.vv.alert.show('提示', '分享成功。');
                    }
                }
            };
            if (cc.vv.shareType == 20) { //分享赠金币

            }
        } else {

        }
    },
    getPosInfo: function (locationStr) {
        cc.vv.mapInfo = JSON.stringify(locationStr);
    },
    getMapInfo: function () {
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            cc.vv.mapInfo = jsb.reflection.callStaticMethod(this.ANDROID_AMap_API, "getLocationStr", "()Ljava/lang/String;");
            if (cc.vv.mapInfo == -1) {
                var data = {
                    "longitude": "117.109581",
                    "latitude": "36.693084",
                    "country": "中国",
                    "province": "山东省",
                    "city": "济南市",
                    "citycode": "0531",
                    "district": "历下区",
                    "adcode": "370102",
                }
                var data1 = {
                    "longitude": "116.35", //经度
                    "latitude": "35.2605", //纬度
                    "country": "中国",
                    "province": "山东省",
                    "city": "济宁市",
                    "citycode": "0531",
                    "district": "桥头区",
                    "adcode": "370102",
                }
                var data2 = {
                    "longitude": "116.35",
                    "latitude": "35.26",
                    "country": "中国",
                    "province": "xx省",
                    "city": "xx市",
                    "citycode": "0000",
                    "district": "xx区",
                    "adcode": "370000",
                }
                data = JSON.stringify(data);
                data1 = JSON.stringify(data1);
                data2 = JSON.stringify(data2);
            } 
        }
        else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(this.IOS_AMap_API, "locate");
        }
    },
    JsCopy: function (str) {
        var self = this;
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            setTimeout(() => {
                jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "JavaCopy", "(Ljava/lang/String;)V", str);
                cc.vv.alert.show("提示", "复制成功!")
            }, 100)
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(this.IOS_Util_API, "copyToClipboard:", str);
            cc.vv.alert.show("提示", "复制成功!")
        }
    },

});