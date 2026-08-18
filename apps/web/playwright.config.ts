import { defineConfig, devices } from '@playwright/test';

// Dedicated, non-default ports so this suite doesn't collide with anything
// else already running on the host's :3000/:5173 (e.g. another app's dev
// server), and so CI can run it without special-casing the default ports.
const WEB_PORT = 4311;
const API_PORT = 4310;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${String(WEB_PORT)}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Boots both the real api and the web dev server (which proxies /api to
  // it, see vite.config.ts) so these tests exercise the same request path
  // as a real user rather than mocked fetches.
  webServer: [
    {
      command: 'pnpm --filter @nevis/api dev',
      url: `http://localhost:${String(API_PORT)}/healthz`,
      env: { PORT: String(API_PORT), CORS_ORIGIN: `http://localhost:${String(WEB_PORT)}` },
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: `pnpm --filter @nevis/web dev --port ${String(WEB_PORT)} --strictPort`,
      url: `http://localhost:${String(WEB_PORT)}`,
      env: { VITE_DEV_API_PORT: String(API_PORT) },
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
