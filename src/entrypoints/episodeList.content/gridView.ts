export const VIEW_MODE_KEY = 'utlp-view-mode';

let listResizeObservers: ResizeObserver[] = [];

const episodeColumns = new WeakMap<HTMLElement, HTMLElement>();

function getListColumnCount(containerWidth: number, minColWidth = 450, maxCols = 10): number {
    return Math.min(Math.max(1, Math.floor(containerWidth / minColWidth)), maxCols);
}

function buildThumbnail(): HTMLElement {
    const thumb = document.createElement('div');
    thumb.dataset.utlpThumb = '1';
    Object.assign(thumb.style, {
        width: '100%',
        aspectRatio: '16 / 9',
        background: '#d1d5db',
        flexShrink: '0',
        position: 'relative',
        borderRadius: '6px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
        overflow: 'hidden',
    });

    return thumb;
}

function onHoverIn(this: HTMLElement) {
    const thumb = this.querySelector<HTMLElement>('[data-utlp-thumb]');
    if (thumb) thumb.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    this.style.zIndex = '20';
}

function onHoverOut(this: HTMLElement) {
    const thumb = this.querySelector<HTMLElement>('[data-utlp-thumb]');
    if (thumb) thumb.style.boxShadow = '0 1px 4px rgba(0,0,0,0.10)';
    this.style.zIndex = '';
}

function onTitleClick(this: HTMLElement, e: MouseEvent) {
    e.stopPropagation();
    const episode = this.closest<HTMLElement>('div.episode');
    const link = episode?.querySelector<HTMLAnchorElement>('a');
    if (link?.href) {
        window.open(link.href, link.target || '_blank');
    }
}

function ensureActionsRow(episode: HTMLElement, parent: HTMLElement): HTMLElement {
    let actionsRow = episode.querySelector<HTMLElement>('[data-utlp-card-actions]');
    if (!actionsRow) {
        actionsRow = document.createElement('div');
        actionsRow.dataset.utlpCardActions = '1';
        parent.appendChild(actionsRow);
    } else if (actionsRow.parentElement !== parent) {
        parent.appendChild(actionsRow);
    }

    Object.assign(actionsRow.style, {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '0px',
        flexShrink: '0',
        marginLeft: 'auto',
        marginTop: '0',
    });

    episode.querySelectorAll<HTMLElement>('span[style*="inline-flex"]').forEach(span => {
        if (span.parentElement !== actionsRow) actionsRow!.appendChild(span);
    });

    return actionsRow;
}

function applyGridCard(episode: HTMLElement, link: HTMLAnchorElement | null, titleEl: HTMLElement | null) {
    Object.assign(episode.style, {
        display: 'flex',
        flexDirection: 'column',
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        borderRadius: '0',
        overflow: 'visible',
        position: 'relative',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
        alignItems: 'stretch',
        gap: '8px',
        padding: '0',
    });

    episode.removeEventListener('mouseenter', onHoverIn);
    episode.removeEventListener('mouseleave', onHoverOut);
    episode.addEventListener('mouseenter', onHoverIn);
    episode.addEventListener('mouseleave', onHoverOut);

    let thumb = episode.querySelector<HTMLElement>('[data-utlp-thumb]');
    if (!thumb) {
        thumb = buildThumbnail();
        episode.insertBefore(thumb, episode.firstChild);
        thumb.style.position = 'relative';
    }
    thumb.style.display = 'block';

    thumb.addEventListener('click', e => {
        e.stopPropagation();
        e.preventDefault();
        const link = episode.querySelector<HTMLAnchorElement>('a');
        if (link?.href) {
            window.open(link.href, link.target || '_blank');
        }
    });

    if (link) {
        link.style.cssText =
            'display: none; position: absolute; width: 0; height: 0; overflow: hidden; pointer-events: none;';
    }

    let cardBody = episode.querySelector<HTMLElement>(':scope > [data-utlp-card-body]');
    if (!cardBody) {
        cardBody = document.createElement('div');
        cardBody.dataset.utlpCardBody = '1';
        episode.appendChild(cardBody);
    }

    Object.assign(cardBody.style, {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0',
        gap: '8px',
        flex: '1',
        minHeight: '60px',
        width: '100%',
        boxSizing: 'border-box',
    });

    if (titleEl && titleEl.parentElement !== cardBody) cardBody.appendChild(titleEl);
    if (titleEl) {
        Object.assign(titleEl.style, {
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: '2',
            overflow: 'visible',
            textOverflow: 'ellipsis',
            lineHeight: '1.4',
            flex: '1',
            minWidth: '0',
            wordBreak: 'break-word',
            textAlign: 'left',
            cursor: 'pointer',
        });

        titleEl.removeEventListener('click', onTitleClick);
        titleEl.addEventListener('click', onTitleClick);
    }

    ensureActionsRow(episode, cardBody);
}

function applyListCard(episode: HTMLElement, link: HTMLAnchorElement | null, titleEl: HTMLElement | null) {
    Object.assign(episode.style, {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: '',
        overflow: '',
        boxShadow: '',
        background: '',
        border: '',
        cursor: '',
        transition: '',
        gap: '8px',
        padding: '4px 0',
    });

    episode.removeEventListener('mouseenter', onHoverIn);
    episode.removeEventListener('mouseleave', onHoverOut);

    const thumb = episode.querySelector<HTMLElement>('[data-utlp-thumb]');
    if (thumb) thumb.style.display = 'none';

    if (link) link.style.cssText = '';

    const cardBody = episode.querySelector<HTMLElement>('[data-utlp-card-body]');
    if (cardBody) {
        while (cardBody.firstChild) episode.appendChild(cardBody.firstChild);
        cardBody.remove();
    }

    if (titleEl) {
        Object.assign(titleEl.style, {
            display: 'block',
            flex: '1',
            fontSize: '',
            fontWeight: '',
            fontFamily: '',
            color: '',
            lineHeight: '',
            overflow: '',
            textOverflow: '',
            WebkitLineClamp: '',
            WebkitBoxOrient: '',
            wordBreak: '',
            textAlign: 'left',
            minWidth: '0',
        });
    }

    ensureActionsRow(episode, episode);
}

