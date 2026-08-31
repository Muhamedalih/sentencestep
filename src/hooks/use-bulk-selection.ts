"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Row-selection state for an admin list's bulk-action bar (Content, Library,
 * Word Lists) — a plain Set so toggling/checking membership is O(1)
 * regardless of list size, cleared automatically whenever the visible id set
 * changes (a filter/search/page navigation) so a stale selection can never
 * silently apply to rows no longer on screen.
 */
export function useBulkSelection(visibleIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const visibleSet = useMemo(() => new Set(visibleIds), [visibleIds]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => (prev.size === visibleIds.length ? new Set() : new Set(visibleIds)));
  }, [visibleIds]);

  const clear = useCallback(() => setSelected(new Set()), []);

  // Only ever counts ids that are still actually visible — a selection made
  // before a filter change is silently dropped rather than acted on blind.
  const selectedVisible = useMemo(
    () => Array.from(selected).filter((id) => visibleSet.has(id)),
    [selected, visibleSet],
  );

  return {
    selected: selectedVisible,
    isSelected: (id: string) => selected.has(id),
    allSelected: visibleIds.length > 0 && selectedVisible.length === visibleIds.length,
    toggle,
    toggleAll,
    clear,
  };
}
