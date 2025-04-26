import '~/assets/tailwind.css';
import { render } from 'solid-js/web';
import App from './App.tsx';
import { createSignal } from 'solid-js';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import { browser, defineContentScript } from '#imports';
export default defineContentScript({
    matches: ['*://*.la.utexas.edu/app_home/*', '*://*.la.utexas.edu/player/episode/*'],
    cssInjectionMode: 'ui',
    async main(ctx) {
        // Create a signal to store the VTT data
        const [vttData, setVttData] = createSignal(null);
        const [vttUrl, setVttUrl] = createSignal<string | null>(null);
        const [videoElement, setVideoElement] = createSignal<HTMLVideoElement>();

        // Create a connection to the background script
        const port = browser.runtime.connect({ name: 'content-script-connection' });

        // Listen for messages on the port
        port.onMessage.addListener(message => {
            if (message.type === 'vtt-file') {
                setVttData(message.data);
                setVttUrl(message.url);
            }
        });

        // Clean up when the content script is invalidated
        ctx.onInvalidated(() => {
            port.disconnect();
        });

        const waitForVideoAndSetup = (): void => {
            const observer = new MutationObserver((mutations, obs) => {
                const videoContainer = document.querySelector('.video-js') as HTMLElement;
                const progressBar = document.querySelector('.progress-bar') as HTMLElement;

                if (videoContainer) {
                    const videoElement = videoContainer.querySelector('video');

                    if (!videoElement) {
                        console.error('Video element not found');
                        return;
                    }

                    console.warn('🎥 Video found!');

                    // Stop observing since we found the video
                    obs.disconnect();

                    videoContainer.style.borderRadius = '1rem';
                    videoContainer.style.backgroundColor = 'oklch(98.4% 0.003 247.858)';
                    videoContainer.style.overflow = 'hidden';

                    videoElement.style.borderRadius = '1rem';

                    videoContainer.style.boxShadow = '0 25px 50px -12px rgb(0 0 0 / 0.25)';

                    setVideoElement(videoElement);
                }

                if (progressBar) {
                    console.warn('🎥 Progress bar found!');
                    progressBar.style.backgroundColor = 'oklch(98.4% 0.003 247.858)';
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });

            setTimeout(() => {
                const container = document.querySelector('.video-js') as HTMLElement;
                if (container) {
                    const video = container.querySelector('video');

                    if (!video) {
                        console.error('Video element not found');
                        return;
                    }

                    console.warn('🎥 Video found on fallback!');
                    observer.disconnect();

                    container.style.borderRadius = '1rem';
                    container.style.backgroundColor = 'oklch(98.4% 0.003 247.858)';
                    container.style.overflow = 'hidden';

                    video.style.borderRadius = '1rem';

                    setVideoElement(video);
                }
            }, 5000); // fallback after 5 seconds
        };

        waitForVideoAndSetup();

        const ui = await createShadowRootUi(ctx, {
            name: 'utlp-sidebar',
            position: 'inline',
            onMount: uiContainer => {
                render(
                    () => (
                        <App vttUrl={vttUrl} vttData={vttData} videoElement={videoElement} uiContainer={uiContainer} />
                    ),
                    uiContainer
                );
            },
        });

        ui.mount();
    },
});
