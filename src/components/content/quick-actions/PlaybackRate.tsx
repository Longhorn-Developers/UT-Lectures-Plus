import Popover from '@corvu/popover';
import Button from '../Button';
import { createSignal, JSX, For } from 'solid-js';
import { Gauge, XIcon } from 'lucide-solid';
import { setSelectedAction, state } from '@/stores/SelectedActionStore';

interface PlaybackRateProps {
    uiContainer: HTMLElement;
    onClick?: () => void;
}

/**
 * PlaybackRate component allows users to adjust the playback rate of a video.
 *
 * @param props - The props object.
 * @returns The PlaybackRate component.
 */
const PlaybackRate = (props: PlaybackRateProps): JSX.Element => {
    const [playbackRate, setPlaybackRate] = createSignal(1);

    const updatePlaybackRate = (newRate: number) => {
        // Ensure rate is between 0.25 and 3
        const clampedRate = Math.max(0.25, Math.min(10, newRate));
        setPlaybackRate(parseFloat(clampedRate.toFixed(2)));

        // Update the video playback rate
        const video = document.querySelector('video');
        if (video) {
            video.playbackRate = clampedRate;
        }
    };

    return (
        <Popover
            onOpenChange={isOpen => {
                if (!isOpen) {
                    setSelectedAction(null);
                }
            }}
            floatingOptions={{
                offset: 8,
                flip: true,
                shift: true,
            }}
            closeOnOutsidePointer={false}
        >
            <Popover.Trigger>
                <Button
                    label='Playback'
                    icon={Gauge}
                    active={state.selectedAction === 'playback'}
                    onClick={props.onClick}
                />
            </Popover.Trigger>
            <Popover.Portal mount={props.uiContainer} forceMount>
                <Popover.Content
                    style={{
                        'box-shadow': 'var(--shadow-sm)',
                    }}
                    class='data-open:animate-in data-open:fade-in-50% data-open:slide-in-from-top-1 data-closed:animate-out data-closed:fade-out-0% data-closed:slide-out-to-top-1 z-50 flex rounded-lg border border-slate-200 bg-white p-4 font-sans'
                >
                    <Popover.Close class='absolute top-1 right-1.5 hover:cursor-pointer'>
                        <XIcon class='size-4 text-slate-500' />
                    </Popover.Close>
                    <div class='mt-3 flex w-60 flex-col items-center space-y-4'>
                        {/* Slider */}
                        <input
                            type='range'
                            min='0.5'
                            max='4'
                            step='0.25'
                            value={playbackRate()}
                            onInput={e => updatePlaybackRate(parseFloat((e.target as HTMLInputElement).value))}
                            class='accent-ut-burntorange focus:ring-ut-burntorange h-2 w-full cursor-pointer appearance-none rounded bg-slate-200 focus:ring-2 focus:outline-none'
                        />

                        {/* Preset Buttons */}
                        <div class='flex w-full flex-wrap justify-between gap-1'>
                            <For each={[0.5, 1, 2, 3, 4]}>
                                {(rate, index) => {
                                    const nextRate = () => {
                                        const arr = [0.5, 1, 2, 3, 4];
                                        return index() < arr.length - 1 ? arr[index() + 1] : 10;
                                    };

                                    return (
                                        <button
                                            onClick={() => updatePlaybackRate(rate)}
                                            class='rounded-full px-3 py-1 text-xs font-semibold transition-colors hover:cursor-pointer hover:bg-slate-100'
                                            classList={{
                                                'bg-ut-burntorange text-white hover:bg-ut-burntorange':
                                                    playbackRate() >= rate && playbackRate() < nextRate(),
                                            }}
                                        >
                                            {playbackRate() >= rate && playbackRate() < nextRate()
                                                ? [0.5, 1, 2, 3, 4].includes(playbackRate())
                                                    ? `${playbackRate()}x`
                                                    : `${playbackRate().toFixed(2)}x`
                                                : `${rate}x`}
                                        </button>
                                    );
                                }}
                            </For>
                        </div>
                    </div>
                </Popover.Content>
            </Popover.Portal>
        </Popover>
    );
};

export default PlaybackRate;
