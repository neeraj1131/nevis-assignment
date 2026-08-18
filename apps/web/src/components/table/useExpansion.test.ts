import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useExpansion } from './useExpansion.js';

describe('useExpansion', () => {
  it('defaults to an empty expanded set when no initial ids are given', () => {
    const { result } = renderHook(() => useExpansion());

    expect(result.current.expanded.size).toBe(0);
    expect(result.current.isExpanded('company')).toBe(false);
  });

  it('seeds the expanded set from the provided initial ids', () => {
    const { result } = renderHook(() => useExpansion(['company']));

    expect(result.current.isExpanded('company')).toBe(true);
    expect(result.current.expanded.has('company')).toBe(true);
  });

  it('toggle adds an id that is not yet expanded', () => {
    const { result } = renderHook(() => useExpansion());

    act(() => {
      result.current.toggle('branch1');
    });

    expect(result.current.isExpanded('branch1')).toBe(true);
  });

  it('toggle removes an id that is already expanded', () => {
    const { result } = renderHook(() => useExpansion(['company']));

    act(() => {
      result.current.toggle('company');
    });

    expect(result.current.isExpanded('company')).toBe(false);
  });

  it('toggling one id does not affect others', () => {
    const { result } = renderHook(() => useExpansion(['company', 'branch1']));

    act(() => {
      result.current.toggle('branch1');
    });

    expect(result.current.isExpanded('company')).toBe(true);
    expect(result.current.isExpanded('branch1')).toBe(false);
  });
});
