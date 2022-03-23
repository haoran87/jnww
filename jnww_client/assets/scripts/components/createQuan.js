cc.Class({
    extends: cc.Component,

    properties: {
        quanName:cc.EditBox,
    },

    // use this for initialization
    onLoad: function () {
       var btnConfirm = this.node.getChildByName("confirm");
       var btnCancel = this.node.getChildByName('cancel');
       btnConfirm.on("click",this.sendCreateQuan,this);
       btnCancel.on("click",this.cancel,this);
    },
    sendCreateQuan:function(){
        var self = this;
        var str = this.quanName.string;
        if(str.length == 0){
            cc.vv.alert.show("提示","请给你的圈子起个名字！")
            return;
        }
        console.log("创建的圈子的名称 == "+str);
       var resultCallback = function(ret){
           console.log("返回的结果代码 == "+ret.errcode+"   "+ ret)
            if(ret.errcode == 0){
                cc.vv.alert.show("提示","恭喜，创建圈子成功！ 圈子代码："+ret.id)
                self.cancel();
                cc.vv.quan.updateQuans(ret.data);
                // cc.vv.quan.getQuans(cc.vv.userMgr.userId)
            }
            else{
                if(ret.errcode == 4 ){
                    cc.vv.alert.show("提示","改圈子昵称已经存在了");
                }
                else{
                    cc.vv.alert.show("提示","创建圈子失败 错误代码:"+ret.errcode);
                }
            }
       }
        var data = {
            quanName:str,
            userId:cc.vv.userMgr.userId,
        }
        cc.vv.http.sendRequest("/create_quan",data,resultCallback)
    },
    cancel:function(){
        this.quanName.string = "";
        this.node.active = false;
    },
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
