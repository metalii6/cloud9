var sys = require("sys");
var lang = require("pilot/lang");

var User = function (name, permissions) {
    this.name = name;
    this.permissions = permissions;
    this.clients = [];
    this.$server_exclude = {};
};

sys.inherits(User, process.EventEmitter);

User.OWNER_PERMISSIONS = {
    client_exclude: "",
    server_exclude: "",
    dav: "rw"
};

User.COLLABORATOR_PERMISSIONS = {
    client_exclude: "",
    server_exclude: "git",
    dav: "rw"
};

User.VISITOR_PERMISSIONS = {
    client_exclude: [
        "ext/save/save",
        "ext/newresource/newresource",
        "ext/undo/undo",
        "ext/searchreplace/searchreplace",
        "ext/quickwatch/quickwatch",
        "ext/extmgr/extmgr",
        "ext/run/run", //Add location rule
        "ext/debugger/debugger", //Add location rule
        "ext/noderunner/noderunner", //Add location rule
        "ext/watcher/watcher",
        "c9/ext/projectinfo/projectinfo",
        
        "ext/tabbehaviors/tabbehaviors"
    ].join("|"),
    server_exclude: [
        "git",
        "debugger",
        "shell",
        "runvm"
    ].join("|"),
    dav: "ro"
};

(function() {
    
    this.setPermissions = function(permissions) {
        this.$server_exclude = lang.arrayToMap(permissions.server_exclude.split("|"));
        this.permissions = permissions;
    };
    
    this.getPermissions = function(permissions) {
        return this.permissions;
    };
    
    this.addClientConnection = function(client, message) {
        var id = client.sessionId;
        if (this.clients[id] === client)
            return;
            
        this.clients[id] = client;
        this.onClientCountChange();
        
        var _self = this;
        client.on("message", function(message) {
            _self.onClientMessage(message, client);
        });
        
        client.on("disconnect", function() {
            _self.emit("disconnectClient", {
                user: _self,
                client: client
            });
            delete _self.clients[client.sessionId];
            _self.onClientCountChange();
        });
        
        if (message)
            _self.onClientMessage(message, client);         
    };
    
    this.onClientMessage = function(message, client) {
        try {
            message = JSON.parse(message);
        } catch (e) {
            return this.error("Error parsing message: " + e + "\nmessage: " + message, 8);
        }

        this.emit("message", {
            message: message,
            user: this,
            client: client
        });
    };
    
    this.onClientCountChange = function() {
        var count = Object.keys(this.clients).length;
        this.emit("clientCountChange", count);
        
        if (count === 0)
            this.emit("disconnectUser", this);
    };
    
    this.error = function(description, code, message, client) {
        //console.log("Socket error: " + description, new Error().stack);
        var sid = (message || {}).sid || -1;
        var error = JSON.stringify({
            "type": "error",
            "sid": sid,
            "code": code,
            "message": description
        });
        if (client)
            client.send(error);
        else
            this.broadcast(error);
    };
    
    this.broadcast = function(msg, scope) {
        if (scope && this.$server_exclude[scope])
            return;
            
        for (var id in this.clients) 
            this.clients[id].send(msg);
    };
    
}).call(User.prototype);

module.exports = User;
