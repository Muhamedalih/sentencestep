"use client";

import { useLayoutEffect, useState } from "react";

const STORAGE_KEY = "sentencestep-theme";

/**
 * Reads/writes the `dark` class on <html> that globals.css's `.dark`
 * token overrides key off. The actual pre-hydration application of that
 * class (so there's no flash of the wrong theme on load) happens in a tiny
 * inline script in src/app/layout.tsx — this hook only needs to stay in
 * sync with whatever that script (or a previous toggle) already set.
 *
 * `isDark` starts false to match what the server always renders (it has no
 * way to know the client's preference, and a lazy initializer that read the
 * DOM here would make the client's very first hydration render disagree
 * with the server-rendered HTML — a real hydration mismatch, not just a
 * visual one). It then syncs to the real DOM state in a `useLayoutEffect`,
 * which — unlike a plain `useEffect` — runs synchronously before the browser
 * paints, so the correction lands before anything is drawn: no hydration
 * mismatch, and no flash of the wrong icon/label either.
 */
export function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useLayoutEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // localStorage can be unavailable (private browsing, disabled) — the
      // toggle still applies for this page load, it just won't persist.
    }
    setIsDark(next);
  }

  return { isDark, toggle };
}
