import { Bookmark, Clipboard, Download, Search, X } from 'lucide-solid';
import Button from '../Button';
import { Accessor, createSignal, JSX, Show } from 'solid-js';
import SearchStore from '@/stores/SearchStore';
import PlaybackRate from './PlaybackRate';
import { QuickActionType, state, setSelectedAction } from '@/stores/SelectedActionStore';
import AISummary from './AISummary';

interface QuickActionProps {
    uiContainer: HTMLElement;
    setAutoScroll: (value: boolean) => void;
    vttUrl: Accessor<string | null>;
}

/**
 * QuickActions component provides a set of quick action buttons for the user interface.
 *
 * @param props - The props object.
 * @returns The QuickActions component.
 */
const QuickActions = (props: QuickActionProps): JSX.Element => {
    const [isClosing, setIsClosing] = createSignal(false);
    const { setQuery, clear } = SearchStore;

    let searchContainerRef: HTMLDivElement | undefined;

    const openSearch = () => {
        setIsClosing(false);
        setSelectedAction('search');

        // Wait for animation to complete before focusing
        setTimeout(() => {
            const input = props.uiContainer.querySelector('#search-input') as HTMLInputElement;
            if (input) input.focus();
        }, 300);
    };

    const closeSearch = () => {
        if (searchContainerRef) {
            setIsClosing(true);

            // Force a style recalculation to ensure animation runs
            searchContainerRef.style.animation = 'none';
            searchContainerRef.style.animation = 'var(--animate-collapse)';

            // Wait for the closing animation to finish before actually hiding
            setTimeout(() => {
                setSelectedAction(null);
                clear();
                setIsClosing(false);
                props.setAutoScroll(true);
            }, 300);
        }
    };

    const handleButtonClick = (buttonType: QuickActionType) => {
        // Save the current scroll position

        if (state.selectedAction === buttonType) {
            setSelectedAction(null);
        } else {
            setSelectedAction(buttonType);
        }
    };

    const convertVttToTxt = (vttContent: string): string => {
        // Split by lines
        const lines = vttContent.split('\n');
        let textOutput = '';
        let isHeader = true;
        let lastLineWasEmpty = false;

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Skip WebVTT header
            if (isHeader && line.includes('WEBVTT')) {
                isHeader = false;
                continue;
            }

            // Skip timestamp lines (they contain --> or are just numbers)
            if (line.includes('-->') || /^\d+$/.test(trimmedLine)) {
                continue;
            }

            // Handle empty lines - preserve paragraph breaks
            if (trimmedLine === '') {
                // Only add one empty line to avoid multiple consecutive empty lines
                if (!lastLineWasEmpty) {
                    textOutput += '\n';
                    lastLineWasEmpty = true;
                }
                continue;
            }

            // Add actual text content
            if (trimmedLine.length > 0) {
                textOutput += trimmedLine + '\n';
                lastLineWasEmpty = false;
            }
        }

        return textOutput;
    };

    return (
        <div
            style={{
                'border-bottom': '1px solid oklch(92.9% 0.013 255.508)',
            }}
            class='flex items-center gap-2 px-4 pb-3 shadow-xl'
        >
            <Show
                when={state.selectedAction == 'search'}
                fallback={
                    <div class='flex w-full items-center justify-between'>
                        <div class='flex items-center gap-2'>
                            <Button
                                onClick={openSearch}
                                label='Search'
                                icon={Search}
                                active={state.selectedAction === 'search'}
                            />

                            <PlaybackRate
                                uiContainer={props.uiContainer}
                                onClick={() => handleButtonClick('playback')}
                            />

                            <Button
                                onClick={() => handleButtonClick('bookmarks')}
                                label='Bookmarks'
                                icon={Bookmark}
                                active={state.selectedAction === 'bookmarks'}
                            />

                            <AISummary
                                active={state.selectedAction === 'ai-summary'}
                                onClick={() => handleButtonClick('ai-summary')}
                                vttUrl={props.vttUrl}
                                uiContainer={props.uiContainer}
                            />
                        </div>

                        <div class='flex flex-row items-center gap-2'>
                            <Button
                                onClick={() => {
                                    // Assuming you want to download the transcript
                                    const vttUrl = props.vttUrl();
                                    if (vttUrl) {
                                        // Fetch the VTT content
                                        fetch(vttUrl)
                                            .then(response => response.text())
                                            .then(vttContent => {
                                                // Convert VTT to plain text
                                                const txtContent = convertVttToTxt(vttContent);

                                                // Create a blob with the converted content
                                                const blob = new Blob([txtContent], {
                                                    type: 'text/plain',
                                                });
                                                const url = URL.createObjectURL(blob);

                                                // Create and trigger download
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.download = `${vttUrl.split('/').pop()?.split('.')[0]}.txt`;
                                                document.body.appendChild(link);
                                                link.click();

                                                // Clean up
                                                document.body.removeChild(link);
                                                URL.revokeObjectURL(url);
                                            })
                                            .catch(error => {
                                                console.error('Error converting VTT to text:', error);
                                            });
                                    }
                                }}
                                label='Transcript'
                                icon={Download}
                                active={false}
                            />
                            <Button
                                onClick={() => {
                                    const vttUrl = props.vttUrl();
                                    if (vttUrl) {
                                        // Fetch the VTT content
                                        fetch(vttUrl)
                                            .then(response => response.text())
                                            .then(vttContent => {
                                                // Convert VTT to plain text
                                                const txtContent = convertVttToTxt(vttContent);

                                                // Copy to clipboard
                                                navigator.clipboard
                                                    .writeText(txtContent)
                                                    .then(() => {
                                                        // You could add a temporary success message here
                                                        alert('Transcript copied to clipboard!');
                                                    })
                                                    .catch(err => {
                                                        console.error('Failed to copy text: ', err);
                                                    });
                                            })
                                            .catch(error => {
                                                console.error('Error converting VTT to text:', error);
                                            });
                                    }
                                }}
                                label='Copy'
                                icon={Clipboard}
                                active={false}
                            />
                        </div>
                    </div>
                }
            >
                <div
                    ref={searchContainerRef}
                    style={{
                        animation: isClosing() ? 'var(--animate-collapse)' : 'var(--animate-expand)',
                    }}
                    class='flex w-full items-center gap-2 transition-all duration-300 ease-in-out'
                >
                    <div class='flex h-7 w-full items-center gap-2 rounded bg-slate-100 px-1.5 pr-2'>
                        <Search
                            class='text-theme-black ml-0 size-4 shrink-0 stroke-2 transition-all'
                            classList={{ 'ml-1': !isClosing() }}
                        />
                        <input
                            id='search-input'
                            type='text'
                            onInput={e => {
                                setQuery((e.target as HTMLInputElement).value);
                                if (e.target.value === '') {
                                    setSelectedAction(null);
                                }
                            }}
                            placeholder='Search transcript...'
                            class='w-full flex-1 border-none bg-transparent text-sm outline-none'
                        />
                    </div>

                    <Show when={!isClosing()}>
                        <button
                            onClick={closeSearch}
                            class='rounded bg-transparent p-1 text-slate-500 transition-colors duration-200 hover:cursor-pointer hover:bg-slate-100'
                        >
                            <X class='size-5' />
                        </button>
                    </Show>
                </div>
            </Show>
        </div>
    );
};

export default QuickActions;
