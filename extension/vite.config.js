import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { cpSync, existsSync, readFileSync, writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Post-build: copy manifest.json + icons, and flatten popup.html to dist root
 */
function chromeExtensionPlugin() {
  return {
    name: 'chrome-extension-post-build',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');
      const publicDir = resolve(__dirname, 'public');

      // Copy public assets (manifest, icons)
      cpSync(publicDir, distDir, { recursive: true, force: true });

      // Move popup.html from nested location to root if needed
      const nestedPopup = resolve(distDir, 'src/popup/popup.html');
      const rootPopup = resolve(distDir, 'popup.html');
      if (existsSync(nestedPopup)) {
        let html = readFileSync(nestedPopup, 'utf-8');
        // Strip all relative ../ prefixes so paths resolve from dist root
        html = html.replace(/(src|href)="(?:\.\.\/)+/g, '$1="');
        writeFileSync(rootPopup, html);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), chromeExtensionPlugin()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content/index.jsx'),
        background: resolve(__dirname, 'src/background/service-worker.js'),
        popup: resolve(__dirname, 'src/popup/popup.html'),
      },
      output: {
        // Content script and background must be single files (no code splitting)
        // Chrome extension content scripts can't dynamically import chunks
        manualChunks: undefined,
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'content') return 'content.js';
          if (chunkInfo.name === 'background') return 'background.js';
          return '[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.[0]?.endsWith('.css') || assetInfo.name?.endsWith('.css')) {
            return 'content.css';
          }
          return 'assets/[name][extname]';
        },
      },
    },
    target: 'esnext',
    minify: 'esbuild',
    chunkSizeWarningLimit: 600,
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@utils': resolve(__dirname, 'src/utils'),
    },
  },
});
