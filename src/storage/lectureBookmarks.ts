import { storage } from '#imports';

export interface LectureBookmark {
  id: string;
  title: string;
  url: string;
}

export const lectureBookmarksStorage = storage.defineItem<LectureBookmark[]>(
  'local:lecture-bookmarks',
  {
    fallback: [],
    version: 1,
  }
);