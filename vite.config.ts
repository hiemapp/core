import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        dts({
            insertTypesEntry: true,
            include: [resolve(__dirname, 'dist/api/index.d.ts')]
        })
    ],
    build: {
        lib: {
            entry: resolve(__dirname, 'dist/api/index.d.ts'),
            name: 'api'
        },
        emptyOutDir: false,
    }
});
