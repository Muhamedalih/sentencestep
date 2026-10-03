"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * A whole number that counts up to `value` when it appears (and eases to a new
 * value when it changes), instead of just being there — the redesigned Word
 * Lists' "numbers that count" in place of celebration icons. Reduced motion
 * shows the final number at once. The element carries the final number as its
 * accessible text from the first paint, so assistive technology never reads a
 * half-counted figure.
 */
export function CountUp({
  value,
  durationMs = 700,
  className,
}: {
  value: number;
  durationMs?: number;
  className?: string;
}) {
  const reducedMotion = useReducedMotion() ?? false;
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  shownRef.current = shown;

  useEffect(() => {
    if (reducedMotion || durationMs <= 0) {
      setShown(value);
      return;
    }
    const from = shownRef.current;
    if (from === value) return;
    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      // Ease-out cubic: fast at first, settling on the number.
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(from + (value - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs, reducedMotion]);

  return (
    <span className={className} dir="ltr">
      <span aria-hidden="true" className="tabular-nums">
        {shown}
      </span>
      <span className="sr-only">{value}</span>
    </span>
  );
}
