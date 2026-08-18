import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('GET /docs/json', () => {
  it('returns an OpenAPI spec that documents /api/v1/clients', async () => {
    const app = buildApp({ logger: false });
    const response = await app.inject({ method: 'GET', url: '/docs/json' });

    expect(response.statusCode).toBe(200);
    const spec = response.json<{
      info: { title: string };
      paths: Record<string, unknown>;
    }>();

    expect(spec.info.title).toBe('Nevis Clients API');
    expect(spec.paths['/api/v1/clients']).toBeTruthy();

    await app.close();
  });
});
