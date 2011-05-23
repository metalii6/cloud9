/*
    TODO:
    - larger context dragging
    - expanded state tab dragging
    - mark items as dockable
    - place menus to the left of the bar (instead of fixed dist from right)
    - make sure menus are hidden on creation
    - tweak tab animations
    - tweak design of hover states (esp tab)
    - add tab reordering
    - state serialization / deserialization
    - floating sections or menus
    
    INTEGRATION
    - closing a window should set the state in the windows menu
    - debugger plugin doesnt need to be visible at the start anymore
    - add right click menu to buttons/sections
    - maintain state of sections/buttons even when closed
    - save serialized state in settings.xml
*/

var menuCounter = 100;

var bar = addBar();
var section = addSection(bar);
var menu1 = createMenu(section);
addButton(section, menu1, addPage(menu1, "Test4", "test4"));

var section = addSection(bar);
var menu2 = createMenu(section);
addButton(section, menu2, addPage(menu2, "Test3", "test3"));

var section = addSection(bar);
var menu = createMenu(section);
addButton(section, menu, addPage(menu, "Test1", "test1"));
addButton(section, menu, addPage(menu, "Test2", "test2"));

function addPage(menu, caption, name){
    var page = menu.firstChild.add(caption, name);
    page.oDrag = page.$button;
    page.setAttribute("draggable", true);
    page.addEventListener("beforedrag", dragPage);
    page.addEventListener("afterclose", closePage);
    return page;
}

function closePage(e){
    var button = this.$dockbutton;
    var pNode = this.lastParent;
    var btnPNode = button.parentNode;

    button.destroy(true, true);
    
    if (!pNode.getPages().length) {
        var barParent = btnPNode.parentNode;
        pNode.parentNode.destroy(true, true);
        btnPNode.destroy(true, true);
        if (!barParent.selectNodes("vbox").length)
            barParent.destroy(true, true);
    }
}

function dragPage(e){ //change this to beforedrag and recompile apf
    var menu = this.parentNode.parentNode.cloneNode(false);
    menu.removeAttribute("id");
    apf.document.body.appendChild(menu);
    
    var tab = this.parentNode.cloneNode(false);
    tab.removeAttribute("id");
    menu.appendChild(tab);
    
    var page = this.cloneNode(true);
    page.removeAttribute("id");
    tab.appendChild(page);
    
    apf.setOpacity(menu.$ext, 0.8);

    var pos = apf.getAbsolutePosition(this.parentNode.parentNode.$ext);
    menu.setLeft(pos[0]);
    menu.setTop(pos[1]);
    menu.$ext.style.margin = "0 0 0 0"
    menu.addEventListener("afterdrag", function(e){
        menu.id = menu.name = ""; //@todo fix this bug in apf
        menu.destroy(true, true);
        stopDrag(e.htmlEvent);
    });
    
    //document instead?
    var clientX = e.htmlEvent.clientX;
    var clientY = e.htmlEvent.clientY;
    menu.setAttribute("draggable", true);
    setTimeout(function(){
        //@todo Collapse menu
        
        menu.$dragStart({clientX:clientX,clientY:clientY});
        menu.$ext.style.zIndex = 1000000;
    });

    startDrag(menu, this);

    return false;
};

