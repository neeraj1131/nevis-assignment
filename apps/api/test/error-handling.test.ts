import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('error handling', () => {
  it('responds to an unknown route with RFC 9457 problem details', async () => {
    const app = buildApp({ logger: false });
    const response = await app.inject({ method: 'GET', url: '/does-not-exist' });

    expect(response.statusCode).toBe(404);
    expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);

    const body = response.json<{
      type: string;
      title: string;
      status: number;
      detail: string;
      instance: string;
    }>();
    expect(body.type).toBeTruthy();
    expect(body.title).toBeTruthy();
    expect(body.status).toBe(404);
    expect(body.instance).toBe('/does-not-exist');

    await app.close();
  });

  it('responds to an unhandled 5xx error with RFC 9457 problem details and no stack trace', async () => {
    const app = buildApp({ logger: false });
    app.get('/boom', () => {
      throw new Error('kaboom secret');
    });
    await app.ready();

    const response = await app.inject({ method: 'GET', url: '/boom' });

    expect(response.statusCode).toBe(500);
    expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);

    const body = response.json<{
      type: string;
      title: string;
      status: number;
      detail: string;
      instance: string;
    }>();
    expect(body.type).toBeTruthy();
    expect(body.title).toBeTruthy();
    expect(body.status).toBe(500);
    expect(body.detail).toBeTruthy();
    expect(body.instance).toBe('/boom');

    // The handler guarantees stack traces never reach the response body.
    expect(response.payload).not.toContain('kaboom secret');
    expect(response.payload).not.toContain('stack');
    expect(response.payload).not.toMatch(/\n\s*at /);

    await app.close();
  });

  it('falls back to "Bad Request" as the title when a 4xx error has no name', async () => {
    const app = buildApp({ logger: false });
    app.get('/nameless-4xx', () => {
      const error = new Error('missing field') as Error & { statusCode: number };
      error.statusCode = 400;
      error.name = '';
      throw error;
    });
    await app.ready();

    const response = await app.inject({ method: 'GET', url: '/nameless-4xx' });

    expect(response.statusCode).toBe(400);
    expect(response.json<{ title: string }>().title).toBe('Bad Request');

    await app.close();
  });
});
