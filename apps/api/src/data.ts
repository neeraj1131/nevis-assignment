import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { CompanySchema, type Company } from '@nevis/shared';
import type { FastifyBaseLogger } from 'fastify';

/**
 * Resolves the dataset path relative to this module's own directory.
 *
 * This works unmodified from both layouts:
 *  - `src/data.ts` (tsx dev / vitest): `../data` resolves to `apps/api/data`.
 *  - `dist/data.js` (prod build): `../data` resolves to `apps/api/dist/data`,
 *    which `scripts/copy-data.mjs` populates as part of `pnpm build`.
 */
function resolveDatasetPath(): string {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  return path.join(moduleDir, '..', 'data', 'clients.json');
}

export function loadClientsDataset(logger: FastifyBaseLogger): Company {
  const datasetPath = resolveDatasetPath();
  const raw = readFileSync(datasetPath, 'utf-8');
  const json: unknown = JSON.parse(raw);
  const result = CompanySchema.safeParse(json);

  if (!result.success) {
    logger.fatal({ err: result.error, datasetPath }, 'clients dataset failed schema validation');
    throw new Error('Invalid clients dataset: failed CompanySchema validation');
  }

  return result.data;
}
