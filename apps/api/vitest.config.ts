import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      // server.ts is a thin process bootstrap (listen + graceful shutdown
      // wiring); it's exercised end-to-end by Docker/manual runs, not unit
      // tests, so it's excluded from the coverage floor rather than faked.
      exclude: ['src/server.ts'],
      thresholds: {
        lines: 90,
        statements: 90,
        branches: 85,
        functions: 90,
      },
    },
  },
});
