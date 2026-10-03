"use client";

import { useEffect, useState } from "react";

/** Live `matchMedia` result for an arbitrary query; false during SSR (it only drives post-mount behaviour). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    function handleChange(event: MediaQueryListEvent) {
      setMatches(event.matches);
    }
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}
