import { createContext, useContext, JSX, createEffect, onMount, onCleanup, Accessor } from 'solid-js';
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
 * This provider manages bookmarks for the current URL, including a Ctrl + B bookmark of activeCue
 *
 * @param props - The props object.
 * @param props.children - The child components to be rendered within the provider.
 * @param props.activeCueElement the currently active cue (transcript element)
 * @returns The BookmarkProvider component.
 */
export function BookmarkProvider(props: { children: JSX.Element, activeCueElement: Accessor<HTMLDivElement | null> }): JSX.Element {
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
        // Add event listener for making a bookmark with Ctrl + B
        document.addEventListener('keydown', checkBookmarkHotkey)
    });

    // Clean up event listeners when component unmounts
    onCleanup(() => {
        window.removeEventListener('beforeunload', saveBookmarks);
        document.removeEventListener('visibilitychange', saveBookmarks);
        document.removeEventListener('keydown', checkBookmarkHotkey);
        document.removeEventListener('keydown', checkBookmarkHotkey)
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

    /** checkBookmarkHotkey bookmarks the current caption if there is one with the Ctrl + B hotkey,
     * and removes the bookmark instead if it already exists. Has a 0.25 second cooldown to prevent 
     * accidental double-presses, and holding down the key will not trigger multiple events.
     * <br> pre: current caption exists, ctrl + b pressed, event is not repeat
     * <br> post: current caption is bookmarked or unbookmarked if the bookmark exists
     */
    let cooldownTimer: NodeJS.Timeout | null = null;
    function checkBookmarkHotkey(event: KeyboardEvent) {
        const key: string = event.key;
        // prevent repeat by avoiding if event.repeat is true, otherwise if ctrl + b then bookmark
        if (key == "b" && event.ctrlKey && !event.repeat) {
            if (cooldownTimer != null) {
                // too soon since previous click, return before work done
                return;
            } else {
                const cooldownAmount: number = 250 // milliseconds
                cooldownTimer = setTimeout(() => {
                    cooldownTimer = null; // Reset cooldown after 0.25sec delay
                }, cooldownAmount);
            }
            const toBookmark: HTMLDivElement | null = props.activeCueElement()
            if (toBookmark) {
                const id = toBookmark.attributes.getNamedItem("data-cue-id")?.value
                const startString: string | undefined = toBookmark.attributes.getNamedItem("data-start")?.value
                const start: number = startString ? parseFloat(startString) : 0
                const text = toBookmark.attributes.getNamedItem("data-text")?.value
                // due to solidjs Context rules, this MUST be within BookmarkProvider or descendant
                if (id && start && text) {
                    if (!isBookmarked(id)) {
                        addBookmark({ id, start, text });
                    } else {
                        removeBookmark(id);
                    }
                } else {
                    // simple test to let developer know if they inadvertently removed required part
                    console.warn('cue was modified at some point to not have all three of \
                        id, start, and text. Add it back or figure out an alternate bookmark \
                        method for Ctrl + B in captionsControl!')
                }
            } else { console.warn("no selected caption to bookmark"); }
        }
    }
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
