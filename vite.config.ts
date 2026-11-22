import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const development = mode === 'development';

  return {
    base: './',
    publicDir: false,
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: development,
      minify: !development,
      cssMinify: !development,
      modulePreload: { polyfill: false },
      rolldownOptions: {
        input: { main: fileURLToPath(new URL('./src/ts/main.ts', import.meta.url)) },
        output: {
          entryFileNames: 'main.js',
          chunkFileNames: 'chunks/[name]-[hash].js',
          assetFileNames: ({ names }) =>
            names.includes('main.css') ? 'main.css' : 'assets/[name]-[hash][extname]',
        },
      },
    },
  };
});
