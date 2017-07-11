/* global tabs */

function mixin(target, source) {
    for(var key in source) {
        if(key.substr(0,1) !== '_')
            target[key] = source[key];
    }
    return target;
}
function parseRelaxedJSON(s) {
    return JSON.parse(s.replace(/\'/g, "\"").replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": '));
}
var panelInternal = {
    tabCount: 0,
    panels: {},
    active: null,
    create: function(tabId) {
        var panel = {
            tabId: tabId,
            mode: panelAction.ModeType.NORMAL,
            url: "about:blank",
            title: "",
            focused: false,
            visible: false,
            width: undefined,
            height: undefined,
            left: undefined,
            right: undefined,
            top: undefined,
            bottom: undefined
        };
        panelInternal.panels[tabId] = panel;
        return panel;
    },
    doClose: function(tabId) {
        if(panelInternal.panels[tabId]) {
            delete panelInternal.panels[tabId];
            //fixme: close event?
        }
    },
    find: function(tabId, create) {
        var panel = panelInternal.panels[tabId];
        if(!panel) {
            if(create)
                panel = panelInternal.create(tabId);
            else
                throw "Panel not found";
        }
        return panel;
    },
    close: function() {
        var panel = panelInternal.active;
        if(panel) {
            if(panel._dom) {
                panel._dom.close();
            } else {
                panelInternal.doClose(panel.tabId);
            }
            panelInternal.active = null;
        }
    },
    cssFromOptions: function(options) {
        var css = {};
        for(var key of ["width", "height", "left", "right", "top", "bottom"]) {
            if(options.hasOwnProperty(key))
                css[key] = options[key] + 'px';
        }
        return css;
    },
    show: function(e) {
        var options = parseRelaxedJSON(e.currentTarget.dataset.showPanel);
        panelInternal.close();
        var panel = panelInternal.find(tabs.active.id, true);
        panelInternal.active = panel;
        panel._dom = new PanelDom(options.mode, options.url);
        panel._dom.onClose = function() {
            panel._dom = null;
            panelInternal.doClose(panel.tabId);
        };
        var css = panelInternal.cssFromOptions(options);
        panel._dom.applyCSS(css);
    }
};
tabs.onChange.addListener((tab)=> {
    var panel = panelInternal.active;
    if(panel) {
        panelAction.onHidden.emit(panel);
        if(panel._dom)
            panel._dom.hide();
        panelInternal.active = null;
    }
    try {
        panel = panelInternal.find(tab.id);
        panelAction.onShown.emit(panel);
        if(panel._dom)
            panel._dom.show();
        panelInternal.active = panel;
    } catch(e) {
        
    }
});

class PanelDom {
    constructor(mode, src) {
        this.windowNode = createElement(document.body, 'div', {className: 'panelActionWindow + ' + mode});
        this.topNode = createElement(this.windowNode, 'div');
        this.iconNode = createElement(this.topNode, 'div', {className: 'panelActionIcon'});
        this.imgNode = createElement(this.iconNode, 'img', {src: 'icon16.png', alt: 'Extension Icon', title: 'Dict.cc Translation'});
        if(mode === panelAction.ModeType.COMPACT) {
            this.iframeNode = createElement(this.topNode, 'iframe', {src: src});
        } else {
            this.titleNode = createElement(this.topNode, 'div', {className: 'panelActionTitle', textContent: 'Dict.cc Translation'});
        }
        this.closeNode = createElement(this.topNode, 'div', {className: 'panelActionButton', textContent: 'X'});
        if(mode === panelAction.ModeType.NORMAL) {
            this.bottomNode = createElement(this.windowNode, 'div');
            this.iframeNode = createElement(this.bottomNode, 'iframe', {src: src});
        }
        on(this.closeNode, 'click', this.close.bind(this));
    }

    setUrl(url) {
        this.iframeNode.src = url;
    }
    show() {
        this.windowNode.style.display = 'block';
    }
    hide() {
        this.windowNode.style.display = 'none';
    }
    close() {
        if(this.onClose)
            this.onClose();
        document.body.removeChild(this.windowNode);
    }
    applyCSS(css) {
        for(var key in css) {
            this.windowNode.style[key] = css[key];
        }
    }
}

function initButtons() {
    var closePanels = document.querySelectorAll('button[data-close-panel]');
    for(var i=0; i<closePanels.length; i++)
        on(closePanels[i], 'click', panelInternal.close);
    var showPanels = document.querySelectorAll('button[data-show-panel]');
    for(var i=0; i<showPanels.length; i++)
        on(showPanels[i], 'click', panelInternal.show);
}

var panelAction = {
    setProperties: function(details) {
        return new Promise(function(resolve, reject) {
            try {
                var panel = panelInternal.find(details.tabId);
                var changed = [];
                for(var key in details) {
                    if(key !== 'tabId' && panel[key] !== details[key]) {
                        panel[key] = details[key];
                        changed.push(key);
                    }
                }
                if(changed.indexOf('mode') >= 0) {
                    // todo: recreate panelui
                } else {
                    // todo: if url change: change iframe
                    if(changed.indexOf('left') >= 0 || changed.indexOf('right') >= 0
                            || changed.indexOf('bottom') >= 0 || changed.indexOf('top') >= 0
                            || changed.indexOf('width') >= 0 || changed.indexOf('height') >= 0) {
                        if(panel._dom)
                            panel._dom.applyCSS(panelInternal.cssFromOptions(panel));
                    }
                }
                //todo:
                // if focus change: focus/blur
                // if visible change: show/hide
                resolve(mixin({}, panel));
            } catch(e) {
                reject(e);
            }
        });
    },
    getProperties: function(details) {
        return new Promise(function(resolve, reject) {
            try {
                var panel = panelInternal.find(details.tabId);
                resolve(mixin({}, panel));
            } catch(e) {
                reject(e);
            }
        });
    },
    setIcon: function(details) {
        //imageData or path
        return new Promise(function(resolve, reject) {
            //todo
            reject("not implemented yet");
        });
    },
    sendMessage: function(tabId, message) {
        return new Promise(function(resolve, reject) {
            //todo
            reject("not implemented yet");
        });
    },
    onFocus: new BrowserEvent(),
    onBlur: new BrowserEvent(),
    onShown: new BrowserEvent(),
    onHidden: new BrowserEvent()
};

//Types:
panelAction.ModeType = {
    NORMAL: "normal",
    COMPACT: "compact"
};

initButtons();
