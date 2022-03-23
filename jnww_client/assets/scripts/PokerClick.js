cc.Class({
    extends: cc.Component,

    properties: {
           _isUp:false,
           _origalPosY:0,
           _nowPosY:0, 
           _targetNode:cc.Node,
           _stopClick:false,
           _logicId: 0,
    },

    // use this for initialization
    onLoad: function () {
         this._origalPosY = this.node.getPositionY();
         this._nowPosY   = this._origalPosY + 30;
         this.node.on(cc.Node.EventType.MOUSE_DOWN,this.clickCallback,this);  
         var canvas = cc.find("Canvas");
         this._targetNode = canvas;  
    }, 
    clickCallback:function(event){
        if(this._stopClick && this._isUp == false) return;
        this._isUp = !this._isUp;
        if(this._isUp){
           this.node.setPositionY(this._nowPosY);
        } else{
           this.node.setPositionY(this._origalPosY);
        }      
        var poker      = this.getComponent("Poker"); 
        this._logicId  = poker.getLogicId();
        this._targetNode.emit("PokerClick"); 
    },
    setOriginalPos:function(){
        this._isUp = false;
        this.node.setPositionY(this._origalPosY);
    },
    setStopClick:function(isStop) {
        this._stopClick = isStop;
    },
    getIsUp:function(){
        return this._isUp;
    },
    getLogicId:function(){
        return this._logicId;
    } 
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
