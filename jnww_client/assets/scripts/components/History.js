const Buffer = require("buffer").Buffer; //20180122 添加

cc.Class({
    extends: cc.Component,

    properties: {
        HistoryItemPrefab: {
            default: null,
            type: cc.Prefab,
        },
        _history: null,
        _viewlist: null,
        _content: null,
        _viewitemTemp: null,
        _historyData: null,
        _curRoomInfo: null,
        _emptyTip: null,
        _factData: null,
        _backNum: null,
    },
    onLoad: function () {
        cc.vv.history = this;
    },
    start(){
        this._history = this.node.getChildByName("history");
        this._history.active = false;

        this._emptyTip = this._history.getChildByName("emptyTip");
        this._emptyTip.active = true;

        this._viewlist = this._history.getChildByName("viewlist");
        this._content = cc.find("view/content", this._viewlist);

        this._viewitemTemp = this._content.children[0];
        this._content.removeChild(this._viewitemTemp);

        var node = cc.find("Canvas/right_bottom/btn_zhanji");
        this.addClickEvent(node,this.node,"History","onBtnHistoryClicked");//带房卡模式

        var node = cc.find("Canvas/history/btn_back");
        this.addClickEvent(node, this.node, "History", "onBtnBackClicked");
    },
    addClickEvent: function (node, target, component, handler) {
        var eventHandler = new cc.Component.EventHandler();
        eventHandler.target = target;
        eventHandler.component = component;
        eventHandler.handler = handler;
        var clickEvents = node.getComponent(cc.Button).clickEvents;
        clickEvents.push(eventHandler);
    },

    onBtnBackClicked: function () {
        cc.vv.audioMgr.playClicked(); 
        if (this._backNum == null) {
            this._historyData = null;
            this._history.active = false;
            cc.sys.localStorage.removeItem("quanHistory");
        } else {
            this.initRoomHistoryList(this._historyData);
            cc.sys.localStorage.removeItem("roomInfo");
        }
    },

    onBtnHistoryClicked: function () {
        cc.vv.audioMgr.playClicked(); 
        var self = this;
        cc.vv.userMgr.getHistoryList(-1,function (data) {
            if (data == null) {
                self.shrinkContent(0);
                self._emptyTip.active = true;
                self._history.active = true;
                return;
            }
            data.sort(function (a, b) {
                return b.time - a.time;
            });
            self._historyData = data;
            for (var i = 0; i < data.length; ++i) {
                for (var j = 0; j < 3; ++j) {
                    var s = data[i].seats[j];
                    if (s.userid > 0) {
                        s.name = new Buffer(s.name, 'base64').toString();
                    }
                }
            }
            self.initRoomHistoryList(data, 1);
        });
    },

    dateFormat: function (time) {
        var date = new Date(time);
        var datetime = "{0}-{1}-{2} \n {3}:{4}:{5}";
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        month = month >= 10 ? month : ("0" + month);
        var day = date.getDate();
        day = day >= 10 ? day : ("0" + day);
        var h = date.getHours();
        h = h >= 10 ? h : ("0" + h);
        var m = date.getMinutes();
        m = m >= 10 ? m : ("0" + m);
        var s = date.getSeconds();
        s = s >= 10 ? s : ("0" + s);
        datetime = datetime.format(year, month, day, h, m, s);
        return datetime;
    },

    initRoomHistoryList: function (data) {
        for (var i = 0; i < data.length; ++i) {
            var node = this.getViewItem(i);
            node.idx = i;
            var datetime = this.dateFormat(data[i].time * 1000);
            node.getChildByName("time").getComponent(cc.Label).string = datetime;

            var btnOp = node.getChildByName("btnOp");
            btnOp.idx = i;
            var btnHuifang = node.getChildByName("btnHuifang");
            btnHuifang.active = false;
            node.getChildByName("roomNo").getComponent(cc.Label).string = data[i].id;
            node.getChildByName("juNo").active = false;
            btnOp.active = true;
            for (var j = 0; j < 3; ++j) {
                var s = data[i].seats[j];
                var info = node.getChildByName("info" + j);
                var name = info.getChildByName('name').getComponent(cc.Label);
                var id = info.getChildByName('id').getComponent(cc.Label);
                var score = info.getChildByName('score').getComponent(cc.Label);
                if (s.userid > 0) {
                    name.string = s.name;
                    id.string = 'ID:' + s.userid;
                    score.string = s.score>0?"+"+s.score:s.score;
                } else {
                    name.string = '';
                    id.string = '';
                    score.string = '';
                }
            }
        }
        this._emptyTip.active = data.length == 0;
        this._history.active = true;
        this.shrinkContent(data.length);
        this._curRoomInfo = null;
        this._backNum = null;
    },

    initGameHistoryList: function (roomInfo, data) {
        data.sort(function (a, b) {
            return a.create_time - b.create_time;
        });
        for (var i = 0; i < data.length; ++i) {
            var node = this.getViewItem(i);
            var idx = data[i].game_index;
            node.idx = idx;
            node.getChildByName("roomNo").getComponent(cc.Label).string = roomInfo.id;
            var datetime = this.dateFormat(data[i].create_time * 1000);
            node.getChildByName("time").getComponent(cc.Label).string = datetime;
            node.getChildByName("juNo").active = true;
            node.getChildByName("juNo").getComponent(cc.Label).string = "第"+idx+"局";
            var btnOp = node.getChildByName("btnOp");
            var btnHuifang = node.getChildByName("btnHuifang");
            btnHuifang.idx = idx;
            btnOp.active = false;
            btnHuifang.active = true;

            var result = JSON.parse(data[i].result);
            for (var j = 0; j < 3; ++j) {
                var s = roomInfo.seats[j];
                var info = node.getChildByName("info" + j);
                var name = info.getChildByName('name').getComponent(cc.Label);
                var id = info.getChildByName('id').getComponent(cc.Label);
                var score = info.getChildByName('score').getComponent(cc.Label);
                if (s.userid > 0) {
                    name.string = s.name;
                    id.string = 'ID:' + s.userid;
                    score.string = result[j]>0?"+"+result[j]:result[j];
                } else {
                    name.string = '';
                    id.string = '';
                    score.string = '';
                }
            }
        }
        this.shrinkContent(data.length);
        this._curRoomInfo = roomInfo;
        this._backNum = 1;
    },

    getViewItem: function (index) {
        var content = this._content;
        if (content.childrenCount > index) {
            return content.children[index];
        }
        var node = cc.instantiate(this._viewitemTemp);
        content.addChild(node);
        return node;
    },
    shrinkContent: function (num) {
        while (this._content.childrenCount > num) {
            var lastOne = this._content.children[this._content.childrenCount - 1];
            this._content.removeChild(lastOne, true);
        }
    },

    getGameListOfRoom: function (idx) {
        var self = this;
        var roomInfo = this._historyData[idx];
        cc.sys.localStorage.setItem("roomInfo", idx);
        cc.vv.userMgr.getGamesOfRoom(roomInfo.uuid, function (data) {
            if (data != null && data.length > 0) {
                self.initGameHistoryList(roomInfo, data);
            }
        });
    },

    getDetailOfGame: function (idx) {
        var self = this;
        var roomUUID = this._curRoomInfo.uuid;
        cc.vv.userMgr.getDetailOfGame(roomUUID, idx, function (data) {
            console.log("接收到回放返回结果")
            data.base_info = JSON.parse(data.base_info);
            data.action_records = JSON.parse(data.action_records);
            cc.vv.gameNetMgr.prepareReplay(self._curRoomInfo, data);
            cc.vv.replayMgr.init(data);
            cc.director.loadScene("niuniu");
        });
    },

    onViewItemClicked: function (event) {
        var idx = event.target.idx;
        console.log(idx);
        if (this._curRoomInfo == null) {
            this.getGameListOfRoom(idx);
        } else {
            this.getDetailOfGame(idx);
        }
        cc.vv.audioMgr.playClicked(); 
    },

    onBtnOpClicked: function (event) {
        var idx = event.target.parent.idx;
        console.log(idx);
        if (this._curRoomInfo == null) {
            this.getGameListOfRoom(idx);
        } else {
            this.getDetailOfGame(idx);
        }
    },
});