import { describe, expect, it } from 'vitest';
import { formatNumber } from './formatNumber.js';

describe('formatNumber', () => {
  it('adds thousands separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('formats small integers without separators', () => {
    expect(formatNumber(42)).toBe('42');
  });

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
});
