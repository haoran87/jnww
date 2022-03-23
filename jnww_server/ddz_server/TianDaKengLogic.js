var assert = require('assert');//!!

var CardListData = [
	0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0x0C,0x0D,
	0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x1A,0x1B,0x1C,0x1D,
	0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2A,0x2B,0x2C,0x2D,
	0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3A,0x3B,0x3C,0x3D,
    // 0x4E,0x4F,
];

//计算单张牌的点数，A为16，小王为14，大王为15，其余为本身的点数
function getCardValue(card) {
    card &= 0x0F;
    if (card == 1) return 16;
    return card;
}
exports.getCardValue = getCardValue;

//获取牌的花色
function getCardColor(card) {
    return (card & 0xF0) >> 4;
}

//判断是不是一组牌
function isCardGroup(d) {
    if (typeof(d) != 'object') {
        return false;
    }
    if (d.length != 5) {
        return false;
    }
    return true;
}

//将牌转换成字符串//!!
function card2Str(d) {
    var v = getCardValue(d);
    var c = getCardColor(d);
    var str = '';
    if (c == 0) {
        str = '方块';
    }
    else if (c == 1) {
        str = '梅花';
    }
    else if (c == 2) {
        str = '红桃';
    }
    else if (c == 3) {
        str = '黑桃';
    }
    else if (c == 4) {
        str = '';
    }
    if (v == 14) str += '小王';
    else if (v == 15) str += '大王';
    else if (v == 16) str += 'A';
    else if (v == 11) str += 'J';
    else if (v == 12) str += 'Q';
    else if (v == 13) str += 'K';
    else str += v;
    
    return str;
}
exports.card2Str = card2Str;

// for (var i = 0; i < CardListData.length; i++) {
    // // console.log('' + getCardValue(CardListData[i]));
    // console.log(card2Str(CardListData[i]));
// }


// var testData = [
// [1, 2, 3, 4, 5],
// [2, 2, 3, 4, 5],
// [2, 2, 2, 3, 4],
// [2, 2, 2, 2, 3],
// [2, 2, 2, 2, 2],
// [0x4E, 2, 3, 4, 5],
// [0x4E, 0x4E, 3, 4, 5],
// [0x4E, 0x4E, 0x4E, 3, 4],
// [0x4E, 0x4E, 0x4E, 0x4E, 3],
// [0x4E, 0x4E, 0x4E, 0x4E, 0x4E],
// ];

// for (var i = 0; i < testData.length; i++) {
    // console.log(cardGroup2Str(testData[i]) + ' type is ' + getCardGroupType(testData[i]));
// }

//将一组牌转换成字符串//!!
function cardGroup2Str(d) {
    if (!isCardGroup(d)) {
        assert(0);
        return;
    }
    var l = [];
    for (var i = 0; i < d.length; i++) {
        l.push(card2Str(d[i]));
    }
    return l.join(',');
}

//计算牌的类型
function getCardGroupType(d) {
    var maxIndexAndValue = getMaxIndexAndValue(d);
    var ret = maxIndexAndValue.maxCount;
    
    if (maxIndexAndValue.maxIndex == 14 || maxIndexAndValue.maxIndex == 15) {//如果是大小王
        ret += 1;
    }
    
    // if (ret < 3) {//在这里修改会导致，3张牌算分不正确
        // ret = 3;
    // }
    
    return ret;
}
exports.getCardGroupType = getCardGroupType;

//计算牌的点数
function getCardGroupPoint(d, includeDiPai) {
    if (!d) {
        return;
    }
    var point = 0;
    var start = 0;
    if (includeDiPai) {
        start = 0;
    }
    else {
        start = 2;
    }
    for (var i = start; i < d.length; i++) {
        point += getCardValue(d[i]);
    }
    
    return point;
}
exports.getCardGroupPoint = getCardGroupPoint;

