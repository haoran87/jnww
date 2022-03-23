var roomMgr = require('./roommgr');
var userList = {};
var userOnline = 0;
var quanList = {};
exports.bind = function(userId,socket){
    if(userList[userId] && userList[userId].handshake.address != socket.handshake.address){
        userList[userId].disconnect(true);
        userList[userId] = socket;
    }
    else{
        userList[userId] = socket;
        userOnline++;
    }
};
exports.quanbind = function(userId,socket){
    if(quanList[userId] && quanList[userId].handshake.address != socket.handshake.address){
        quanList[userId].disconnect(true);
        quanList[userId] = socket;
    }
    else{
        quanList[userId] = socket;
    }
};
exports.quanSend = function(){
    for(var key in quanList){
        quanList[key].emit("hello")
    }
};

exports.delQuanlist = function(userId){
    delete quanList[userId];
};

exports.del = function(userId){
    delete userList[userId];
    userOnline--;
};

exports.get = function(userId){
    return userList[userId];
};

exports.isOnline = function(userId){
    var data = userList[userId];
    if(data != null){
        return true;
    }
    return false;
};
exports.gameDdisconnect = function (userId,toHall) {
    if(userList[userId]){
        userList[userId].emit("game_disconnect",{toHall:toHall})
    }
};
exports.getOnlineCount = function(){
    return userOnline;
}

exports.sendMsg = function(userId,event,msgdata){
    var userInfo = userList[userId];
    if(userInfo == null){
        return;
    }
    var socket = userInfo;
    if(socket == null){
        return;
    }

    socket.emit(event,msgdata);
};

exports.kickAllInRoom = function(roomId,toHall){
    if(roomId == null){
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }

    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];
        //如果不需要发给发送方，则跳过
        if(rs.userId > 0){
            var socket = userList[rs.userId];
            if(socket != null){
                exports.gameDdisconnect(rs.userId,toHall);
                exports.del(rs.userId);
            }
        }
    }
};

exports.broacastInRoom = function(event,data,sender,includingSender){
    var roomId = roomMgr.getUserRoom(sender);
    if(roomId == null){
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }

    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];

        //如果不需要发给发送方，则跳过
        if(rs.userId == sender && includingSender != true){
            continue;
        }
        var socket = userList[rs.userId];
        if(socket != null){
            socket.emit(event,data);
        }
    }
};
