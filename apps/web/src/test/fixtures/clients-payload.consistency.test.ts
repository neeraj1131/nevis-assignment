import { describe, expect, it } from 'vitest';
import canonical from '../../../../api/data/clients.json' with { type: 'json' };
import fixture from './clients-payload.json' with { type: 'json' };

// The same payload is deliberately kept as static fixtures in three places
// (apps/api/data/clients.json is the canonical copy the server serves,
// mirrored here and in packages/shared/test/fixtures/ so each package's
// tests don't reach across a workspace boundary at runtime). This guard
// catches the copies silently drifting apart if only one gets edited.
describe('web fixture consistency', () => {
  it('matches apps/api/data/clients.json exactly', () => {
    expect(fixture).toEqual(canonical);
  });
});
