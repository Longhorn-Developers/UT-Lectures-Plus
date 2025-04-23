import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
    modules: ['@wxt-dev/module-solid'],
    vite: () => ({
        plugins: [tailwindcss()],
    }),
    manifest: {
        name: 'UT Lectures Plus',
        description:
            'This plugin adds a transcript box (with search) to all LectureOnline and TowerLA lectures from UT Austin! Studying has never been easier.',
        permissions: ['webRequest', 'tabs', 'storage'],
        host_permissions: ['*://*.la.utexas.edu/*'],
    },
});
