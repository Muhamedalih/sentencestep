"use client";

import { useEffect, useState } from "react";

/** Same cutoff as every other "mobile" check across the app (LearnSidebar's tab strip, the lesson screen's tap-to-start gate, …). */
const MOBILE_MEDIA_QUERY = "(max-width: 639px)";

function matchesMobile(): boolean {
  return typeof window !== "undefined" && window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

/**
 * A real viewport-width check (never a user-agent guess), kept live across
 * resize/orientation change. The lazy initializer runs `matchMedia`
 * immediately on the client's first render instead of only inside an
 * effect — the gap between "mounted with the wrong default" and "effect
 * corrects it" is exactly what let a mobile-only gate (autoFocus, autoPlay)
 * fire once before flipping to the right value. Defaults to `false` during
 * SSR (`window` doesn't exist yet), which never mismatches hydration since
 * this value only ever drives a post-mount effect/behavior, not markup.
 */
export function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(matchesMobile);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_MEDIA_QUERY);
    setIsMobile(mql.matches);
    function handleChange(event: MediaQueryListEvent) {
      setIsMobile(event.matches);
    }
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
}
