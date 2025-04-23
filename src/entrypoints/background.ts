import { defineBackground, Browser, browser } from '#imports';

export default defineBackground(() => {
    // Store active connections from content scripts
    const connections: Record<string, Browser.runtime.Port> = {};
    // Track if the listener is currently active
    let isListenerActive = false;

    // Define the listener function separately so we can reference it for removal
    const requestListener = (details: Browser.webRequest.WebRequestBodyDetails) => {
        if (details.url.endsWith('.vtt')) {
            const url = new URL(details.url);
            getVTTFile(url.toString())
                .then(text => {
                    // Remove the listener after successfully getting the VTT file
                    browser.webRequest.onBeforeRequest.removeListener(requestListener);
                    isListenerActive = false;

                    const message = {
                        type: 'vtt-file',
                        data: text,
                        url: details.url,
                    };

                    // Instead of querying for the tab, use the details.tabId
                    // from the request to know which tab made the request
                    const requestTabId = details.tabId?.toString();

                    if (requestTabId && connections[requestTabId]) {
                        connections[requestTabId].postMessage(message);
                    } else {
                        // If we can't determine the tab or don't have a connection,
                        // broadcast to all connected tabs
                        Object.values(connections).forEach(port => {
                            port.postMessage(message);
                        });
                    }
                })
                .catch(error => {
                    console.error('Error fetching VTT file:', error);
                });
        }
    };

    const addVTTListener = () => {
        if (!isListenerActive) {
            browser.webRequest.onBeforeRequest.addListener(requestListener, { urls: ['*://*.la.utexas.edu/*'] }, [
                'requestBody',
            ]);
            isListenerActive = true;
            console.warn('VTT file listener added');
        }
    };

    // Listen for connection attempts from content scripts
    browser.runtime.onConnect.addListener(port => {
        const sender = port.sender;
        const tabId = sender?.tab?.id?.toString();

        if (!tabId) {
            return;
        }

        // Store the connection using tabId as a string key
        connections[tabId] = port;
        console.warn(`Connected to tab ${tabId}`);

        // Ensure the VTT listener is active when a new connection is made
        addVTTListener();

        // Remove connection when it's disconnected
        port.onDisconnect.addListener(() => {
            delete connections[tabId];
            console.warn(`Disconnected from tab ${tabId}`);
        });

        // Listen for messages from this port
        port.onMessage.addListener(message => {
            console.warn(`Message from tab ${tabId}:`, message);
            // Handle any messages from content script if needed
        });
    });

    const getVTTFile = async (url: string) => {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'text/vtt',
            },
        });

        if (response.ok) {
            const vttText = await response.text();
            return vttText;
        } else {
            console.error('Failed to fetch VTT file:', response.status);
            throw new Error('Failed to fetch VTT file');
        }
    };

    // Initialize the listener
    addVTTListener();
});
