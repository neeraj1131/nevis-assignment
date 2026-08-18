import { useCallback, useState } from 'react';

export interface UseExpansionResult {
  expanded: ReadonlySet<string>;
  toggle: (id: string) => void;
  isExpanded: (id: string) => boolean;
}

/**
 * Holds the set of currently-expanded row ids for the hierarchy table.
 * `initialExpandedIds` seeds the set (e.g. the company id, so branches are
 * visible by default).
 *
 * M5 (deferred): expansion state is uncontrolled (owned entirely inside this
 * hook) — there's no `expanded`/`onExpandedChange` prop pair for a parent to
 * drive or observe it (e.g. to persist to the URL, or expand-all/collapse-all
 * from outside). Fine for the current single-table usage; would need adding
 * if another consumer needs to control it.
 */
export function useExpansion(initialExpandedIds: readonly string[] = []): UseExpansionResult {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set(initialExpandedIds));

  const toggle = useCallback((id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const isExpanded = useCallback((id: string) => expanded.has(id), [expanded]);

  return { expanded, toggle, isExpanded };
}
