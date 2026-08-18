import { describe, expect, it } from 'vitest';
import { MONTHS } from '../src/months.js';

describe('MONTHS', () => {
  it('has exactly 12 entries', () => {
    expect(MONTHS).toHaveLength(12);
  });

  it('starts at Feb 2024 and ends at Jan 2025', () => {
    expect(MONTHS[0]).toBe('Feb 2024');
    expect(MONTHS[11]).toBe('Jan 2025');
  });
});
