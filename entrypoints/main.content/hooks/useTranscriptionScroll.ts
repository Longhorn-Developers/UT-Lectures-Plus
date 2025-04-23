import { Accessor, createSignal, Setter } from 'solid-js';

interface TranscriptionScroll {
    autoScroll: Accessor<boolean>;
    setAutoScroll: Setter<boolean>;
    isScrolledToBottom: Accessor<boolean>;
    setIsScrolledToBottom: Setter<boolean>;
}

/**
 * Hook that manages transcription auto-scrolling state.
 * Provides signals for controlling automatic scrolling behavior and tracking scroll position.
 *
 * @returns Object containing autoScroll and isScrolledToBottom signals and their setters.
 */
export function useTranscriptionScroll(): TranscriptionScroll {
    const [autoScroll, setAutoScroll] = createSignal<boolean>(true);
    const [isScrolledToBottom, setIsScrolledToBottom] = createSignal<boolean>(false);

    return {
        autoScroll,
        setAutoScroll,
        isScrolledToBottom,
        setIsScrolledToBottom,
    };
}
