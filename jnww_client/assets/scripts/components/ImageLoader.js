function loadImage(url,code,callback){
    cc.loader.load(url+".png",function(err, texture){
        console.log("image err = "+err)
        if(texture){
        var spriteFrame = new cc.SpriteFrame(texture);
            spriteFrame.width = texture.height||50;
            spriteFrame.height = texture.width||50;
            callback(code, spriteFrame)
        }
        else{
            callback(code, null)
        }
    })

};

function getBaseInfo(userid,callback){
    if(cc.vv.baseInfoMap == null){
        cc.vv.baseInfoMap = {};
    }
    
    if(cc.vv.baseInfoMap[userid] != null){
        callback(userid,cc.vv.baseInfoMap[userid]);
    }
    else{
        cc.vv.http.sendRequest('/base_info',{userid:userid},function(ret){
            var url = 'http://image.17kuaileqp.com/'+userid;
            var info = {
                name:ret.name,
                sex:ret.sex,
                url:url,
            }
            cc.vv.baseInfoMap[userid] = info;
            callback(userid,info);
            
        },cc.vv.http.master_url);   
    }  
};

cc.Class({
    extends: cc.Component,
    properties: {
      
    },
    onLoad: function () {
        this.setupSpriteFrame();
    },
    
    setUserID:function(userid){
        if(!cc.sys.isNative)return;
        if(!userid){
            return;
        }
        var self = this;
        getBaseInfo(userid,function(code,info){
           if(info && info.url){
                loadImage(info.url,userid,function (err,spriteFrame) {
                    self._spriteFrame = spriteFrame;
                    self.setupSpriteFrame();
                });   
            } 
        });
    },
    
    setupSpriteFrame:function(){
        if(this._spriteFrame){
            var spr = this.getComponent(cc.Sprite);
            if(spr){
                spr.spriteFrame = this._spriteFrame;    
            }
        }
    }
    
});