var whiledrag, lastInfo;
function startDrag(dragged, original){
    var last;
    
    apf.addListener(document, "mousemove", whiledrag = function(e){
        if (last) {
            last.$ext.style.borderBottom = "";
            delete last;
        }
        
        if (!e) return;
        
        dragged.$ext.style.top = "-2000px";
        indicator.style.top = "-2000px";
        apf.plane.hide();
        
        var info = lastInfo = calcAction(e, original);
        var aml  = last = info.aml;

        if (!aml) return;
        
        //if (!aml.dock) return;
        
        var pos = apf.getAbsolutePosition(aml.$ext);
        indicator.style.left = pos[0] + "px";
        indicator.style.top  = pos[1] + "px";
        indicator.style.display = "block";
        indicator.style.backgroundColor = "";
        indicator.innerHTML = "";
        
        var width = aml.$ext.offsetWidth;
        var height = aml.$ext.offsetHeight;
        
        switch(info.position) {
            case "after_button":
                indicator.innerHTML = "<div style='position:absolute'></div>";
                indicator.style.borderWidth = "6px 1px 3px 1px";
                
                var pos2 = apf.getAbsolutePosition(aml.parentNode.$ext);
                indicator.style.left = pos2[0] + "px";
                indicator.style.top  = pos2[1] + "px";
                width = aml.parentNode.$ext.offsetWidth;
                height = aml.parentNode.$ext.offsetHeight;
                
                var div = indicator.firstChild;
                if (aml == original) { //@todo Checks needs to include different representations
                    div.style.top = (pos[1] - pos2[1] - 8) + "px";
                    div.style.left = "2px";
                    div.style.right = "2px";
                    div.style.height = (aml.$ext.offsetHeight - 4) + "px";
                    div.style.border = "2px solid blue";                    
                }
                else {
                    div.style.top = (pos[1] - pos2[1] + aml.$ext.offsetHeight - 8) + "px";
                    div.style.width = "100%";
                    div.style.borderBottom = "3px solid blue";
                }
                
                break;
            case "before_tab":
                break;
            case "in_tab":
                indicator.style.borderWidth = "3px 3px 3px 3px";
                break;
            case "in_section":
                var buttons = aml.selectNodes("button");
                if (original == buttons[0]) {
                    //same as after_button
                    indicator.innerHTML = "<div style='position:absolute'></div>";
                    indicator.style.borderWidth = "6px 1px 3px 1px";
                    
                    var pos2 = apf.getAbsolutePosition(buttons[0].$ext);
                    var div = indicator.firstChild;
                    div.style.top = (pos[1] - pos2[1] + 10) + "px";
                    div.style.left = "2px";
                    div.style.right = "2px";
                    div.style.height = (buttons[0].$ext.offsetHeight - 4) + "px";
                    div.style.border = "2px solid blue";                    
                }
                else if (original.parentNode == aml.$dockfor)
                    indicator.style.borderWidth = "1px 1px 1px 1px";
                else
                    indicator.style.borderWidth = "9px 1px 3px 1px";
                break;
            case "before_section":
                height = 0;
            case "after_section":
                indicator.style.left = pos[0] + "px";
                indicator.style.top  = (pos[1] + height - 3) + "px";
                indicator.style.height = "5px";
                indicator.style.width = "100%";
                indicator.style.borderWidth = "0 0 0 0";
                indicator.innerHTML = "<div style='margin:2px 0 2px 0'></div>";
                indicator.firstChild.style.backgroundColor = "blue";
                indicator.style.backgroundColor = "rgba(0,0,255,0.5)";
                return;
            case "in_column":
                indicator.innerHTML = "<div style='position:absolute'></div>";
                indicator.style.borderWidth = "0 0 0 0";
                
                var div = indicator.firstChild;
                div.style.top = "100%";
                div.style.marginBottom = "-29px";
                div.style.borderBottom = "30px solid gray";
                div.style.width = "100%";
                apf.setOpacity(div, 0.5);
                
                break;
            case "left_of_column":
                if (aml.previousSibling && aml.previousSibling.localName == "bar")
                    indicator.style.borderWidth = "0 0 0 3px";
                else {
                    indicator.innerHTML = "<div style='position:absolute'></div>";
                    indicator.style.borderWidth = "0 0 0 0";
                    
                    var div = indicator.firstChild;
                    div.style.left = "0";
                    div.style.marginLeft = "-15px";
                    div.style.borderLeft = "15px solid gray";
                    div.style.height = "100%";
                    apf.setOpacity(div, 0.5);
                }
                break;
            case "right_of_column":
                indicator.style.borderWidth = "0 3px 0 0";
                break;
            default:
                indicator.style.display = "none";
                break;
        }
        
        var diff = apf.getDiff(indicator);
        indicator.style.width  = (width - diff[0]) + "px";
        indicator.style.height = (height - diff[1]) + "px";
    });
    
    whiledrag.dragged  = dragged;
    whiledrag.original = original;
}

var indicator = document.body.appendChild(document.createElement("div"));
indicator.style.position = "absolute";
indicator.style.display = "none";
indicator.style.border = "3px solid blue";
indicator.style.zIndex = 1000000;

