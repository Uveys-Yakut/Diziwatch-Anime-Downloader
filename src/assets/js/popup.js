function sndCrrntHtmlDimesion(timeout) {
    const htmlElement = document.querySelector("html");
    setTimeout(() => {
        const width = htmlElement.offsetWidth;
        const height = htmlElement.offsetHeight;

        chrome.runtime.sendMessage({
            action: "crrntWndwdDmnsn",
            data: { width, height }
        });
    }, timeout);
}
function extrctSeasonEpsd(str) {
    const regexPatterns = [
        /(\d+)[^\d]+(\d+)/,
        /(\d+)-(\d+)/
    ];

    for (const regex of regexPatterns) {
        const match = str.match(regex);
        if (match) {
            return {
                season: parseInt(match[1], 10),
                episode: parseInt(match[2], 10)
            };
        }
    }

    return null;
}
function getSnglEpsdUrl(epsdDt, { season, episode }) {
    const seasonKey = `season_${season}`;
    
    if (epsdDt[seasonKey]) {
        if (epsdDt[seasonKey][episode]) {
            return {cntnt: epsdDt[seasonKey][episode].url, status: "success"};
        } else {
            return {cntnt: `${season}.Sezon için ${episode}.bölüm bulunamadı.`, status: 'error'};
        }
    } else {
        return {cntnt: `${season}Sezon bulunamadı.`, status: 'error'};
    }
}
function createDwnldLstHtml(type, epsdDt, totalNmbrOfSeasons) {
    function createListEpsdUrl(listGroup, url) {
        const seasonMtch = url.match(/(\d+)-sezon/);
        const epsdMtch = url.match(/-([0-9]+)-bolum$/);
        if (epsdMtch && seasonMtch) {
            const seasonNmbr = parseInt(seasonMtch[1], 10);
            const episdNmbr = parseInt(epsdMtch[1], 10);
    
            const newListItem = document.createElement('li');
            newListItem.className = 'list-group-item';
            newListItem.setAttribute('data-epsd', episdNmbr);
            if (type === "allUrl") {
                newListItem.innerHTML = `${episdNmbr}.Bölüm <img src="/src/assets/img/dwnldPrcss.gif" alt="dwnldPrcss">`;
            }
            else if (type === "singlUrl") {
                newListItem.innerHTML = `${seasonNmbr}.Sezon ${episdNmbr}.Bölüm <img src="/src/assets/img/dwnldPrcss.gif" alt="dwnldPrcss">`;
            }
    
            listGroup.appendChild(newListItem);
        }
    }
    const cntntWrpr = document.querySelector("#cntnt_wrpr");

    const epsdViwr = document.createElement('div');
    epsdViwr.className = "epsd-viwr_wrpr";
    epsdViwr.innerHTML = '';
    epsdViwr.innerHTML = `
        <div class="cntnt_wrpr" style="width: 90%; margin-left: 4px;">
            <div class="card" style="width: 100%; margin: 0 !important; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);">
                <div class="card-header">
                    Download Process
                </div>
                <ul class="list-group list-group-flush"></ul>
            </div>
        </div>    
    `;
    if(totalNmbrOfSeasons > 4) {
        epsdViwr.style.height = "100%";
    }
    
    cntntWrpr.setAttribute("style", "display: none;");
    document.getElementById("inptWrpr").setAttribute("style", "display: none;");
    document.getElementsByTagName("body")[0].setAttribute("style", "height: fit-content;");            
    document.getElementsByTagName("html")[0].setAttribute("style", "height: fit-content;");            
    const listGroup = epsdViwr.querySelector('.list-group');
    listGroup.innerHTML = '';

    if (type === "allUrl") {
        for (const [key, value] of Object.entries(epsdDt)) {
            const url = value.url;
            createListEpsdUrl(listGroup, url);
        }
    }
    else if (type === "singlUrl") {
        const url = epsdDt;
        createListEpsdUrl(listGroup, url);
    }
    cntntWrpr.insertAdjacentElement('afterend', epsdViwr);
}
function sndEpsdInpVal(inptVal, epsdDt, totalNmbrOfSeasons) {
    const seasonEpsdDt = extrctSeasonEpsd(inptVal);

    if(seasonEpsdDt === null) {
        alert('Lütfen geçerli bir değer girin.\n\nExample: ["1.sezon 2.bölüm", "1-2", "1 2"]\n\n(Önemli) "Bu sayfanın daha fazla iletişim kutusu oluşturmasını önle" uzantının doğru çalışabilmesi için lütfen bu mesajı onaylamayın.');
    } 
    else {
        const snglEpsdUrl = getSnglEpsdUrl(epsdDt, seasonEpsdDt);

        if(snglEpsdUrl.status === "success") {
            createDwnldLstHtml("singlUrl", snglEpsdUrl.cntnt, totalNmbrOfSeasons);
            chrome.runtime.sendMessage({
                action: 'snglDwnldEpsd',
                dwnldEpsdDt: {
                    url: snglEpsdUrl.cntnt
                }
            });
        } else {
            alert("Hata: "+snglEpsdUrl.cntnt+'\n\n(Önemli) "Bu sayfanın daha fazla iletişim kutusu oluşturmasını önle" uzantının doğru çalışabilmesi için lütfen bu mesajı onaylamayın.');
        }
    }
}
function createInptWrpr(targetElementId, epsdDt, totalNmbrOfSeasons) {
    const targetElement = document.querySelector(targetElementId);
    
    if (!targetElement) {
        console.error(`Element with id ${targetElementId} not found.`);
        return;
    }
    targetElement.innerHTML = '';
    const inptWrpr = document.createElement('div');
    inptWrpr.id = 'inptWrpr';
    inptWrpr.className = 'inpt_wrpr';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Sezon ve bölüm numarasını giriniz.';

    const button = document.createElement('button');
    button.id = 'inptSndr';
    button.className = 'btn btn-dark';

    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-chess-queen';

    button.appendChild(icon);

    inptWrpr.appendChild(input);
    inptWrpr.appendChild(button);
    targetElement.appendChild(inptWrpr);

    button.addEventListener('click', () => {
        const inptVal = input.value;
        if (inptVal === "") {
            alert("Lütfen gerekli alanı doldurunuz.")
        } 
        else {
            sndEpsdInpVal(input.value, epsdDt, totalNmbrOfSeasons);
            sndCrrntHtmlDimesion(100);
        }
    });
}
function extensionThemeMode() {
    return new Promise((resolve) => {
        const elements = {
            body: document.querySelector("body"),
            html: document.querySelector("html"),
            mnTtl: document.querySelector(".mn_ttl"),
            mnCntnr: document.querySelector(".mn_cntnr"),
            cntntWrpr: document.querySelector("#cntnt_wrpr"),
            mnFtr: document.querySelector(".mn_ftr"),
            pstrImg: document.querySelector(".pstr_img"),
            bttnCntnr: document.querySelector(".bttn-cntnr"),
            inptWrpr: document.querySelector(".inpt_wrpr")
        };

        Object.keys(elements).forEach(key => {
            if (elements[key]) {
                elements[key].classList.add("thm_1");
            }
        });

        if (elements.body) elements.body.classList.add("bdy_thm_1");
        if (elements.html) elements.html.classList.add("html_thm_1");

        resolve();
    });
}
function populateContent(data, totalNmbrOfSeasons) {
    const mnCntnr = document.querySelector('.mn_cntnr');
    const cntntWrpr = document.getElementById('cntnt_wrpr');
    const ttl = data[0];
    const pstrImgUrl = data[1];
    const jsonData = data[2];

    cntntWrpr.innerHTML = '';
    cntntWrpr.innerHTML = `
        <div class="mn_cntnt">
            <div class="pstr_img mb-2">
                <img src="${pstrImgUrl}" alt="${ttl}">
            </div>
            <div class="ttl-nm">
                <span>${ttl}</span>
            </div>
            <div class="brick mt-1 mb-1"></div>
        </div>
    `;

    const mnCntnt = cntntWrpr.querySelector('.mn_cntnt');
    const buttonContainer = document.createElement('div');

    buttonContainer.className = 'bttn-cntnr';

    for (const [seasonKey, episodes] of Object.entries(jsonData)) {
        const seasonDiv = document.createElement('div');
        const button = document.createElement('button');
        const totalEpisodes = Object.keys(episodes).length;
        const seasonNumber = seasonKey.replace('season_', '');

        button.className = 'btn btn-dark mb-1 mt-1';
        button.innerHTML = `<span>${seasonNumber}. Sezon (${totalEpisodes} Bölüm) İndir</span>`;
        button.addEventListener('click', () => {
            createDwnldLstHtml("allUrl", episodes, totalNmbrOfSeasons);
            chrome.runtime.sendMessage({
                action: 'opnUrl',
                opnUrl: {
                    season: seasonNumber,
                    episodes: Object.values(episodes)
                }
            });
            mnCntnr.setAttribute("style", `height: 320px !important;`);
            sndCrrntHtmlDimesion(100);
        });

        seasonDiv.className = 'season-dwnld';
        seasonDiv.appendChild(button);
        buttonContainer.appendChild(seasonDiv);
    }
    mnCntnt.insertAdjacentElement('afterend', buttonContainer);
}

