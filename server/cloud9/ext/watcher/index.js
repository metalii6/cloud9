/**
 * Watcher Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var fs      = require("fs"),
    sys     = require("sys"),
    Plugin  = require("cloud9/plugin");
   
var ignoredPaths = {};
 
function cloud9WatcherPlugin(ide) {
    var that = this;
    
    ide.davServer.plugins['watcher'] = function (handler) {
        handler.addEventListener('beforeWriteContent', function (e, uri) {
            var path = handler.server.tree.basePath + '/' + uri;

            // console.log('Detected save', path);
            ignoredPaths[path] = path;
            e.next();
        });
    };

    this.ide = ide;
    this.hooks = ["disconnect", "command"];
    this.name = "watcher";
    this.filenames = {};
}

sys.inherits(cloud9WatcherPlugin, Plugin);

(function() {
    this.unwatchFile = function(filename) {
        // console.log("No longer watching file " + filename);
        delete this.filenames[filename];
        fs.unwatchFile(filename);
        return true;
    };

    // TODO: this does not look correct. There could be more than one client be
    // attached. There needs to be a per client list with ref counting
    this.disconnect = function() {
        for (var filename in this.filenames) 
            this.unwatchFile(filename);
        return true;
    };

    this.command = function(user, message, client) {
        var filename, that, subtype, files;

        if (!message || message.command != "watcher") 
            return false;
        with (message) {
            if (command != "watcher")
                return false;

            switch (type) {
            case "watchFile":
                if (this.filenames[path]) 
                    ; // console.log("Already watching file " + path);
                else {
                    // console.log("Watching file " + path);
                    that = this;
                    fs.watchFile(path, function (curr, prev) {
                        // console.log('Detected event', path);
                        if (ignoredPaths[path]) {
                            delete ignoredPaths[path];
                            return;   
                        }
                        if (curr.nlink == 1 && prev.nlink == 0)
                            subtype = "create";
                        else if (curr.nlink == 0 && prev.nlink == 1)
                            subtype = "remove";
                        else if (curr.mtime.toString() != prev.mtime.toString()) 
                            subtype = "change";
                        else
                            return;
                        if (curr.isDirectory()) {
                            files = {};
                            
                            // TODO don't use sync calls
                            fs.readdirSync(path).forEach(function (file) {
                                var stat = fs.statSync(path + "/" + file);

                                if (file.charAt(0) != '.') {
                                    files[file] = {
                                        type : stat.isDirectory() ? "folder" : "file",
                                        name : file
                                    };
                                }
                            });
                        }
                        that.ide.broadcast(JSON.stringify({
                            "type"      : "watcher",
                            "subtype"   : subtype,
                            "path"      : path,
                            "files"     : files
                        }));
                        console.log("Sent " + subtype + " notification for file " + path);
                    });
                    this.filenames[path] = path;
                }
                return true;
            case "unwatchFile":
                return this.unwatchFile(path);
            default:
                return false;
            }
        }
    };
    
    this.dispose = function(callback) {
        for (filename in this.filenames)
            this.unwatchFile(this.filenames[filename]);
        callback();
    };
    
}).call(cloud9WatcherPlugin.prototype);

module.exports = cloud9WatcherPlugin;
