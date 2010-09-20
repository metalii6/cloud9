/**
 * Documentation for the Ajax.org Cloud IDE
 */
require.def("ext/docs/docs",
    ["core/ide", "core/ext", "text!ext/docs/docs.xml"], function(ide, ext, markup) {

return ext.register("ext/docs/docs", {
    name   : "Documentation",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,

    hook : function(){
        var _self = this;
        this.mnuItem = mnuPanels.appendChild(new apf.item({
            caption : this.name,
            type    : "check",
            onclick : function(){
                ext.initExtension(_self);
                this.checked ? _self.enable() : _self.disable();
            }
        }));
    },

    init : function(amlNode){
        //Append the docs window at the right of the editor
        ide.vbMain.selectSingleNode("a:hbox/a:vbox[3]").appendChild(winDocViewer);
        
        var _self = this;
        winDocViewer.addEventListener("show", function(){
            if (!this.parentNode.visible)
                this.parentNode.show();
            _self.mnuItem.check();
        })
        winDocViewer.addEventListener("hide", function(){
            _self.mnuItem.uncheck();
            if (!this.parentNode.selectSingleNode("node()[@visible='true']").length)
                this.parentNode.hide();
        })
        winDocViewer.show();
    },

    enable : function(){
        winDocViewer.show();
    },

    disable : function(fromParent){
        winDocViewer.hide();
    },

    destroy : function(){
        winDocViewer.destroy(true, true);
        this.mnuItem.destroy(true, true);
    }
});

});