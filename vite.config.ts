import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      // During local dev with `netlify dev`, Netlify CLI serves functions on :8888.
      // When running plain `vite dev`, this proxy forwards /api to the local function port.
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, '/.netlify/functions'),
      },
    },
  },
});
