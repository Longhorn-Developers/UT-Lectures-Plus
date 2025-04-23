import { VttCue } from '@/entrypoints/main.content/utils';
import Cue from './Cue';
import { RotateCw } from 'lucide-solid';
import { createMemo, For, Show, createEffect, Accessor, JSX } from 'solid-js';
import { useBookmarks } from '@/context/BookmarkProvider';
import { clearSelectedAction, state } from '@/stores/SelectedActionStore';
import SearchStore from '@/stores/SearchStore';
import AISummaryStore from '@/stores/AISummaryStore';
import { SolidMarkdown } from 'solid-markdown';
import remarkBreaks from 'remark-breaks';

type TranscriptionProps = {
    ref?: HTMLDivElement;
    videoElement: () => HTMLVideoElement | undefined;
    cues: () => VttCue[];
    overlayStyles: () => {
        top: number;
        height: number;
        opacity: number;
    };
    autoScroll: () => boolean;
    setAutoScroll: (value: boolean) => void;
    isScrolledToBottom: () => boolean;
    isAnimatingOut: () => boolean;
    handleSyncClick: () => void;
    onWheel: (e: WheelEvent) => void;
    vttUrl: Accessor<string | null>;
};

/**
 * Transcription component displays a list of VTT cues (subtitles) and provides functionality for searching, bookmarking, and syncing with video playback.
 *
 * @param props - The props object containing various properties and functions.
 * @returns The Transcription component.
 */