var diffPixel = 3;
function calcAction(e, original){
    var position = "none";
    
    var el = document.elementFromPoint(e.clientX, e.clientY);
    if (el != document.body) {
        var aml = apf.findHost(el);
        if (!aml) return {};
        //if (!aml.dock) return {};
        
        if (aml.localName == "page" || aml.localName == "tab" || aml.localName == "menu") {
            position = "in_tab";
            if (aml.localName == "page")
                aml = aml.parentNode;
            else if (aml.localName == "menu")
                aml = aml.firstChild;
            var pos = apf.getAbsolutePosition(aml.$ext);
            var t = e.clientY - pos[1];
            if (t > 23)
                return {};
        }
        else {
            var bar = aml;
            while (bar && bar.localName != "bar")
                bar = bar.parentNode;
            
            if (bar) {
                var pos = apf.getAbsolutePosition(e.target, bar.$ext);
                var l = pos[0] + e.offsetX;
                var r = bar.$ext.offsetWidth - l;
            }
            
            if (bar && l < diffPixel) {
                position = "left_of_column";
                aml = bar;
            }
            else if (bar && r < diffPixel) {
                position = "right_of_column";
                aml = bar;
            }
            else if (aml.localName == "button") {
                position = "after_button";
                var pos = apf.getAbsolutePosition(aml.$ext);
                var t = e.clientY - pos[1];
                if (t < aml.$ext.offsetHeight/2) {
                    if (aml.previousSibling && aml.previousSibling.localName == "button")
                        aml = aml.previousSibling
                    else {
                        position = "in_section"
                        aml = aml.parentNode;
                    }
                }
            }
            else if (aml.localName == "bar") {
                position = "in_column";
                var vboxs = aml.selectNodes("vbox");
                aml = vboxs[vboxs.length - 1];
            }
            else if (aml.localName == "divider" || aml.localName == "vbox") {
                position = "in_section";
                if (aml.localName == "divider")
                    aml = aml.parentNode;
                
                var pos = apf.getAbsolutePosition(aml.$ext);
                var t = e.clientY - pos[1];
                var b = aml.$ext.offsetHeight - t;

                if (t < diffPixel) {
                    if (original.localName != "divider" 
                      || original.parentNode != (aml.previousSibling 
                      && aml.previousSibling.$dockfor)) {
                        position = "before_section";
                    }
                }
                else if (b < diffPixel && aml.nextSibling) {
                    if (original.localName != "divider" 
                      || original.parentNode != aml.$dockfor) {
                        position = "after_section";
                    }
                }
            }
        }
    }    
    
    return {
        position : position,
        aml      : aml
    }
}

function stopDrag(e){
    whiledrag();
    apf.removeListener(document, "mousemove", whiledrag);
    
    indicator.style.display = "none";
    
    var info = lastInfo;//calcAction(e);
    var aml  = info.aml;

    if (!aml) return;
    
    var original = whiledrag.dragged;
    
    switch(info.position) {
        case "in_section":
            aml = aml.selectNodes("button")[0];
            if (!aml) {
                
                return;
            }
        case "after_button":
            var submenu = self[aml.submenu];
            var dragAml = whiledrag.original;

            moveTo(submenu, dragAml, aml, info.position == "in_section" 
                ? aml 
                : aml.nextSibling, aml.parentNode, info.position);
            break;
        case "before_section":
            aml = aml.selectNodes("button")[0];
        case "in_column":
        case "after_section":
            var section = addSection(aml.parentNode, info.position == "before_section"
                ? aml
                : null);
            
            //reconstruct menu
            var submenu = createMenu(section);
            var dragAml = whiledrag.original;

            moveTo(submenu, dragAml, aml, null, section, info.position);
            break;
        case "before_tab":
            break;
        case "in_tab":
            var submenu = aml.parentNode;
            var dragAml = whiledrag.original;
            
            moveTo(submenu, dragAml, aml, info.position == "in_tab" 
                ? null
                : aml.$dockbutton, submenu.ref, info.position);
            break;
        case "left_of_column":
            var bar = addBar(aml);
            //Single Tab Case
            //create new section
            var section = addSection(bar);
            var submenu = createMenu(section);
            var dragAml = whiledrag.original;
            
            moveTo(submenu, dragAml, aml, null, section, info.position);
            break;
        case "right_of_column":
            var bar = addBar();
            //Single Tab Case
            //create new section
            var section = addSection(bar);
            
            //reconstruct menu
            var submenu = createMenu(section);
            var dragAml = whiledrag.original;
            
            moveTo(submenu, dragAml, aml, null, section, info.position);
            break;
        default:
            break;
    }
}

function moveTo(submenu, dragAml, aml, beforeButton, parentNode, position){
    var beforePage = beforeButton && beforeButton.$dockpage;

    if (dragAml.localName == "page" || dragAml.localName == "button") {
        if (dragAml.localName == "page") {
            var page = dragAml;
            var button = dragAml.$dockbutton;
        }
        else if (dragAml.localName == "button") {
            var page = dragAml.$dockpage;
            var button = dragAml;
        }
        var pNode = page.parentNode;
        var btnPNode = button.parentNode;
        
        submenu.firstChild.insertBefore(page, beforePage);
        button.setAttribute("submenu", submenu.id);
        
        //add button to section
        parentNode.insertBefore(button, beforeButton);
        
        if (!pNode.getPages().length) {
            var barParent = btnPNode.parentNode;
            pNode.parentNode.destroy(true, true);
            btnPNode.destroy(true, true);
            if (!barParent.selectNodes("vbox").length)
                barParent.destroy(true, true);
        }
    }
    else if (dragAml.localName == "divider") {
        var buttons = dragAml.parentNode.selectNodes("button");
        for (var i = buttons.length - 1; i >= 0; i--) {
            var button = buttons[i];
            var page = button.$dockpage;
            var pNode = page.parentNode;
            var btnPNode = button.parentNode;
            
            submenu.firstChild.insertBefore(page, beforePage);
            button.setAttribute("submenu", submenu.id);
            
            //add button to section
            parentNode.insertBefore(button, beforeButton);
        }
        
        //Test is not needed;
        if (!pNode.getPages().length) {
            var barParent = btnPNode.parentNode;
            pNode.parentNode.destroy(true, true);
            btnPNode.destroy(true, true);
            if (!barParent.selectNodes("vbox").length)
                barParent.destroy(true, true);
        }
    }
}

