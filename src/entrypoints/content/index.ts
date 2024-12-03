import "./style.css";

export default defineContentScript({
    matches: ["<all_urls>"], // TODO: Use a more specific pattern
    main() {
        var IFRAME = document.createElement("IFRAME");

        function timestampToMilliseconds(timestamp) {
            // Split the timestamp into hours, minutes, seconds, and seconds
            const splitted_time = timestamp.split(":");
            let hours = "0";
            let minutes = "0";
            let secondsWithMillis = "00.000";
            if (splitted_time.length === 3) {
                hours = splitted_time[0];
                minutes = splitted_time[1];
                secondsWithMillis = splitted_time[2];
            } else if (splitted_time.length === 2) {
                minutes = splitted_time[0];
                secondsWithMillis = splitted_time[1];
            }

            //console.log(secondsWithMillis)
            // Split secondsWithMillis into seconds and seconds
            const [seconds, milliseconds] = secondsWithMillis.split(".");

            // Calculate the total milliseconds
            const totalMilliseconds =
                parseInt(hours, 10) * 60 * 60 * 1000 + // hours to milliseconds
                parseInt(minutes, 10) * 60 * 1000 + // minutes to milliseconds
                parseInt(seconds, 10) * 1000 + // seconds to milliseconds
                parseInt(milliseconds, 10); // milliseconds

            return totalMilliseconds / 1000;
        }

        function isNumeric(input) {
            var isValid = /^\d+$/.test(input);
            return isValid;
        }

        let scroll = true;
        let video_url = null;
        var vid = null;

        function auto_scroll() {
            let existingDiv = document.getElementsByClassName("caption-box")[0];
            if (existingDiv) {
                let children = existingDiv.childNodes;
                // console.log(children)
                let mindif = 10000;
                let cur = {};
                seekedTime = vid.currentTime;
                for (cap of children) {
                    let dif = seekedTime - cap.dataset.time;
                    if (dif >= 0 && dif <= mindif) {
                        mindif = dif;
                        cur = cap;
                    }
                    cap.style.backgroundColor = "white";
                }
                if (cur) {
                    // console.log(cur)
                    cur.scrollIntoView({
                        block: "center",
                        behavior: "smooth",
                    });
                    cur.style.backgroundColor = "LightGray";
                }
            }
        }

        var delayInMilliseconds = 1000; //1 second

        setTimeout(function () {
            vid = document.getElementsByTagName("video")[0];
            if (vid) {
                vid.ontimeupdate = auto_scroll;
                vid.onseeked = function () {
                    let existingDiv =
                        document.getElementsByClassName("caption-box")[0];
                    if (existingDiv) {
                        let children = existingDiv.childNodes;
                        //console.log(children)
                        let mindif = 10000;
                        let cur = {};
                        seekedTime = vid.currentTime;
                        for (cap of children) {
                            let dif = seekedTime - cap.dataset.time;
                            if (dif >= 0 && dif <= mindif) {
                                mindif = dif;
                                cur = cap;
                            }
                        }
                        if (cur)
                            //console.log(cur)
                            cur.scrollIntoView({
                                block: "center",
                            });
                    }
                };
            }
        }, delayInMilliseconds);

        chrome.runtime.onMessage.addListener(async function (
            msg,
            sender,
            sendResponse
        ) {
            //console.log(msg)
            let loadCheck =
                document.getElementsByClassName("flex-container")[0];
            if (msg.captions && !loadCheck) {
                //modified_captions = addNewlineBeforeTimestamps(msg.captions)
                cur_url = window.document.location.href;
                //console.log(cur_url)

                if (msg.source.includes("utexas")) {
                    let caption_divs = [];
                    let captions = msg.captions;
                    let pattern = /^\d+\s*\n/gm;

                    // Use replace() to remove those lines (replace them with an empty string)
                    let cleanedText = captions.replace(pattern, "");

                    pattern = /^ +/gm;

                    // Use replace() to remove the leading whitespace
                    cleanedText = cleanedText.replace(pattern, "");
                    let caption_chunks = cleanedText.split("\n\n");
                    caption_chunks.shift();

                    //caption_chunks = caption_chunks[1];
                    if (caption_chunks.length == 1)
                        caption_chunks = caption_chunks[0].split("\n\r\n");
                    //console.log(caption_chunks)
                    for (chunk of caption_chunks) {
                        let s = chunk.split("\n");
                        if (s.length > 1) {
                            var isValid = /^\d+$/.test("" + s[0]);
                            if (isNumeric(s[0].trim())) {
                                s.shift();
                            }
                            let timestamp = s[0].split(" ")[0];
                            let cap = s.slice(1).join(" ");
                            let milliseconds = "";
                            if (timestamp) {
                                milliseconds =
                                    timestampToMilliseconds(timestamp);
                            } else {
                                milliseconds = "";
                            }
                            caption_divs.push({
                                timestamp: timestamp,
                                caption: cap,
                                milliseconds: milliseconds,
                            });
                        }
                    }

                    let existingDiv = null;
                    if (msg.source.includes("lecturecapture")) {
                        existingDiv =
                            document.getElementsByClassName("videorow")[0];
                    } else if (msg.source.includes("tower")) {
                        existingDiv = document.getElementById("video_app"); //getElementsByClassName('videorow')[0];
                        // document.getElementById('video_app').classList.add("video_style_addon");
                        document
                            .getElementsByClassName("container")[0]
                            .classList.add("container_addon");
                        document
                            .querySelector("#video_app > div > div")
                            .classList.add("container_addon");
                        document.querySelector(
                            "#video_app > div > div"
                        ).style.marginTop = "30px";
                        document
                            .querySelector(
                                "#video_app > div > div > div:nth-child(2)"
                            )
                            .classList.add("container_addon");
                        document
                            .querySelector(
                                "#video_app > div > div > div.container_addon > div:nth-child(2)"
                            )
                            .classList.add("container_addon");
                        document
                            .querySelector(
                                "#video_app > div > div > div.container_addon > div:nth-child(2)"
                            )
                            .classList.add("cascade_addon");
                        document
                            .querySelector("#fullscreen_element")
                            .classList.add("big_video_addon");
                    }
                    existingDiv.classList.add("video_style");
                    //document.getElementById('video_app');//getElementsByClassName('videorow')[0];
                    const flexContainer = document.createElement("div");
                    flexContainer.classList.add("flex-container");

                    flexContainer.appendChild(existingDiv);

                    const injectElementOutside = document.createElement("div");
                    injectElementOutside.classList.add("captionBlob");
                    const injectElement = document.createElement("div");
                    injectElement.className = "caption-box";
                    for (obj of caption_divs) {
                        const preElement = document.createElement("pre");
                        //preElement.className = "hover";
                        preElement.innerHTML =
                            obj.timestamp + "\n" + obj.caption;
                        preElement.dataset.time = obj.milliseconds;
                        preElement.addEventListener("click", function (e) {
                            let video =
                                document.getElementsByTagName("video")[0];
                            video.currentTime = e.srcElement.dataset.time;
                        });
                        injectElement.appendChild(preElement);
                    }
                    injectElementOutside.appendChild(injectElement);
                    const buttonDiv = document.createElement("div");
                    buttonDiv.classList.add("right");
                    const button = document.createElement("button");
                    button.innerHTML = "Auto-Scroll: On";
                    button.onclick = function () {
                        if (!scroll) {
                            if (vid) vid.ontimeupdate = auto_scroll;
                            scroll = true;
                            button.style.background = "white";
                            button.innerHTML = "Auto-Scroll: On";
                        } else {
                            if (vid) {
                                vid.ontimeupdate = function () {
                                    let existingDiv =
                                        document.getElementsByClassName(
                                            "caption-box"
                                        )[0];
                                    let children = existingDiv.childNodes;
                                    // console.log(children)
                                    let mindif = 10000;
                                    let cur = {};
                                    seekedTime = vid.currentTime;
                                    for (cap of children) {
                                        let dif = seekedTime - cap.dataset.time;
                                        if (dif >= 0 && dif <= mindif) {
                                            mindif = dif;
                                            cur = cap;
                                        }
                                        cap.style.backgroundColor = "white";
                                    }
                                    //cur.scrollIntoView({ block: 'center', behavior: 'smooth' });
                                    cur.style.backgroundColor = "LightGray";
                                };
                            }

                            scroll = false;
                            button.style.backgroundColor = "#DCDCDC";
                            button.innerHTML = "Auto-Scroll: Off";
                        }
                    };
                    button.classList.add("button-4");
                    buttonDiv.appendChild(button);
                    injectElementOutside.appendChild(buttonDiv);
                    flexContainer.appendChild(injectElementOutside);

                    document.body.appendChild(flexContainer);
                    //document.body.appendChild(button);

                    // Function to handle search functionality
                    function handleSearch() {
                        const searchInput = document
                            .getElementById("searchInput")
                            .value.toLowerCase();
                        if (searchInput != "") {
                            const captions =
                                document.querySelectorAll(".caption-box pre");

                            captions.forEach((caption) => {
                                const text = caption.textContent.toLowerCase();
                                if (text.includes(searchInput)) {
                                    caption.style.display = "block";
                                    const highlightedText =
                                        caption.textContent.replace(
                                            new RegExp(searchInput, "gi"),
                                            (match) =>
                                                `<span class="highlight">${match}</span>`
                                        );
                                    caption.innerHTML = highlightedText;
                                } else {
                                    caption.style.display = "none";
                                }
                            });
                        } else {
                            const captions =
                                document.querySelectorAll(".caption-box pre");
                            captions.forEach((caption) => {
                                const text = caption.textContent.toLowerCase();
                                if (text.includes(searchInput)) {
                                    caption.style.display = "block";
                                    const highlightedText = caption.textContent;
                                    caption.innerHTML = highlightedText;
                                } else {
                                    caption.style.display = "none";
                                }
                            });
                        }
                    }

                    // Create search bar element
                    const searchBar = document.createElement("input");
                    searchBar.setAttribute("type", "text");
                    searchBar.setAttribute("id", "searchInput");
                    searchBar.setAttribute("placeholder", "Search captions...");
                    searchBar.addEventListener("input", handleSearch);

                    // Create container div to hold search bar and captionBlob
                    const containerDiv = document.createElement("div");
                    if (msg.source.includes("lecturecapture")) {
                        containerDiv.classList.add("search-container");
                    } else if (msg.source.includes("tower")) {
                        containerDiv.classList.add("search-container-tower");
                        containerDiv.classList.add("top_padding");
                    }
                    containerDiv.appendChild(searchBar);

                    // Get reference to existing captionBlob div
                    const captionBlob = document.querySelector(".captionBlob");

                    // Insert container div before the captionBlob div
                    captionBlob.parentNode.insertBefore(
                        containerDiv,
                        captionBlob
                    );

                    // Move the captionBlob inside the container div
                    containerDiv.appendChild(captionBlob);

                    // Adjust styles if needed
                    containerDiv.style.display = "flex";
                    containerDiv.style.flexDirection = "column";
                }
            } else {
                if (video_url == null) {
                    video_url = msg.video_url;
                    //console.log(video_url)
                    const button = document.createElement("button");
                    const frameDiv = document.getElementsByClassName(
                        "tool_content_wrapper"
                    )[0];
                    // Set the button's text content
                    button.textContent =
                        "Click here to open video in new tab with transcript!";

                    // Define the callback function
                    function handleClick() {
                        window.open(video_url);
                        // Add any functionality you want here
                    }

                    // Attach the callback function to the button's click event
                    button.addEventListener("click", handleClick);

                    // Append the button to the document body (or any other container)
                    if (frameDiv) {
                        frameDiv.appendChild(button);
                    }
                }
            }
        });
    },
});
