const openWindows = new Set();

function openUrl(url) {
    return new Promise((resolve) => {
        chrome.storage.local.get(['screenWidth', 'screenHeight'], (result) => {
            const screenWidth = Math.floor(result.screenWidth);
            const screenHeight = Math.floor(result.screenHeight);
            const windowWidth = 600;
            const windowHeight = 400;
            
            const left = Math.floor((screenWidth - windowWidth) / 2);
            const top = Math.floor((screenHeight - windowHeight) / 2);

            chrome.windows.create({
                url: url + "#player",
                type: 'popup',
                width: windowWidth,
                height: windowHeight,
                left: left,
                top: top
            }, (window) => {
                const windowId = window.id;
                openWindows.add(windowId);
    
                chrome.tabs.onUpdated.addListener(function onUpdated(tabId, changeInfo) {
                    if (changeInfo.status === 'complete' && windowId) {
                        chrome.tabs.query({ windowId: windowId }, (tabs) => {
                            if (tabs.length > 0) {
                                const tabId = tabs[0].id;
    
                                chrome.scripting.executeScript({
                                    target: { tabId: tabId },
                                    files: ['src/assets/js/getDwnldUrl.js']
                                }, () => {
                                    chrome.tabs.sendMessage(tabId, { action: 'getUrlCntnt' });
                                    function dwnldWtchFl(message, sender, sendResponse) {
                                        if (message.action === "dwnldWtchFl") {
                                            chrome.runtime.sendMessage({ action: 'fnshDwnldItm', itmNmbr: message.epsdeNmbr });
                                            chrome.windows.remove(windowId, () => {
                                                openWindows.delete(windowId);
                                                resolve();
                                                chrome.runtime.onMessage.removeListener(dwnldWtchFl);
                                            });
                                        }
                                    }
                                    chrome.runtime.onMessage.addListener(dwnldWtchFl);
                                });
                            }
                        });
                    }
                });
            });
        });
    });
}

async function processSeason(seasonData) {
    for (const episode of seasonData.episodes) {
        await openUrl(episode.url);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    chrome.runtime.sendMessage({ action: 'fnshDwnldPrcss' });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'opnUrl') {
        processSeason(message.opnUrl);
    }
});
