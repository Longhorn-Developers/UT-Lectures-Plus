export default defineBackground(() => {
    function list(e) {
        // console.log("what is e?")
        // console.log(e)
        let searchTerm = "utexas";
        if (e.initiator.includes(searchTerm)) {
            // recieved = true;
            let caption_url = e.url;
            // console.log("captions found")
            //console.log(caption_url)

            fetch(caption_url)
                .then((r) => r.text())
                .then((result) => {
                    console.log(result);
                    chrome.tabs.query(
                        {
                            active: true,
                            currentWindow: true,
                        },
                        function (tabs) {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                captions: result,
                                source: e.initiator,
                            });
                        }
                    );
                });
        }
    }

    function iframeworkaround(e) {
        if ((e.method = "GET")) {
            // console.log("what is e?")
            // console.log(e.requestHeaders[10])
            if (e.requestHeaders[10]) {
                if (e.requestHeaders[10].name === "Referer") {
                    let video_url = e.requestHeaders[10].value;
                    //console.log(video_url)
                    chrome.tabs.query(
                        {
                            active: true,
                            currentWindow: true,
                        },
                        function (tabs) {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                video_url: video_url,
                            });
                        }
                    );
                }
            }
        }
    }
    chrome.webRequest.onCompleted.addListener(
        function (e) {
            {
                list(e);
            }
        },
        {
            urls: ["*://*/*.vtt"],
            types: ["xmlhttprequest"],
        },
        ["responseHeaders"]
    );

    chrome.webRequest.onBeforeSendHeaders.addListener(
        function (e) {
            {
                iframeworkaround(e);
            }
        },
        {
            urls: ["*://*/*.edu"],
            types: ["xmlhttprequest"],
        },
        ["extraHeaders", "requestHeaders"]
    );
});
