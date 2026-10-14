import brandFontPlugin from './scripts/brand-font-plugin.mjs';
import { defineConfig } from 'vite';

// Standalone UI preview for the sandbox; production assets are built through Laravel's Vite plugin.
export default defineConfig({
    plugins: [brandFontPlugin()],
    server: {
        host: '0.0.0.0',
        allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1'],
    },
});
