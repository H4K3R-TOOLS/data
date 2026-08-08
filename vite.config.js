import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // In local dev, proxy /api to Vercel dev server (run: vercel dev)
    // Or you can run: npm run dev alongside vercel dev
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
