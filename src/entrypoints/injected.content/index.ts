import { defineContentScript } from '#imports';
import './injected.css';

export default defineContentScript({
    matches: ['*://*.la.utexas.edu/app_home/*', '*://*.la.utexas.edu/player/episode/*'],
    cssInjectionMode: 'manifest',
    async main() {},
});
