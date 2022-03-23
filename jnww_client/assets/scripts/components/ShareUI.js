cc.Class({
  extends: cc.Component,

  properties: {
    _friendZoneBtn: cc.Node,
    _friendBtn: cc.Node,
    _closeBtn: cc.Node
  },

  // use this for initialization
  onLoad: function () {
    this._friendBtn = this.node.getChildByName('friendBtn');
    this._friendZoneBtn = this.node.getChildByName('friendZoneBtn');
    this._closeBtn = this.node.getChildByName('btn_close');

    this._friendBtn.on('click', this.callback, this);
    this._friendZoneBtn.on('click', this.callback, this);
    this._closeBtn.on('click', this.callback, this);
  },

  callback: function (event) {
    var button = event.target;
    var name = button.name;
    if (name == 'friendBtn') {
      cc.vv.audioMgr.playClicked(); 
      cc.vv.anysdkMgr.share('旺旺棋牌', '旺旺棋牌');
    } else if (name == 'friendZoneBtn') {
      cc.vv.audioMgr.playClicked(); 
      cc.vv.anysdkMgr.shareFriendZone('旺旺棋牌',
      "");
    } else if (name == 'btn_close') {
      cc.vv.audioMgr.playClicked(); 
      this.node.active = false;
    }
  },
});