document.addEventListener('DOMContentLoaded', () => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'clickedWndwInf') {
            chrome.windows.getAll({ populate: true }, (windows) => {
                const trgtWndwID = message.windowId;
                const trgtWndw = windows.filter(window => window.id === trgtWndwID)[0];
                const tabs = trgtWndw.tabs;
                const targetTab = tabs.filter(tab => tab.active)[0];

                chrome.scripting.executeScript({
                    target: { tabId: targetTab.id },
                    func: () => {
                        window.location.reload();
                        setTimeout(() => {
                            window.location.reload();
                        }, 50);
                    }
                });
                chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
                    if (tabId === targetTab.id && changeInfo.url) {
                        window.close();
                    }
                });
            });
        }
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "senderData") {
        setTimeout(() => {
            const totalNmbrOfSeasons = Object.keys(message.senderAllDt[2]).length;

            populateContent(message.senderAllDt, totalNmbrOfSeasons);
            createInptWrpr('#sctnFrmWrpr', message.senderAllDt[2], totalNmbrOfSeasons);

            if(totalNmbrOfSeasons < 4) {
                extensionThemeMode();
            } 
            sndCrrntHtmlDimesion(200);
        }, 500);
    } else if (message.action === "fnshDwnldItm") {
        const dwnldItm = document.querySelector(`li[data-epsd="${message.itmNmbr}"]`);
        const imgTag = dwnldItm.querySelector('img');

        if (imgTag) {
            imgTag.remove();
        }

        const spanTag = document.createElement('span');
        spanTag.textContent = '✅';
        dwnldItm.appendChild(spanTag);
    } else if (message.action === "fnshDwnldPrcss") {
        const html = document.querySelector("html");
        const body = document.querySelector("body");
        const mnCntnr = document.querySelector('.mn_cntnr');
        const inptWrpr = document.getElementById('inptWrpr');
        const cntntWrpr = document.getElementById('cntnt_wrpr');
        const epsdViwr = document.querySelector('.epsd-viwr_wrpr');

        epsdViwr.remove();
        html.removeAttribute("style");
        body.removeAttribute("style");
        mnCntnr.removeAttribute("style");
        inptWrpr.removeAttribute("style");
        cntntWrpr.removeAttribute("style");

        sndCrrntHtmlDimesion(200)
    }
});