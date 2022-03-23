/**
 * Module exports.
 */

module.exports = PokerManager;


/**
 * PokerManager constructor.
 *
 * @param
 */
function PokerManager() {
	this.genAllPokers();
	// this.testPokers();
}

PokerManager.prototype.genAllPokers = function () {
	var pokerList = shuffle();
	return pokerList;
};

PokerManager.prototype.testPokers = function () {
	var p1List = [0x03,0x04,0x14,0x13,0x23,0x24];
	var p2List = [0x07,0x08,0x17,0x18, 0x27,0x28];
	var p3List = new Array();
	var p4List = new Array(); 
	
	var CardListData = [
		0x01,0x02,0x05,0x06,0x09,0x0A,0x0B,0x0C,0x0D,
		0x11,0x12,0x15,0x16,0x19,0x1A,0x1B,0x1C,0x1D,
		0x21,0x22,0x25,0x26,0x29,0x2A,0x2B,0x2C,0x2D,
		0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3A,0x3B,0x3C,0x3D,
		0x4E,0x4F,
	];//0x03,0x04,0x13,0x14,0x23,0x24,0x07,0x08,0x17,0x18,0x27,0x28,
	var pokers = CardListData.shuffle();
	for(var i = 0 ; i < pokers.length ;i++){
		if(p1List.length < 17){
			p1List.push(pokers[i])
		}
		else if(p2List.length < 17){
			p2List.push(pokers[i])
		}
		else if(p3List.length < 17){
			p3List.push(pokers[i])
		}
		else{
			p4List.push(pokers[i])
		}
	}
	var pokerMap = [p1List,p2List,p3List,p4List];
	return pokerMap;
}

var ColourType = {
	heitao: 'heitao',
	hongxin: 'hongxin',
	meihua: 'meihua',
	fangzhuan: 'fangzhuan',
	dawang: 'dawang',
	xiaowang: 'xiaowang'
};
function getCardValue(card) {
    card &= 0x0F;
	if (card == 1) return 14;
	if (card == 2) return 15;
	if (card == 14) return 16;
	if(card == 15) return 17
    return card;
}
PokerManager.prototype.getCardValue = getCardValue;
function getCardColor(card) {
    return (card & 0xF0) >> 4;
};
PokerManager.prototype.getCardColor = getCardColor;
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
		var v = getCardValue(card);
		if(v == 16){
			c = "xiaowang"
		}
		if(v == 17){
			c = 'dawang'
		}
	}
	return c;
}
PokerManager.prototype.getColorType = getColorType;
function getCardName(card){
	var color = getColorType(card);
	var num = getCardNum(card);
	return color+"_"+num;
};
PokerManager.prototype.getCardName = getCardName;
function getCardNum(card){
	card &= 0x0F;
	if(card == 14 || card == 15)return 0;
	return card;
}
PokerManager.prototype.getCardNum = getCardNum;
function getSortValue(card){
	var v = getCardValue(card);
	if(v < 16){
		var c = (card & 0xF0) >> 4;
		c = c/10;
		v += c;
	}
	return v;
}
PokerManager.prototype.getSortValue = getSortValue;
// 洗牌
function shuffle() {
	var CardListData = [
		0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0x0C,0x0D,
		0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x1A,0x1B,0x1C,0x1D,
		0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2A,0x2B,0x2C,0x2D,
		0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3A,0x3B,0x3C,0x3D,
		0x4E,0x4F,
	];
	var list = CardListData
	list.shuffle();
	return list;
}

//数组洗牌
Array.prototype.shuffle = function () {
	var input = this;
	for (var i = input.length - 1; i >= 0; i--) {
		var randomIndex = Math.floor(Math.random() * (i + 1));
		var itemAtIndex = input[randomIndex];
		input[randomIndex] = input[i];
		input[i] = itemAtIndex;
	}
	return input;
};
//从大到小排序
PokerManager.prototype.sortNum_big = function( list ){
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
 PokerManager.prototype.sortNum_small = function (list){
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
