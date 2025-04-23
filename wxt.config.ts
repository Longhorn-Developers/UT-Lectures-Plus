import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
    srcDir: 'src',
    modules: ['@wxt-dev/module-solid'],
    imports: false, // Disable auto-imports
    vite: () => ({
        plugins: [tailwindcss()],
    }),
    manifest: {
        name: 'UT Lectures Plus',
        description:
            'This plugin adds a transcript box (with search) to all LectureOnline and TowerLA lectures from UT Austin! Studying has never been easier.',
        permissions: ['webRequest', 'storage'],
        host_permissions: ['*://*.la.utexas.edu/*'],
    },
});
