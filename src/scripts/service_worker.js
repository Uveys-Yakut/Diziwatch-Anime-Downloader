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

async function snglDwnldEpsd(dwnldEpsdDt) {
    await openUrl(dwnldEpsdDt.url);
    await new Promise(resolve => setTimeout(resolve, 500));
    chrome.runtime.sendMessage({ action: 'fnshDwnldPrcss' });
}
function createPopupWindow(tab) {
    const clickedWindowId = tab.windowId;

    chrome.storage.local.get(['screenWidth', 'screenHeight'], (result) => {
        const screenWidth = result.screenWidth;
        const screenHeight = result.screenHeight;

        var windowWidth = 398 + 16;
        var windowHeight = 385 + 39;

        const left = Math.round((screenWidth - windowWidth) / 2);
        const top = Math.round((screenHeight - windowHeight) / 2);

        console.log(left, top);

        chrome.windows.create({
            url: chrome.runtime.getURL('src/popup.html'),
            type: 'popup',
            width: windowWidth,
            height: windowHeight,
            left: left,
            top: top
        }, (window) => {
            const windowID = window.id;
            const tabsId = window.tabs[0].id;

            setTimeout(() => {
                chrome.tabs.sendMessage(tabsId, { action: 'clickedWndwInf', windowId: clickedWindowId });
            }, 1000);

            const intervalId = setInterval(() => {
                chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                    if (message.action === "crrntWndwdDmnsn") {
                        const dimesionDt = message.data;
                        windowWidth = Math.floor(dimesionDt.width) + 16;
                        windowHeight = Math.floor(dimesionDt.height) + 39;
                    }
                });
                chrome.windows.get(window.id, (win) => {
                    if (win.width !== windowWidth || win.height !== windowHeight) {
                        chrome.windows.update(window.id, {
                            width: windowWidth,
                            height: windowHeight
                        });
                    }
                });
            }, 500);

            chrome.windows.onRemoved.addListener((removedWindowId) => {
                if (removedWindowId === window.id) {
                    clearInterval(intervalId);
                }
            });
        });
    });
}
function chckInstltnAndOpnPopup(tab, result) {
    if (result.isInstalled) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                alert('(ÖNEMLİ) İndirilmek istenen sezon içersindeki tüm bölümler indirilmeden herhangi bir işlem yapılamaz.\n(ÖNEMLİ) İşlemi yarıda kesmeniz durumunda tekrar kaldığınız yerden indirmeye devam edemezsiniz.\n(ÖNEMLİ) Tüm indirmler sonlandıktan sonra anasayfaya yönlendirileceksiniz.\n(Önemli) "Bu sayfanın daha fazla iletişim kutusu oluşturmasını önle" uzantının doğru çalışabilmesi için lütfen bu mesajı onaylamayın.');
            }
        }, () => {
            chrome.storage.local.set({ isInstalled: false });

            createPopupWindow(tab);
        });
    }
    else {
        createPopupWindow(tab);
    }
}
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install" || details.reason === "update") {
        chrome.storage.local.set({ isInstalled: true });
    }
});
chrome.action.onClicked.addListener((tab) => {
    if (!tab.url.includes("diziwatch.net/dizi/")) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                alert('Hata: Lütfen uzantıyı geçerli url\'ler içersinde çalışıtırın.\n\n(Önemli) "Bu sayfanın daha fazla iletişim kutusu oluşturmasını önle" uzantının doğru çalışabilmesi için lütfen bu mesajı onaylamayın.');
            }
        });
        return;
    }

    chrome.storage.local.get(['screenWidth', 'screenHeight', 'isInstalled'], (result) => {
        chckInstltnAndOpnPopup(tab, result);
    });
});

chrome.commands.onCommand.addListener((command) => {
    if (command === 'open_popup') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                const activeTab = tabs[0];
                chrome.storage.local.get(['isInstalled'], (result) => {
                    chckInstltnAndOpnPopup(activeTab, result);
                })
            }
        });
    }
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'opnUrl') {
        processSeason(message.opnUrl);
    } 
    else if (message.action === 'snglDwnldEpsd') {
        snglDwnldEpsd(message.dwnldEpsdDt);
    }
});
