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

  it('keys the limit on the outermost trusted hop, so a spoofed X-Forwarded-For cannot evade it', async () => {
    const app = buildApp({ logger: false });

    // `trustProxy: 1` (app.ts) trusts exactly one hop: the entry an actual
    // reverse proxy (nginx in docker-compose) would append after the real
    // client's own X-Forwarded-For contribution. Everything to the left of
    // that outermost entry is attacker-controlled and must be ignored when
    // deriving the rate-limit key.
    const trustedHopIp = '203.0.113.9';

    let last;
    for (let i = 0; i < 101; i += 1) {
      // Rotate the spoofable, client-supplied portion of the header on every
      // request, as an attacker would to try to land each request in a
      // fresh per-IP bucket. Only the trailing, "proxy-appended" entry stays
      // constant.
      last = await app.inject({
        method: 'GET',
        url: '/healthz',
        headers: { 'x-forwarded-for': `10.0.${String(i)}.${String(i)}, ${trustedHopIp}` },
      });
    }

    // If the rotating spoofed entries were honored, every request would get
    // its own bucket and 101 requests would never trip the limit. Because
    // only the trusted outermost hop is used, they all land in the same
    // bucket and the 101st request is rejected — proving the derived
    // client ip did not change despite the spoofing attempt.
    expect(last?.statusCode).toBe(429);

    await app.close();
  });
});
