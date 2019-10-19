const defaultRgx =  ["<all_urls>"].join('\n');
let portFromCS;
let watch_tabs  = [];
function updateRegexpes() {
	browser.storage.local.get("regstr", function(res) {
        let regstr = (res.regstr || defaultRgx);
        let urlmatchpattern = regstr.split("\n");
        watch_tabs = [];
		browser.tabs.query({url: urlmatchpattern, discarded: false}, function(tabs) {
			tabs.forEach(x => {
				watch_tabs.push(x.id);
			})
		});
	});
}
function monitorTabRemoved(tabId, removeInfo) {
	if(watch_tabs.includes(tabId)) {
		watch_tabs = watch_tabs.filter(x=>{
			return x === tabId;
		});
	}
}
function monitorTabUpdated(tabId, changeInfo, tabInfo) {
	if ('url' in changeInfo) {
		updateRegexpes();
	}
}
function setHeader(e) {
	if(!e.frameId || !watch_tabs.includes(e.tabId)) {
  		return {responseHeaders: e.responseHeaders};	
	}
    let headersdelete = ["content-security-policy", "x-frame-options"];
    let cspval = "";
    e.responseHeaders = e.responseHeaders.filter(x=>{
        let lowername = x.name.toLowerCase();
        cspval = lowername === headersdelete[0] ? x.value : cspval;
		return !headersdelete.includes(lowername)
	});
	e.responseHeaders.push({
		name: "content-security-policy",
		value: cspval.includes("frame-ancestors") ? cspval.replace(/frame-ancestors[^;]*;?/, "frame-ancestors *;") : "frame-ancestors *;" + cspval
  	}); 	
  	return {responseHeaders: e.responseHeaders};
}
function connected(p) {
	if (p.name === "port-from-cs") {
		portFromCS = p;
		portFromCS.onMessage.addListener(function (m) {
			if ('updateRegexpes' in m) {
				browser.storage.local.set({"regstr": m.updateRegexpes}, function() {
					updateRegexpes();
				})
			}
		});
	}
}
function initExtension() {
	updateRegexpes();
	browser.runtime.onConnect.addListener(connected);
	browser.tabs.onUpdated.addListener(monitorTabUpdated);
	browser.tabs.onRemoved.addListener(monitorTabRemoved);
	browser.webRequest.onHeadersReceived.addListener(
		setHeader,
		{urls: ["<all_urls>"]},
		["blocking", "responseHeaders"]
	);
}
initExtension();
