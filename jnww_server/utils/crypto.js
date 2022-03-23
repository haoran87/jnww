var crypto = require('crypto');
var CryptoJS = require("crypto-js");


exports.md5 = function (content) {
	var md5 = crypto.createHash('md5');
	md5.update(content);
	return md5.digest('hex');	
}

exports.toBase64 = function(content){
	return new Buffer(content).toString('base64');
}

exports.fromBase64 = function(content){
	return new Buffer(content, 'base64').toString();
}

function getAesString(data,key,iv){
    var key  = CryptoJS.enc.Utf8.parse(key);

    var iv   = CryptoJS.enc.Utf8.parse(iv);
    var encrypted =CryptoJS.AES.encrypt(data,key,
        {
            iv:iv,
            mode:CryptoJS.mode.CBC,
            padding:CryptoJS.pad.Pkcs7
        });
    return encrypted.toString();    
}
exports.guan = function (data){ 
    var key  = exports.key;  
    var iv   = exports.iv;
    var encrypted =getAesString(data,key,iv); 
    var encrypted1 =CryptoJS.enc.Utf8.parse(encrypted);
    return encrypted;
}
exports.key  = '~!@#$(*&^%$&$$@)'; 
exports.iv   = '#$%^#@&*(!@#*$#@';