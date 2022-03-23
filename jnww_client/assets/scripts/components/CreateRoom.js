import { isNullOrUndefined } from "util";

cc.Class({
    extends: cc.Component,
    //创建房间
    properties: {
        //局数   
        _roundList: null,
        _maxList: null,
        checkedMemory:null,
    },

    // use this for initialization
    onLoad: function () {
        this._roundList = [];
        this._maxList = [];
        var rules = this.node.getChildByName("rules");
        var btn_close = this.node.getChildByName("btn_close");
        var btn_create = this.node.getChildByName("btn_create");
        btn_close.on("click", this.closeCallback, this);
        btn_create.on("click", this.creatRoom, this);
        //局数 
        var round = rules.getChildByName("round");
        for (var i = 0; i < round.childrenCount; i++) {
            var checkBox = round.children[i].getComponent(cc.Toggle);
            if (checkBox != null) {
                this._roundList.push(checkBox);
            }
        }
        //炸
        var max = rules.getChildByName("max");
        for (var i = 0; i < max.childrenCount; i++) {
            var checkBox = max.children[i].getComponent(cc.Toggle);
            if (checkBox != null) {
                this._maxList.push(checkBox);
            }
        }
    },
    onEnable(){
        this.initStatus()
    },
    initStatus: function (event) {
        var checkedInfo = cc.sys.localStorage.getItem("checkedInfo");
        if (checkedInfo) {
            checkedInfo = JSON.parse(checkedInfo);
            if(this.checkedMemory == null){
                this.checkedMemory = checkedInfo;
            }
            var roundIndex = checkedInfo.round;
            if (this._roundList.length > 0) {
                for (var i = 0; i < this._roundList.length; i++) {
                    if (i == roundIndex) {
                        this._roundList[i].isChecked = true;
                    } else {
                        this._roundList[i].isChecked = false;
                    }
                }
            }
            var maxIndex = checkedInfo.max;
            if(this._maxList.length > 0){
                for (var i = 0; i < this._maxList.length; i++) {
                    if (i == maxIndex) {
                        this._maxList[i].isChecked = true;
                    } else {
                        this._maxList[i].isChecked = false;
                    }
                }
            }
        }
        else{
            if(this.checkedMemory == null){
                this.checkedMemory = {
                    round:1,
                    max:2,
                }
            }
        }

    },

    closeCallback: function (event) {
        this.node.active = false;
        cc.vv.audioMgr.playClicked(); 
    },
    //创建房间
    creatRoom: function (event) {
        cc.vv.audioMgr.playClicked(); 
        var quanId = -1;
        var quanZhu = -1;
        if (cc.vv.quan && cc.vv.quan._quanId) {
            quanId = cc.vv.quan._quanId;
            quanZhu = cc.vv.quan._quanZhu;
        }
        this.node.getChildByName("btn_create").getComponent(cc.Button).interactable = false;
        var self = this;
        var type = "ddz";
        var fee = 0;
        var conf = {
            type: type,
            jushu: this.checkedMemory.round,
            fee: fee,
            max: this.checkedMemory.max,
            kong: false,
        }
        cc.vv.anysdkMgr.getMapInfo();
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            mapInfo: cc.vv.mapInfo,
            conf: JSON.stringify(conf),
            quanId: quanId,
            quanZhu: quanZhu,
        }
        cc.vv.wc.show("正在创建房间");
        cc.vv.http.sendRequest("/create_private_room", data, self.onCreate.bind(self));
    },
    onCreate: function (ret) {
        if (ret.errcode !== 0) {
            cc.vv.wc.hide();
            if (ret.errcode == -10) {
                this.node.active = false;
                return;
            }
            if (ret.errcode == 2222) {
                cc.vv.alert.show("提示", "房卡不够，创建房间失败!");
            } else if (ret.errcode == 11) {
                cc.vv.userMgr.commission = 1;
                cc.vv.alert.show("提示", "你的号被禁止玩游戏了！");
            } else if (ret.errcode == -11) {
                cc.vv.alert.show("提示", "已在房卡模式游戏内");
            } else if (ret.errcode == -12) {
                cc.vv.alert.show("提示", "已在金币模式游戏内");
            } else if (ret.errcode == 110) {
                cc.vv.alert.show("提示", "群主没房卡了！");
            } else {
                cc.vv.alert.show("提示", "创建房间失败,错误码:" + ret.errcode);
            }
        } else {
            if (cc.vv.quan && cc.vv.quan._quanId) {
                cc.vv.quan.onCloseQuan();
                cc.vv.quan._quanId = null;
                cc.vv.quan._quanZhu = null;
                cc.vv.quan = null;
            }
            cc.vv.net.close()
            cc.vv.net.loginData = ret;
            cc.vv.gameNetMgr.connectGameServer(ret);

        }
    },
    onChecked(event,customEventData){
        var name = event.target.parent.name;
        this.checkedMemory[name] = Number(customEventData);
        cc.sys.localStorage.setItem("checkedInfo", JSON.stringify( this.checkedMemory));
    },

});