cc.Class({
    extends: cc.Component,

    properties: {

    },
    initHandlers: function () {
        var self = this;
        cc.vv.net.addHandler("login_quan", function (data) {
            console.log("要加载或更新hall场景了");
            var curScene = cc.director.getScene().name;
            if(curScene != "hall"){
                cc.director.loadScene("hall");
            }
            else{
                cc.vv.Hall.refreshInfo();
                if (!cc.vv.quan) return;
                if (!cc.vv.Hall.joinFriendCircle.active) return;
                cc.vv.quan.getQuans(cc.vv.userMgr.userId,cc.vv.quan._quanId);
            }
            
        });
        cc.vv.net.addHandler("change_user_gems_result", function (data) {
            if (data.code == 1) {
                cc.vv.userMgr.kong = 0;
                cc.vv.userMgr.lv = 1;
                cc.find("Canvas/adminButton/agent").active = false;
                cc.find("Canvas/adminButton/addGems").active = false;
                cc.vv.AdminDo.node.active = false;
            } else {
                cc.vv.userMgr.gems = data.dGems;
                cc.vv.Hall.lblGems.getComponent(cc.Label).string = data.dGems;
                if (data.code == 2) {
                    cc.vv.AdminDo.doCancel()
                }
            }
            if (data.code != 3) {
                cc.vv.alert.show("提示", data.msg);
                cc.vv.AdminDo.doX = true
            }

        });

        cc.vv.net.addHandler("change_user_rights_result", function (data) {
            if (!data.code) {
                cc.vv.alert.show("提示", data.msg);
            } else if (data.code == 1) {
                cc.find("Canvas/adminButton/addGems").active = false;
            } else if (data.code == 2) {
                cc.find("Canvas/adminButton/addGems").active = true;
            }
        });
        cc.vv.net.addHandler("request_to_quan_result", function (data) {
            if (!cc.vv.quan) return;
            if (!cc.vv.Hall.joinFriendCircle.active) return;
            console.log("申请信息传导这了")
            cc.vv.quan.getReMessage();
            if (data && data.code == 1) {
                cc.vv.quan.getQuans(cc.vv.userMgr.userId);
            }
        });
        cc.vv.net.addHandler("update_quan_info", function (data) {
            if (!cc.vv.quan) return;
            if (!cc.vv.Hall.joinFriendCircle.active) return;
            if (cc.vv.quan.zhuoScroll.active && cc.vv.quan._quanId == data.quanId) {
                console.log("玩家在圈子里获得桌子信息")
                cc.vv.quan.getQuans(cc.vv.userMgr.userId,data.quanId);
            }
        });
        cc.vv.net.addHandler("clear_user_from_quan", function (data) {
            if (!cc.vv.quan) return;
            if (!cc.vv.Hall.joinFriendCircle.active) return;
            cc.vv.quan.getQuans(cc.vv.userMgr.userId);
        });
        cc.vv.net.addHandler("add_user_in_quan", function (data) {
            if (!cc.vv.quan) return;
            if (!cc.vv.Hall.joinFriendCircle.active) return;
            cc.vv.quan.getQuans(cc.vv.userMgr.userId);
        });
        cc.vv.net.addHandler("update_quanzhu_gems", function (data) {
            var curScene = cc.director.getScene().name;
            if(curScene == "hall"){
                cc.vv.Hall.refreshInfo();
            }
           
        });
    },
    connectQuanServer: function () {
        cc.vv.net.ip = cc.vv.http.hallNetIP;
        var onConnectOK = function () {
            console.log("quan 连接好了   ");
            cc.vv.net.send("loginQuan", {
                userId: cc.vv.userMgr.userId
            });
        };
        var onConnectFailed = function () {
            console.log(" quan connect failed.");

        };
        console.log("圈准备连接  ")
        cc.vv.net.connect(onConnectOK, onConnectFailed);
    },
    disconnectQuanServer:function(){
             var curScene = cc.director.getScene().name;
            if(curScene == "hall"){
                if(cc.vv.net.loginData){
                    cc.vv.gameNetMgr.connectGameServer(cc.vv.net.loginData);
                }
                console.log("hall断开连接"+cc.vv.net.ip)
                if(cc.vv.net.ip == "youxi.17kuaileqp.com:9998"){
                    var arr = cc.vv.net.ip.split(':');
                    var data = {
                        account: cc.vv.userMgr.account,
                        sign: cc.vv.userMgr.sign,
                        userId: cc.vv.userMgr.userId,
                        ip: arr[0],
                        port: arr[1],
                    }
                    cc.vv.http.sendRequest("/is_server_online", data, function(ret){
                       if(ret.isonline){
                         self.connectGameServer(cc.vv.net.loginData)
                       }
                       else{
                            cc.game.restart();
                            cc.audioEngine.stopAll();  
                       }
                    });
                   
                }
               return;
            }
    },
});