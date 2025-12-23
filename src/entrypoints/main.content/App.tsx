import { ChevronLeft } from 'lucide-solid';
import { createEffect, Show, Accessor, createSignal, onCleanup, onMount, JSX } from 'solid-js';
import { parseVtt } from './utils';
import { useCueSync } from '@/hooks/useCueSync';
import { useTranscriptionScroll } from '@/hooks/useTranscriptionScroll';
import TopBar from '@/components/content/TopBar';
import Transcription from '@/components/content/Transcription';
import QuickActions from '@/components/content/quick-actions/QuickActions';
import { BookmarkProvider } from '@/context/BookmarkProvider';
import { state, setSelectedAction } from '@/stores/SelectedActionStore';
import SearchStore from '@/stores/SearchStore';

interface AppProps {
    vttData: Accessor<string | null>;
    vttUrl: Accessor<string | null>;
    videoElement: Accessor<HTMLVideoElement | undefined>;
    uiContainer: HTMLElement;
}

/**
 * Main application component for the UT Lectures Plus content script.
 * Manages video playback synchronization with transcription and provides UI for interaction.
 *
 * @param props - Component properties including VTT data, URL, video element, and UI container
 * @returns The rendered application component
 */
const App = (props: AppProps): JSX.Element => {
    const {
        cues,
        setCues,
        playing,
        setPlaying,
        currentTime,
        setCurrentTime,
        activeCueId,
        setActiveCueId,
        activeCueElement,
        setActiveCueElement,
    } = useCueSync();
    const { autoScroll, setAutoScroll, isScrolledToBottom, setIsScrolledToBottom } = useTranscriptionScroll();

    const [sidebarOpen, setSidebarOpen] = createSignal(true);
    const [animating, setAnimating] = createSignal(false);
    const [isAnimatingOut, setIsAnimatingOut] = createSignal(false);
    const [sidebarWidth, setSidebarWidth] = createSignal(320);
    const [isDragging, setIsDragging] = createSignal(false);

    const [overlayStyles, setOverlayStyles] = createSignal({
        top: 0,
        height: 0,
        opacity: 0,
    });


    /** videoTimeControl finds the video element and creates three event listeners  which
     * rewind and fast forward when the left and right arrow keys are clicked, respectively, and
     * allow pausing by pressing spacebar.
     * <br> pre: none
     * <br> post: leftarrowclick-->rewind TIME seconds, rightarrowclick-->fast forward TIME sec,
     * spacebar-->video paused/played
     */
    const videoTimeControl = () => {
        const video: HTMLVideoElement | null = document.querySelector('video');
        const TIME = 10;
        video?.addEventListener('keydown', (event) => {
            const key: string = event.key;
            const callback = {
                "ArrowLeft": () => video.currentTime -= TIME,
                "ArrowRight": () => video.currentTime += TIME,
                " ": () => video.paused ? video.play() : video.pause()
            }[key];
            callback?.();
        })

    }

    /** captionsControl finds the video element and creates two event listeners which
     * decrease and increase caption size when the - and = keys are clicked, respectively.
     * <br> pre: none
     * <br> post: "-"-->shrink captions, "="-->enlarge captions by native increment
     */
    const captionsControl = () => {
        const fontPercent = document.getElementsByClassName("vjs-font-percent vjs-track-setting")[0];
        // can't use sizeSelect for event listener because it isn't permanent, use document
        document?.addEventListener('keydown', (event) => {
            const key: string = event.key;
            // to avoid error, only change selected size and trigger event if valid operation
            const sizeSelect = fontPercent.querySelector("select");
            if (sizeSelect) {
                const callback = {
                    "=": () => {
                        if (sizeSelect?.selectedIndex < sizeSelect?.options?.length - 1) {
                            sizeSelect.selectedIndex += 1;
                            sizeSelect.dispatchEvent(new Event('change'));
                        }
                    },
                    "-": () => {
                        if (sizeSelect?.selectedIndex > 0) {
                            sizeSelect.selectedIndex -= 1;
                            sizeSelect.dispatchEvent(new Event('change'));
                        }
                    },
                }[key];
                callback?.();
            }
        })
    }
    const { clear } = SearchStore;

    let transcriptContainerRef!: HTMLDivElement;
    let sidebarRef!: HTMLDivElement;
    let overlayUpdateInterval: number;

    const updateOverlayPosition = () => {
        const element = activeCueElement();
        if (element) {
            const cueRect = element.getBoundingClientRect();
            const top = element.offsetTop;
            const height = cueRect.height;

            setOverlayStyles({
                top,
                height,
                opacity: 1,
            });
        }
    };

    const scrollToActiveCue = () => {
        const element = activeCueElement();
        if (element) {
            const container = transcriptContainerRef;
            const cueTop = element.getBoundingClientRect().top;
            const containerTop = container.getBoundingClientRect().top;

            const padding = 8; // Adjust this value as needed

            // Scroll to the active element
            container.scrollTo({
                top: cueTop - containerTop + container.scrollTop - padding,
                behavior: 'smooth',
            });
        }
    };

    const autoScrollHandler = (interval: number) => {
        return setInterval(() => {
            if (state.selectedAction === 'search' || !autoScroll() || !playing()) {
                return;
            }

            scrollToActiveCue();
        }, interval);
    };

    const handleDragStart = (e: MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'ew-resize';
    };

    const handleDrag = (e: MouseEvent) => {
        if (!isDragging()) return;

        // Calculate width based on the distance from the right edge of the screen
        const newWidth = window.innerWidth - e.clientX;

        // Set minimum and maximum width constraints
        const minWidth = 275;
        const maxWidth = window.innerWidth * 0.3; // 30% of the screen width

        if (newWidth >= minWidth && newWidth <= maxWidth) {
            setSidebarWidth(newWidth);
        }
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
    };

    // Set up event listeners for video time updates and play/pause events
    createEffect(() => {
        const video = props.videoElement();
        if (!video) return;

        const handleTimeUpdate = (): void => {
            setCurrentTime(video.currentTime);
        };

        video.addEventListener('timeupdate', handleTimeUpdate);

        video.addEventListener('play', () => {
            setPlaying(true);
        });

        video.addEventListener('pause', () => {
            setPlaying(false);
        });
    });

    // Parse VTT data and set cues
    createEffect(() => {
        const data = props.vttData();
        if (data) {
            const parsedCues = parseVtt(data);
            setCues(parsedCues);
        }
    });

    // Determine the active cue based on current time
    createEffect(() => {
        const time = currentTime();
        const allCues = cues();

        const activeCue = allCues.find(cue => time >= cue.start && time <= cue.end);

        if (activeCue) {
            setActiveCueId(activeCue.id);
        } else {
            setActiveCueId(null);
        }
    });

    // Add event listeners for drag operations
    createEffect(() => {
        if (sidebarOpen()) {
            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', handleDragEnd);

            onCleanup(() => {
                document.removeEventListener('mousemove', handleDrag);
                document.removeEventListener('mouseup', handleDragEnd);
            });
        }
    });

    createEffect(() => {
        // Add data-sidebar-open attribute to the body element
        if (sidebarOpen()) {
            document.body.setAttribute('data-sidebar-open', 'true');
        } else {
            document.body.setAttribute('data-sidebar-open', 'false');
        }
    });

    // Set up auto-scrolling with interval along with video hotkey control
    onMount(() => {
        const scrollInterval = autoScrollHandler(500);

        // Set up interval for updating overlay position every 100ms
        overlayUpdateInterval = window.setInterval(updateOverlayPosition, 100);

        // Use createEffect for reactive tracking instead of setInterval
        createEffect(() => {
            const id = activeCueId();
            if (id) {
                const element = props.uiContainer.querySelector(`[data-cue-id="${id}"]`) as HTMLDivElement;
                setActiveCueElement(element);
            } else {
                setActiveCueElement(null);
                setOverlayStyles(prev => ({ ...prev, opacity: 0 }));
            }
        });

        // Set initial sidebar state with animation
        if (sidebarRef) {
            // Start with opacity 0 to prevent flash
            sidebarRef.style.opacity = '0';

            // Apply animation after a short delay to ensure DOM is ready
            setTimeout(() => {
                sidebarRef.style.opacity = '1';
                sidebarRef.style.animation = 'var(--animate-slide-in)';
            }, 100);
        }
        videoTimeControl()
        captionsControl()
        onCleanup(() => {
            clearInterval(scrollInterval);
            clearInterval(overlayUpdateInterval);
        });
    });

    onCleanup(() => {
        //video keydown is for videoTimeCOntrol, and document keydown is for captionControl
        const video = props.videoElement();
        if (video) {
            video.removeEventListener('timeupdate', () => { });
            video.removeEventListener('play', () => { });
            video.removeEventListener('pause', () => { });
            video.removeEventListener('keydown', () => {});
        }
        document.removeEventListener('keydown', () => {});
    });

    const handleManualScroll = () => {
        if (autoScroll() && playing()) {
            setAutoScroll(false);
        }

        // Check if scrolled to bottom
        if (transcriptContainerRef) {
            const { scrollTop, scrollHeight, clientHeight } = transcriptContainerRef;
            setIsScrolledToBottom(scrollTop + clientHeight >= scrollHeight - 1);
        }
    };

    const handleSyncClick = () => {
        // First set animating state to trigger animation
        setIsAnimatingOut(true);

        // Scroll to the active cue element
        const activeElement = activeCueElement();
        if (activeElement) {
            const container = transcriptContainerRef;
            const cueTop = activeElement.getBoundingClientRect().top;
            const containerTop = container.getBoundingClientRect().top;

            const padding = 8; // Adjust this value as needed

            // Scroll to the active element
            container.scrollTo({
                top: cueTop - containerTop + container.scrollTop - padding,
                behavior: 'smooth',
            });
        }

        // Then set autoScroll after animation completes
        setTimeout(() => {
            setAutoScroll(true);
            setIsAnimatingOut(false);
        }, 300); // Match to animation duration
    };

    const toggleSidebar = () => {
        if (animating()) return;

        setAnimating(true);

        if (sidebarOpen()) {
            sidebarRef.style.animation = 'var(--animate-slide-out)';
            setTimeout(() => {
                setSidebarOpen(false);
                setAnimating(false);
                setSelectedAction(null);
                clear();
            }, 300);
        } else {
            setSidebarOpen(true);
            sidebarRef.style.opacity = '0'; // Hide immediately to prevent flash

            // We need to wait for the next render cycle before applying the animation
            setTimeout(() => {
                if (sidebarRef) {
                    sidebarRef.style.opacity = '1';
                    sidebarRef.style.animation = 'var(--animate-slide-in)';
                    setTimeout(() => setAnimating(false), 300);
                }
            }, 10);
        }
    };

    return (
        <>
            <Show when={sidebarOpen()}>
                <div
                    ref={sidebarRef}
                    style={{
                        'box-shadow': 'var(--shadow-sm)',
                        width: `${sidebarWidth()}px`,
                        position: 'relative', // Ensure position is relative for absolute positioning
                    }}
                    class='relative flex h-screen flex-col overflow-hidden bg-white pt-3 font-sans tracking-tight shadow-xl'
                >
                    {/* Add drag handle to left side */}
                    <div
                        class='active:bg-ut-burntorange/50 absolute top-0 left-0 z-10 h-full w-0.5 cursor-ew-resize hover:bg-slate-200'
                        onMouseDown={handleDragStart}
                    />

                    <TopBar toggleSidebar={toggleSidebar} />

                    <QuickActions uiContainer={props.uiContainer} setAutoScroll={setAutoScroll} vttUrl={props.vttUrl} />

                    <BookmarkProvider activeCueElement={activeCueElement}>
                        <Transcription
                            ref={transcriptContainerRef}
                            videoElement={props.videoElement}
                            cues={cues}
                            overlayStyles={overlayStyles}
                            autoScroll={autoScroll}
                            setAutoScroll={setAutoScroll}
                            isScrolledToBottom={isScrolledToBottom}
                            isAnimatingOut={isAnimatingOut}
                            handleSyncClick={handleSyncClick}
                            onWheel={handleManualScroll}
                            vttUrl={props.vttUrl}
                        />
                    </BookmarkProvider>
                </div>
            </Show>

            <Show when={!sidebarOpen()}>
                <div class='fixed top-1/2 right-0 z-30 -translate-y-1/2'>
                    <button
                        style={{ 'box-shadow': 'var(--shadow-2xl)' }}
                        onClick={toggleSidebar}
                        class='bg-ut-burntorange hover:bg-ut-burntorange/95 shadow-ut-burntorange flex h-16 w-8 items-center justify-center rounded-l-md transition-colors hover:cursor-pointer'
                        aria-label='Open transcript'
                        title='Open UT Lectures+'
                    >
                        <ChevronLeft class='stroke-white' size={20} />
                    </button>
                </div>
            </Show>

            {/* Optional overlay for smooth dragging */}
            <Show when={isDragging()}>
                <div class='fixed inset-0 z-50 cursor-ew-resize' />
            </Show>
        </>
    );
};

export default App;
