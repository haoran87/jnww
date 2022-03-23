// var URL = "http://192.168.1.170:9010";
var URL = "http://youxi.17kuaileqp.com:9010";
// var URL = "http://47.104.136.26:9010";
cc.VERSION = 20161227;
var HTTP = cc.Class({
    extends: cc.Component,
    statics: {
        sessionId: 0,
        userId: 0,
        master_url: URL,
        url: URL,
        gameNetIP:"youxi.17kuaileqp.com:10000",
        hallNetIP:"youxi.17kuaileqp.com:9997",
        sendRequest: function (path, data, handler, extraUrl) {
            var xhr = cc.loader.getXMLHttpRequest();
            xhr.timeout = 5000;
            var str = "?";
            for (var k in data) {
                if (str != "?") {
                    str += "&";
                }
                str += k + "=" + data[k];
            }
            if (extraUrl == null) {
                extraUrl = HTTP.url;
            }
            var requestURL = extraUrl + path + encodeURI(str);
            console.log("客户端要连接:" + requestURL);
            xhr.open("GET", requestURL, true);
            if (cc.sys.isNative) {
                xhr.setRequestHeader("Accept-Encoding", "gzip,deflate", "text/html;charset=UTF-8");
            }
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && (xhr.status >= 200 && xhr.status < 300)) {
                    // console.log("http res(" + xhr.responseText.length + "):" + xhr.responseText);
                    console.log(path+"获取信息成功")
                    try {
                        var ret = JSON.parse(xhr.responseText);
                        if (handler !== null) {
                            handler(ret);
                        }
                    } catch (e) {
                        console.log("err:" + e);
                        var ret = {
                            ecode: -1,
                            emsg: "err:" + e + ' ' + xhr.responseText
                        };
                        if (handler !== null) {
                            handler(ret);
                        }
                    } finally {
                        
                    }
                }
                else{
                    if(path == "/is_hall_online"){
                        handler(false);
                    }
                    else if(path == "/is_server_online"){
                        handler(false);
                    }
                    console.log(path+"获取信息 不成功")
                }
            };
            xhr.send();
            return xhr;
        },
    },
});