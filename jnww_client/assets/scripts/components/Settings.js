cc.Class({
    extends: cc.Component,

    properties: {
        _btnYXOpen:null,
        _btnYXClose:null,
        _btnYYOpen:null,
        _btnYYClose:null,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
                
        this._btnYXOpen = this.node.getChildByName("yinxiao").getChildByName("btn_yx_open");
        this._btnYXClose = this.node.getChildByName("yinxiao").getChildByName("btn_yx_close");
        
        this._btnYYOpen = this.node.getChildByName("yinyue").getChildByName("btn_yy_open");
        this._btnYYClose = this.node.getChildByName("yinyue").getChildByName("btn_yy_close");
        
        this.initButtonHandler(this.node.getChildByName("btn_close"));
        this.initButtonHandler(this.node.getChildByName("btn_exit"));
        
        
        this.initButtonHandler(this._btnYXOpen);
        this.initButtonHandler(this._btnYXClose);
        this.initButtonHandler(this._btnYYOpen);
        this.initButtonHandler(this._btnYYClose);
        

        var slider = this.node.getChildByName("yinxiao").getChildByName("progress");
        cc.vv.utils.addSlideEvent(slider,this.node,"Settings","onSlided");
        
        var slider = this.node.getChildByName("yinyue").getChildByName("progress");
        cc.vv.utils.addSlideEvent(slider,this.node,"Settings","onSlided");
        
        this.refreshVolume();
    },
    
    onSlided:function(slider){
        if(slider.node.parent.name == "yinxiao"){
            cc.vv.audioMgr.setSFXVolume(slider.progress);
        }
        else if(slider.node.parent.name == "yinyue"){
            cc.vv.audioMgr.setBGMVolume(slider.progress);
        }
        this.refreshVolume();
    },
    
    initButtonHandler:function(btn){
        cc.vv.utils.addClickEvent(btn,this.node,"Settings","onBtnClicked");    
    },
    
    refreshVolume:function(){
        
        // this._btnYXClose.active = cc.vv.audioMgr.sfxVolume > 0;
        // this._btnYXOpen.active = !this._btnYXClose.active;
        
        var yx = this.node.getChildByName("yinxiao");
        var width = 362 * cc.vv.audioMgr.sfxVolume;
        var progress = yx.getChildByName("progress")
        progress.getComponent(cc.Slider).progress = cc.vv.audioMgr.sfxVolume;
        progress.getChildByName("progress").width = width;  
        //yx.getChildByName("btn_progress").x = progress.x + width;
        
        
        // this._btnYYClose.active = cc.vv.audioMgr.bgmVolume > 0;
        // this._btnYYOpen.active = !this._btnYYClose.active;
        var yy = this.node.getChildByName("yinyue");
        var width = 362 * cc.vv.audioMgr.bgmVolume;
        var progress = yy.getChildByName("progress");
        progress.getComponent(cc.Slider).progress = cc.vv.audioMgr.bgmVolume; 
        
        progress.getChildByName("progress").width = width;
        //yy.getChildByName("btn_progress").x = progress.x + width;
    },
    
    onBtnClicked:function(event){
        if(event.target.name == "btn_close"){
           var jsfj = this.node.getChildByName("btn_sqjsfj");
           if(jsfj == null){
            cc.vv.audioMgr.playClicked(); 
           } 
            this.node.active = false; 
        }
        else if(event.target.name == "btn_exit"){
            cc.vv.audioMgr.playClicked(); 
            cc.sys.localStorage.removeItem("wx_account");
            cc.sys.localStorage.removeItem("wx_sign");
            // cc.director.loadScene("login");
            cc.audioEngine.stopAll();
            cc.game.restart();
           
        }
        else if(event.target.name == "btn_yx_open"){
            cc.vv.audioMgr.setSFXVolume(1.0);
            this.refreshVolume(); 
        }
        else if(event.target.name == "btn_yx_close"){
            cc.vv.audioMgr.setSFXVolume(0);
            this.refreshVolume();
        }
        else if(event.target.name == "btn_yy_open"){
            cc.vv.audioMgr.setBGMVolume(1);
            this.refreshVolume();
        }
        else if(event.target.name == "btn_yy_close"){
            cc.vv.audioMgr.setBGMVolume(0);
            this.refreshVolume();
        }
    },
    clearAll:function(event){
        console.log("点击了一键静音事件"+event.target.parent.name)
        var isChecked = event.target.parent.getComponent(cc.Toggle).isChecked;
        console.log("是否选择了 == "+isChecked)
        if(isChecked){
            var slider1 = this.node.getChildByName("yinxiao").getChildByName("progress").getComponent(cc.Slider);
            var slider2 = this.node.getChildByName("yinyue").getChildByName("progress").getComponent(cc.Slider);
            console.log("试试 == "+slider1.progress)
            cc.sys.localStorage.setItem("yinxiao", slider1.progress);
            cc.sys.localStorage.setItem("yinyue", slider2.progress);
            cc.vv.audioMgr.setSFXVolume(0);
            this.refreshVolume();
            cc.vv.audioMgr.setBGMVolume(0);
            this.refreshVolume();
            
        }
        else{
            var yxs =  cc.sys.localStorage.getItem("yinxiao");
            var yys = cc.sys.localStorage.getItem("yinyue");
            cc.vv.audioMgr.setSFXVolume(Number(yxs));
            this.refreshVolume();
            cc.vv.audioMgr.setBGMVolume(Number(yys));
            this.refreshVolume();
        }
    },
});
