const POSITION_UP = 1;
const POSITION_DOWN = 2;
var pokerLogic = require("NiuniuLogic")
cc.Class({
    extends: cc.Component,

    properties: {
        pokerPrefab: {
            default: null,
            type: cc.Prefab
        },
        backPrefab: {
            default: null,
            type: cc.Prefab
        },
        pokerBoxPrefab: {
            default: null,
            type: cc.Prefab
        },
        _pokerSpriteList: null,
        _pokerBoxList: null,
        _touchStart: null,
        _touchMove: null,
        _chArr: null,
        _choosing:false,
        _direction:0,
        _moveArr:[],

    },

    // use this for initialization
    onLoad: function () {
        cc.find("Canvas/qdzBtn").active = false;
        this._chArr = [];
        this.node.on(cc.Node.EventType.TOUCH_START, this.startCallback, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.endCallback, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.endCallback, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.moveCallback, this);

    },

    /**显示牌 */
    displayPokers: function (pokerList, pokerAtlas) {
        this.node.destroyAllChildren();
        // this.node.removeAllChildren();
        this._pokerSpriteList = new Array();
        this._pokerBoxList = new Array();
        var gap = 58.5; //牌间隙
        var len = pokerList.length;
        var ll = (len - 1) * gap + 204
        this.node.width = ll;
        this.node.height = 204 + 60
        this.node.x = -(ll / 2);
        for (var i in pokerList) {
            var poker = pokerList[i]
            var pokerName = pokerLogic.getCardName(poker);
            var pokerSprite = cc.instantiate(this.pokerPrefab);
            var pokerBox = cc.instantiate(this.pokerBoxPrefab);
            pokerSprite.getComponent(cc.Sprite).spriteFrame = pokerAtlas.getSpriteFrame(pokerName) ;
            pokerSprite.getChildByName("poker_face").active = false;
            pokerSprite.status = POSITION_DOWN;
            pokerSprite.poker = poker;
            this.node.addChild(pokerBox)
            this.node.addChild(pokerSprite);
            pokerSprite.setPosition(i * gap + 18, 0);
            pokerBox.setPosition(i * gap + 18, 0);
            this._pokerSpriteList.push(pokerSprite);
            this._pokerBoxList.push(pokerBox)
        }
    },
    pokerAllDown: function () {
        for (var i in this._pokerSpriteList) {
            var pokerSprite = this._pokerSpriteList[i];
            if (pokerSprite.status === POSITION_UP)
                pokerSprite.y -= 60;

            pokerSprite.status = POSITION_DOWN;
            pokerSprite.isChiose = false;
            pokerSprite.opacity = 255;
            // pokerSprite.getChildByName("poker_face").color = new cc.Color(255, 255, 255);
            pokerSprite.getChildByName("poker_face").active = false;
        }
        cc.vv.selectPokers.splice(0, cc.vv.selectPokers.length);
    },
    _getCardForTouch: function (touch,touchLoc) {
        var isneed = true;
        for (var i = this._pokerSpriteList.length - 1; i >= 0; i--) { // 需要倒序
            var pokerSprite = this._pokerSpriteList[i];
            var ctouch = pokerSprite.convertToNodeSpace(touchLoc);
            var pokerFace = pokerSprite.getChildByName("poker_face").getBoundingBox();
            var pokerBox = this._pokerBoxList[i]
            var box = pokerBox.getBoundingBox();
            var prePs = this._pokerBoxList[i+1];
            if(prePs){
                var preBox = prePs.getBoundingBox();
                 var idle = box.contains(touch) && !preBox.contains(touch) && pokerFace.contains(ctouch)
                 if(pokerSprite.y > !this._pokerSpriteList[i].y){
                     idle = box.contains(touch) && pokerFace.contains(ctouch)
                 }
            }
            else{
                var idle = box.contains(touch) && pokerFace.contains(ctouch)
            }
            if (idle) {
                pokerSprite.isChiose = true;
                pokerSprite.opacity = 255;
                // pokerSprite.getChildByName("poker_face").color = new cc.Color(30, 30, 30);
                pokerSprite.getChildByName("poker_face").active = true;
                return; //关键， 找到一个就返回
            }
            if(pokerSprite.getBoundingBox().contains(touch)){
                isneed = false
            }
        }
        if (isneed && cc.vv.selectPokers.length > 0) {
            this.pokerAllDown()
        }

    },
    _checkSelectCardReserve(touchBegan, touchMoved,touchLoc) {
        var p1 = touchBegan.x < touchMoved.x ? touchBegan : touchMoved;
        var width = Math.abs(touchBegan.x - touchMoved.x);
        var height = Math.abs(touchBegan.y - touchMoved.y) > 5 ? Math.abs(touchBegan.y - touchMoved.y) : 5;
        var rect = new cc.Rect(p1.x, p1.y, width, height);

        for (let i = this._pokerSpriteList.length - 1; i >= 0; i--) {
            var p = this._pokerSpriteList[i]
            var newRect = p.getBoundingBox()
            if (!rect.intersects(newRect)) {
                this._pokerSpriteList[i].isChiose = false;
                this._pokerSpriteList[i].opacity = 255;
                // this._pokerSpriteList[i].getChildByName("poker_face").color = new cc.Color(255, 255, 255);
                this._pokerSpriteList[i].getChildByName("poker_face").active = false;
            }
        }
        if (p1 === touchMoved) {
            for (let j = this._pokerSpriteList.length - 1; j >= 0; j--) {
                var sprite = this._pokerSpriteList[j];
                if(sprite.isChiose){
                    if(touchMoved.x > sprite.x+58.5){
                        var ctouch = sprite.convertToNodeSpace(touchLoc);
                        var pokerFace = sprite.getChildByName("poker_face").getBoundingBox();
                        var pokerBox = this._pokerBoxList[j]
                        var box = pokerBox.getBoundingBox();
                        var prePs = this._pokerBoxList[j+1];
                        if(prePs){
                            var preBox = prePs.getBoundingBox();
                             var idle = box.contains(touchMoved) && !preBox.contains(touchMoved) && pokerFace.contains(ctouch)
                             if(!idle){
                                this._pokerSpriteList[j].isChiose = false;
                                 this._pokerSpriteList[j].opacity = 255;
                                // this._pokerSpriteList[j].getChildByName("poker_face").color = new cc.Color(255, 255, 255);
                                this._pokerSpriteList[j].getChildByName("poker_face").active = false;
                            }
                        }
                    }
                }
            }
        }

    },

    startCallback: function (event) {
        var touches = event.getTouches(); //获取触摸点
        var touchLoc = touches[0].getLocation(); //触摸点坐标
        this._touchStart = this.node.convertToNodeSpace(touchLoc); //将坐标转换为当前节点坐标
        this._getCardForTouch(this._touchStart,touchLoc);
    },
    moveCallback: function (event) {
        var touches = event.getTouches();
        var touchLoc = touches[0].getLocation();
        this._touchMove = this.node.convertToNodeSpace(touchLoc); //将坐标转换为当前节点坐标
        this._getCardForTouch(this._touchMove,touchLoc);
        this._checkSelectCardReserve(this._touchStart, this._touchMove,touchLoc);
    },
    endCallback: function (event) {
        if (this._chArr.length > 0) {
            this._chArr = [];
        };
        for (var i = 0; i < this._pokerSpriteList.length; i++) {
            var pokerSprite = this._pokerSpriteList[i];
            if (pokerSprite.isChiose) {
                this._chArr.push(pokerSprite.poker);
            }
        }
        if (this._chArr.length >= 5) {
            var rowArr = [];
            for (var k = 0; k < this._chArr.length; k++) {
                var p = this._chArr[k];
                var pv = pokerLogic.getDdzCardValue(p)
                if (pv >= 15) continue;
                if (rowArr.length == 0) {
                    rowArr.push(p);
                } else {
                    var pr = rowArr[rowArr.length - 1];
                    var prv = pokerLogic.getDdzCardValue(pr);
                    if (prv - pv == 0) {
                        continue;
                    }
                    if (prv - pv == 1) {
                        rowArr.push(p);
                        continue;
                    }
                    if (prv - pv> 1 && rowArr.length < 5) {
                        rowArr = [];
                        continue;
                    }
                    if (prv - pv > 1 && rowArr.length >= 5) {
                        break;
                    }
                }
            }
            if (rowArr.length >= 5) {
                cc.vv.selectPokers = [];
                for (var i = 0; i < this._pokerSpriteList.length; i++) {
                    var pokerSprite = this._pokerSpriteList[i];
                    if (pokerSprite.status === POSITION_UP) {
                        pokerSprite.status = POSITION_DOWN;
                        pokerSprite.y -= 60;
                    }
                    if (pokerSprite.isChiose) {
                        pokerSprite.isChiose = false;
                        pokerSprite.opacity = 255;
                        // pokerSprite.getChildByName("poker_face").color = new cc.Color(255, 255, 255);
                        pokerSprite.getChildByName("poker_face").active = false;
                    }
                    for (var j = 0; j < rowArr.length; j++) {
                        var pr = rowArr[j];
                        pokerLogic.getCardName(pokerSprite.poker)
                        if (pokerLogic.getCardName(pr) ==  pokerLogic.getCardName(pokerSprite.poker)) {
                            pokerSprite.status = POSITION_UP;
                            pokerSprite.y += 60;
                            cc.vv.selectPokers.push(pokerSprite.poker);
                        }
                    }
                }
                return;
            }
        }
        for (var i = 0; i < this._pokerSpriteList.length; i++) {
            var pokerSprite = this._pokerSpriteList[i];
            if (pokerSprite.isChiose) {
                pokerSprite.isChiose = false;
                pokerSprite.opacity = 255;
                // pokerSprite.getChildByName("poker_face").color = new cc.Color(255, 255, 255);
                pokerSprite.getChildByName("poker_face").active = false;
                if (pokerSprite.status === POSITION_UP) {
                    pokerSprite.status = POSITION_DOWN;
                    pokerSprite.y -= 60;
                    //移除所选牌
                    var index = -1;
                    for (var k in cc.vv.selectPokers) {
                        var sp = cc.vv.selectPokers[k];
                        if (pokerLogic.getCardName(sp) == pokerLogic.getCardName(pokerSprite.poker))
                            index = k;
                    }
                    if (index != -1) {
                        cc.vv.selectPokers.splice(index, 1);
                    }

                } else {
                    pokerSprite.status = POSITION_UP;
                    pokerSprite.y += 60;
                    var have = -1;
                    for (var e = 0; e < cc.vv.selectPokers.length; e++) { 
                        if (pokerLogic.getCardName(cc.vv.selectPokers[e]) == pokerLogic.getCardName(pokerSprite.poker)) {
                            have = 1;
                            break;
                        }      
                    }
                    if (have == -1) {
                        cc.vv.selectPokers.push(pokerSprite.poker);
                    }
                }
            }
        }
        this._direction = 0;
    },
    showTipPokers: function (pokerList) {
        this.pokerAllDown()
        for (var i = 0; i < pokerList.length; i++) {
            var p = pokerList[i];
            for (var j = 0; j < this._pokerSpriteList.length; j++) {
                var pNode = this._pokerSpriteList[j];
                var pnp = pNode.poker
                pokerLogic.getSortValue(p)
                if ( pokerLogic.getSortValue(pnp) ==  pokerLogic.getSortValue(p)) {
                    pNode.status = POSITION_UP;
                    if (pNode.y == 0) {
                        pNode.y += 60;
                    }
                    //添加选择的牌
                    cc.vv.selectPokers.push(pnp);
                    break;
                }
            }
        }
    },
    showRow: function () {

    },
});