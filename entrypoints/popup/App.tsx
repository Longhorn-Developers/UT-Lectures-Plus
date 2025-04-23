import { createSignal, JSX, Show } from 'solid-js';
import { Sparkles, Book, Github, ExternalLink } from 'lucide-solid';

/**
 * Popup component for UT Lectures Plus extension
 *
 * @returns The rendered popup UI
 */
function App(): JSX.Element {
    const [activeTab, setActiveTab] = createSignal<'about' | 'help'>('about');

    return (
        <div class='flex min-h-64 w-80 flex-col p-4 font-sans'>
            <header class='mb-4 flex items-center justify-between'>
                <h1 class='text-xl font-bold'>
                    UT Lectures<span class='text-ut-burntorange'>+</span>
                </h1>
                <span class='rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500'>v1.0</span>
            </header>

            <div class='mb-4 flex border-b border-slate-200'>
                <button
                    onClick={() => setActiveTab('about')}
                    class='-mb-px px-3 pb-2 text-sm font-medium transition-colors hover:cursor-pointer'
                    classList={{
                        'border-b-2 border-ut-burntorange text-ut-burntorange': activeTab() === 'about',
                        'text-slate-600 hover:text-slate-800': activeTab() !== 'about',
                    }}
                >
                    About
                </button>
                <button
                    onClick={() => setActiveTab('help')}
                    class='-mb-px px-3 pb-2 text-sm font-medium transition-colors hover:cursor-pointer'
                    classList={{
                        'border-b-2 border-ut-burntorange text-ut-burntorange': activeTab() === 'help',
                        'text-slate-600 hover:text-slate-800': activeTab() !== 'help',
                    }}
                >
                    Help
                </button>
            </div>

            <Show when={activeTab() === 'about'}>
                <div class='flex-1'>
                    <p class='mb-4 text-sm text-slate-600'>
                        Enhance your UT Austin Lectures experience with transcripts, search, bookmarks, and AI
                        summaries.
                    </p>

                    <div class='mb-4 rounded-lg border border-orange-100 bg-orange-50 p-3'>
                        <h2 class='text-ut-burntorange mb-2 flex items-center gap-1 text-sm font-medium'>
                            <Book size={16} />
                            Key Features
                        </h2>
                        <ul class='ml-5 list-disc space-y-2 text-xs text-slate-700'>
                            <li>Interactive transcript with search</li>
                            <li>Bookmark important moments</li>
                            <li>AI-powered lecture summaries</li>
                            <li>Adjustable playback speed</li>
                            <li>Download transcripts as text</li>
                        </ul>
                    </div>

                    <footer class='mt-auto text-xs text-slate-500'>
                        <div class='flex items-center justify-between'>
                            <a
                                href='https://github.com/Longhorn-Developers/UT-Lectures-Plus'
                                target='_blank'
                                class='hover:text-ut-burntorange flex items-center gap-1 transition-colors'
                            >
                                <Github size={14} />
                                GitHub
                            </a>
                            <span>© 2025 Longhorn Developers</span>
                        </div>
                    </footer>
                </div>
            </Show>

            <Show when={activeTab() === 'help'}>
                <div class='flex-1'>
                    <div class='space-y-4'>
                        <div>
                            <h2 class='mb-1 text-sm font-medium'>How to use:</h2>
                            <p class='text-xs text-slate-600'>
                                Visit any LectureOnline or TowerLA lecture from UT Austin. The sidebar will
                                automatically appear.
                            </p>
                        </div>

                        <div>
                            <h2 class='mb-1 text-sm font-medium'>Troubleshooting:</h2>
                            <p class='text-xs text-slate-600'>
                                If the sidebar doesn't appear, try refreshing the page or opening the video in a new
                                tab.
                            </p>
                        </div>

                        <div class='rounded-lg border border-orange-100 bg-orange-50 p-3'>
                            <h2 class='text-ut-burntorange mb-2 flex items-center gap-1 text-sm font-medium'>
                                <Sparkles size={16} />
                                AI Summary Feature
                            </h2>
                            <p class='text-xs text-slate-700'>
                                The AI summary requires an{' '}
                                <a
                                    href='https://platform.openai.com/api-keys'
                                    target='_blank'
                                    class='text-ut-burntorange hover:underline'
                                >
                                    OpenAI API key
                                </a>
                                . You'll be prompted to enter it when you use this feature.
                            </p>
                        </div>

                        <a
                            href='https://github.com/Longhorn-Developers/UT-Lectures-Plus/issues'
                            target='_blank'
                            class='text-ut-burntorange flex items-center gap-1 text-xs hover:underline'
                        >
                            Report an issue <ExternalLink size={12} />
                        </a>
                    </div>
                </div>
            </Show>
        </div>
    );
}

export default App;
