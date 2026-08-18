import { http, HttpResponse } from 'msw';
import { MONTHS } from '@nevis/shared';
// Duplicated from the canonical fixture at
// packages/shared/test/fixtures/clients-payload.json (also mirrored at
// .superpowers/sdd/clients-payload.json). Kept local so apps/web's test
// suite doesn't reach into another package's test directory; the shared
// package does not currently export this fixture for cross-package import.
import clientsPayload from './fixtures/clients-payload.json' with { type: 'json' };

export const FIXED_GENERATED_AT = '2025-01-01T00:00:00.000Z';

export const handlers = [
  http.get('/api/v1/clients', () => {
    return HttpResponse.json({
      data: clientsPayload,
      meta: { months: MONTHS, generatedAt: FIXED_GENERATED_AT },
    });
  }),
];
