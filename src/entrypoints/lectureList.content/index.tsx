import '~/assets/tailwind.css';
import { render } from 'solid-js/web';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import { defineContentScript } from '#imports';
import BookmarkButton from '@/components/content/BookmarkButton';

/**
 * Content Script
 *
 * Injects bookmark buttons into lecture episode elements on the page.
 * Uses a MutationObserver to handle dynamically loaded content.
 */
export default defineContentScript({
    matches: ['<all_urls>'],
    cssInjectionMode: 'ui',
    async main(ctx) {
        const injectButtons = async () => {
            const episodes = document.querySelectorAll('div.episode');

            episodes.forEach(async episode => {
                // Avoid injecting twice
                if (episode.querySelector('.utlp-bookmark-mount')) return;

                const titleEl = episode.querySelector('span.episode_title');
                if (!titleEl) {
                    return;
                }

                const title = titleEl.textContent?.trim() ?? '';
                const link = episode.querySelector('a');
                const url = link?.href ?? '';
                const id = url || title;

                // Create a mount point
                const mountPoint = document.createElement('span');
                mountPoint.className = 'utlp-bookmark-mount';
                mountPoint.style.cssText = 'display: inline-block; vertical-align: middle; margin-left: 8px;';
                titleEl.appendChild(mountPoint);

                const ui = await createShadowRootUi(ctx, {
                    name: 'utlp-lecture-bookmark',
                    position: 'inline',
                    anchor: mountPoint,
                    onMount: container => {
                        container.style.cssText = 'display: contents;';
                        render(() => <BookmarkButton id={id} title={title} url={url} />, container);
                    },
                });

                ui.mount();
            });
        };

        // Observe dynamic content changes
        const observer = new MutationObserver(() => {
            injectButtons();
        });

        observer.observe(document.body, { childList: true, subtree: true });

        await injectButtons();
    },
});
