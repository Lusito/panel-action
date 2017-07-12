/* global panelAction */

(function() {
    function initOpenButton(b) {
        var options = parseRelaxedJSON(b.dataset.openPanel);
        on(b, 'click', ()=> {
            panelAction.open(options).then((panel)=> {
                setTimeout(()=> {
                    panelAction.sendMessage(options.tabId, 'test', {foo: 'bar'});
                }, 1000);
            });
        });
    }
    function initCloseButton(b) {
        var options = parseRelaxedJSON(b.dataset.closePanel);
        on(b, 'click', ()=> panelAction.close(options));
    }
    var openPanels = document.querySelectorAll('button[data-open-panel]');
    for(var i=0; i<openPanels.length; i++)
        initOpenButton(openPanels[i]);
    var closePanels = document.querySelectorAll('button[data-close-panel]');
    for(var i=0; i<closePanels.length; i++)
        initCloseButton(closePanels[i]);
})();
