const  crypto = require('./crypto-js');
cc.Class({
    extends: cc.Component,

    properties: {
       
    },

    onLoad: function () {
        
    },
    getDAesString: function(encrypted,key,iv){
        var key  = CryptoJS.enc.Utf8.parse(key);
        var iv   = CryptoJS.enc.Utf8.parse(iv);
        var decrypted =CryptoJS.AES.decrypt(encrypted,key,
            {
                iv:iv,
                mode:CryptoJS.mode.CBC,
                padding:CryptoJS.pad.Pkcs7
            });
        return decrypted.toString(CryptoJS.enc.Utf8);
    },
    kai : function (data){
        var key  = cc.vv.key; 
        var iv   = cc.vv.iv;
        var decryptedStr =this.getDAesString(data,key,iv);
        return decryptedStr;
    },
    // toBase64 :function(content){
    //     return new Buffer(content).toString('base64');
    // },
    
    // fromBase64 : function(content){
    //     return new Buffer(content, 'base64').toString();
    // }
   
});

