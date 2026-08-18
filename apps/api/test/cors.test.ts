import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('CORS', () => {
  it('sets access-control-allow-origin for an allowed origin', async () => {
    const app = buildApp({ logger: false });
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/clients',
      headers: { origin: 'http://localhost:5173' },
    });

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    await app.close();
  });
});