const Transcription = (props: TranscriptionProps): JSX.Element => {
    const { setCurrentUrl, isBookmarked } = useBookmarks();

    // Make trimmedQuery a memo to ensure reactivity
    const trimmedQuery = () => SearchStore.query.trim();

    // When vttUrl is set, update bookmarks current url
    createEffect(() => {
        const url = props.vttUrl();

        if (url != null) {
            setCurrentUrl(url);
        }
    });

    // Track search state changes
    createEffect(() => {
        if (state.selectedAction === 'search') {
            props.setAutoScroll(false); // Disable auto-scroll when search is active
        }
    });

    // Create a filtered list of cues based on search query or bookmark
    const filteredCues = createMemo(() => {
        if (state.selectedAction === 'bookmarks') {
            return props.cues().filter(cue => isBookmarked(cue.id));
        }

        if (!trimmedQuery()) return props.cues();

        return props.cues().filter(cue => cue.text.toLowerCase().includes(trimmedQuery().toLowerCase()));
    });

    return (
        <Show
            when={props.cues().length > 0}
            fallback={<div class='py-4 text-center text-gray-500'>Loading transcript...</div>}
        >
            <div class='relative w-full flex-1 overflow-hidden'>
                <div
                    ref={props.ref}
                    onWheel={e => {
                        if (state.selectedAction != 'search') {
                            props.onWheel(e);
                        }
                    }}
                    class='relative h-full overflow-y-auto px-4 pt-2 pb-16'
                >
                    {/* Search results indicator */}
                    <Show when={state.selectedAction == 'search' && trimmedQuery() != ''}>
                        <div class='mb-2 bg-white py-2 text-sm'>
                            <span class='font-medium text-gray-700'>
                                {filteredCues().length} {filteredCues().length === 1 ? 'result' : 'results'} for "
                                {trimmedQuery()}"
                            </span>
                        </div>
                    </Show>

                    {/* Animated overlay */}
                    <Show when={state.selectedAction == null}>
                        <div
                            class='bg-ut-burntorange/5 pointer-events-none absolute inset-0 z-5 rounded transition-all duration-300 ease-in-out'
                            style={{
                                border: '1.5px solid var(--color-ut-burntorange)',
                                top: `${props.overlayStyles().top}px`,
                                height: `${props.overlayStyles().height}px`,
                                opacity: props.overlayStyles().height != 0 ? props.overlayStyles().opacity : 0,
                                left: '14px', // accounting for px-4 padding
                                right: '16px',
                            }}
                        />
                    </Show>

                    {/* Cues */}
                    <Show when={state.selectedAction != 'ai-summary'}>
                        <For each={filteredCues()}>
                            {cue => (
                                <Cue
                                    {...cue}
                                    data-cue-id={cue.id}
                                    onClick={() => {
                                        const video = props.videoElement();
                                        if (video) {
                                            video.currentTime = cue.start + 0.1; // Add a small offset to avoid skipping
                                        }
                                    }}
                                    highlight={trimmedQuery}
                                />
                            )}
                        </For>
                    </Show>

                    <Show when={state.selectedAction == null}>
                        <div class='mt-3 text-center text-sm text-gray-500'>You've reached the end!</div>
                    </Show>

                    <Show when={state.selectedAction == 'bookmarks' && filteredCues().length === 0}>
                        <div class='mt-3 text-center text-sm text-gray-500'>
                            No bookmarks found.{' '}
                            <button
                                class='text-ut-burntorange font-medium hover:cursor-pointer hover:underline'
                                onClick={() => {
                                    props.setAutoScroll(true);
                                    clearSelectedAction();
                                }}
                            >
                                Go back
                            </button>
                        </div>
                    </Show>

                    <Show when={state.selectedAction == 'ai-summary' && AISummaryStore.currentSummary != ''}>
                        <div class='mt-3'>
                            <div class='mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center'>
                                <div class='flex items-center gap-2'>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(
                                                AISummaryStore.currentSummary.replace(/&nbsp;/g, '')
                                            );
                                            alert('Summary copied to clipboard!');
                                        }}
                                        class='focus:ring-ut-burntorange inline-flex items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all duration-150 hover:cursor-pointer hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:ring-2 focus:ring-offset-1 focus:outline-none active:scale-[0.98]'
                                    >
                                        <svg
                                            xmlns='http://www.w3.org/2000/svg'
                                            class='size-3.5'
                                            viewBox='0 0 24 24'
                                            fill='none'
                                            stroke='currentColor'
                                            stroke-width='2'
                                            stroke-linecap='round'
                                            stroke-linejoin='round'
                                        >
                                            <rect width='14' height='14' x='8' y='8' rx='2' ry='2' />
                                            <path d='M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' />
                                        </svg>
                                        Copy
                                    </button>
                                    <button
                                        onClick={() => {
                                            AISummaryStore.setOpen(true);
                                        }}
                                        class='border-ut-burntorange/30 text-ut-burntorange focus:ring-ut-burntorange inline-flex items-center justify-center gap-1.5 rounded-md border bg-gradient-to-r from-orange-50 to-orange-100 px-2 py-1.5 text-xs font-medium shadow-sm transition-all duration-150 hover:cursor-pointer hover:from-orange-100 hover:to-orange-200 focus:ring-2 focus:ring-offset-1 focus:outline-none active:scale-[0.98]'
                                    >
                                        <svg
                                            xmlns='http://www.w3.org/2000/svg'
                                            class='size-3.5'
                                            viewBox='0 0 24 24'
                                            fill='none'
                                            stroke='currentColor'
                                            stroke-width='2'
                                            stroke-linecap='round'
                                            stroke-linejoin='round'
                                        >
                                            <path d='M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' />
                                            <path d='M21 3v5h-5' />
                                            <path d='M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' />
                                            <path d='M8 16H3v5' />
                                        </svg>
                                        Regenerate
                                    </button>
                                </div>
                            </div>

                            <div class='text-sm'>
                                <SolidMarkdown
                                    remarkPlugins={[remarkBreaks]}
                                    children={AISummaryStore.currentSummary}
                                />
                            </div>
                        </div>
                    </Show>

                    <Show when={state.selectedAction == 'ai-summary' && AISummaryStore.currentSummary == ''}>
                        <div class='mt-3 text-center text-sm text-gray-500'>
                            No summary generated.{' '}
                            <button
                                class='text-ut-burntorange font-medium hover:cursor-pointer hover:underline'
                                onClick={() => {
                                    AISummaryStore.setOpen(true);
                                }}
                            >
                                Generate summary
                            </button>
                        </div>
                    </Show>
                </div>

                <div
                    style={{
                        background: `linear-gradient(to top, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0))`,
                        opacity: props.isScrolledToBottom() ? 0 : 1,
                    }}
                    class='pointer-events-none absolute inset-x-0 bottom-0 z-10 h-36 transition-opacity duration-300'
                />

                <Show when={(!props.autoScroll() || props.isAnimatingOut()) && state.selectedAction == null}>
                    <div class='sticky right-0 bottom-4 left-0 z-20 flex justify-center'>
                        <button
                            onClick={() => {
                                props.handleSyncClick();
                            }}
                            disabled={props.isAnimatingOut()}
                            aria-label='Enable auto-scroll to follow transcript'
                            class='group bg-ut-burntorange hover:bg-ut-burntorange/95 flex items-center gap-2 rounded-full px-3 py-2 font-medium text-white shadow-md'
                            classList={{
                                'animate-scale-in hover:cursor-pointer active:scale-[0.98]': !props.isAnimatingOut(),
                                'animate-scale-out pointer-events-none': props.isAnimatingOut(),
                            }}
                        >
                            <RotateCw
                                size={14}
                                class='transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12'
                            />
                            <span class='text-sm font-medium'>Sync with video</span>
                        </button>
                    </div>
                </Show>
            </div>
        </Show>
    );
};

export default Transcription;