//比较两组牌的大小，先比较类型，类型相同的话，再比较点数，1前者大，-1后者大，0一样大
function compareCard(c1, c2) {
    // var type1 = getCardGroupType(c1);
    // var type2 = getCardGroupType(c2);
    // if ((type1 == type2) || (type1 < 4 && type2 < 4)) {
        // var value1 = getCardGroupPoint(c1, true);
        // var value2 = getCardGroupPoint(c2, true);
        // if (type1 == 3) {
            // var maxIndex = getMaxIndexAndValue(c1).maxIndex;
            // if (maxIndex == 14 || maxIndex == 15) {
                // value1 += maxIndex * 2;
            // }
            // else {
                // value1 += maxIndex * 3;
            // }
        // }
        // if (type2 == 3) {
            // var maxIndex = getMaxIndexAndValue(c2).maxIndex;
            // if (maxIndex == 14 || maxIndex == 15) {
                // value2 += maxIndex * 2;
            // }
            // else {
                // value2 += maxIndex * 3;
            // }
        // }
        // if (value1 > value2) return 1;
        // if (value1 < value2) return -1;
        // return 0;
    // }
    // if (type1 > type2) return 1;
    // if (type1 < type2) return -1;
    var scoreAndType1 = calcScoreAndType(c1, true);
    var scoreAndType2 = calcScoreAndType(c2, true);
    var type1 = scoreAndType1.type;
    var type2 = scoreAndType2.type;
    var value1 = scoreAndType1.score;
    var value2 = scoreAndType2.score;
    // console.log('type and value ' + type1 + ' ' + value1 + ' ' + type2 + ' ' + value2);
    if (type1 == type2 || (type1 < 4 && type2 < 4)) {
        if (value1 > value2) {
            return 1;
        }
        else if (value1 < value2) {
            return -1;
        }
        else {
            return 0;
        }
    }
    else if (type1 > type2) {
        return 1;
    }
    else if (type1 < type2) {
        return -1;
    }
}
exports.compareCard = compareCard;

function getMaxIndexAndValue(d) {
    var t = [];
    for (var i = 0; i < d.length; i++) {
        var v = getCardValue(d[i]);
        if (t[v] == null) {
            t[v] = 0;
        }
        t[v]++;
        // console.log('v is ' + v);
    }
    
    //寻找最多的
    var maxIndex = 0;
    t[0] = 0;//添加用于比较的基本数据，不添加就是null，无法进行比较
    for (var k in t) {
        // console.log('k is ' + k + '  ' + t[k]);
        if (t[k] > t[maxIndex]) {
            maxIndex = k;
        }
    }
    
    return {maxIndex:maxIndex, maxCount:t[maxIndex]};
}
exports.getMaxIndexAndValue = getMaxIndexAndValue;

function calcScoreAndType(d, includeDiPai) {
    var t = {};
    var begin = 0;
    if (!includeDiPai) {
        begin = 2;
    }
    // console.log('d.length is ' + d.length);
    for (var i = begin; i < d.length; i++) {
        var v = getCardValue(d[i]);
        var k = 'k' + v;
        if (!t[k]) {
            t[k] = {
                value: v,//牌值
                count: 0,//数量
                type: 0,//这组牌的类型
                score: 0,//这组牌的分数
            };
        }
        t[k].count++;
    }
    
    var score = 0;
    var maxType = 0;
    
    for (var k in t) {
        var group = t[k];
        
        //这组牌的类型
        group.type = group.count;
        //如果是大小王则升级
        if (group.value == 14 || group.value == 15) {
            group.type += 1;
        }
        
        //这组牌的分数
        group.score = group.value * group.count;
        
        //如果类型为3，则翻倍
        if (group.type == 3) {
            group.score *= 2;
        }
        
        //如果类型为4，则乘100
        if (group.type == 4) {
            group.score *= 100;
        }
        
        //如果类型为5，则乘10000
        if (group.type == 5) {
            group.score *= 10000;
        }
        
        score += group.score;
        if (group.type > maxType) {
            maxType = group.type;
        }
    }
    
    // console.log('t is ' + JSON.stringify(t) + ' score is ' + score + ' maxType is ' + maxType);
    
    return {score: score, type: maxType};
}
exports.calcScoreAndType = calcScoreAndType;

// //test
// var ret = {};
// ret = calcScoreAndType([1,2,3,4,5]);
// console.log('ret is ' + JSON.stringify(ret));
// ret = calcScoreAndType([2,2,0x4e,0x4e,5]);
// console.log('ret is ' + JSON.stringify(ret));
// ret = calcScoreAndType([0x4e,0x4e,5,5,5]);
// console.log('ret is ' + JSON.stringify(ret));
// ret = calcScoreAndType([0x4e,0x4e,0x4f,0x4f,5]);
// console.log('ret is ' + JSON.stringify(ret));
// ret = calcScoreAndType([2,2,2,2,5]);
// console.log('ret is ' + JSON.stringify(ret));
// ret = calcScoreAndType([2,2,2,2,2],true);
// console.log('ret is ' + JSON.stringify(ret));

// var ret = compareCard([12, 5, 2, 3, 12], [12, 3, 7, 2, 7]);
// console.log('ret is ' + ret);
