cc.Class({
    extends: cc.Component,

    properties: {
        _notice:null,
        _nc:null,
    },
    onLoad(){
        cc.vv.notice = this;
        this._notice = cc.find("Canvas/notice");
        this._nc = this._notice.getChildByName("nc").getComponent(cc.Label)
    },
    tip:function(content){
        this._nc.string = content;
        this._notice.getComponent(cc.Animation).play("notice");
    },
    start () {

    },

    // update (dt) {},
});
