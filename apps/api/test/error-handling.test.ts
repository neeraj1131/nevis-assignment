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
});
