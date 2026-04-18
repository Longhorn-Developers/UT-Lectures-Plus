import { storage } from '#imports';

interface LectureTitlesByUrl {
    [episodeUrl: string]: string;
}

export const lectureTitlesStorage = storage.defineItem<LectureTitlesByUrl>('local:lecture-titles-by-url', {
    fallback: {},
    version: 1,
});

export async function getCustomTitle(episodeUrl: string): Promise<string | null> {
    const titles = await lectureTitlesStorage.getValue();
    return titles[episodeUrl] ?? null;
}

export async function saveCustomTitle(episodeUrl: string, title: string): Promise<void> {
    const titles = await lectureTitlesStorage.getValue();
    titles[episodeUrl] = title;
    await lectureTitlesStorage.setValue(titles);
}

export async function getAllCustomTitles(): Promise<LectureTitlesByUrl> {
    return lectureTitlesStorage.getValue();
}
