"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether a horizontally-scrollable element currently has more
 * content hidden past its start or end edge, so a caller can render a fade
 * hint only on the edge(s) where content is actually cut off — never on an
 * edge that's already fully visible, and never once the strip has been
 * scrolled all the way to one side. Re-checks on scroll and on resize (a
 * ResizeObserver covers both the element's own size changing and its
 * content growing/shrinking, e.g. once async data replaces a loading
 * skeleton).
 */
export function useScrollEdgeFade<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [showStartFade, setShowStartFade] = useState(false);
  const [showEndFade, setShowEndFade] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function update() {
      const { scrollLeft, scrollWidth, clientWidth } = el!;
      setShowStartFade(scrollLeft > 1);
      setShowEndFade(scrollLeft + clientWidth < scrollWidth - 1);
    }

    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  return { ref, showStartFade, showEndFade };
}
