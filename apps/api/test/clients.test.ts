import { describe, expect, it } from 'vitest';
import { CompanySchema, MONTHS } from '@nevis/shared';
import { buildApp } from '../src/app.js';

describe('GET /api/v1/clients', () => {
  it('returns a company payload that parses against CompanySchema, with meta.months === MONTHS', async () => {
    const app = buildApp({ logger: false });
    const response = await app.inject({ method: 'GET', url: '/api/v1/clients' });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ data: unknown; meta: { months: unknown } }>();

    expect(() => CompanySchema.parse(body.data)).not.toThrow();
    expect(body.meta.months).toEqual(MONTHS);

    await app.close();
  });

  it('includes a generatedAt ISO timestamp in meta', async () => {
    const app = buildApp({ logger: false });
    const response = await app.inject({ method: 'GET', url: '/api/v1/clients' });
    const body = response.json<{ meta: { generatedAt: string } }>();

    expect(new Date(body.meta.generatedAt).toISOString()).toBe(body.meta.generatedAt);

    await app.close();
  });

  it('sends an exact Cache-Control header', async () => {
    const app = buildApp({ logger: false });
    const response = await app.inject({ method: 'GET', url: '/api/v1/clients' });

    expect(response.headers['cache-control']).toBe('public, max-age=300');

    await app.close();
  });

  it('returns an ETag on first request, and 304 with empty body when If-None-Match matches', async () => {
    const app = buildApp({ logger: false });

    const first = await app.inject({ method: 'GET', url: '/api/v1/clients' });
    expect(first.statusCode).toBe(200);
    const etag = first.headers.etag;
    expect(etag).toBeTruthy();

    const second = await app.inject({
      method: 'GET',
      url: '/api/v1/clients',
      headers: { 'if-none-match': String(etag) },
    });

    expect(second.statusCode).toBe(304);
    expect(second.body).toBe('');

    await app.close();
  });

  it('returns 200 with a fresh body when If-None-Match does not match', async () => {
    const app = buildApp({ logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/clients',
      headers: { 'if-none-match': '"not-the-real-etag"' },
    });

    expect(response.statusCode).toBe(200);

    await app.close();
  });
});
