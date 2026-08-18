import { describe, expect, it } from 'vitest';
import canonical from '../../../../apps/api/data/clients.json' with { type: 'json' };
import fixture from './clients-payload.json' with { type: 'json' };

// See apps/web/src/test/fixtures/clients-payload.consistency.test.ts for
// why this fixture is duplicated rather than shared at runtime, and what
// this guard is protecting against.
describe('shared fixture consistency', () => {
  it('matches apps/api/data/clients.json exactly', () => {
    expect(fixture).toEqual(canonical);
  });
});
