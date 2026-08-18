import { describe, expect, it, vi } from 'vitest';
import type { FastifyBaseLogger } from 'fastify';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(() => JSON.stringify({ not: 'a valid company' })),
}));

const { loadClientsDataset } = await import('../src/data.js');

describe('loadClientsDataset', () => {
  it('logs fatal and throws when the dataset fails CompanySchema validation', () => {
    const fatal = vi.fn();
    const logger = { fatal } as unknown as FastifyBaseLogger;

    expect(() => loadClientsDataset(logger)).toThrow(/Invalid clients dataset/);
    expect(fatal).toHaveBeenCalledOnce();
  });
});
