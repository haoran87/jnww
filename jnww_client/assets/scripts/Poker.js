var niuniu_logic = require('./NiuniuLogic');
cc.Class({
    extends: cc.Component,

    properties: {
         _pid:null,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        //this._wang = this.node.getChildByName("Wang").getComponent(cc.Sprite);
        //this._Type = this.node.getChildByName("Type").getComponent(cc.Sprite);
        //this._TypeS = this.node.getChildByName("TypeS").getComponent(cc.Sprite);
        //this._cardValue = this.node.getChildByName("Value").getComponent(cc.Sprite);
       // this._sprite = this.getComponent(cc.Sprite);
        // this.refresh(0x4E);
    },  
    //通过id ，或缺poker信息  
    refresh:function(id){
        var self = this;
        if (id == undefined) {
            return;
        }
        if(cc.vv.gameNetMgr.gamestate == "begin"){
            id = 0;
        }
        this._pid = id;
        if(this._pid == 0){
            var path_wang  = "textures/niuniu/puke1/niu_bg";
            cc.loader.loadRes(path_wang, cc.SpriteFrame, function (err, spriteFrame) {
                self.getComponent(cc.Sprite).spriteFrame = spriteFrame;
            });         
           return;
        }            

        console.log('pokers refresh: id is ' + id);
        var color       =  niuniu_logic.getCardColor(id);
        var card_value  =  niuniu_logic.getCardValue(id);
        // var r_b = "";
        // if(color == 0 || color == 2){
        //     r_b = "r_";
        // }else if(color == 1 || color == 3){
        //     r_b = "b_";
        // }
        
        if(id == 0x4E || id ==0x4F){ //大小王
            var path_wang  = "textures/niuniu/puke1/joker_" + card_value;
            cc.loader.loadRes(path_wang, cc.SpriteFrame, function (err, spriteFrame) {
                self.getComponent(cc.Sprite).spriteFrame = spriteFrame;
            });         
            return;
        }

        var path  = "textures/niuniu/puke1/" + color + "_"  + card_value;
        cc.loader.loadRes(path, cc.SpriteFrame, function (err, spriteFrame) {
            console.log('puke1 err is ' + err);
            if (!err) {
                self.getComponent(cc.Sprite).spriteFrame = spriteFrame;
            }
        });       
    },
    getLogicId:function(){
       var logicId = niuniu_logic.getCardLogicValue(this._pid);       
       return logicId; 
    },
  
     //获取数值Sprite
    refresh1:function(id){
        var self = this;
        this._pid   = id;
        this._wang = this.node.getChildByName("Wang").getComponent(cc.Sprite);
        this._Type = this.node.getChildByName("Type").getComponent(cc.Sprite);
        this._TypeS = this.node.getChildByName("TypeS").getComponent(cc.Sprite);
        this._cardValue = this.node.getChildByName("Value").getComponent(cc.Sprite);
        var color       =  niuniu_logic.getCardColor(id);
        var card_value  =  niuniu_logic.getCardValue(id);
        var r_b = "";
        if(color == 0 || color == 2){
            r_b = "r_";
        }else if(color == 1 || color == 3){
            r_b = "b_"
        }else{

        }
        color++;
        var path_value = "textures/puke1/" + r_b + card_value;
        var path_Type  = "textures/puke1/Type" + color;
        var path_TypeS = "textures/puke1/TypeS" + color;
        var path_wang  = "textures/puke1/joker-" + card_value;

        if(id == 0x4E || id ==0x4F){ //大小王
            this._wang.node.active = true;
            this._cardValue.node.active = false;
            this._TypeS.node.active = false;
            this._Type.node.active  = true;     
            cc.loader.loadRes(path_wang, cc.SpriteFrame, function (err, spriteFrame) {
                self._wang.node.getComponent(cc.Sprite).spriteFrame = spriteFrame;
            });         
            return;
        }

        this._cardValue.node.active = true;
        this._TypeS.node.active = true;
        this._Type.node.active  = true;
        this._wang.node.active = false;
        //加载牌值
        cc.loader.loadRes(path_value, cc.SpriteFrame, function (err, spriteFrame) {
            self._cardValue.getComponent(cc.Sprite).spriteFrame = spriteFrame;
        }); 
        cc.loader.loadRes(path_Type, cc.SpriteFrame, function (err, spriteFrame) {
            self._Type.getComponent(cc.Sprite).spriteFrame = spriteFrame;
        }); 
        cc.loader.loadRes(path_TypeS, cc.SpriteFrame, function (err, spriteFrame) {
            self._TypeS.getComponent(cc.Sprite).spriteFrame = spriteFrame;
        }); 
    }, 
});
