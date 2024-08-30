chrome.storage.local.set({ screenWidth: window.screen.width, screenHeight: window.screen.height });
var dzwtchCntnt = document.getElementsByClassName("incontentx");

if(dzwtchCntnt.length > 0) {
    var animeSctns_Dt = {};
    var animeNm = dzwtchCntnt[0].childNodes[1].childNodes[1].textContent;
    var animePosterUrl = dzwtchCntnt[0].childNodes[3].childNodes[1].childNodes[2].childNodes[0].src;

    dzwtchCntnt[0].childNodes[7].childNodes[3].childNodes.forEach((item, index) => {
        if (index % 2 === 1) {
            const url = item.childNodes[2].href.split('-bolum')[0]+"-bolum";
            const regex = /-([0-9]+)-sezon-([0-9]+)-bolum/;
            const match = url.match(regex);
        
            if (match) {
                const seasonNumber = `season_${match[1]}`;
                const episodeNumber = match[2];
        
                if (!animeSctns_Dt[seasonNumber]) {
                    animeSctns_Dt[seasonNumber] = {};
                }
        
                animeSctns_Dt[seasonNumber][episodeNumber] = { "url": url};
            } else {
                console.log(`URL'de sezon veya bölüm bilgisi bulunamadı: ${url}`);
            }
        }
    });
    senderAll_Dt = [
        animeNm,
        animePosterUrl,
        animeSctns_Dt
    ]

    chrome.runtime.sendMessage({action: 'senderData', senderAllDt: senderAll_Dt});
}