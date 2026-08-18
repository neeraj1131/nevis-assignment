import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CompanySchema, MonthlyValuesSchema } from '../src/schema.js';

const fixturePath = fileURLToPath(new URL('./fixtures/clients-payload.json', import.meta.url));
const fixture: unknown = JSON.parse(readFileSync(fixturePath, 'utf-8'));

describe('MonthlyValuesSchema', () => {
  it('accepts an array of 12 nonnegative integers', () => {
    const values = Array.from({ length: 12 }, (_, i) => i);
    expect(MonthlyValuesSchema.safeParse(values).success).toBe(true);
  });

  it('rejects arrays that are too short', () => {
    expect(MonthlyValuesSchema.safeParse([1, 2, 3]).success).toBe(false);
  });

  it('rejects arrays that are too long', () => {
    const values = Array.from({ length: 13 }, (_, i) => i);
    expect(MonthlyValuesSchema.safeParse(values).success).toBe(false);
  });

  it('rejects negative numbers', () => {
    const values = Array.from({ length: 12 }, () => -1);
    expect(MonthlyValuesSchema.safeParse(values).success).toBe(false);
  });

  it('rejects non-integer numbers', () => {
    const values = Array.from({ length: 12 }, () => 1.5);
    expect(MonthlyValuesSchema.safeParse(values).success).toBe(false);
  });
});

describe('CompanySchema', () => {
  it('accepts the real clients payload verbatim', () => {
    const result = CompanySchema.safeParse(fixture);
    expect(result.success).toBe(true);
  });

  it('rejects a company whose values array has the wrong length', () => {
    const fixtureObj = fixture as { values: number[] };
    const broken = { ...fixtureObj, values: fixtureObj.values.slice(0, 5) };
    expect(CompanySchema.safeParse(broken).success).toBe(false);
  });
});
