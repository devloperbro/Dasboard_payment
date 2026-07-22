import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Enable detailed logging
    hmr: {
      overlay: true
    },
    // Log all requests
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug'
      }
    }
  },
  // Source maps disabled for production (prevents exposing source to browser)
  build: {
    sourcemap: false
  },
  // Enable detailed logging
  logLevel: 'info'
});
