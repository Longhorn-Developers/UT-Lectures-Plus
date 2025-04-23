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
        description: 'Enhance your UT Austin Lectures experience.',
        permissions: ['webRequest', 'tabs', 'storage'],
        host_permissions: ['*://*.la.utexas.edu/*'],
    },
});
