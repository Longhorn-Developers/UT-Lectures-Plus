import { defineContentScript } from '#imports';
import './injected.css';

export default defineContentScript({
    matches: ['*://*.la.utexas.edu/*'],
    cssInjectionMode: 'manifest',
    async main() {},
});