function createMenu(section){
    var menu = new apf.menu({
        id : "submenu" + menuCounter++,
        width : "200",
        height : "200",
        ref        : section,
        pinned     : "true",
        animate    : "false",
        skin       : "dockwindowbasic",
        childNodes : [
            new apf.tab({
                anchors : "0 0 0 0", 
                skin : "docktab",
                buttons : "scale,close",
                onclose : function(e){
                    var page = e.page;
                    page.lastParent = this;
                }

            })
        ]
    });
    
    apf.document.body.appendChild(menu);
    
    return menu;
}

function addBar(before){
    var bar = hboxMain.insertBefore(new apf.bar({
        skin : "debug-panel",
        childNodes : [
            new apf.button({
                skin : "dockheader"
            })
        ]
    }), before);
    
    return bar;
}

function addSection(bar, before){
    var section = bar.insertBefore(new apf.vbox({
        padding : 0,
        edge : "0 0 3 0",
        "class" : "docksection",
        childNodes : [
            new apf.divider({
                skin : "divider-debugpanel",
                margin : "3 5 2 5",
                draggable : "true"
            })
        ]
    }), before);
    
    var div = section.firstChild;
    div.addEventListener("beforedrag", function(e){ //change this to beforedrag and recompile apf
        var section = this.parentNode;
        
        //this.hideMenu();
    
        var pNode = section.parentNode;
        var placeHolder = section.cloneNode(false);
        placeHolder.removeAttribute("id");
        placeHolder.$dockfor = section;
    
        var diff = apf.getDiff(section.$ext);
        var height = section.$ext.offsetHeight;
        var pos = apf.getAbsolutePosition(section.$ext);
        
        pNode.insertBefore(placeHolder, section);
        placeHolder.$ext.style.background = "gray";
        placeHolder.$ext.style.height = (height - diff[1]) + "px";
        
        section.setWidth(section.$ext.offsetWidth);
        apf.document.body.appendChild(section);
        section.setLeft(pos[0]);
        section.setTop(pos[1]);
        
        section.addEventListener("afterdrag", function(e){
            pNode.insertBefore(section, placeHolder);
            section.setAttribute("draggable", false);
    
            setTimeout(function(){
                section.removeAttribute("left");
                section.removeAttribute("top");
                section.removeAttribute("width");
                section.$ext.style.position = "relative";
            });
            
            stopDrag(e.htmlEvent);
            placeHolder.destroy(true, true);
        });
    
        section.setAttribute("draggable", true);
        
        var clientX = e.htmlEvent.clientX;
        var clientY = e.htmlEvent.clientY;
        setTimeout(function(){
            //@todo Collapse menu
            
            section.$dragStart({clientX:clientX,clientY:clientY});
            section.$ext.style.zIndex = 1000000;
        });
        
        startDrag(section, this);
        
        return false;
    });
    
    return section;
}

function addButton(section, submenu, page){
    var button = section.appendChild(new apf.button({
        "class" : "dockButtonID",
        skin    : "dockButton",
        submenu : submenu.id,
        draggable : "true"
    }));
    
    button.addEventListener("beforedrag", function(e){ //change this to beforedrag and recompile apf
        this.hideMenu();
        
        //Upgrade to container if only 1 element
        if (this.parentNode.selectNodes("button").length == 1) {
            this.parentNode.firstChild.dispatchEvent("beforedrag", e);
            return false;
        }
        
        var btn = this.cloneNode(true);
        btn.removeAttribute("id");
        apf.document.body.appendChild(btn);
        btn.setValue(true);
    
        var pos = apf.getAbsolutePosition(this.$ext);
        btn.setLeft(pos[0]);
        btn.setTop(pos[1]);
        btn.addEventListener("afterdrag", function(e){
            btn.destroy(true, true);
            stopDrag(e.htmlEvent);
        });
        
        //document instead?
        var clientX = e.htmlEvent.clientX;
        var clientY = e.htmlEvent.clientY;
        btn.addEventListener("mouseover", function(e){
            //@todo Collapse menu
            
            btn.$dragStart({clientX:clientX,clientY:clientY});
            btn.$ext.style.zIndex = 1000000;
            this.removeEventListener("mouseover", arguments.callee);
        });
        
        startDrag(btn, this);
        
        return false;
    });

    page.$dockbutton = button;
    button.$dockpage = page;

    return button;
}