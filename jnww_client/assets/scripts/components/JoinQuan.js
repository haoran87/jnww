const Buffer = require("buffer").Buffer;
cc.Class({
    extends: cc.Component,

    properties: {
        _inputIndex: 0,
        _createQuan: cc.Node,
        _circleTemp: null,
        circleContent: cc.Node,
        zhuoContent: cc.Node,
        memberContent: cc.Node,
        infoContent: cc.Node,
        zhuoScroll:cc.Node,
        memberScroll:cc.Node,
        _joincirecle: null,
        _quans: null,
        _zhuoTemp: null,
        _memberTemp: null,
        _peopleTemp: null,
        _quanStr: "",
        _getReTimer: null,
        _infoList: null,
        _infoTemp: null,
        btnMore: cc.Node,
        _quanTimer: null,
        _quanDowntime: 10,
        _interval: 10,
        _quanId: null,
        _quanZhu: null,
        _checkArr: null,
        nums: {
            default: [],
            type: [cc.Label]
        },
    },

    // use this for initialization
    onLoad: function () {
        // this._createRoom = cc.find("Canvas/CreateRoom");
        cc.vv.quan = this;
        this._circleTemp = this.circleContent.children[0];
        this.circleContent.removeChild(this._circleTemp);
        this._zhuoTemp = this.zhuoContent.children[0];
        this._memberTemp = this.memberContent.children[0];
        this.zhuoContent.removeChild(this._zhuoTemp);
        this.memberContent.removeChild(this._memberTemp);
        this._infoTemp = this.infoContent.children[0];
        this.infoContent.removeChild(this._infoTemp);
        this._createQuan = this.node.getChildByName("createQuan")
        if (cc.vv.userMgr.kong == 1) {
            this._createQuan.active = true;
        } else {
            this._createQuan.active = false;
        }
        this._createQuan.on("click", this.showCreateQuan, this);
        this._joincirecle = this.node.getChildByName("joinCircle");
        this._quans = this.node.getChildByName("quan");
        this._infoList = this.node.getChildByName("infoList");
        this.initQuan();
        this.getQuans(cc.vv.userMgr.userId);
        this.getReMessage();
    },
    showCreateQuan: function () {
        var self = this;
        var onGet = function (ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                cc.vv.userMgr.lv = ret.lv;
                cc.vv.userMgr.kong = ret.kong;
                if(ret.lv >= 2 && ret.kong == 1){
                    cc.find("Canvas/createQuan").active = true;
                }
                else{
                    self._createQuan.active = false;
                }
               
            }
        };

        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
        };
        cc.vv.http.sendRequest("/get_user_status", data, onGet.bind(this));
       
    },
    onEnable: function () {
        this.onResetClicked1();
    },
    
    onInputFinished: function (roomId) {

    },
    onInput: function (num) {
        if (this._inputIndex >= this.nums.length) {
            return;
        }
        this.nums[this._inputIndex].string = num;
        this._inputIndex += 1;
        this._quanStr += num;
    },
    onNumClicked:function(event,customEventData){
        cc.vv.audioMgr.playClicked(); 
        this.onInput(customEventData);
    },
   
    //  清楚换成了切换到创建房间
    onResetClicked: function () {
        cc.vv.audioMgr.playClicked(); 
        for (var i = 0; i < this.nums.length; ++i) {
            this.nums[i].string = " ";
        }
        this._inputIndex = 0;
        this._quanStr = "";
    },
    onResetClicked1: function () {
        for (var i = 0; i < this.nums.length; ++i) {
            this.nums[i].string = " ";
        }
        this._inputIndex = 0;
        this._quanStr = "";
    },
    onCreateRoom: function () {
        this._createRoom.active = true;
        this.node.active = false;
    },
    onDelClicked: function () {
        cc.vv.audioMgr.playClicked(); 
        if (this._inputIndex > 0) {
            this._inputIndex -= 1;
            this.nums[this._inputIndex].string = "";
            this._quanStr = this._quanStr.substr(0, this._quanStr.length - 1);
            console.log("删除时 圈== " + this._quanStr)
        }

    },
    onCloseQuan: function (event) {
        if(event && event.target.name == "close_btn"){
            cc.vv.audioMgr.playClicked(); 
        }
        this._quanId = null;
        this._quanZhu = null;
        this.node.active = false;
        // if (this._quanTimer) {
        //     clearInterval(this._quanTimer);
        //     this._quanTimer = null;
        // }
    },
    initQuan: function () {
        this._joincirecle.active = true;
        this._quans.active = false;
        this.btnMore.active = false;
    },
    parseRoomID: function () {
        var str = "";
        for (var i = 0; i < this.nums.length; ++i) {
            str += this.nums[i].string;
        }
        return str;
    },
    getQuans: function (userId,quanId) {
        var self = this;
        var onGet = function (ret) {
            if(ret.lv >= 2 && ret.kong == 1){
                cc.find("Canvas/adminButton/addGems").active = true;
                self._createQuan.active = true;
            }
            else{
                cc.find("Canvas/adminButton/agent").active = false;
                cc.find("Canvas/adminButton/addGems").active = false;
                self._createQuan.active = false;
            }
            if (ret.errcode == 0) {
                self.updateQuans(ret.data,quanId)
                cc.vv.userMgr.kong = ret.kong;
                cc.vv.userMgr.lv = ret.lv;
            } else {
                if (ret.errcode == 4) {
                    console.log("还没有圈子呢")
                    self.updateQuans(ret.data)
                    self.moreClicked();
                }
                if (ret.errcode == 11) {
                    cc.vv.userMgr.commission = 1;
                    self.onCloseQuan();
                    cc.vv.alert.show("提示", "你的号被禁止玩游戏了！");
                }
            }
        };
        var data = {
            userId: userId,
        }
        cc.vv.http.sendRequest("/get_quans", data, onGet)
    },
    updateQuans: function (quans,quanId) {
        if (!quans || quans.length == 0) {
            this.node.getChildByName("quanList").getChildByName("tip").active = true;
        }
        if (quans.length > 0) {
            this.node.getChildByName("quanList").getChildByName("tip").active = false;

        }
        var isexist = false;
        for (var i = 0; i < quans.length; i++) {
            var node = this.getViewItem(this.circleContent, i, this._circleTemp)
            node.getChildByName("name").getComponent(cc.Label).string = quans[i].name;
            node.getChildByName("id").getComponent(cc.Label).string = quans[i].id;
            node.getChildByName("num").getComponent(cc.Label).string = quans[i].num;
            if (this._quanId == quans[i].id) {
                isexist = true;
            }
        }
        if (!isexist) {
            this.moreClicked();
        }
        else if(quanId){
            if (this.zhuoScroll.active) {
                this.getZhuos(this._quanId)
            }
            else if(this.memberScroll.active){
                this.getMember()
            }
        }
        this.circleContent.height = this._circleTemp.height * quans.length
        this.shrinkContent(this.circleContent, quans.length);

    },
    getViewItem: function (content, index, tempNode, cNum) {
        if (content.childrenCount > index) {
            return content.children[index];
        }
        var node = cc.instantiate(tempNode);
        console.log("content.y =="+content.y)
        if (cNum) {
            var addw = 0
            if(cNum == 3){
                addw = 5
            }
            console.log("tempnode.y =="+tempNode.y)
            node.y = tempNode.y - (tempNode.height+addw) * Math.floor(index / cNum);
            console.log("node.y =="+node.y)
            node.x = tempNode.x + (tempNode.width+addw) * (index % cNum);
        } else {
            node.y = tempNode.y - tempNode.height * index;
        }
        content.addChild(node);
        console.log("content.y =="+content.y)
        return node;
    },
    shrinkContent: function (content, num) {
        while (content.childrenCount > num) {
            var lastOne = content.children[content.childrenCount - 1];
            content.removeChild(lastOne, true);
        }
    },
    quanClick: function (event) {
        var id = event.target.getChildByName("id").getComponent(cc.Label).string;
        cc.vv.net.send("join_quan_user_list",{quanId:id,userId:cc.vv.userMgr.userId})
        this.getZhuos(id)
    },
    getZhuos: function (id) {
        var self = this;
        this._quanId = id;
        var onGet = function (ret) {
            if (ret.errcode == 0) {
                var rData = ret.zhuos;
                var quanName = ret.quanName;
                var gems = ret.gems;
                self._quanZhu = ret.quanZhu;
                self.updateZhuos(rData, quanName, gems);
            } else {
                cc.vv.alert.show("提示", "获取圈子信息错误 errcode = " + ret.errcode)
            }
        }
        var data = {
            quanId: id,
        }
        cc.vv.http.sendRequest("/get_zhuos", data, onGet)
    },
    updateZhuos: function (zhuos, quanName, gems) {
        this.memberScroll.active = false;
        this.zhuoScroll.active = true;
        this._quans.getChildByName("zhuoBtns").active = true;
        this._quans.getChildByName("reExit").active = cc.vv.userMgr.userId != this._quanZhu;
        this._quans.getChildByName("memberBtns").active = false;
        this._quans.getChildByName("quanName").getComponent(cc.Label).string = quanName;
        this._quans.getChildByName("fkLabel").getComponent(cc.Label).string = gems;
        this._quans.getChildByName("zhuoBtns").getChildByName("btn_history").active = cc.vv.userMgr.userId == this._quanZhu;
        this._quans.getChildByName("zhuoBtns").getChildByName("btn_members").active = cc.vv.userMgr.userId == this._quanZhu;
        if (zhuos.length == 0) {
            this._quans.getChildByName("tip").active = true;
            this.zhuoContent.height = this._zhuoTemp.height
        } else {
            this._quans.getChildByName("tip").active = false;
            for (var i = 0; i < zhuos.length; i++) {
                var zhuo = zhuos[i];
                var node = this.getViewItem(this.zhuoContent, i, this._zhuoTemp, 3);
                var info = JSON.parse(zhuo.base_info);
                if (info.type == "ddz") {
                    var type = "斗地主";
                } else {
                    var type = "麻将";
                }
                var wanfa = "三炸封顶";
                if (info.max == 1) {
                    wanfa = "四炸封顶";
                }
                if (info.max == 2) {
                    wanfa = "炸不封顶"
                }
                node.getChildByName("type").getComponent(cc.Label).string = type;
                node.getChildByName("wanfa").getComponent(cc.Label).string = wanfa;
                node.getChildByName("id").getComponent(cc.Label).string = zhuo.id;
                node.getChildByName("status").getComponent(cc.Label).string = zhuo.isStart == 0 ? "等待中" : "进行中";
                if(zhuo.isStart){
                    node.getChildByName("ju").getComponent(cc.Label).string = zhuo.num_of_turns+1+"/"+info.maxGames + "局";
                }
                else{
                    node.getChildByName("ju").getComponent(cc.Label).string = info.maxGames + "局";
                }
                node.roomId = zhuo.id;
                var childs = node.getChildByName("seats").children;
                for (var k = 0; k < childs.length; k++) {
                    var s = childs[k].getComponent("ImageLoader");
                    var nameLabel = childs[k].getChildByName("name").getComponent(cc.Label);
                    var uId = "user_id" + k;
                    var uName = "user_name"+k
                    if (zhuo[uId] > 0) {
                        s.setUserID(zhuo[uId]);
                        childs[k].active = true;
                        nameLabel.string = new Buffer(zhuo[uName], 'base64').toString();
                    } else {
                        childs[k].active = false;
                        nameLabel.string = " "
                    }

                }
            }
            this.zhuoContent.height = this._zhuoTemp.height * (Math.floor(zhuos.length / 3) + 1)+300;
        }
        this.shrinkContent(this.zhuoContent, zhuos.length);
        this._joincirecle.active = false;
        this._quans.active = true;
        this.btnMore.active = true;
    },
    checkQuan: function () {
        var self = this;
        if (this._quanStr.length == 0) {
            cc.vv.alert.show("提示", "请输入你查找的圈子")
            return
        }
        if (this._quanStr.length < 7) {
            cc.vv.alert.show("提示", "没有你查找的圈子")
            return;
        }
        if (this._quanStr.length == 7) {
            var onGet = function (ret) {
                if (ret.errcode == 0) {
                    cc.vv.alert.show("提示", "是否申请！", self.sendReMessage.bind(self), true)
                } else if (ret.errcode == 4) {
                    cc.vv.alert.show("提示", "圈子不存在")
                } else if (ret.errcode == 2) {
                    cc.vv.alert.show("提示", "你已经在该圈了")
                } else if (ret.errcode == 3) {
                    cc.vv.alert.show("提示", "审核当中！请联系群主加快速度")
                }

            };
            var data = {
                quanId: this._quanStr,
                userId: cc.vv.userMgr.userId,
                isok: 1,
            }
            cc.vv.http.sendRequest("/request_to_quan", data, onGet)
        }
        // if(this._)
    },
    reExit(event,customEventData){
        var self = this;
        cc.vv.alert.show("提示", "确定退出这个圈？", function(){
            self.sendReMessage(event,customEventData);
        }, true)
    },
    sendReMessage: function (event, customEventData) {
        var self = this;
        var num = 2;
        var qid = this._quanStr;
        if (customEventData == 4) {
            num = 4;
            qid = this._quanId;
        }
        var data = {
            quanId: qid,
            userId: cc.vv.userMgr.userId,
            isok: num,
        }
        var onGet = function (ret) {
            console.log("接收到申请返回的消息" + ret.errcode)
            if (ret.errcode == 0) {
                if(num == 4){
                    cc.vv.alert.show("提示", "已经退出该圈了！")
                    console.log("申请退出返回的 信息 =="+ret.quans)
                    self.updateQuans(ret.data);
                    self.moreClicked();
                }else{
                    cc.vv.alert.show("提示", "已经发送申请消息，请联系圈主尽快处理")
                }
               
            }
            if (ret.errcode == 666) {
                cc.vv.alert.show("提示", "正在申请退出，请联系圈主处理")
            }
            if (ret.errcode == 777) {
                cc.vv.alert.show("提示", "申请退出被拒绝")
            }
            if (ret.errcode == 888) {
                cc.vv.alert.show("提示", '同意退出该群')
            }
        }
        cc.vv.http.sendRequest("/request_to_quan", data, onGet)
    },
    getReMessage: function () {
        var self = this;
        var data = {
            userId: cc.vv.userMgr.userId,
        }
        var onGet = function (ret) {
            if (ret.errcode == 0) {
                console.log("获取申请记录成功= " + JSON.stringify(ret.mData))
                var data = ret.mData;
                self.updateInfoList(data)
            }
        }
        cc.vv.http.sendRequest("/get_re_message", data, onGet)
    },
    updateInfoList: function (data) {
        console.log("updateinfolist 执行了")
        if (data.length == 0) {
            this._infoList.getChildByName("tip").active = true;
        } else {
            this._infoList.getChildByName("tip").active = false;
            var kong = cc.vv.userMgr.kong
            var newsNode = this.node.getChildByName("message").getChildByName("newShow");
            for (var i = 0; i < data.length; i++) {
                var info = data[i]
                info.altname = new Buffer(info.altname, 'base64').toString();
                var node = this.getViewItem(this.infoContent, i, this._infoTemp);
                node.getChildByName("name").getComponent(cc.Label).string = info.quanname;
                node.getChildByName("id").getComponent(cc.Label).string = info.quanid;
                node.getChildByName("applicant").getComponent(cc.Label).string = info.altname;
                if (kong == 0 && (info.status != 8)) {
                    if (!this._infoList.active && !newsNode.active && (info.status == 1 || info.status == 2 || info.status == 5 || info.status == 6)) {
                        newsNode.active = true;
                    }
                    node.getChildByName("confirm").active = false;
                    node.getChildByName("refuse").active = false;
                    // node.getChildByName("yes").active = true;
                    var su = "已同意加入";
                    if (info.status == 2) {
                        su = "已拒绝加入"
                    }
                    if (info.status == 5) {
                        su = "已同意退出"
                    }
                    if (info.status == 6) {
                        su = "已拒绝退出"
                    }
                    if (info.status == 0) {
                        su = "加入审核中"
                    }
                    if (info.status == 4) {
                        su = "退出审核中"
                    }
                    node.getChildByName("status").getComponent(cc.Label).string = su;
                }
                if (kong == 1) {
                    if (info.creator == cc.vv.userMgr.userId && (info.status == 0 || info.status == 4)) {
                        if (!newsNode.active && !this._infoList.active) {
                            newsNode.active = true;
                        }
                        node.getChildByName("confirm").active = true;
                        node.getChildByName("confirm").quanInfo = info;
                        node.getChildByName("refuse").active = true;
                        node.getChildByName("refuse").quanInfo = info;
                        // node.getChildByName("yes").active = false;
                        if (info.status == 0) {
                            var istr = "申请加入"
                        } else if (info.status == 4) {
                            var istr = "申请退出"
                        }
                        node.getChildByName("status").getComponent(cc.Label).string = istr;
                    }
                    if (info.applicant == cc.vv.userMgr.userId && info.status != 8) {
                        if (!this._infoList.active && !newsNode.active && (info.status == 1 || info.status == 2 || info.status == 5 || info.status == 6)) {
                            newsNode.active = true;
                        }
                        node.getChildByName("confirm").active = false;
                        node.getChildByName("refuse").active = false;
                        // node.getChildByName("yes").active = true;
                        var su = "已同意加入";
                        if (info.status == 2) {
                            su = "已拒绝加入"
                        }
                        if (info.status == 5) {
                            su = "已同意退出"
                        }
                        if (info.status == 6) {
                            su = "已拒绝退出"
                        }
                        if (info.status == 0) {
                            su = "加入审核中"
                        }
                        if (info.status == 4) {
                            su = "退出审核中"
                        }
                        node.getChildByName("status").getComponent(cc.Label).string = su;
                    }
                }
            }
            this.infoContent.height = this._infoTemp.height * data.length;
        }
        this.shrinkContent(this.infoContent, data.length);
    },
    closeInfoNode: function () {
        var self = this;
        this._infoList.active = false;
        // this.setQuanTimer();
        var onGet = function (ret) {
            if (ret.errcode == 0) {
                console.log("更改状态成功")
                self.getReMessage()
            } else {
                console.log("更改状态失败")
            }
        }
        cc.vv.http.sendRequest("/change_quan_message_status", {
            userId: cc.vv.userMgr.userId
        }, onGet)
    },
    showInfoNode: function () {
        var newsNode = this.node.getChildByName("message").getChildByName("newShow");
        this._infoList.active = true;
        if (newsNode.active) {
            newsNode.active = false;
        }
        // if (this._quanTimer) {
        //     clearInterval(this._quanTimer);
        //     this._quanTimer = null;
        // }
    },
    infoClicked: function (event, customEventData) {
        var self = this;
        var node = event.target;
        var data = {
            quanInfo: JSON.stringify(node.quanInfo),
            result: customEventData,
        }
        var onGet = function (ret) {
            if (ret.errcode == 0) {
                cc.vv.alert.show("提示", ret.errmsg)
                self.getReMessage()
            }
            
        };
        cc.vv.http.sendRequest("/answer_re_quan", data, onGet)
    },
    moreClicked: function () {
        this.btnMore.active = false;
        this._joincirecle.active = true;
        this._quans.active = false;
        this._quanId = null;
        this._quanZhu = null;
    },
    zhuoClicked: function (event) {
        console.log("点击桌进入的房间 == " + event.target.roomId)
        var roomId = event.target.roomId;
        cc.vv.userMgr.enterRoom(roomId,true)
    },
    getMember: function () {
        var self = this;
        var data = {
            quanId: this._quanId,
        }
        var onGet = function (ret) {
            if (ret.errcode == 0) {
                var data = JSON.parse(ret.mData);
                self.updateMembers(data);
            } else {
                cc.vv.alert.show("提示", "获取全成员信息失败！")
            }
        }
        cc.vv.http.sendRequest("/get_quan_member", data, onGet)
    },
    updateMembers: function (data) {
        this.zhuoScroll.active = false;
        this.memberScroll.active = true;
        this._checkArr = [];
        this._quans.getChildByName("tip").active = false;
        this._quans.getChildByName("zhuoBtns").active = false;
        var idle = this._quanZhu == cc.vv.userMgr.userId;
        this._quans.getChildByName("reExit").active = !idle;
        this._quans.getChildByName("memberBtns").active = idle;
        for (var i = 0; i < data.length; i++) {
            var mem = data[i];
            var node = this.getViewItem(this.memberContent, i, this._memberTemp, 5);
            var icon = node.getChildByName("icon").getComponent("ImageLoader");
            icon.setUserID(mem.userId);
            var name = node.getChildByName("name").getComponent(cc.Label);
            var testnnn = new Buffer(mem.name, 'base64').toString();
            if (testnnn == "") {
                testnnn = mem.name
            }
            name.string = testnnn;
            if (this._quanZhu != cc.vv.userMgr.userId) {
                node.getComponent(cc.Toggle).interactable = false;
            } else {
                node.info = mem.userId;
                node.getComponent(cc.Toggle).interactable = true;
                node.getComponent(cc.Toggle).isChecked = false;
            }
            if (mem.userId == this._quanZhu) {
                node.getChildByName("qzlogo").active = true;
                node.getComponent(cc.Toggle).interactable = false;
            }

        }
        this.memberContent.height = this._memberTemp.height * (Math.floor(data.length / 5) + 1)
        this.shrinkContent(this.memberContent, data.length);
        this._joincirecle.active = false;
        this._quans.active = true;
        this.btnMore.active = true;
    },
    checkMembers: function (event) {
        var ischecked = event.target.getComponent(cc.Toggle).isChecked;
        if (ischecked) {
            this._checkArr.push(event.target.info);
        } else {
            for (var i = 0; i < this._checkArr.length; i++) {
                if (this._checkArr[i] == event.target.info) {
                    this._checkArr.splice(i, 1);
                    break;
                }
            }
        }
    },
    tipFunc: function (event, customEventData) {
        var self = this;
        if (customEventData == 12) {
            if (this._checkArr.length == 0){
                cc.vv.alert.show("提示","请选中要删除的圈子成员")
                return
            } ;
            cc.vv.alert.show("提示", "是否要删除成员", self.clearMembers.bind(self), true)
        }
        if (customEventData == 11) {
            cc.vv.alert.show("提示", "是否要删除圈子", self.clearQuan.bind(self), true)
        }
    },
    clearMembers: function () {
        var self = this;
        var data = {
            memberArr: JSON.stringify(this._checkArr),
            quanId: this._quanId,
        }
        var onResult = function (ret) {
            if (ret.errcode == 0) {
                cc.vv.alert.show("提示", "删除成功!")
                self.getMember();
            }
        }
        cc.vv.http.sendRequest("/clear_quan_members", data, onResult)
    },
    clearQuan: function () {
        var self = this;
        if (!this._quanId) return;
        var data = {
            quanId: this._quanId,
            userId: cc.vv.userMgr.userId,
        }
        var onResult = function (ret) {
            if (ret.errcode == 0) {
                cc.vv.alert.show("提示", "删除圈子成功!");
                self.moreClicked();
                self.getQuans(cc.vv.userMgr.userId)
            } else {
                if (ret.errcode == 1) {
                    cc.vv.alert.show("提示", "删除圈子成功!");
                }
                if (ret.errcode == 2) {
                    cc.vv.alert.show("提示", "你不能删除圈子");
                }
                if (ret.errcode == 3) {
                    cc.vv.alert.show("提示", "删除圈子失败!");
                }
            }
        }
        cc.vv.http.sendRequest("/delete_quan", data, onResult)
    },
    addMembersFunc: function () {
        cc.find("Canvas/addMembers").active = true;
    },
    getQuanHistory: function () {
        var quanId = this._quanId
        this.onCloseQuan();
        cc.vv.userMgr.getHistoryList(quanId, function (data) {
            if (data == null) {
                cc.vv.history.shrinkContent(0);
                cc.vv.history._emptyTip.active = true;
                cc.vv.history._history.active = true;
                return;
            }
            data.sort(function (a, b) {
                return b.time - a.time;
            });
            cc.vv.history._historyData = data;
            for (var i = 0; i < data.length; ++i) {
                for (var j = 0; j < 3; ++j) {
                    var s = data[i].seats[j];
                    if (s.userid > 0) {
                        s.name = new Buffer(s.name, 'base64').toString();
                    }
                }
            }
            cc.vv.history.initRoomHistoryList(data);
            cc.sys.localStorage.setItem("quanHistory", quanId);
        });
    },
});