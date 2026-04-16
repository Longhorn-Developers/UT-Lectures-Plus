import { createSignal, onMount, JSX, Show } from 'solid-js';
import { Bookmark } from 'lucide-solid';
import type { LectureBookmark } from '@/storage/lectureBookmarks';

type StorageType = typeof import('@/storage/lectureBookmarks').lectureBookmarksStorage;

interface BookmarkButtonProps {
    id: string;
    title: string;
    url: string;
}
/**
 * BookmarkButton component
 *
 * Renders a toggleable bookmark button for a lecture.
 * Handles reading/writing bookmark state from extension storage.
 *
 * Storage is dynamically imported inside `onMount` to avoid
 * runtime errors in non-extension environments.
 *
 * @param props - Lecture metadata used for bookmarking
 * @returns A bookmark toggle button
 */
const BookmarkButton = (props: BookmarkButtonProps): JSX.Element => {
    const [isBookmarked, setIsBookmarked] = createSignal(false);
    const [ready, setReady] = createSignal(false);
    let storage: StorageType | undefined;


    onMount(async () => {
        const { lectureBookmarksStorage } = await import('@/storage/lectureBookmarks');
        storage = lectureBookmarksStorage;

        const bookmarks = await storage.getValue();
        setIsBookmarked(bookmarks.some((b: LectureBookmark) => b.id === props.id));
        setReady(true);
    });

    const handleClick = async () => {
        if (!storage) return;

        const current = await storage.getValue();
        const alreadyBookmarked = current.some((b: LectureBookmark) => b.id === props.id);

        if (alreadyBookmarked) {
            await storage.setValue(current.filter((b: LectureBookmark) => b.id !== props.id));
            setIsBookmarked(false);
        } else {
            await storage.setValue([...current, { id: props.id, title: props.title, url: props.url }]);
            setIsBookmarked(true);
        }
    };

    return (
        <Show when={ready()}>
            <button
                onClick={handleClick}
                title={isBookmarked() ? 'Remove bookmark' : 'Bookmark this lecture'}
                class="flex items-center justify-center w-9 h-9 rounded-md transition-colors duration-200"
                classList={{
                    'bg-ut-burntorange': isBookmarked(),
                    'bg-gray-200 hover:bg-gray-300': !isBookmarked(),
                }}
            >
            
                <Bookmark
                    class="w-6 h-6"
                    color={isBookmarked() ? 'white' : 'currentColor'}
                />
            </button>
        </Show>
    );
};

export default BookmarkButton;