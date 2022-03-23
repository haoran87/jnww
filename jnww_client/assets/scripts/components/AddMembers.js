cc.Class({
    extends: cc.Component,

    properties: {
      uID:cc.EditBox,
    },

    // use this for initialization
    onLoad: function () {
        var btnConfirm = this.node.getChildByName("confirm");
        var btnCancel = this.node.getChildByName('cancel');
        btnConfirm.on("click",this.addMembers,this);
        btnCancel.on("click",this.cancel,this);
    },
    addMembers:function(){
        var self = this;
        var str = this.uID.string;
        if(str.length == 0){
            cc.vv.alert.show("提示","请输入要添加成员的ID")
            return;
        }
        if(str.length < 5){
            cc.vv.alert.show("提示","要添加成员不存在")
            return;
        }
       var resultCallback = function(ret){
            if(ret.errcode == 0){
                cc.vv.alert.show("提示",ret.errmsg)
                cc.vv.quan.getMember(ret.data);
                cc.find("Canvas/addMembers").active = false;
                // cc.vv.quan.getQuans(cc.vv.userMgr.userId)
            }
            else{
                if(ret.errcode == 1 ){
                    cc.vv.alert.show("提示","要添加的玩家不存在");
                }
                else if(ret.errcode == 2){
                    cc.vv.alert.show("提示","圈子已经不存在了");
                }
                else if(ret.errcode == 3){
                    cc.vv.alert.show("提示","玩家已经在这个圈子了");
                }
                else{
                    cc.vv.alert.show("提示","添加成员失败 错误代码:"+ret.errcode);
                }
            }
       }
        var data = {
           quanId:cc.vv.quan._quanId,
            addId:str,
        }
        cc.vv.http.sendRequest("/add_quan_members",data,resultCallback)
    },
    cancel:function(){
        this.uID.string = "";
        this.node.active = false;
    },
});
