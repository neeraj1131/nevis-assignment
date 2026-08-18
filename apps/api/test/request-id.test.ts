import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('x-request-id', () => {
  it('sets a generated x-request-id response header when none is supplied', async () => {
    const app = buildApp({ logger: false });
    const response = await app.inject({ method: 'GET', url: '/healthz' });

    expect(response.headers['x-request-id']).toBeTruthy();

    await app.close();
  });

  it('echoes back an incoming x-request-id as both the request id and response header', async () => {
    const app = buildApp({ logger: false });
    const response = await app.inject({
      method: 'GET',
      url: '/healthz',
      headers: { 'x-request-id': 'client-supplied-id-123' },
    });

    expect(response.headers['x-request-id']).toBe('client-supplied-id-123');

    await app.close();
  });
});
