const defaultRgx =  ["<all_urls>"].join('\n');

let myPort = browser.runtime.connect({name:"port-from-cs"});

browser.storage.local.get("regstr", function(res) {
    document.querySelector(".listextarea").value = (res.regstr || defaultRgx);
});
window.onload = function()
{
    let txtarea = document.querySelector(".listextarea");

    txtarea.onchange = function(){
        let regstr = txtarea.value.trim();
        myPort.postMessage({
            updateRegexpes: regstr
        });
    }
};
