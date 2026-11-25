import { storage } from '#imports';

interface ThumbnailsByUrl {
    [episodeUrl: string]: string;
}

export const videoThumbnailsStorage = storage.defineItem<ThumbnailsByUrl>('local:video-thumbnails-by-url', {
    fallback: {},
    version: 1,
});

/**
 * Retrieves the cached thumbnail (JPEG data URL) for an episode.
 *
 * @param episodeUrl - The episode URL to look up
 * @returns The cached data URL, or null if none is saved
 */
export async function getCachedThumbnail(episodeUrl: string): Promise<string | null> {
    const thumbs = await videoThumbnailsStorage.getValue();
    return thumbs[episodeUrl] ?? null;
}

/**
 * Caches a thumbnail (JPEG data URL) for an episode.
 *
 * @param episodeUrl - The episode URL to save the thumbnail for
 * @param dataUrl - The thumbnail image as a data URL
 */
export async function saveCachedThumbnail(episodeUrl: string, dataUrl: string): Promise<void> {
    const thumbs = await videoThumbnailsStorage.getValue();
    thumbs[episodeUrl] = dataUrl;
    await videoThumbnailsStorage.setValue(thumbs);
}
