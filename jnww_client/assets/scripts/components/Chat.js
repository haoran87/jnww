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
        _chatRoot:null,
        _tabQuick:null,
        _tabEmoji:null,
        _iptChat:null,
        
        _quickChatInfo:null,
        _btnChat:null,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        
        cc.vv.chat = this;
        
        this._btnChat = this.node.getChildByName("btn_chat");
        this._btnChat.active = false //  cc.vv.replayMgr.isReplay() == false;
        
        this._chatRoot = this.node.getChildByName("chat");
        this._chatRoot.active = false;
        this._tabQuick = this._chatRoot.getChildByName("quickchatlist");
        this._tabEmoji = this._chatRoot.getChildByName("emojis");
        
        this._iptChat = this._chatRoot.getChildByName("iptChat").getComponent(cc.EditBox);
        
        
        this._quickChatInfo = {};
     
        this._quickChatInfo["item0"] = {index:0,content:"把把都是这样,怎么打呀",sound:"chatSound/fix_msg_21"};
        this._quickChatInfo["item1"] = {index:1,content:"我这牌尿你一头，小心哦",sound:"chatSound/fix_msg_23"};
        this._quickChatInfo["item2"] = {index:2,content:"我一秒几十万上下,快点呀！",sound:"chatSound/fix_msg_24"};
        this._quickChatInfo["item3"] = {index:3,content:"大家好，很高兴见到各位！",sound:"chatSound/fix_msg_25"};
        this._quickChatInfo["item4"] = {index:4,content:"底牌亮出来绝对吓死你！",sound:"chatSound/fix_msg_7"};
        this._quickChatInfo["item5"] = {index:5,content:"别看牌，我们闷到底！",sound:"chatSound/fix_msg_8"};
        this._quickChatInfo["item6"] = {index:6,content:"搏一搏，单车变摩托；赌一赌，摩托变路虎！",sound:"chatSound/fix_msg_9"};
        this._quickChatInfo["item7"] = {index:7,content:"想要富，下重注!",sound:"chatSound/fix_msg_10"};
        this._quickChatInfo["item8"] = {index:8,content:"一点小钱，拿去喝茶吧！",sound:"chatSound/fix_msg_11"};
    },
    
    getQuickChatInfo(index){
        console.log("chat chat+"+index)
        var key = "item" + index;
        return this._quickChatInfo[key];   
    },
    
    onBtnChatClicked:function(){
        this._chatRoot.active = true;
    },
    
    onBgClicked:function(){
        this._chatRoot.active = false;
    },
    
    onTabClicked:function(event){
        if(event.target.name == "tabQuick"){
            this._tabQuick.active = true;
            this._tabEmoji.active = false;
        }
        else if(event.target.name == "tabEmoji"){
            this._tabQuick.active = false;
            this._tabEmoji.active = true;
        }
    },
    
    onQuickChatItemClicked:function(event){
        this._chatRoot.active = false;
        var info = this._quickChatInfo[event.target.name];
        cc.vv.net.send("quick_chat",info.index); 
    },
    
    onEmojiItemClicked:function(event){
        console.log(event.target.name);
        this._chatRoot.active = false;
        cc.vv.net.send("emoji",event.target.name);
    },
    
    onBtnSendChatClicked:function(){
        this._chatRoot.active = false;
        if(this._iptChat.string == ""){
            return;
        }

        cc.vv.net.send("chat",this._iptChat.string);
        this._iptChat.string = "";
    },
});
