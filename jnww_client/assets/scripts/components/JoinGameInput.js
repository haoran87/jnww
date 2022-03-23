cc.Class({
    extends: cc.Component,

    properties: {
        _inputIndex: 0,
        nums: {
            default: [],
            type: [cc.Node]
        },
    },

    onLoad: function () {

    },
    onEnable(){
        this.onResetClicked();
    },
    onInputFinished: function (roomId) {
        cc.vv.userMgr.enterRoom(roomId,true)
        // cc.vv.userMgr.enterRoom(roomId, function (ret) {
        //     if (ret.errcode == 0) {
        //         this.node.active = false;
        //     } else {
        //         var content = "房间[" + roomId + "]不存在，请重新输入!";
        //         if (ret.errcode == 4) {
        //             content = "房间[" + roomId + "]已满!";
        //             cc.vv.alert.show("提示", content);
        //         } else if (ret.errcode == 5) {
        //             content = "房间[" + roomId + "]游戏已经开始!";
        //             cc.vv.alert.show("提示", content);
        //         } else if (ret.errcode == 2222) {
        //             content = "房卡不够，加入房间失败!";
        //             cc.vv.alert.show("提示", content);
        //         } else if (ret.errcode == 11) {
        //             cc.vv.Hall.addReferee.active = true;
        //         }
        //     }
        //     this.onResetClicked();
        // }.bind(this));
        // var onEnter = function (ret) {
        //     if (ret.errcode != 0) {
        //         cc.vv.wc.hide();
        //         if (ret.errcode == -1) {
        //             setTimeout(function () {
        //                 self.enterRoom(roomId, callback);
        //             }, 5000);
        //         } else if (ret.errcode == 66) {
        //             cc.vv.alert.show("提示", "已在房卡模式游戏 房间号：" + ret.roomid);
        //         } else if (ret.errcode == 77) {
        //             cc.vv.alert.show("提示", "已在金币模式游戏");
        //         } else if (ret.errcode == 123) {
        //             cc.vv.alert.show("提示", "你不是这个圈子里的人");
        //         } else if (ret.errcode == 456) {
        //             var curScene = cc.director.getScene().name;
        //             if (curScene == "hall") {
        //                cc.vv.alert.show("提示", "房间不存在");
        //             }else if(curScene == "niuniu"){
        //                 cc.vv.QuanNetMgr.connectQuanServer();
        //             }
        //         } else if (ret.errcode == 11) {
        //             cc.vv.userMgr.commission = 1;
        //             cc.vv.alert.show("提示", "你的号被禁止玩游戏了！");
        //         } 
        //         else if (ret.errcode == 4) {
        //             cc.vv.alert.show("提示", "房间已满！！");
        //         } else {
        //             cc.vv.QuanNetMgr.connectQuanServer();
        //         }
        //     } else {
        //         if (cc.vv.quan && cc.vv.quan._quanId) {
        //             cc.vv.quan.onCloseQuan();
        //             cc.vv.quan._quanId = null;
        //             cc.vv.quan._quanZhu = null;
        //             cc.vv.quan = null;
        //         }
        //         cc.vv.gameNetMgr.connectGameServer(ret);
        //     }
        // };
        // cc.vv.anysdkMgr.getMapInfo();
        // var data = {
        //     account: cc.vv.userMgr.account,
        //     sign: cc.vv.userMgr.sign,
        //     roomid: roomId,
        //     mapInfo: cc.vv.mapInfo,
        // };
        // cc.vv.wc.show("正在进入房间" + roomId);
        // cc.vv.http.sendRequest("/enter_private_room", data, onEnter);
    },
    onInput: function (num) {
        if (this._inputIndex >= this.nums.length) {
            return;
        }
        this.nums[this._inputIndex].getComponent(cc.Label).string = num;
        this._inputIndex += 1;

        if (this._inputIndex == this.nums.length) {
            var roomId = this.parseRoomID();
            this.onInputFinished(roomId);
        }
    },
    onNumClicked:function(event,customEventData){
        var num = Number(customEventData);
        cc.vv.audioMgr.playClicked(); 
        this.onInput(num);
    },
    onResetClicked: function (event) {
       if(event && event.target.name == "reset"){
        cc.vv.audioMgr.playClicked(); 
       }
        for (var i = 0; i < this.nums.length; ++i) {
            this.nums[i].getComponent(cc.Label).string = " ";
        }
        this._inputIndex = 0;
    },
    onDelClicked: function (event) {
        cc.vv.audioMgr.playClicked(); 
        if (this._inputIndex > 0) {
            this._inputIndex -= 1;
            this.nums[this._inputIndex].getComponent(cc.Label).string = " ";
        }
    },
    onCloseClicked: function () {
        cc.vv.audioMgr.playClicked(); 
        this.node.active = false;
    },
    parseRoomID: function () {
        var str = "";
        for (var i = 0; i < this.nums.length; ++i) {
            str += this.nums[i].getComponent(cc.Label).string;
        }
        return str;
    }
});