/**
 * Styles a single episode element according to the given view mode
 *
 * @param {HTMLElement}episode - The episode element to style.
 * @param {'list' | 'grid'} mode - The view mode to style the episode for.
 */
export function styleEpisodeCard(episode: HTMLElement, mode: 'list' | 'grid'): void {
    episode.dataset.utlpViewMode = mode;
    const link = episode.querySelector<HTMLAnchorElement>('a');
    const titleEl = episode.querySelector<HTMLElement>('span.episode_title');

    if (mode === 'grid') {
        applyGridCard(episode, link, titleEl);
    } else {
        applyListCard(episode, link, titleEl);
    }
}

function redistributeListEpisodes(container: HTMLElement, episodes: HTMLElement[]): void {
    const numCols = getListColumnCount(container.offsetWidth);
    const rowsPerCol = Math.ceil(episodes.length / numCols);

    container.querySelectorAll<HTMLElement>('[data-utlp-list-col]').forEach(c => c.remove());

    const cols: HTMLElement[] = Array.from({ length: numCols }, () => {
        const col = document.createElement('div');
        col.dataset.utlpListCol = '1';
        Object.assign(col.style, {
            display: 'flex',
            flexDirection: 'column',
            flex: '1',
            minWidth: '0',
            boxSizing: 'border-box',
        });
        container.appendChild(col);
        return col;
    });

    episodes.forEach((ep, i) => {
        const colIndex = Math.floor(i / rowsPerCol);
        const targetCol = cols[colIndex] ?? cols[cols.length - 1];
        targetCol.appendChild(ep);
        styleEpisodeCard(ep, 'list');
    });
}

function disconnectListObservers(): void {
    listResizeObservers.forEach(o => o.disconnect());
    listResizeObservers = [];
}

/**
 * Saves the original parent column of each episode to restore later
 */
export function saveOriginalPositions(): void {
    const episodes = [...document.querySelectorAll<HTMLElement>('div.episode')];
    episodes.forEach(ep => {
        if (ep.parentElement) {
            episodeColumns.set(ep, ep.parentElement);
        }
    });
}

/**
 * Applies the specified view mode to the episode cards.
 *
 * @param {'list' | 'grid'} mode - The view mode to apply, either 'list' or 'grid'.
 */
export function applyViewMode(mode: 'list' | 'grid'): void {
    const currentMode = document.body.dataset.utlpViewMode;
    if (currentMode === mode) return;
    document.body.dataset.utlpViewMode = mode;

    const episodes = [...document.querySelectorAll<HTMLElement>('div.episode')];
    const originalColumns = [...new Set(episodes.map(ep => episodeColumns.get(ep)).filter(Boolean))] as HTMLElement[];
    const containers = [...new Set(originalColumns.map(col => col.parentElement).filter(Boolean))] as HTMLElement[];
    if (!containers.length) return;

    if (mode === 'grid') {
        disconnectListObservers();

        episodes.forEach(ep => {
            const originalCol = episodeColumns.get(ep);
            if (originalCol) originalCol.appendChild(ep);
        });
        originalColumns.forEach(col => {
            col.style.display = 'none';
        });

        containers.forEach(container => {
            container.querySelectorAll('[data-utlp-list-col]').forEach(c => c.remove());
            container.classList.remove('grid', 'grid-cols-1', 'md:grid-cols-3');
            Object.assign(container.style, {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px',
                width: '100%',
                maxWidth: 'none',
                boxSizing: 'border-box',
            });
        });

        originalColumns.forEach(col => {
            col.style.cssText = '';
            const hasEpisodes = [...col.children].some(child => (child as HTMLElement).classList.contains('episode'));
            if (!hasEpisodes) {
                col.style.display = 'none';
                return;
            }
            Object.assign(col.style, {
                display: 'contents',
                gridTemplateColumns: '',
                gap: '',
            });
        });

        episodes.forEach(ep => styleEpisodeCard(ep, 'grid'));
    } else {
        disconnectListObservers();

        originalColumns.forEach(col => {
            col.style.display = 'none';
        });

        containers.forEach(container => {
            container.classList.remove('grid', 'grid-cols-1', 'md:grid-cols-3');
            Object.assign(container.style, {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                flexWrap: 'nowrap',
                gap: '16px',
                width: '100%',
                maxWidth: 'none',
                boxSizing: 'border-box',
            });

            const containerEpisodes = episodes.filter(ep => {
                const originalCol = episodeColumns.get(ep);
                return (
                    originalCol?.closest('[data-utlp-container]') === container ||
                    originalCol?.parentElement === container
                );
            });

            redistributeListEpisodes(container, containerEpisodes);

            const observer = new ResizeObserver(() => {
                redistributeListEpisodes(container, containerEpisodes);
            });

            observer.observe(container);
            listResizeObservers.push(observer);
        });
    }
}

/**
 * Gets the current view mode from localStorage
 *
 * @returns {'list' | 'grid'} The current view mode, defaulting to 'list'
 */
export function getCurrentMode(): 'list' | 'grid' {
    return (localStorage.getItem(VIEW_MODE_KEY) ?? 'list') as 'list' | 'grid';
}
