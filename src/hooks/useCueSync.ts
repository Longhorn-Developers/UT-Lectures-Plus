import { Accessor, Setter, createSignal } from 'solid-js';
import { VttCue } from '../utils';

interface CueSync {
    cues: Accessor<VttCue[]>;
    setCues: Setter<VttCue[]>;
    currentTime: Accessor<number>;
    setCurrentTime: Setter<number>;
    playing: Accessor<boolean>;
    setPlaying: Setter<boolean>;
    activeCueId: Accessor<string | null>;
    setActiveCueId: Setter<string | null>;
    activeCueElement: Accessor<HTMLDivElement | null>;
    setActiveCueElement: Setter<HTMLDivElement | null>;
}

/**
 * Hook that manages VTT cue synchronization with video playback.
 * Provides signals for cues, current time, playback status, and active cue tracking.
 *
 * @returns Object containing signals for cues management and their setters.
 */
export function useCueSync(): CueSync {
    const [cues, setCues] = createSignal<VttCue[]>([]);
    const [currentTime, setCurrentTime] = createSignal<number>(0);
    const [playing, setPlaying] = createSignal<boolean>(false);
    const [activeCueId, setActiveCueId] = createSignal<string | null>(null);
    const [activeCueElement, setActiveCueElement] = createSignal<HTMLDivElement | null>(null);

    return {
        cues,
        setCues,
        currentTime,
        setCurrentTime,
        playing,
        setPlaying,
        activeCueId,
        setActiveCueId,
        activeCueElement,
        setActiveCueElement,
    };
}
