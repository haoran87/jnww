var ACTION_QIANG = 1;
var ACTION_CHUPAI = 2;
// var ACTION_PENG = 3;
// var ACTION_GANG = 4;
// var ACTION_HU = 5;
// var ACTION_CHI = 7;


cc.Class({
    extends: cc.Component,

    properties: {
        _lastAction:null,
        _actionRecords:null,
        _currentIndex:0,
    },

    // use this for initialization
    onLoad: function () {

    },
    
    clear:function(){
        this._lastAction = null;
        this._actionRecords = null;
        this._currentIndex = 0;
    },
    
    init:function(data){//在history.js被调用
        this._actionRecords = data.action_records;
        if(this._actionRecords == null){
            this._actionRecords = {};
        }
        this._currentIndex = 0;
        this._lastAction = null;
    },
    
    isReplay:function(){
        return this._actionRecords != null;    
    },
    
    getNextAction:function(){
        if(this._currentIndex >= this._actionRecords.length){
            return null;
        }
        var actionInfo = this._actionRecords[this._currentIndex++];
        return actionInfo;
    },
    
    takeAction:function(){
        var action = this.getNextAction();
        this._lastAction = action;
        if(action == null){
            return -1;
        }
        var nextActionDelay = 1.0;
        if(action.type == 1){
            cc.vv.gameNetMgr.doQiangdizhu(action.data);
            return 1.0;
        }
        else if(action.type == 2){
          cc.vv.gameNetMgr.doQiangdizhuResult(action.data)
            return 0.5;
        }
        else if(action.type == 3){
            cc.vv.gameNetMgr.doPlaySuccess(action.data);
            return 1.0;
        }
        else if(action.type == 4){
            cc.vv.gameNetMgr.doNotifyNext(action.data);
            return 1.0;
        }
        else if(action.type == 5){
            cc.vv.gameNetMgr.doSpringNotify(action.data);
            return 1.5;
        }
	    else if(action.type == 6){
            cc.vv.gameNetMgr.doGameOver(action.data);
            return 1.0;
        }
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
