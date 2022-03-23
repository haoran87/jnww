var CardListData =
[
	0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0x0C,0x0D,	//方块
	0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x1A,0x1B,0x1C,0x1D,	//梅花 A - K
	0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2A,0x2B,0x2C,0x2D,	//红桃 A - K
	0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3A,0x3B,0x3C,0x3D,	//黑桃 A - K
    0x4E, 0x4F
];
// 字符掩码
var LOGIC_MASK_COLOR  = 0xF0;
var LOGIC_MASK_VALUE  = 0x0F;

var MAX_COUNT         = 5;

//牌型
var  Wuniu       = 0;    //五牛
var  TonghuaShun = 101;  //同花顺
var  Zhandan     = 102;  //炸弹
var  WuhuaNiu    = 103;  //五花牛
var  WuXiaoniu   = 104;  //五小牛
var  Hulu        = 105;  //葫芦
var  Tonghua     = 106;  //同花
var  Shunzi      = 107;  //顺子

//获取poker逻辑值
function getCardLogicValue(id){  
  var card_value = getCardValue(id);
  if(card_value > 10){
      card_value = 10;
  }
  return card_value;
};
function getCardColor(id){
    return (id & LOGIC_MASK_COLOR) >> 4; 
}
function getCardValue(id){
    return id & LOGIC_MASK_VALUE;
}
function getDdzCardValue(card) {
    card &= 0x0F;
	if (card == 1) return 14;
	if (card == 2) return 15;
	if (card == 14) return 16;
	if(card == 15) return 17
    return card;
}
exports.getDdzCardValue = getDdzCardValue;
function getColorType(card){
	var c = (card & 0xF0) >> 4;
	if(c == 0){
		c = 'fangzhuan';
	}
	else if(c == 1){
		c = 'meihua';
	}
	else if(c == 2){
		c = 'hongxin';
	}
	else if(c == 3){
		c = 'heitao';
	}
	else if(c == 4){
		var v = getDdzCardValue(card);
		if(v == 16){
			c = "xiaowang"
		}
		if(v == 17){
			c = 'dawang'
		}
	}
	return c;
}
exports.getColorType = getColorType;
function getCardName(card){
	var color = getColorType(card);
	var num = getCardNum(card);
	return color+"_"+num;
};
exports.getCardName = getCardName;
function getCardNum(card){
	card &= 0x0F;
	if(card == 14 || card == 15)return 0;
	return card;
}
exports.getCardNum = getCardNum;
function getSortValue(card){
    var v = getDdzCardValue(card);
	if(v < 16){
		var c = (card & 0xF0) >> 4;
        c = c / 10;
		v += c;
    }
	return v;
}
exports.getSortValue = getSortValue;
//从大到小排序
function sortNum_big( list ){
   var length = list.length;
   for(var i = 0; i < length; i++){
       for(var j = i + 1; j < length; j++){
          if(getSortValue(list[i]) < getSortValue(list[j]))
          {
              var temp = list[i];
              list[i]  = list[j];
              list[j]  = temp;
          }  
       }
   }
}
//从小到大排序
function sortNum_small(list){
     var length = list.length;
   for(var i = 0; i < length; i++){
       for(var j = i + 1; j < length; j++){
        if(getSortValue(list[i]) > getSortValue(list[j]))
          {
              var temp = list[i];
              list[i]  = list[j];
              list[j]  = temp;
          }  
       }
   }
}
exports.typeContents = [
    "无牛",
    "牛一",
    "牛二",
    "牛三",
    "牛四",
    "牛五",
    "牛六",
    "牛七",
    "牛八",
    "牛九",
    "牛牛",
    "五花牛",
    "顺子",
    "同花",
    "葫芦",
    "炸弹",
    "五小牛",
    "同花顺牛"
]
exports.CardListData  = CardListData;
exports.getCardColor  = getCardColor;
exports.getCardValue  = getCardValue;
exports.sortNum_big   = sortNum_big;
exports.sortNum_small = sortNum_small;
exports.getCardLogicValue = getCardLogicValue;

