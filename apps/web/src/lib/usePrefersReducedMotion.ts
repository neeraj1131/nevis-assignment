import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/** Tracks the `prefers-reduced-motion` media query, updating live if the user changes it. */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const mediaQueryList = window.matchMedia(QUERY);
    const handleChange = (event: MediaQueryListEvent): void => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQueryList.addEventListener('change', handleChange);
    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}
