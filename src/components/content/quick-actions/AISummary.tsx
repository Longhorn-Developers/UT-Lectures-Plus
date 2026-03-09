import { Accessor, createSignal, createEffect, JSX } from 'solid-js';
import Button from '../Button';
import { Sparkles, X } from 'lucide-solid';
import Dialog from '@corvu/dialog';
import AISummaryStore from '@/stores/AISummaryStore';

const generateAISummary = async (apiKey: string, text: string): Promise<string> => {
    const prompt = `You’re great at turning spoken content into clear summaries.
Please read the following video content and write a short, easy-to-follow summary that includes:
	•	The main points
	•	Important ideas
	•	Any final takeaways

Make it clear and natural, like you’re explaining it to someone else.
Don’t say it’s a transcript or mention that it came from one.

    Content:
    ${text}
    `;

    const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4.1-nano',
            input: prompt,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to generate summary');
    }

    const data = await response.json();

    const summary = data.output[0]?.content[0]?.text || 'No summary could be generated. Please try again.';

    return summary;
};

/**
 * AISummary component provides a dialog for generating AI summaries of video content.
 *
 * @param props  - The props object.
 * @param props.active - Indicates if the button is active.
 * @param props.vttUrl - The URL of the VTT file to summarize.
 * @param props.onClick - Function to call when the button is clicked.
 * @param props.uiContainer - The container element for the UI.
 */
