import { storage } from '#imports';

interface LectureTitlesByUrl {
    [episodeUrl: string]: string;
}

export const lectureTitlesStorage = storage.defineItem<LectureTitlesByUrl>('local:lecture-titles-by-url', {
    fallback: {},
    version: 1,
});

/**
 * Retrieves the custom title for a given episode URL.
 *
 * @param episodeUrl - The episode URL to look up
 * @returns The custom title, or null if none is saved
 */
export async function getCustomTitle(episodeUrl: string): Promise<string | null> {
    const titles = await lectureTitlesStorage.getValue();
    return titles[episodeUrl] ?? null;
}

/**
 * Saves a custom title for a given episode URL.
 *
 * @param episodeUrl - The episode URL to save the title for
 * @param title - The custom title to save
 */
export async function saveCustomTitle(episodeUrl: string, title: string): Promise<void> {
    const titles = await lectureTitlesStorage.getValue();
    titles[episodeUrl] = title;
    await lectureTitlesStorage.setValue(titles);
}

/**
 * Retrieves all saved custom titles.
 *
 * @returns A map of episode URLs to custom titles
 */
export async function getAllCustomTitles(): Promise<LectureTitlesByUrl> {
    return lectureTitlesStorage.getValue();
}
