import { formatTime, VttCue } from '@/entrypoints/main.content/utils';
import { Bookmark } from 'lucide-solid';
import { Index, JSX, Show, createMemo } from 'solid-js';
import { useBookmarks } from '@/context/BookmarkProvider';

interface CueProps extends VttCue {
    onClick: () => void;
    highlight: () => string;
}

/**
 * Cue component displays a single VTT cue with a timestamp and text.
 *
 * @param props - The props object.
 * @returns The Cue component.
 */
const Cue = (props: CueProps): JSX.Element => {
    const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();

    const getParts = createMemo(() => {
        if (!props.highlight() || props.highlight().trim() === '') {
            return [{ text: props.text, isMatch: false }];
        }

        try {
            const trimmedHighlight = props.highlight().trim();
            const lowercaseText = props.text.toLowerCase();
            const lowercaseHighlight = trimmedHighlight.toLowerCase();

            const parts = [];
            let lastIndex = 0;

            let index = lowercaseText.indexOf(lowercaseHighlight, lastIndex);

            while (index !== -1) {
                // Add non-matching part before the match
                if (index > lastIndex) {
                    parts.push({
                        text: props.text.substring(lastIndex, index),
                        isMatch: false,
                    });
                }

                // Add matching part
                parts.push({
                    text: props.text.substring(index, index + trimmedHighlight.length),
                    isMatch: true,
                });

                lastIndex = index + trimmedHighlight.length;
                index = lowercaseText.indexOf(lowercaseHighlight, lastIndex);
            }

            // Add remaining text after the last match
            if (lastIndex < props.text.length) {
                parts.push({
                    text: props.text.substring(lastIndex),
                    isMatch: false,
                });
            }

            return parts;
        } catch (e) {
            console.error('Error parsing highlight:', e);
            // In case of error, return the full text
            return [{ text: props.text, isMatch: false }];
        }
    });

    const onBookmarkClick = (e: MouseEvent) => {
        e.stopPropagation();
        if (isBookmarked(props.id)) {
            removeBookmark(props.id);
        } else {
            addBookmark({ id: props.id, start: props.start, text: props.text });
        }
    };
    
    const bookmarkState = () => isBookmarked(props.id);

    return (
        <div
            aria-label='Cue'
            role='button'
            tabIndex={0}
            class='group hover:bg-ut-burntorange/5 focus:bg-ut-burntorange/10 grid w-full grid-cols-[1fr_6fr] gap-x-2 rounded-md p-2 transition-colors duration-200 hover:cursor-pointer'
            onClick={() => {
                props.onClick();
            }}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    props.onClick();
                }
            }}
            data-cue-id={props.id}
            data-start={props.start}
            data-text={props.text}
        >
            <div class='text-ut-burntorange flex h-full flex-col items-center gap-1 group-hover:underline'>
                <p class='text-ut-burntorange text-sm font-medium'>{formatTime(props.start)}</p>

                <button
                    onClick={onBookmarkClick}
                    aria-label={bookmarkState() ? 'Remove bookmark' : 'Add bookmark'}
                    title={bookmarkState() ? 'Remove bookmark' : 'Add bookmark'}
                    class='transition-opacity duration-200 hover:cursor-pointer'
                    classList={{
                        'opacity-100': bookmarkState(),
                        'opacity-0 group-hover:opacity-100': !bookmarkState(),
                    }}
                >
                    <Bookmark
                        class='size-4 stroke-gray-500 stroke-2 transition-transform duration-200 hover:scale-105 active:scale-95'
                        classList={{
                            'fill-ut-burntorange text-ut-burntorange stroke-ut-burntorange': bookmarkState(),
                            'fill-transparent': !bookmarkState(),
                        }}
                    />
                </button>
            </div>
            <div class='text-theme-black text-left text-sm'>
                <Index each={getParts()}>
                    {part => (
                        <Show when={part().isMatch} fallback={part().text}>
                            <span class='bg-yellow-200 font-medium'>{part().text}</span>
                        </Show>
                    )}
                </Index>
            </div>
        </div>
    );
};

export default Cue;
