/* global panelAction */

(function() {
    var actionCount = 0;
    var resultMessage = byId('result_message');
    var data = byId('control_data');
    function doAction(tabId, action) {
        var options = parseRelaxedJSON(data.value);
        var promise;
        switch(action) {
            case "open":
                promise = panelAction.open(mixin({tabId: tabId}, options));
                break;
            case "close":
                promise = panelAction.close({tabId: tabId});
                break;
            case "update":
                promise = panelAction.setProperties(mixin({tabId: tabId}, options));
                break;
            case "message":
                promise = panelAction.sendMessage(tabId, "testMessage", options);
                break;
        }
        var actionId = ++actionCount;
        if(promise) {
            promise.then(()=> {
                resultMessage.textContent = '(' + actionId + ') Success!';
                resultMessage.className = 'success';
            }, (e)=> {
                resultMessage.textContent = '(' + actionId + ') Error: ' + e.toString();
                resultMessage.className = 'error';
            });
        }
    }

    function initAction(select) {
        var action = select.dataset.action;
        on(select, 'change', ()=> {
            if(select.value !== '') {
                doAction(select.value, action);
                select.value = '';
            }
        });
    }
    var actions = document.querySelectorAll('select[data-action]');
    for(var i=0; i<actions.length; i++)
        initAction(actions[i]);
    
    function setPreset(value) {
        value = value.replace(/,\s*/g, ',\n    ').replace(/{\s*/, '{\n    ').replace(/\s*}/, '\n\}');
        data.value = value;
    }
    var presets = byId('control_presets');
    on(presets, 'change', ()=> {
        if(presets.value !== '') {
            setPreset(presets.value);
            presets.value = '';
        }
    });
    panelAction.onShown.addListener((panel)=> {
        console.log('shown panel on tab: ' + panel.tabId);
    });
    panelAction.onHidden.addListener((panel)=> {
        console.log('hidden panel on tab: ' + panel.tabId);
    });
    panelAction.onBlur.addListener((panel)=> {
        console.log('blurred panel on tab: ' + panel.tabId);
    });
    panelAction.onFocus.addListener((panel)=> {
        console.log('focussed panel on tab: ' + panel.tabId);
    });
})();
