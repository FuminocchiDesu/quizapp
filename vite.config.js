import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/', // Add this for Vercel
  resolve: {
    alias: {
      pages: resolve(__dirname, 'src/pages'),
      layouts: resolve(__dirname, 'src/layouts'),
      routes: resolve(__dirname, 'src/routes'),
      components: resolve(__dirname, 'src/components'),
      stores: resolve(__dirname, 'src/stores'),
      helpers: resolve(__dirname, 'src/helpers'),
      assets: resolve(__dirname, 'src/assets'),
    },
  },
});