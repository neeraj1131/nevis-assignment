import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      // main.tsx is the Vite entry point (createRoot/render); it has no
      // logic to unit test and is exercised by every e2e run instead.
      // test/** is fixtures/harness, not app code.
      exclude: ['src/main.tsx', 'src/vite-env.d.ts', 'src/test/**'],
      // Branches lag statements/lines here: several are Recharts internals
      // (legend/tooltip payload shapes) and Avatar's PALETTE fallback that
      // aren't practically reachable from component tests. 70% is the
      // measured floor rather than an arbitrary round number.
      thresholds: {
        lines: 80,
        statements: 80,
        branches: 70,
        functions: 80,
      },
    },
  },
});
