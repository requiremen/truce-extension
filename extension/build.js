import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { cpSync, existsSync, readFileSync, writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runBuild() {
  const distDir = resolve(__dirname, 'dist');
  const publicDir = resolve(__dirname, 'public');

  // Common Vite config options
  const baseConfig = {
    configFile: false,
    plugins: [react()],
    base: './',
    resolve: {
      alias: {
        '@shared': resolve(__dirname, 'src/shared'),
        '@utils': resolve(__dirname, 'src/utils'),
      },
    },
  };

  // 1. Build Background (Service Worker)
  await build({
    ...baseConfig,
    build: {
      outDir: distDir,
      emptyOutDir: true, // Only empty on the first build
      rollupOptions: {
        input: resolve(__dirname, 'src/background/service-worker.js'),
        output: { entryFileNames: 'background.js', format: 'es' },
      },
    },
  });

  // 2. Build Content Script
  await build({
    ...baseConfig,
    build: {
      outDir: distDir,
      emptyOutDir: false,
      cssCodeSplit: false,
      rollupOptions: {
        input: resolve(__dirname, 'src/content/index.jsx'),
        output: { 
          entryFileNames: 'content.js', 
          format: 'iife', 
          assetFileNames: 'content.css'
        },
      },
    },
  });

  // 3. Build Popup
  await build({
    ...baseConfig,
    build: {
      outDir: distDir,
      emptyOutDir: false,
      rollupOptions: {
        input: resolve(__dirname, 'src/popup/popup.html'),
        output: { 
          entryFileNames: 'popup.js',
          assetFileNames: 'assets/[name]-[hash][extname]'
        },
      },
    },
  });

  // 4. Post-build tasks
  cpSync(publicDir, distDir, { recursive: true, force: true });

  const nestedPopup = resolve(distDir, 'src/popup/popup.html');
  const rootPopup = resolve(distDir, 'popup.html');
  if (existsSync(nestedPopup)) {
    let html = readFileSync(nestedPopup, 'utf-8');
    html = html.replace(/(src|href)="(?:\.\.\/)+/g, '$1="');
    writeFileSync(rootPopup, html);
  }

  console.log('✨ Extension build complete! No shared chunks created.');
}

runBuild().catch(console.error);
