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
    cssFromOptions: function(options) {
        var css = {};
        for(var key of ["width", "height", "left", "right", "top", "bottom"]) {
            if(options.hasOwnProperty(key)) {
                var value = options[key];
                if(value !== null && typeof(value) !== 'undefined')
                    css[key] = value + 'px';
            }
        }
        if(css.width && css.left && css.right)
            delete css.width;
        if(css.height && css.top && css.bottom)
            delete css.height;
        return css;
    },
    open: function(options) {
        var panel = panelInternal.find(options.tabId, true);
        panelInternal.close(panel);
        panelInternal.panels[options.tabId] = panel;
        var active = options.tabId === tabs.active.id;
        if(active)
            panelInternal.active = panel;
        panel._dom = new PanelDom(options.mode, options.url);
        panel._dom.onClose = function() {
            panel._dom = null;
            panelInternal.doClose(panel.tabId);
        };
        var css = panelInternal.cssFromOptions(options);
        panel._dom.applyCSS(css);
        if(active) {
            panel._dom.show();
            panelAction.onShown.emit(panel);
        } else {
            panel._dom.hide();
        }
        return panel;
    },
    close: function(panel) {
        if(panel._dom) {
            panel._dom.close();
        } else {
            panelInternal.doClose(panel.tabId);
        }
        if(panel === panelInternal.active)
            panelInternal.active = null;
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
        if(panel._dom)
            panel._dom.show();
        panelAction.onShown.emit(panel);
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
        var style = '';
        for(var key in css) {
            style += key + ':' + css[key] + ';';
        }
        this.windowNode.style = style;
    }
}

var panelAction = {
    open: function(details) {
        return new Promise(function(resolve, reject) {
            try {
                var panel = panelInternal.open(details);
                resolve(mixin({}, panel));
            } catch(e) {
                reject(e);
            }
        });
    },
    close: function(details) {
        return new Promise(function(resolve, reject) {
            try {
                var panel = panelInternal.find(details.tabId);
                panelInternal.close(panel);
                resolve(mixin({}, panel));
            } catch(e) {
                reject(e);
            }
        });
    },
    setProperties: function(details) {
        return new Promise(function(resolve, reject) {
            try {
                if(details.hasOwnProperty('visible'))
                    throw 'visible is currently read-only';
                var panel = panelInternal.find(details.tabId);
                var changed = [];
                for(var key in details) {
                    if(key !== 'tabId' && panel[key] !== details[key]) {
                        panel[key] = details[key];
                        changed.push(key);
                    }
                }
                if(changed.indexOf('mode') >= 0) {
                    // recreate panel ui
                    panel = panelInternal.open(panel);
                } else {
                    if(changed.indexOf('url') >= 0 && panel._dom)
                        panel._dom.iframeNode.src = panel.url;
                    if(changed.indexOf('left') >= 0 || changed.indexOf('right') >= 0
                            || changed.indexOf('bottom') >= 0 || changed.indexOf('top') >= 0
                            || changed.indexOf('width') >= 0 || changed.indexOf('height') >= 0) {
                        if(panel._dom)
                            panel._dom.applyCSS(panelInternal.cssFromOptions(panel));
                    }
                }
                if(changed.indexOf('focus') >= 0) {
                    //todo: focus/blur
                }
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
    sendMessage: function(tabId, message, options) {
        return new Promise(function(resolve, reject) {
            try {
                var panel = panelInternal.find(tabId);
                panel._dom.iframeNode.contentWindow.postMessage({
                    message: message,
                    options: options
                }, '*');
                resolve(mixin({}, panel));
            } catch(e) {
                reject(e);
            }
        });
    },
    // Events
    onFocus: new BrowserEvent(),
    onBlur: new BrowserEvent(),
    onShown: new BrowserEvent(),
    onHidden: new BrowserEvent(),
    
    // Types
    ModeType: {
        NORMAL: "normal",
        COMPACT: "compact"
    }
};
