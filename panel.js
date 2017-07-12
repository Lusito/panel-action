
window.addEventListener("message", (event)=> {
    console.log('received message: ' + event.data.message, event.data.options);
}, false);
