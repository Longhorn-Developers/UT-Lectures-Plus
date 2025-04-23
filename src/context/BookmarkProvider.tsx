import { createContext, useContext, JSX, createEffect, onMount, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import { storage } from '#imports';

interface Bookmark {
    id: string;
    start: number;
    text: string;
}

interface BookmarksByUrl {
    [url: string]: Bookmark[];
}

interface BookmarkContextValue {
    bookmarks: Bookmark[];
    currentUrl: string;
    setCurrentUrl: (url: string) => void;
    addBookmark: (bookmark: Bookmark) => void;
    removeBookmark: (id: string) => void;
    isBookmarked: (id: string) => boolean;
}

// Define a storage item for bookmarks with versioning support
const bookmarksStorage = storage.defineItem<BookmarksByUrl>('local:bookmarks-by-url', {
    fallback: {}, // Default to empty object if not found
    version: 1, // Start with version 1 for future-proofing
});

const BookmarkContext = createContext<BookmarkContextValue>({
    bookmarks: [],
    currentUrl: '',
    setCurrentUrl: () => {},
    addBookmark: () => {},
    removeBookmark: () => {},
    isBookmarked: () => false,
});

/**
 * This provider manages bookmarks for the current URL.
 *
 * @param props - The props object.
 * @param props.children - The child components to be rendered within the provider.
 * @returns The BookmarkProvider component.
 */
export function BookmarkProvider(props: { children: JSX.Element }): JSX.Element {
    // Store all bookmarks organized by URL
    const [allBookmarks, setAllBookmarks] = createStore<BookmarksByUrl>({});

    // Store the current URL and its bookmarks
    const [state, setState] = createStore({
        currentUrl: '',
        bookmarks: [] as Bookmark[],
    });

    // Save bookmarks to storage
    const saveBookmarks = async () => {
        if (state.bookmarks.length === 0) {
            console.warn('No bookmarks to save');
            return;
        }

        // Add bookmarks for the current URL to the allBookmarks object
        const currentUrl = state.currentUrl;
        if (currentUrl) {
            const currentBookmarks = state.bookmarks;
            setAllBookmarks(prev => ({
                ...prev,
                [currentUrl]: currentBookmarks,
            }));
        }

        try {
            await bookmarksStorage.setValue(allBookmarks);
            console.warn('Bookmarks saved to storage');
        } catch (error) {
            console.error('Failed to save bookmarks:', error);
        }
    };

    // Load all bookmarks from storage on mount
    onMount(async () => {
        const storedBookmarks = await bookmarksStorage.getValue();
        console.warn('Loaded bookmarks from storage:', storedBookmarks);
        if (storedBookmarks) {
            setAllBookmarks(storedBookmarks);
        }

        // Add event listener for when the user is about to close the tab or navigate away
        window.addEventListener('beforeunload', saveBookmarks);

        // Add event listener for when the page becomes hidden (user switches tabs)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                saveBookmarks();
            }
        });
    });

    // Clean up event listeners when component unmounts
    onCleanup(() => {
        window.removeEventListener('beforeunload', saveBookmarks);
        document.removeEventListener('visibilitychange', saveBookmarks);

        // Final save when component unmounts
        saveBookmarks();
    });

    // Update current bookmarks whenever the URL changes
    createEffect(() => {
        const url = state.currentUrl;
        if (url) {
            const urlBookmarks = allBookmarks[url] || [];
            setState('bookmarks', urlBookmarks);
        }
    });

    const setCurrentUrl = (url: string) => {
        setState('currentUrl', url);
    };

    const addBookmark = (bookmark: Bookmark) => {
        setState('bookmarks', prev => [...prev, bookmark]);
    };

    const removeBookmark = (id: string) => {
        setState('bookmarks', prev => prev.filter(b => b.id !== id));
    };

    const isBookmarked = (id: string) => {
        return state.bookmarks.some(bookmark => bookmark.id === id);
    };

    return (
        <BookmarkContext.Provider
            value={{
                get bookmarks() {
                    return state.bookmarks;
                },
                get currentUrl() {
                    return state.currentUrl;
                },
                setCurrentUrl,
                addBookmark,
                removeBookmark,
                isBookmarked,
            }}
        >
            {props.children}
        </BookmarkContext.Provider>
    );
}

/**
 * This hook provides access to the bookmark context.
 *
 * @returns The bookmark context value.
 */
export const useBookmarks = (): BookmarkContextValue => useContext(BookmarkContext);
