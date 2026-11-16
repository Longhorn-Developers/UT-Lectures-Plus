import { defineContentScript } from '#imports';

//Defining Player and Video interfaces
interface Player {
    ready(callback: () => void): void;
    textTracks(): TextTrackList;
    el(): HTMLElement;
    on(event: string, callback: () => void): void;
    off(event: string, callback: () => void): void;
}

interface VideoJs {
    getPlayers(): Record<string, Player | null>;
    hook(event: 'setup', callback: (player: Player) => void): void;
}

export default defineContentScript({
    matches: ['*://*.la.utexas.edu/app_home/*', '*://*.la.utexas.edu/player/episode/*'],
    world: 'MAIN',
    runAt: 'document_start',
    main() {
        //Checks and prevents attaching to the same player twice and waits until API's are ready
        const initialized = new WeakSet<Player>();

        const setup = (player: Player) => {
            if (initialized.has(player)) return;
            initialized.add(player);

            player.ready(() => {
                let active = true;
                let tracks: TextTrackList | undefined;
                const element = player.el();

                //Loops through video player's tracks and visably disable the subtitles
                const disableCaptions = () => {
                    if (!active || !tracks) return;
                    for (let i = 0; i < tracks.length; i++) {
                        const track = tracks[i];
                        if (track.kind === 'captions' && track.mode !== 'disabled') {
                            track.mode = 'disabled';
                        }
                    }
                };

                // Run after Video.js's default-track selection handlers.
                const scheduleDisable = () => queueMicrotask(disableCaptions);
                const bindTracks = () => {
                    tracks?.removeEventListener('addtrack', scheduleDisable);
                    tracks?.removeEventListener('change', scheduleDisable);
                    tracks = player.textTracks();
                    tracks.addEventListener('addtrack', scheduleDisable);
                    tracks.addEventListener('change', scheduleDisable);
                    scheduleDisable();
                };

                //Removes listeners once the user takes control or video player destroyed
                const cleanup = () => {
                    active = false;
                    tracks?.removeEventListener('addtrack', scheduleDisable);
                    tracks?.removeEventListener('change', scheduleDisable);
                    player.off('loadstart', bindTracks);
                    player.off('loadedmetadata', scheduleDisable);
                    player.off('dispose', cleanup);
                    element.removeEventListener('click', allowCaptionChoice, true);
                    element.removeEventListener('keydown', allowCaptionChoice, true);
                };

                //Stop override if user chooses to enable captions themselves using Enter or Space
                const allowCaptionChoice = (event: Event) => {
                    if (!event.isTrusted) return;
                    if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') return;
                    if (
                        event.target instanceof Element &&
                        event.target.closest('.vjs-subs-caps-button, .vjs-captions-button, .vjs-subtitles-button')
                    ) {
                        cleanup();
                    }
                };

                element.addEventListener('click', allowCaptionChoice, true);
                element.addEventListener('keydown', allowCaptionChoice, true);
                player.on('loadstart', bindTracks);
                player.on('loadedmetadata', scheduleDisable);
                player.on('dispose', cleanup);
                bindTracks();
            });
        };

        //Finds Video.js to attach setup hook. Checks every 250ms if player hasn't loaded yet.
        const connect = () => {
            const videojs = (window as Window & { videojs?: VideoJs }).videojs;
            if (!videojs?.getPlayers || !videojs.hook) return false;
            videojs.hook('setup', setup);
            Object.values(videojs.getPlayers()).forEach(player => {
                if (player) setup(player);
            });
            return true;
        };

        //Recheck if Video.js has loaded. 
        if (!connect()) {
            const timer = window.setInterval(() => {
                if (connect()) window.clearInterval(timer);
            }, 250);
            window.addEventListener('pagehide', () => window.clearInterval(timer), { once: true });
        }
    },
});
