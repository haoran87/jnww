cc.Class({
    extends: cc.Component,

    properties: {
       btCancle:cc.Node,
       reID:{
        default: null,
        type: cc.EditBox
       },
       btConfirm:cc.Node,
    },

   
    onLoad: function () {
        this.btCancle.on("click",this.onCancel,this);
        this.btConfirm.on("click",this.onConfirm,this);
    },
    onCancel:function(event){
        this.node.active = false;
        this.reID.string = '';
    },
    onConfirm:function(){
        var self = this;
        var referee = this.reID.string;
        referee = parseInt(referee);
        if(cc.vv.userMgr.referee > 0 ){
            cc.vv.alert.show("提示","已有代理！");
            return;
        }
        if(this.reID.string.length == 0){
            cc.vv.alert.show("提示","请输入代理ID！");
            return;
        }
        if(isNaN(referee) || referee <= 0){
            cc.vv.alert.show("提示","输入的代理ID不正确！");
            return;
        }
       var onOK = function(ret){
            if(ret.errcode == 1){
                cc.vv.alert.show("提示","该代理不存在！");
            }
            else if(ret.errcode == 0){
                cc.vv.userMgr.referee = referee;
                cc.vv.alert.show("提示","代理添加成功!");
                self.node.active = false;
            }
            else{
                cc.vv.alert.show("提示","代理添加失败!");
            }
       }
       var data = {
        account: cc.vv.userMgr.account,
        sign: cc.vv.userMgr.sign,
        referee : referee,
       }
       cc.vv.http.sendRequest("/add_referee_id", data, onOK)
    },
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
