/**
 * Git Blame module for the Cloud9 IDE
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Plugin = require("cloud9/plugin");
var Fs     = require("fs");
var sys    = require("sys");

var BlamePlugin = module.exports = function(ide) {
    this.ide   = ide;
    this.hooks = ["command"];
    this.name  = "blame";
};

sys.inherits(BlamePlugin, Plugin);

(function() {

    this.getGitRoot = function(path, callback) {
        // @TODO SECURITY
        var argv  = ["rev-parse", "--show-toplevel"];

        //console.log(this.ide.workspaceDir + path);
        this.spawnCommand("git", argv, this.ide.workspaceDir + path,
            function(err) { // Error
                return callback(err);
            },
            function(out) { // Data
                return callback(null, out);
            },
            function(code, err, out) {
                // Exit
            }
        );
    };

    this.command = function(user, message, client) {
        if (message.command != "blame")
            return false;

        var _self = this;

        if (message.file.indexOf("/workspace/" >= 0))
            message.file = message.file.substr(11);

        var lastSlash = message.file.lastIndexOf("/");
        var dirPath = "/" + message.file.substr(0, lastSlash);
        this.getGitRoot(dirPath, function(err, gitRoot) {
            if (err || !gitRoot)
                return _self.sendResult(0, message.command, {
                            code: 0,
                            argv: message.argv,
                            err: err ? err : "No git root found for file",
                            out: null
                        });

            gitRoot = gitRoot.replace("\n", "");

            var absoluteFilePath = _self.ide.workspaceDir + "/" + message.file;
            var relativeFilePath = absoluteFilePath.substr(gitRoot.length + 1);

            var argv  = ["blame", "-p", relativeFilePath];

            _self.spawnCommand("git", argv, gitRoot,
                function(err) { // Error
                    _self.sendResult(0, message.command, {
                        code: 0,
                        argv: message.argv,
                        err: err,
                        out: null
                    });
                },
                function(out) { // Data
                    _self.sendResult(0, message.command, {
                        code: 0,
                        argv: message.argv,
                        err: null,
                        out: out
                    });
                },
                function(code, err, out) { // Exit
                    _self.sendResult(0, message.command, {
                        code: code,
                        argv: message.argv,
                        err: null,
                        out: null
                    });
                }
            );
        });

        return true;
    };

    this.dispose = function(callback) {
        // TODO kill all running processes!
        callback();
    };

}).call(BlamePlugin.prototype);