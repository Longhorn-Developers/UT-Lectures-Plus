import '~/assets/tailwind.css';
import { render } from 'solid-js/web';
import { JSX } from 'solid-js';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import { defineContentScript } from '#imports';
import BookmarkButton from '@/components/content/BookmarkButton';
import EditTitleButton from '@/components/content/EditTitleButton';
import { getAllCustomTitles } from '@/storage/lectureTitles';

/**
 * Content Script
 *
 * Injects bookmark & edit-title buttons into lecture episode elements.
 * Uses a MutationObserver to handle dynamically loaded content.
 */
export default defineContentScript({
    matches: ['<all_urls>'],
    cssInjectionMode: 'ui',
    async main(ctx) {
        const injectButtons = async () => {
            const customTitles = await getAllCustomTitles();
            const episodes = document.querySelectorAll('div.episode');

            episodes.forEach(async episode => {
                const titleEl = episode.querySelector<HTMLElement>('span.episode_title');
                if (!titleEl || titleEl.dataset.utlpPatched) {
                    return;
                }
                titleEl.dataset.utlpPatched = 'true';

                const originalTitle = titleEl.textContent?.trim() ?? '';
                const link = episode.querySelector('a');
                const url = link?.href ?? '';
                const id = url || originalTitle;

                const savedTitle = customTitles[url] ?? null;
                if (savedTitle && savedTitle !== originalTitle) {
                    titleEl.textContent = savedTitle;
                    titleEl.title = `Original: ${originalTitle}`;
                }

                // Creates a shadow root UI and mounts a Solid component into it
                const mountAfter = async (name: string, anchor: Element, component: () => JSX.Element) => {
                    const span = document.createElement('span');
                    span.style.cssText =
                        'display: inline-flex; align-items: center; vertical-align: middle; margin-left: 8px;';
                    anchor.insertAdjacentElement('afterend', span);
                    const ui = await createShadowRootUi(ctx, {
                        name,
                        position: 'inline',
                        anchor: span,
                        onMount: container => {
                            container.style.cssText =
                                'display: inline-flex; align-items: center; vertical-align: middle;';
                            render(component, container);
                        },
                    });
                    ui.mount();
                    return span;
                };

                // Bookmark
                const bookmarkSpan = await mountAfter('utlp-lecture-bookmark', titleEl, () => (
                    <BookmarkButton id={id} title={originalTitle} url={url} />
                ));

                // Edit title
                const editSpan = await mountAfter('utlp-edit-title', bookmarkSpan, () => (
                    <EditTitleButton
                        titleEl={titleEl}
                        episodeUrl={url}
                        originalTitle={originalTitle}
                        onSave={newTitle => {
                            titleEl.title = newTitle !== originalTitle ? `Original: ${originalTitle}` : '';
                        }}
                    />
                ));
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
