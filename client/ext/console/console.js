/**
 * Console for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/console/console",
    ["core/ide", "core/ext", "ext/panels/panels", "text!ext/console/console.xml"],
    function(ide, ext, panels, markup) {

return ext.register("ext/console/console", {
    name   : "Console",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,

    clear : function() {
        this.inited && txtConsole.clear();
    },

    logNodeStream : function(data, stream) {
        var colors = {
            30: "black",
            31: "red",
            32: "green",
            33: "yellow",
            34: "blue",
            35: "magenta",
            36: "cyan",
            37: "white"
        };

        var lines = data.split("\n");
        var style = "color:black;";
        var log = [];

        for (var i=0; i<lines.length; i++) {
            log.push("<div><span style='" + style + "'>" + lines[i]
               .replace(/\s/g, "&nbsp;")
                .replace(/(((http:\/\/)|(www\.))[\w\d\.]*(:\d+)?(\/[\w\d]+)?)/, function(m, url) {
                    return "<a href='" + url + "' target='_blank'>" + url + "</a>";
                })
                .replace(/\033\[(?:(\d+);)?(\d+)m/g, function(m, extra, color) {
                    style = "color:" + (colors[color] || "black");
                    if (extra == 1) {
                        style += ";font-weight=bold"
                    } else if (extra == 4) {
                        style += ";text-decoration=underline";
                    }
                    return "</span><span style='" + style + "'>"
                }) + "</span></div>");
        }
        txtConsole.addValue(log.join(""));
    },

    /**** Init ****/

    hook : function(){
        panels.register(this);
    },

    init : function(amlNode){
        this.panel = winDbgConsole;
    },

    enable : function(fromParent){
        if (!this.panel)
            panels.initPanel(this);

        //@todo stupid hack, find out why its not below editors

        //Append the console window at the bottom below the tab
        ide.vbMain.selectSingleNode("a:hbox[1]/a:vbox[2]").appendChild(winDbgConsole);

        if (this.manual && fromParent)
            return;

        if (!fromParent)
            this.manual = true;

        this.mnuItem.check();
        winDbgConsole.show();
    },

    disable : function(fromParent){
        if (this.manual && fromParent || !this.inited)
            return;

        if (!fromParent)
            this.manual = true;

        this.mnuItem.uncheck();
        winDbgConsole.hide();
    },

    destroy : function(){
        winDbgConsole.destroy(true, true);
        panels.unregister(this);
    }
});

});