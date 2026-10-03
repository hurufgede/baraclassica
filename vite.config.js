import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/main.jsx', 'resources/styles/main.scss'],
            refresh: true,
            buildDirectory: 'dist'
        }),
        react()
    ],
    server: {
        watch: { ignored: ['**/storage/framework/views/**'] }
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true
    }
});