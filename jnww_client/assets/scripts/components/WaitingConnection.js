cc.Class({
    extends: cc.Component,
    properties: {
        target:cc.Node,
        _isShow:false,
        lblContent:cc.Label,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return null;
        }
        
        cc.vv.wc = this;
        this.node.active = this._isShow;
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        this.target.angle = this.target.angle - dt*45;
    },
    
    show:function(content){
        this._isShow = true;
        if(this.node){
            this.node.active = this._isShow;   
        }
        if(this.lblContent){
            if(content == null){
                content = "";
            }
            this.lblContent.string = content;
        }
    },
    hide:function(){
        this._isShow = false;
        if(this.node){
            this.node.active = this._isShow;   
        }
    }
});