const AISummary = (props: {
    active: boolean;
    vttUrl: Accessor<string | null>;
    onClick: () => void;
    uiContainer: HTMLElement;
}): JSX.Element => {
    const [isLoading, setIsLoading] = createSignal(false);
    const [apiKey, setApiKey] = createSignal('');

    createEffect(() => {
        const url = props.vttUrl();
        if (url) {
            AISummaryStore.setCurrentUrl(url);
        }
    });

    const handleAISummary = async () => {
        if (!apiKey()) {
            return;
        }

        setIsLoading(true);
        const url = props.vttUrl();

        if (!url) {
            alert('AI Summary is not available for this video.');
            setIsLoading(false);
            return;
        }

        const textToSummarize = await fetch(url)
            .then(async response => {
                const text = response.text();

                return text
                    .then(text => {
                        const cleanedText = text
                            .replace(/WEBVTT[\s\S]*?\n\n/g, '') // Remove WEBVTT header
                            .replace(/\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}/g, '') // Remove timestamps
                            .replace(/\n/g, ' ') // Replace newlines with spaces
                            .replace(/<[^>]+>/g, '') // Remove HTML tags
                            .replace(/\s{2,}/g, ' ') // Replace multiple spaces with a single space
                            .trim(); // Trim leading and trailing spaces
                        return cleanedText;
                    })
                    .catch(error => {
                        console.error('Error parsing VTT file:', error);
                        return '';
                    });
            })
            .catch(error => {
                console.error('Error fetching VTT file:', error);
                return '';
            });

        if (!textToSummarize) {
            alert('AI Summary is not available for this video.');
            setIsLoading(false);
            return;
        }

        try {
            const generatedSummary = await generateAISummary(apiKey(), textToSummarize);

            const formattedSummary = generatedSummary.replace(/\n/g, '&nbsp; \n');

            AISummaryStore.setSummary(formattedSummary);
            AISummaryStore.setOpen(false);
            setIsLoading(false);
        } catch (error) {
            console.error(error);
            alert('Failed to generate summary. Please check your API key and try again.');
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={AISummaryStore.isOpen()} closeOnOutsidePointer={false}>
            <Dialog.Trigger
                onClick={e => {
                    if (!props.active || AISummaryStore.currentSummary != '') {
                        e.stopPropagation();
                        e.preventDefault();
                    } else {
                        AISummaryStore.setOpen(true);
                    }
                }}
            >
                <Button onClick={props.onClick} label='AI Summary' icon={Sparkles} active={props.active} />
            </Dialog.Trigger>
            <Dialog.Portal mount={props.uiContainer} forceMount>
                <Dialog.Overlay class='data-open:animate-in data-open:fade-in-0% data-closed:animate-out data-closed:fade-out-0% fixed inset-0 z-50 bg-black/80' />
                <Dialog.Content class='data-open:animate-in data-open:fade-in-0% data-open:zoom-in-95% data-open:slide-in-from-top-10% data-closed:animate-out data-closed:fade-out-0% data-closed:zoom-out-95% data-closed:slide-out-to-top-10% fixed top-1/2 left-1/2 z-50 max-w-md min-w-80 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-white p-0 shadow-2xl'>
                    {/* Header section */}
                    <div class='relative px-6 py-4'>
                        <Dialog.Close
                            onClick={() => AISummaryStore.setOpen(false)}
                            class='absolute top-4 right-4 text-gray-400 hover:cursor-pointer hover:text-gray-600'
                        >
                            <X size={18} />
                        </Dialog.Close>
                        <Dialog.Label class='font=sans flex items-center gap-2 font-sans text-xl font-bold text-gray-800'>
                            <Sparkles class='stroke-ut-burntorange size-5' />
                            AI Summary
                        </Dialog.Label>
                        <Dialog.Description class='mt-1 font-sans text-sm text-gray-500'>
                            Generate an AI-powered summary of this lecture
                        </Dialog.Description>
                    </div>

                    {/* Content section */}
                    <div class='px-6'>
                        <div class='mb-4'>
                            <label class='mb-1 block font-sans text-sm font-medium text-gray-700'>OpenAI API Key</label>
                            <input
                                autocomplete='new-password'
                                type='password'
                                value={apiKey()}
                                onInput={e => setApiKey(e.target.value)}
                                placeholder='sk-...'
                                style={{
                                    border: '1px solid var(--color-gray-300)',
                                }}
                                class='focus:border-ut-burntorange focus:ring-ut-burntorange w-full rounded-md px-3 py-2 font-sans text-sm shadow-sm'
                            />
                            <p class='mt-1 font-sans text-xs text-gray-500'>
                                Your API key is never stored and is only used for this request.
                                <a
                                    href='https://platform.openai.com/api-keys'
                                    target='_blank'
                                    rel='noreferrer'
                                    class='text-ut-burntorange ml-1 hover:underline'
                                >
                                    Get a key
                                </a>
                            </p>
                        </div>
                    </div>

                    {/* Footer section */}
                    <div class='flex items-center justify-end gap-2 px-6 pb-3'>
                        <Dialog.Close
                            onClick={() => AISummaryStore.setOpen(false)}
                            class='focus:ring-ut-burntorange rounded-md border border-gray-300 bg-white px-6 py-2 font-sans text-sm font-medium text-gray-700 shadow-sm hover:cursor-pointer hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:outline-none'
                        >
                            Cancel
                        </Dialog.Close>
                        <button
                            onClick={handleAISummary}
                            disabled={isLoading() || !apiKey()}
                            class='bg-ut-burntorange hover:bg-ut-burntorange/90 focus:ring-ut-burntorange inline-flex items-center justify-center rounded-md px-4 py-2 font-sans text-sm font-medium text-white shadow-sm hover:cursor-pointer focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:hover:cursor-not-allowed'
                        >
                            {isLoading() ? (
                                <>
                                    <svg
                                        class='mr-2 size-4 animate-spin'
                                        xmlns='http://www.w3.org/2000/svg'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                    >
                                        <circle
                                            class='opacity-25'
                                            cx='12'
                                            cy='12'
                                            r='10'
                                            stroke='currentColor'
                                            stroke-width='4'
                                        />
                                        <path
                                            class='opacity-75'
                                            fill='currentColor'
                                            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                        />
                                    </svg>
                                    Generating...
                                </>
                            ) : (
                                'Generate Summary'
                            )}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog>
    );
};

export default AISummary;
