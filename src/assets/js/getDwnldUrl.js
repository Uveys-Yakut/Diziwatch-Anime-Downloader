function flNm(ttl) {
    const flNm = ttl.toString().toLowerCase()
    .replace(/\./g, '_')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_');;

    return flNm;
}
function closeWindow(epsdeNmbr) {
    chrome.runtime.sendMessage({ action: 'dwnldWtchFl', epsdeNmbr: epsdeNmbr });
}
async function downloadVideo(videoUrl, filename, epsdeNmbr) {
    try {
        const response = await fetch(videoUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const blob = await response.blob();

        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();

        URL.revokeObjectURL(blobUrl);
        document.body.removeChild(link);

        closeWindow(epsdeNmbr);
    } catch (error) {
        console.error('Video indirme sırasında bir hata oluştu:', error);
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getUrlCntnt') {
        const regex = /'pid'\s*:\s*(\d+)/;
        const htmlCntnt = document.documentElement.outerHTML;
        const pidMatch = htmlCntnt.match(regex);

        if (!pidMatch) {
            console.error('PID bulunamadı');
            return;
        }

        const pidCntnt = pidMatch[0].split(": ")[1].trim();
        const data = { action: "playlist", pid: pidCntnt };
        const ftchUrl = new URL('https://diziwatch.net/wp-admin/admin-ajax.php');
        ftchUrl.search = new URLSearchParams(data).toString();

        fetch(ftchUrl, {
            method: 'GET'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const sources = data[0]["sources"];
            const highQulty_wtchDt = sources[sources.length - 1];
            const highQulty_Qulty = highQulty_wtchDt["label"];
            const highQulty_Url = highQulty_wtchDt["file"];
            const mimeType = highQulty_wtchDt["type"].split("/")[1];
            const wtchFlNm = flNm(data[0]["title"])+"_"+highQulty_Qulty;
            const epsdeNmbr = parseInt((wtchFlNm.match(/(\d+)_bölüm/) || [])[1], 10);

            downloadVideo(highQulty_Url, wtchFlNm+"."+mimeType, epsdeNmbr);
        })
        .catch(error => {
            console.error('Fetch işleminde bir hata oluştu:', error);
        });
        return;
    }

    return;
});
