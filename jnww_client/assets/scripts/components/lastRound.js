cc.Class({
    extends: cc.Component,

    properties: {
        _records: null,
    },

    onLoad: function () {
        var btContinue = this.node.getChildByName('btContinue');
        btContinue.active = !cc.vv.replayMgr.isReplay()
        cc.vv.utils.addClickEvent(btContinue, this.node, 'lastRound', 'onBackClicked');
        var btExit = this.node.getChildByName('btExit');
        cc.vv.utils.addClickEvent(btExit, this.node, 'lastRound', 'onBackClicked');
    },

    setData(iswinner,scList,inList) {
        var data = [];
        var sData = [];
        var winBg = this.node.getChildByName("win_bg");
        var loseBg = this.node.getChildByName("lose_bg");
        if(iswinner){
            winBg.active = true;
            loseBg.active = false;
        }
        else{
            winBg.active = false;
            loseBg.active = true;
        }
        if(!this._records){
            this._records = [];
            for (var i = 0; i < this.node.children.length; i++) {
                var c = this.node.children[i];
                if (c.name == 'record') {
                    this._records.push(c);
                }
            }
        }
        var seats = cc.vv.gameNetMgr.seats;
        var spList = seats[cc.vv.gameNetMgr.seatIndex].spList;
        for(var i = 0 ; i < seats.length ; i++){
            var seat = seats[i];
            console.log(seat.userid)
            if(seat.userid > 0 && seat.holds.length > 0){
                data.push(seat);
                for(var k = 0 ; k < inList.length ; k++){
                    if(i == inList[k]){
                        sData.push(scList[k]);
                        break;
                    }
                }
            }
        }
        for(var i = 0 ; i <  this._records.length ; i++){
            var rc = this._records[i];
            if(data.length >= i+1){
                var seat = data[i];
                {
                    var player = this._records[i].getChildByName('player');
                    if (player) {
                        player = player.getChildByName('name');
                        if (player) {
                            player = player.getComponent(cc.Label);
                            player.string = seat.name;
                        }
                    }
                }
                {   
                        var isshow = false;
                        for(var k = 0 ; k < spList.length ; k++ ){
                            if(seat.userid == spList[k]){
                                isshow = true;
                                break;
                            }
                        }
                        if(seat.seatindex == cc.vv.gameNetMgr.seatIndex){
                            isshow = true;
                        }
                        var poker = this._records[i].getChildByName('poker');
                        var paixing = this._records[i].getChildByName('result').getChildByName("paixing");
                        var coins = this._records[i].getChildByName('result').getChildByName("fen");
                        if (!poker) continue;
                        paixing = paixing.getComponent(cc.Label);
                        coins = coins.getComponent(cc.Label);
                        for (var j = 0; j < 3; j++) {//seat.holds.length
                            var p1 = seat.holds[j];
                            var p2 = poker.children[j].getComponent('Poker');
                            if(isshow){
                                if (p2) {
                                    if (p1 != undefined) {
                                        poker.children[j].active = true;
                                        console.log('seat.qipai is ' + seat.qipai);
                                            p2.refresh(p1);
                                    }
                                    else {
                                        poker.children[j].active = false;
                                    }
                                }
                                paixing.string = seat.paixing;
                            }
                            else{
                                if (p2) {
                                    if (p1 != undefined) {
                                        poker.children[j].active = true;
                                            p2.refresh(0);
                                    }
                                    else {
                                        poker.children[j].active = false;
                                    }
                                }
                                paixing.string = "弃牌";
                            }
                        }
                       
                        coins.string = sData[i];//seat.score;
                   
                }
                rc.active = true;
            }
            else{
                rc.active = false;
            }
            
        }
        return
    },
    changeData:function(seatData,gameTimes){
        var lastround = this.node;
        lastround.getChildByName("win").active = false;
        lastround.getChildByName("lose").active = false;
        if(seatData.score > 0){
            var tempNode = lastround.getChildByName("win");
            var audioUrl = "ddz/ani/successound";
        }
        else{
            var tempNode = lastround.getChildByName("lose");
            var audioUrl = "ddz/ani/failsound";
        }
        tempNode.getChildByName("score").getComponent(cc.Label).string = seatData.score > 0?"+"+seatData.score:seatData.score;
        tempNode.getChildByName("difen").getComponent(cc.Label).string = "底分:"+cc.vv.gameNetMgr.difen;
        tempNode.getChildByName("beishu").getComponent(cc.Label).string = "倍数:"+gameTimes;
        var jiabei = tempNode.getChildByName("jiabei").getComponent(cc.Label);
        console.log(seatData.seatIndex+"   是不是地主  "+cc.vv.gameNetMgr.landLord)
        if(seatData.seatIndex == cc.vv.gameNetMgr.landLord){
            jiabei.string = "地主:X2";
        }
        else{
            if(seatData.isqiang == 4){
                jiabei.string = "加倍:X2";
            }
            else{
                jiabei.string = "不加倍";
            }
        }
        cc.vv.audioMgr.playSFX(audioUrl);
        tempNode.active = true;
        this.node.active = true;
        this.node.getChildByName('btContinue').active = !cc.vv.gameNetMgr.isOver && !cc.vv.replayMgr.isReplay();
    },
    onBackClicked: function(event) {
        if(event.target.name == "btContinue"){
            if(cc.vv.gameNetMgr.isOver) return;
            cc.vv.game.readyCallback();
            this.node.active = false;
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
