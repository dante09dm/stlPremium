import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // FUSE workaround: these packages can't be installed via npm on the mounted FS
      '@ant-design/fast-color': path.resolve(__dirname, 'src/vendor/fast-color.js'),
      '@ant-design/colors':     path.resolve(__dirname, 'src/vendor/ant-colors.js'),
    },
    dedupe: ['three', 'react', 'react-dom']
  },
  server: {
    port: 3000,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    }
  }
})
