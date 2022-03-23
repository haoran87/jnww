cc.Class({
    extends: cc.Component,

    properties: {
      _seats:null,
        _localNode:null,
    },

    // use this for initialization
    onLoad: function () {
        this._localNode = this.node.getChildByName("locationInfo");
        this._seats = this._localNode.getChildByName("seats");
        var layout = this._localNode.getChildByName("layout");
        layout.on("click",this.goBack,this);
        var self = this;
        this.node.on("show_user_mapInfo",function(data){
            var data = data;
            console.log("接收到定位返回的消息 === "+JSON.stringify(data.seats))
            self.showLocationInfo(data.seats);
            self._localNode.active = true
        })
        // setTimeout(function(){

        // },1000)
    },
    showLocationInfo:function(sData){
        console.log("发送了定位消息")
        var mapArr = [];
        var sChilds = this._seats.children;
        this.initLine()
        for(var i = 0 ; i < sData.length ; i++){
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
            sChilds[localIndex].getChildByName("name").getComponent(cc.Label).string = sData[i].name;
            if(sData[i].userId > 0 && sData[i].mapInfo != "-1"){
                var mapData = {
                    index:localIndex,
                    mapInfo:sData[i].mapInfo,
                }
                mapArr.push(mapData);
            }
        }
        if(mapArr.length > 1){
            mapArr.sort(function(a,b){
                    return a.index - b.index
            });
            console.log(JSON.stringify(mapArr))
            this.calDistance(mapArr);
        }
       
    },
    calDistance:function(arr){
        var newArr = arr.slice(0);
        for(var i = 0 ; i < arr.length - 1; i++){
            newArr = newArr.slice(1);
            var mapInfo = JSON.parse(arr[i].mapInfo);
            var lat1 = mapInfo.latitude;
            var lng1 = mapInfo.longitude;
            for(var j = 0 ; j < newArr.length ; j++){
                var name = arr[i].index+"_"+newArr[j].index;
                console.log("namename === "+name)
                var node = this._localNode.getChildByName(name);
                var mf = JSON.parse(newArr[j].mapInfo);
                var lat2 = mf.latitude;
                var lng2 = mf.longitude;
                var line = node.getChildByName("line");
                var s = this.GetDistance(lat1,lng1,lat2,lng2);
                if(s != -1){
                    if(Number(s) < 0.1){
                        line.color = new cc.Color(255,0,0);
                    }
                    else{
                        line.color = new cc.Color(70,170,70)
                    }
                    if(s >= 1){
                        s=s.toFixed(3)+"千米";
                     }
                     if(s >= 0 && s < 1){
                         s*=1000;
                         s = s.toFixed(1)+"米"
                     }
                }
                else{
                    line.color = new cc.Color(70,170,70)
                    s = ""
                }
                node.getChildByName("disLabel").getComponent(cc.Label).string = s;
            }
        }
    },
    initLine:function(){
        var line = this._localNode.getChildByName("0_1").getChildByName("line");
        line.color = new cc.Color(70,170,70)
        var line1 = this._localNode.getChildByName("0_2").getChildByName("line");
        line1.color = new cc.Color(70,170,70)
        var line2 = this._localNode.getChildByName("1_2").getChildByName("line");
        line2.color = new cc.Color(70,170,70)
    },
    goBack:function(){
        this._localNode.active = false;
    },
    //进行经纬度转换为距离的计算
    Rad:function (d){
        return d * Math.PI / 180.0;//经纬度转换成三角函数中度分表形式。
     },
     //计算距离，参数分别为第一点的纬度，经度；第二点的纬度，经度
     GetDistance : function (lat1,lng1,lat2,lng2){
         if(lat1 == 0 || lat2 == 0){
             return -1
         }
         var radLat1 = this.Rad(lat1);
         var radLat2 = this.Rad(lat2);
         var a = radLat1 - radLat2;
         var  b = this.Rad(lng1) - this.Rad(lng2);
         var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a/2),2) +
         Math.cos(radLat1)*Math.cos(radLat2)*Math.pow(Math.sin(b/2),2)));
         s = s * 6378.137 ;// EARTH_RADIUS;
         console.log("真实的s === "+s)
        //  s = Math.round(s * 100000000 ) / 100000000 ; //输出为公里
         return s;
     },
  
});
