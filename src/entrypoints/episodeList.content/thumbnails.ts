import { getCachedThumbnail, saveCachedThumbnail } from '@/storage/videoThumbnails';

const THUMB_WIDTH = 480;
const MAX_CONCURRENT = 2;
const FRAME_TIMEOUT_MS = 20000;

const VIDEO_URL_RE = /https?:\/\/[^\s"'<>\\]+?\.(?:mp4|m4v|webm|m3u8)(?:\?[^\s"'<>\\]*)?/i;
const RELATIVE_VIDEO_RE = /["']([^"'\s<>]+?\.(?:mp4|m4v|webm|m3u8)(?:\?[^"'\s<>]*)?)["']/i;

const inFlight = new Map<string, Promise<string | null>>();
const queue: (() => void)[] = [];
let active = 0;

function runLimited<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const start = () => {
            active++;
            task()
                .then(resolve, reject)
                .finally(() => {
                    active--;
                    queue.shift()?.();
                });
        };
        if (active < MAX_CONCURRENT) start();
        else queue.push(start);
    });
}

/**
 * Finds the video source for an episode by fetching its page (same origin, so the
 * user's session cookies are sent) and looking for a video file URL in the HTML.
 *
 * @param episodeUrl - The episode page URL
 * @returns The absolute video URL, or null if none is found
 */
async function findVideoSrc(episodeUrl: string): Promise<string | null> {
    const res = await fetch(episodeUrl, { credentials: 'include' });
    if (!res.ok) return null;
    const html = await res.text();

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const tagSrc =
        doc.querySelector<HTMLSourceElement>('video source[src]')?.getAttribute('src') ??
        doc.querySelector<HTMLVideoElement>('video[src]')?.getAttribute('src');
    if (tagSrc) return new URL(tagSrc, episodeUrl).toString();

    const abs = html.match(VIDEO_URL_RE)?.[0];
    if (abs) return abs.replace(/\\\//g, '/');

    const rel = html.match(RELATIVE_VIDEO_RE)?.[1];
    return rel ? new URL(rel.replace(/\\\//g, '/'), episodeUrl).toString() : null;
}

/**
 * Loads a video off-screen, seeks to its midpoint, and returns that frame as a JPEG data URL.
 * Rejects on network/CORS errors, tainted canvases, or timeout.
 *
 * @param src - The video URL
 * @returns The midpoint frame as a JPEG data URL
 */
function grabMidpointFrame(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.preload = 'metadata';
        video.playsInline = true;

        const cleanup = () => {
            clearTimeout(timer);
            video.removeAttribute('src');
            video.load();
        };
        const fail = (msg: string) => {
            cleanup();
            reject(new Error(msg));
        };
        const timer = setTimeout(() => fail('timeout'), FRAME_TIMEOUT_MS);

        video.addEventListener('error', () => fail('video error'), { once: true });
        video.addEventListener(
            'loadedmetadata',
            () => {
                const d = video.duration;
                video.currentTime = Number.isFinite(d) && d > 0 ? d / 2 : 0;
            },
            { once: true }
        );
        video.addEventListener(
            'seeked',
            () => {
                try {
                    const w = video.videoWidth || 16;
                    const h = video.videoHeight || 9;
                    const canvas = document.createElement('canvas');
                    canvas.width = THUMB_WIDTH;
                    canvas.height = Math.round((THUMB_WIDTH * h) / w);
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return fail('no canvas context');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    cleanup();
                    resolve(dataUrl);
                } catch (e) {
                    fail(`canvas error: ${String(e)}`);
                }
            },
            { once: true }
        );

        video.src = src;
    });
}

async function getThumbnail(episodeUrl: string): Promise<string | null> {
    const cached = await getCachedThumbnail(episodeUrl);
    if (cached) return cached;

    const existing = inFlight.get(episodeUrl);
    if (existing) return existing;

    const p = runLimited(async () => {
        try {
            const src = await findVideoSrc(episodeUrl);
            if (!src) return null;
            const dataUrl = await grabMidpointFrame(src);
            await saveCachedThumbnail(episodeUrl, dataUrl);
            return dataUrl;
        } catch (e) {
            console.warn('[UTLP] Thumbnail unavailable for', episodeUrl, e);
            return null;
        }
    }).finally(() => inFlight.delete(episodeUrl));

    inFlight.set(episodeUrl, p);
    return p;
}

function setThumbImage(thumb: HTMLElement, dataUrl: string) {
    let img = thumb.querySelector<HTMLImageElement>('img[data-utlp-thumb-img]');
    if (!img) {
        img = document.createElement('img');
        img.dataset.utlpThumbImg = '1';
        img.alt = '';
        img.draggable = false;
        Object.assign(img.style, {
            position: 'absolute',
            inset: '0',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
        });
        thumb.appendChild(img);
    }
    img.src = dataUrl;
}

const observer =
    typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
              entries => {
                  entries.forEach(entry => {
                      if (!entry.isIntersecting) return;
                      const thumb = entry.target as HTMLElement;
                      observer?.unobserve(thumb);
                      void loadInto(thumb);
                  });
              },
              { rootMargin: '300px' }
          )
        : null;

async function loadInto(thumb: HTMLElement) {
    const episodeUrl = thumb.dataset.utlpThumbSrc;
    if (!episodeUrl) return;
    const dataUrl = await getThumbnail(episodeUrl);
    // Gray background stays as the fallback when no frame could be grabbed.
    if (dataUrl && thumb.dataset.utlpThumbSrc === episodeUrl) setThumbImage(thumb, dataUrl);
}

/**
 * Attaches a lazily-loaded midpoint-frame thumbnail to a grid card's gray placeholder.
 * Safe to call repeatedly; each placeholder is only wired up once per episode URL.
 *
 * @param thumb - The gray placeholder element
 * @param episodeUrl - The episode page URL the card links to
 */
export function attachVideoThumbnail(thumb: HTMLElement, episodeUrl: string | undefined): void {
    if (!episodeUrl || thumb.dataset.utlpThumbSrc === episodeUrl) return;
    thumb.dataset.utlpThumbSrc = episodeUrl;
    if (observer) observer.observe(thumb);
    else void loadInto(thumb);
}
