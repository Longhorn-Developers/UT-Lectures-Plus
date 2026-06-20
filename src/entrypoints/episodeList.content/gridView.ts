export const VIEW_MODE_KEY = 'utlp-view-mode';

let originalColumns: HTMLElement[] = [];

/**
 * Gets the current view mode from localStorage
 *
 * @returns {'list' | 'grid'} The current view mode, defaulting to 'list'
 */
export function getCurrentMode(): 'list' | 'grid' {
    return (localStorage.getItem(VIEW_MODE_KEY) ?? 'list') as 'list' | 'grid';
}

/**
 * Records the original column wrappers that contain episode elements,so the page's original layout can be restored when switching modes.
 */
export function saveOriginalPositions(): void {
    const episodes = [...document.querySelectorAll<HTMLElement>('div.episode')];

    originalColumns = [...new Set(episodes.map(ep => ep.parentElement).filter(Boolean))] as HTMLElement[];
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
    const container = originalColumns[0]?.parentElement as HTMLElement | null;
    if (!container) return;

    if (mode === 'grid') {
        episodes.forEach(ep => container.appendChild(ep));
        originalColumns.forEach(col => {
            col.style.display = 'none';
        });

        Object.assign(container.style, {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
            padding: '4px 0',
            alignItems: 'start',
        });
    } else {
        episodes.forEach(ep => container.appendChild(ep));

        originalColumns.forEach(col => {
            col.style.display = 'contents';
        });

        Object.assign(container.style, {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
            gap: '4px 16px',
        });
    }

    episodes.forEach(ep => styleEpisodeCard(ep, mode));
}

/**
 * Styles a single episode element according to the given view mode
 *
 * @param episode - The episode element to style.
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

        const link = episode.querySelector<HTMLAnchorElement>('a');
        if (link?.href) {
            window.location.href = link.href;
        }
    });

    if (link) {
        link.style.cssText = 'display: none !important; position: absolute; width: 0; height: 0;';
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

    let actionsRow = episode.querySelector<HTMLElement>('[data-utlp-card-actions]');
    if (actionsRow && actionsRow.parentElement !== cardBody) cardBody.appendChild(actionsRow);
    if (!actionsRow) {
        actionsRow = document.createElement('div');
        actionsRow.dataset.utlpCardActions = '1';
        cardBody.appendChild(actionsRow);
    }

    Object.assign(actionsRow.style, {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '0px',
        flexShrink: '0',
        marginTop: '0',
        marginLeft: 'auto',
    });

    episode.querySelectorAll<HTMLElement>('span[style*="inline-flex"]').forEach(span => {
        if (span.parentElement !== actionsRow) actionsRow!.appendChild(span);
    });
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

    let actionsRow = episode.querySelector<HTMLElement>('[data-utlp-card-actions]');
    if (!actionsRow) {
        actionsRow = document.createElement('div');
        actionsRow.dataset.utlpCardActions = '1';
        episode.appendChild(actionsRow);
    }
    Object.assign(actionsRow.style, {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '0px',
        flexShrink: '0',
        marginLeft: 'auto',
    });

    episode.querySelectorAll<HTMLElement>('span[style*="inline-flex"]').forEach(span => {
        if (span.parentElement !== actionsRow) actionsRow!.appendChild(span);
    });
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
        window.location.href = link.href;
    }
}
