import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Overridable so the Playwright e2e suite (playwright.config.ts) can point
// the dev proxy at an api instance running on a non-default port, avoiding
// collisions with anything else already using :3000 on the host. Unset in
// normal `pnpm dev` usage, so the default stays localhost:3000.
const apiPort = process.env.VITE_DEV_API_PORT ?? '3000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
});
