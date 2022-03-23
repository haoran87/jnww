cc.Class({
    extends: cc.Component,

    properties: {
        bgmVolume:1.0,
        sfxVolume:1.0,
        bgmAudioID:-1,
    },
    init: function () {
        var t = cc.sys.localStorage.getItem("bgmVolume");
        if(t != null){
            this.bgmVolume = parseFloat(t);    
        }
        
        var t = cc.sys.localStorage.getItem("sfxVolume");
        if(t != null){
            this.sfxVolume = parseFloat(t);    
        }
        
        cc.game.on(cc.game.EVENT_HIDE, function () {
            cc.audioEngine.pauseAll();
        });
        cc.game.on(cc.game.EVENT_SHOW, function () {
            cc.audioEngine.resumeAll();
        });
    },
    
    getUrl:function(url){
        return "sounds/" + url ;
    },
    
    playBGM(url){
        var self = this;
        var audioUrl = this.getUrl(url);
        if(this.bgmAudioID >= 0){
            cc.audioEngine.stop(this.bgmAudioID);
        }
        cc.loader.loadRes(audioUrl, cc.AudioClip, function (err, clip) {
            self.bgmAudioID = cc.audioEngine.play(clip, true, self.bgmVolume);
        });
    },
    
    playSFX(url){
        var self = this;
        var audioUrl = this.getUrl(url);
        if(this.sfxVolume > 0){
            cc.loader.loadRes(audioUrl, cc.AudioClip, function (err, clip) {
                var audioId = cc.audioEngine.play(clip,false,self.sfxVolume); 
            });
        }
    },
    playClicked(){
        var audioUrl = "other/click";
        cc.vv.audioMgr.playSFX(audioUrl); 
    },
    setSFXVolume:function(v){
        if(this.sfxVolume != v){
            cc.sys.localStorage.setItem("sfxVolume",v);
            this.sfxVolume = v;
        }
    },
    
    setBGMVolume:function(v,force){
        if(this.bgmAudioID >= 0){
            if(v > 0){
                cc.audioEngine.resume(this.bgmAudioID);
            }
            else{
                cc.audioEngine.pause(this.bgmAudioID);
            }
            //cc.audioEngine.setVolume(this.bgmAudioID,this.bgmVolume);
        }
        if(this.bgmVolume != v || force){
            cc.sys.localStorage.setItem("bgmVolume",v);
            this.bgmVolume = v;
            cc.audioEngine.setVolume(this.bgmAudioID,v);
        }
    },
    
    pauseAll:function(){
        cc.audioEngine.pauseAll();
    },
    
    resumeAll:function(){
        cc.audioEngine.resumeAll();
    }
});
