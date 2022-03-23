cc.Class({
    extends: cc.Component,

    properties: {
    },
    onLoad: function () {
        var btn = this.node.getChildByName("btn_back");
        var btn1 = this.node.getChildByName("btn_back1");
        cc.vv.utils.addClickEvent(btn,this.node,"OnBack","onBtnClicked"); 
        if(btn1){
            cc.vv.utils.addClickEvent(btn1,this.node,"OnBack","onBtnClicked");   
        }
           
    },
    
    onBtnClicked:function(event){
        if(event.target.name == "btn_back" || event.target.name == "btn_back1"){
            this.node.active = false;
        }
        cc.vv.audioMgr.playClicked(); 
    }
});
