cc.Class({
    extends: cc.Component,
    
    properties: {       
         turnDuration:0,
         counterTimer:0,
    },
  // use this for initialization
    onLoad: function () {
        this.turnDuration = 15;
        this.counterTimer = 15;
        this.ProgressBar = this.getComponent('cc.ProgressBar');
       // this.quan = this.counter.getChildByName('quan');
       // this.node.color = new cc.Color(255, 255, 0);
    },
    setOriginal:function(){
        this.turnDuration = 15;
        this.counterTimer = 15;
    },
    setZero:function(){
        this.turnDuration = 0;
        this.counterTimer = 0;
    },
    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        if (this.node.active) {
            this.ProgressBar.progress = this.counterTimer / this.turnDuration;
        }
        // var green = 255 * this.ProgressBar.progress;
        // if (this.node) {
        //     this.node.color = new cc.Color(255, green, 0);
        // }
        this.counterTimer -= dt;
        if (this.counterTimer < 0) {
            this.counterTimer = 15;
            // this.node.active = false;
        }
    },
});
