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
        _gameresult:null,
        _seats:[],
        scoreItem:{
           default:null,
           type:cc.Prefab
        },
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        
        this._gameresult = this.node.getChildByName("game_result");
        //this._gameresult.active = false;
        
        var seats = this._gameresult.getChildByName("seats");
        for(var i = 0; i < seats.children.length; ++i){
            this._seats.push(seats.children[i].getComponent("Seat"));   
        }
        
        var date = cc.find("Canvas/game_result/date");
        var time = cc.vv.gameNetMgr.conf.createTime;
        date.getComponent(cc.Label).string = this.dateFormat(time*1000);

        var roomId =  cc.find("Canvas/game_result/roomId");
        roomId.getComponent(cc.Label).string = "房间号："+cc.vv.gameNetMgr.roomId;

        var jushu = cc.find("Canvas/game_result/jushu");
        jushu.getComponent(cc.Label).string = "局数："+cc.vv.gameNetMgr.maxNumOfGames;

        var btnClose = cc.find("Canvas/game_result/btnClose");
        if(btnClose){
            cc.vv.utils.addClickEvent(btnClose,this.node,"GameResult","onBtnCloseClicked");
        }
        
        var btnShare = cc.find("Canvas/game_result/btnShare");
        if(btnShare){
            cc.vv.utils.addClickEvent(btnShare,this.node,"GameResult","onBtnShareClicked");
        }    
        var btnShare = cc.find("Canvas/game_result/btnCopy");
        if(btnShare){
            cc.vv.utils.addClickEvent(btnShare,this.node,"GameResult","onBtnCopyClicked");
        }    
         //初始化网络事件监听器
        var self = this;
        this.node.on('game_end',function(data){
            self.onGameEnd(data);
        });
    },
    
    onGameEnd:function(data){
        var seats = cc.vv.gameNetMgr.seats;  
        var cashCowIndex = -1;
        var maxscore = 0;
        for(var i = 0; i < seats.length; ++i){
            var seat = seats[i];
            var info = data[i];
            this._seats[i].node.getChildByName("dayingjia").active = false;
            this._seats[i].node.getChildByName("fangzhu").active = seat.userid == cc.vv.gameNetMgr.conf.creator;
            if(seat.score > maxscore){
                maxscore = seat.score;
                cashCowIndex = i;
            }
            if(seat.userid > 0){
                 this._seats[i].setInfo(seat.name,seat.score);
                 this._seats[i].setID(seat.userid);          
                this.showResult(this._seats[i],info);
            }            
        }
        if(cashCowIndex != -1){
            this._seats[cashCowIndex].node.getChildByName("dayingjia").active = true;
        }
        
    },
    showResult:function(seat,info){
        var result = seat.node.getChildByName("result")
        var score   = result.getChildByName("score").getComponent(cc.Label);
        var winNum = result.getChildByName("winNum").getComponent(cc.Label);
        var loseNum = result.getChildByName("loseNum").getComponent(cc.Label);
       var djgNum =  result.getChildByName("djgNum").getComponent(cc.Label);
       var  bombNum = result.getChildByName("bombNum").getComponent(cc.Label);
        score.string    = info.totalScore.toString();
        winNum.string = info.winNum;
        loseNum.string = info.loseNum;
        bombNum.string = info.bombNum;
        djgNum.string = info.djgNum;
    },
    
    onBtnCloseClicked:function(){
        cc.vv.gameNetMgr.roomId = null;
        cc.vv.audioMgr.playClicked(); 
        cc.vv.net.close();
        cc.vv.QuanNetMgr.connectQuanServer();
        cc.vv.quanNet
    },
    
    onBtnShareClicked:function(){
        cc.vv.audioMgr.playClicked(); 
        cc.vv.anysdkMgr.shareResult();
    },
    onBtnCopyClicked:function(){
        cc.vv.audioMgr.playClicked(); 
        var seats = cc.vv.gameNetMgr.seats;
        var time = cc.vv.gameNetMgr.conf.createTime;
        var roomId =  cc.find("Canvas/game_result/roomId");
        var str = ""
        for(var i = 0 ; i < seats.length ; i++){
            var s = seats[i];
            if(str.length == 0){
                str += s.name+"[ID:"+s.userid+"]: "+s.score+"分"
            }
            else{
               str += "\n"+ s.name+"[ID:"+s.userid+"]: "+s.score+"分"
            }
        }
        str = "【旺旺棋牌-斗地主】 "+ roomId.getComponent(cc.Label).string +" "+cc.vv.gameNetMgr.maxNumOfGames+'局 结束时间:'+this.dateFormat(time*1000)+"\n"+str
        cc.vv.anysdkMgr.JsCopy(str);
    },
    dateFormat:function(time){
        var date = new Date(time);
        var datetime = "{0}-{1}-{2} {3}:{4}:{5}";
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        month = month >= 10? month : ("0"+month);
        var day = date.getDate();
        day = day >= 10? day : ("0"+day);
        var h = date.getHours();
        h = h >= 10? h : ("0"+h);
        var m = date.getMinutes();
        m = m >= 10? m : ("0"+m);
        var s = date.getSeconds();
        s = s >= 10? s : ("0"+s);
        datetime = datetime.format(year,month,day,h,m,s);
        return datetime;
    },
});
