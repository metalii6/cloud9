/**
 * Git Tools for the Cloud9 IDE
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Plugin = require("cloud9/plugin");
var Fs     = require("fs");
var sys    = require("sys");

var GitToolsPlugin = module.exports = function(ide) {
    this.ide   = ide;
    this.hooks = ["command"];
    this.name  = "gittools";
};

sys.inherits(GitToolsPlugin, Plugin);

(function() {

    // TODO place these two functions in a separate file
    this.getGitTopDir = function(dirPath, absoluteFilePath, callback) {
        var _self = this;
        this.getGitTopDirProc(dirPath, function(err, gitRoot) {
            if (err || !gitRoot)
                return callback("no");

            gitRoot = gitRoot.replace("\n", "");
            var relativeFilePath = absoluteFilePath.substr(gitRoot.length + 1);
            callback(null, relativeFilePath, gitRoot);
        });
    };

    this.getGitTopDirProc = function(path, callback) {
        // @TODO SECURITY
        var argv  = ["rev-parse", "--show-toplevel"];

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

    /**
     * Entry point for hooked command from the Plugin arch.
     * Determines if the primary command is "gittools" and then
     * handles the subcommand. Assumes the user is passing a
     * file argument in @message to perform a git operation on
     * 
     * @param {object} user
     * @param {object} message User's message to the plugin
     * @param {object} client Client connection to the server
     * @return {boolean} False if message.command != "gittools" so the Plugin
     *      architecture knows to keep asking other plugins if they handle
     *      message.command
     */
    this.command = function(user, message, client) {
        if (message.command != "gittools")
            return false;

        var _self = this;

        // Cleanup the file path
        if (message.file.indexOf("/workspace/" >= 0))
            message.file = message.file.substr(11);

        // Get the file's parent directory path
        var lastSlash = message.file.lastIndexOf("/");
        var dirPath = "/" + message.file.substr(0, lastSlash);

        // Get the absolute system path to the file (as opposed to the 
        // relative file path passed to us by the user)
        var absoluteFilePath = _self.ide.workspaceDir + "/" + message.file;

        // Given the path to the file's parent directory and the
        // absolute file path, determine the top-level directory
        // location of the git repository holding the file
        this.getGitTopDir(dirPath, absoluteFilePath, function(err, relativeFilePath, gitRoot) {
            if (err)
                return _self.sendResult(0, message.command, {
                            code: 0,
                            argv: message.argv,
                            err: err ? err : "No git root found for file",
                            out: null
                        });

            switch (message.subcommand) {
                case "blame":
                    _self.gitBlame(message, relativeFilePath, gitRoot);
                    break;
                default:
                    console.log("Git Tools warning: subcommand `" + 
                        message.subcommand + "` not found");
                    break;
            }
        });

        return true;
    };

    this.gitBlame = function(message, relativeFilePath, gitRoot) {
        var argv  = ["blame", "-p", relativeFilePath];

        var _self = this;
        this.spawnCommand("git", argv, gitRoot,
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
    };

    this.dispose = function(callback) {
        // TODO kill all running processes!
        callback();
    };

}).call(GitToolsPlugin.prototype);