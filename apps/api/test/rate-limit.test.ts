import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('rate limiting', () => {
  it('advertises the rate limit via headers on a normal request', async () => {
    const app = buildApp({ logger: false });
    const response = await app.inject({ method: 'GET', url: '/healthz' });

    expect(response.headers['x-ratelimit-limit']).toBe('100');

    await app.close();
  });

  it('returns a problem-details-shaped 429 once the limit is exceeded', async () => {
    const app = buildApp({ logger: false });

    let last;
    for (let i = 0; i < 101; i += 1) {
      last = await app.inject({ method: 'GET', url: '/healthz' });
    }

    expect(last?.statusCode).toBe(429);
    const body = last?.json<{ type: string; title: string; status: number }>();
    expect(body?.status).toBe(429);
    expect(body?.title).toBe('Too Many Requests');

    await app.close();
  });
});
