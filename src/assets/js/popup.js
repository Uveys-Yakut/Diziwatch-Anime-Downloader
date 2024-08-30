function populateContent(data) {
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
        </div>
        <div class="brick mt-1 mb-1"></div>
    `;

    const brickElement = cntntWrpr.querySelector('.brick.mt-1.mb-1');
    const buttonContainer = document.createElement('div');

    buttonContainer.className = 'bttn-cntnr';

    for (const [seasonKey, episodes] of Object.entries(jsonData)) {
        const epsdViwr = document.createElement('div');
        const seasonDiv = document.createElement('div');
        const button = document.createElement('button');
        const totalEpisodes = Object.keys(episodes).length;
        const seasonNumber = seasonKey.replace('season_', '');

        epsdViwr.className = "epsd-viwr_wrpr";
        epsdViwr.innerHTML = '';
        epsdViwr.innerHTML = `
            <div class="cntnt_wrpr" style="width: 90%;">
                <div class="card" style="width: 100%; margin: 0 !important; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);">
                    <div class="card-header">
                        Download Process
                    </div>
                    <ul class="list-group list-group-flush"></ul>
                </div>
            </div>    
        `;
        button.className = 'btn btn-dark mb-1 mt-1';
        button.innerHTML = `<span>${seasonNumber}. Sezon (${totalEpisodes} Bölüm) İndir</span>`;
        button.addEventListener('click', () => {
            cntntWrpr.setAttribute("style", "display: none;");
            document.getElementsByTagName("html")[0].setAttribute("style", "height: 99% !important;");            
            const listGroup = epsdViwr.querySelector('.list-group');
            listGroup.innerHTML = '';
        
            for (const [key, value] of Object.entries(episodes)) {
                const url = value.url;
                const match = url.match(/-([0-9]+)-bolum$/);
                if (match) {
                    const episodeNumber = parseInt(match[1], 10);
            
                    const newListItem = document.createElement('li');
                    newListItem.className = 'list-group-item';
                    newListItem.setAttribute('data-epsd', episodeNumber);
                    newListItem.innerHTML = `${episodeNumber}.Bölüm <img src="/src/assets/img/dwnldPrcss.gif" alt="dwnldPrcss">`;
            
                    listGroup.appendChild(newListItem);
                }
            }
            cntntWrpr.insertAdjacentElement('afterend', epsdViwr);
            alert("(ÖNEMLİ) İndirlmek istenen sezon içersindeki tüm bölümler indirilmeden herhangi bir işlem yapılamaz.\n\n(ÖNEMLİ) İşlemi yarıda kesmeniz durumunda tekrar kaldığınız yerden indirmeye devam edemezsiniz.\n\n(ÖNEMLİ) Tüm indirmler sonlandıktan sonra anasayfaya yönlendirileceksiniz.")
            chrome.runtime.sendMessage({
                action: 'opnUrl',
                opnUrl: {
                    season: seasonNumber,
                    episodes: Object.values(episodes)
                }
            });
            mnCntnr.setAttribute("style", `height: 320px !important;`);
        });

        seasonDiv.className = 'season-dwnld';
        seasonDiv.appendChild(button);
        buttonContainer.appendChild(seasonDiv);
    }
    brickElement.insertAdjacentElement('afterend', buttonContainer);
}

document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
            const activeTabId = tabs[0].id;
            chrome.tabs.reload(activeTabId);
        }
    });
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "senderData") {
        setTimeout(() => {
            populateContent(message.senderAllDt);
        }, 1250);
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
        const mnCntnr = document.querySelector('.mn_cntnr');
        const cntntWrpr = document.getElementById('cntnt_wrpr');
        const epsdViwr = document.querySelector(".epsd-viwr_wrpr");

        epsdViwr.remove();
        mnCntnr.removeAttribute("style");
        cntntWrpr.removeAttribute("style");
    }
});