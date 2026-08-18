import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js';

function mockMatchMedia(matches: boolean): void {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
}

describe('usePrefersReducedMotion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when the media query does not match', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when the media query matches', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });
});
