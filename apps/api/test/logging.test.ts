import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/env.js';

describe('buildApp logger config', () => {
  it('skips the pino-pretty transport in production', async () => {
    // Deliberately don't pass an explicit `logger` option here: buildApp's
    // `opts.logger ?? { level, transport: isProduction ? undefined : ... }`
    // only evaluates that ternary when `logger` is omitted, so this is the
    // only way to exercise the `isProduction === true` branch. LOG_LEVEL is
    // 'silent' so the real pino logger this constructs stays quiet.
    const env = loadEnv({ NODE_ENV: 'production', LOG_LEVEL: 'silent' });
    const app = buildApp({ env });

    const response = await app.inject({ method: 'GET', url: '/healthz' });
    expect(response.statusCode).toBe(200);

    await app.close();
  });
});
