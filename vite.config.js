import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.js', 'resources/js/admin.js'],
            refresh: true,
        }),
    ],
    server: {
        host: '0.0.0.0',
        allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1'],
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
