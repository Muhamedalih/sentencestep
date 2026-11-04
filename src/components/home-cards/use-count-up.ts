"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A number that counts up from 0 the first time it is shown (an ease-out of `ms`), and is simply
 * the number for a learner whose device asks for reduced motion. It starts once `ready` is true,
 * and a later change of the target (more words typed) is drawn at once, without counting again.
 */
export function useCountUp(target: number, ready: boolean, ms = 900): number {
  const [value, setValue] = useState(0);
  const played = useRef(false);

  useEffect(() => {
    if (!ready) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (played.current || reduced || target <= 0) {
      played.current = true;
      setValue(target);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / ms);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else played.current = true;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, ready, ms]);

  return value;
}
