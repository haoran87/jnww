cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _userinfo:null,
        _exit:null,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        
        this._userinfo = cc.find("Canvas/userinfo");
        this._exit = this._userinfo.getChildByName("btn_exit");
        this._userinfo.active = false;
        cc.vv.utils.addClickEvent(this._userinfo,this.node,"UserInfoShow","onClicked");
        if(this._exit){
            cc.vv.utils.addClickEvent(this._exit,this.node,"UserInfoShow","onExit");
        }
        cc.vv.userinfoShow = this;
    },
    
    show:function(name,userId,iconSprite,sex,ip,mapInfo){
        if(userId != null && userId > 0){
            this._userinfo.active = true;
            this._userinfo.getChildByName("icon").getComponent(cc.Sprite).spriteFrame = iconSprite.spriteFrame;
            this._userinfo.getChildByName("name").getComponent(cc.Label).string = name;
            this._userinfo.getChildByName("ip").getComponent(cc.Label).string = "IP: " + ip.replace("::ffff:","");
            this._userinfo.getChildByName("id").getComponent(cc.Label).string = "ID: " + userId;
            this._userinfo.getChildByName("address").getComponent(cc.Label).string = cc.vv.userMgr.getUserLocation(mapInfo);
            
            var sex_female = this._userinfo.getChildByName("sex_female");
            sex_female.active = false;
            
            var sex_male = this._userinfo.getChildByName("sex_male");
            sex_male.active = false;
            
            if(sex == 1){
                sex_male.active = true;
            }   
            else if(sex == 2){
                sex_female.active = true;
            }
        }
    },
    
    onClicked:function(){
        this._userinfo.active = false;
    },
    onExit:function(){
        cc.vv.audioMgr.playClicked(); 
        cc.sys.localStorage.removeItem("wx_account");
        cc.sys.localStorage.removeItem("wx_sign");
        // cc.director.loadScene("loading");
        cc.audioEngine.stopAll();
        cc.game.restart();
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
