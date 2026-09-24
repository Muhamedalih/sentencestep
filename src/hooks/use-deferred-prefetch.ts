"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Time before the first prefetch fires, and the gap between each subsequent one. */
const INITIAL_DELAY_MS = 400;
const STAGGER_MS = 120;

/**
 * Warms the App Router's client-side cache for a list of hrefs — same
 * eventual result as Next.js's own default `<Link>` prefetch (instant
 * navigation on click), just spread out over time instead of firing the
 * instant every one of those links mounts/enters the viewport. That default
 * behavior is what a page rendering many links at once (a persistent
 * sidebar's nav items, every lesson card on a catalog page) turned into a
 * burst of simultaneous background requests competing with whatever content
 * the page was actually trying to show right then — measured adding real,
 * multi-second contention on first load and page-catalog views. Callers
 * pass `prefetch={false}` on the Link itself and call this hook alongside it
 * instead, so the exact same routes still get warmed — just starting
 * `INITIAL_DELAY_MS` after mount (well past the page's own critical
 * rendering) and `STAGGER_MS` apart from each other (so even a long list
 * never dispatches more than one at a time).
 *
 * `router.prefetch()`, not a `<link rel="prefetch">` tag: every caller of
 * this hook links to a route inside the same (app) root layout, so this is
 * always a soft client-side transition — exactly what router.prefetch()
 * warms. (Contrast with FirstTimeLanguagePicker's own deferred prefetch,
 * which crosses root layouts and therefore has to use a real
 * <link rel="prefetch"> instead — see that component's doc comment.)
 *
 * Depends on `hrefs.join("|")`, not `hrefs` itself, so callers don't need to
 * memoize the array they pass in — a new array with the same routes, in the
 * same order, on every render (the common case for a list derived from
 * props) won't restart the schedule.
 */
export function useDeferredPrefetch(hrefs: string[]) {
  const router = useRouter();
  const key = hrefs.join("|");

  useEffect(() => {
    if (hrefs.length === 0) return;
    const timers = hrefs.map((href, index) =>
      setTimeout(() => router.prefetch(href), INITIAL_DELAY_MS + index * STAGGER_MS),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on `key` (see doc comment), not `hrefs`/`router` themselves
  }, [key]);
}
