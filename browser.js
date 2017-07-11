function byId(id) {
    return document.getElementById(id);
}

function on(node, event, callback) {
    node.addEventListener(event, callback);
}

function createElement(parent, tagName, params) {
    var e = document.createElement(tagName);
    if (params) {
        for (var key in params) {
            e[key] = params[key];
        }
    }
    if (parent)
        parent.appendChild(e);
    return e;
}

class BrowserEvent {
    constructor() {
        this.listeners = [];
    }
    addListener(listener) {
        if(!this.hasListener(listener))
            this.listeners.push(listener);
    }
    removeListener(listener) {
        var index = this.listeners.indexOf(listener);
        if(index !== -1)
            this.listeners.splice(index, 1);
    }
    hasListener(listener) {
        return this.listeners.indexOf(listener) !== -1;
    }
    emit() {
        for(var i=0; i<this.listeners.length; i++) {
            var listener = this.listeners[i];
            listener.apply(listener, arguments);
        }
    }
}
var tabs = {
    active: null,
    tabs: document.querySelectorAll('#tabs > div'),
    pages: document.querySelectorAll('#pages > div'),
    _init: function() {
        var idCount = 0;

        function updateUrl(tab) {
            byId('url').value = "http://someurl.com/" + tab.dataset.url;
        }
        function linkTab(tab) {
            tab.id = "tab" + idCount++;
            on(tab, 'click', function () {
                tabs.active = tab;
                for (var i = 0; i < tabs.tabs.length; i++) {
                    var className = tabs.tabs[i] === tab ? 'active' : '';
                    tabs.tabs[i].className = className;
                    tabs.pages[i].className = className;
                }
                updateUrl(tab);
                tabs.onChange.emit(tab);
            });
        }
        for (var i = 0; i < tabs.tabs.length; i++)
            linkTab(tabs.tabs[i]);
        tabs.active = tabs.tabs[0];
        updateUrl(tabs.active);
        tabs.active.className = 'active';
        tabs.pages[0].className = 'active';
    },
    onChange: new BrowserEvent()
};
tabs._init();
