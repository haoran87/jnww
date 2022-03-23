import { timingSafeEqual } from "crypto";

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _popuproot:null,
        _settings:null,
        _dissolveNotice:null,
        
        _endTime:-1,
        _extraInfo:null,
        _beforInfo:null,
        _noticeLabel:null,
        _jiesanTip:null,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        
        cc.vv.popupMgr = this;
        
        this._popuproot = cc.find("Canvas/popups");
        this._settings = cc.find("Canvas/popups/settings");
        this._dissolveNotice = cc.find("Canvas/popups/dissolve_notice");
        this._noticeLabel = this._dissolveNotice.getChildByName("info").getComponent(cc.Label);
        this._jiesanTip = this._dissolveNotice.getChildByName("jiesanTip");
        this.closeAll();
        
        this.addBtnHandler("settings/btn_close");
        this.addBtnHandler("settings/btn_sqjsfj");
        this.addBtnHandler("dissolve_notice/btn_agree");
        this.addBtnHandler("dissolve_notice/btn_reject");
        this.addBtnHandler("settings/btn_exit1")
        
        var self = this;
        this.node.on("dissolve_notice",function(event){
            var data = event;
            self.showDissolveNotice(data);
        });
        
        this.node.on("dissolve_cancel",function(event){
            self.closeAll();
        });
    },
    
    start:function(){
        if(cc.vv.gameNetMgr.dissoveData && !cc.vv.replayMgr.isReplay()){
            this.showDissolveNotice(cc.vv.gameNetMgr.dissoveData);
        }
    },
    
    addBtnHandler:function(btnName){
        var btn = cc.find("Canvas/popups/" + btnName);
        this.addClickEvent(btn,this.node,"PopupMgr","onBtnClicked");
    },
    
    addClickEvent:function(node,target,component,handler){
        var eventHandler = new cc.Component.EventHandler();
        eventHandler.target = target;
        eventHandler.component = component;
        eventHandler.handler = handler;

        var clickEvents = node.getComponent(cc.Button).clickEvents;
        clickEvents.push(eventHandler);
    },
    
    onBtnClicked:function(event){
        this.closeAll();
        var btnName = event.target.name;
        if(btnName == "btn_agree"){
            cc.vv.net.send("dissolve_agree");
           
        }
        else if(btnName == "btn_reject"){
            cc.vv.net.send("dissolve_reject");
        }
        else if(btnName == "btn_sqjsfj"){
            cc.vv.net.send("dissolve_request"); 
        }
        else if(btnName == "btn_exit1"){
            cc.vv.net.send("exit");
        }
    },
    
    closeAll:function(){
        this._popuproot.active = false;
        this._settings.active = false;
        this._dissolveNotice.active = false;
    },
    
    showSettings:function(){
        this.closeAll();
        this._popuproot.active = true;
        this._settings.active = true;
        var dis = this._settings.getChildByName("btn_sqjsfj");
        var exit = this._settings.getChildByName("btn_exit1");
        var conf = cc.vv.gameNetMgr.conf;
        if(conf.type == "ddz"){
            dis.active = true && !cc.vv.replayMgr.isReplay();
            exit.active = false;
        }
    },
    
    showDissolveRequest:function(){
        this.closeAll();
        this._popuproot.active = true;
    },
    
    showDissolveNotice:function(data){
        this._endTime = Date.now()/1000 + data.time;
        this._extraInfo = "";
        this._beforInfo = "";
        for(var i = 0; i < data.states.length; ++i){
            var b = data.states[i];
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
            var name = cc.vv.gameNetMgr.seats[i].name;
            if(b == 2){
                this._extraInfo += "\n "+ name + "   [已同意]";
                if(localIndex == 0 ){
                    this._dissolveNotice.getChildByName("btn_agree").getComponent(cc.Button).interactable = false;
                    this._dissolveNotice.getChildByName("btn_reject").getComponent(cc.Button).interactable = false;
                }
            }
            else if(b == 0){
                this._extraInfo += "\n"+name+ "     [等待选择]";
                if(localIndex == 0 ){
                    this._dissolveNotice.getChildByName("btn_agree").getComponent(cc.Button).interactable = true;
                    this._dissolveNotice.getChildByName("btn_reject").getComponent(cc.Button).interactable = true;
                }
            }
            else if(b == 1){
                this._beforInfo = name + " 申请解散房间 \n \n"
                if(localIndex == 0 ){
                    this._dissolveNotice.getChildByName("btn_agree").getComponent(cc.Button).interactable = false;
                    this._dissolveNotice.getChildByName("btn_reject").getComponent(cc.Button).interactable = false;
                }
            }
        }
        this.closeAll();
        this._popuproot.active = true;
        this._dissolveNotice.active = true;
        this._jiesanTip.active = cc.vv.gameNetMgr.numOfGames == 1;
    },
    
    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        if(this._endTime > 0){
            var lastTime = this._endTime - Date.now() / 1000;
            if(lastTime < 0){
                this._endTime = -1;
            }
            var m = Math.floor(lastTime / 60);
            var s = Math.ceil(lastTime - m*60);
            var str = "";
            if(m > 0){
                str += m + "分"; 
            }
            
            this._noticeLabel.string = this._beforInfo + str + s + "秒后结束投票，无人拒绝将自动解散" + this._extraInfo;
        }
    },
});
