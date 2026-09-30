"use client";

import { useEffect, useRef } from "react";

/** Elements whose own Enter behaviour (activating them) must not be hijacked into "continue". */
const NATIVE_ENTER_TARGETS = "button, a, summary, select, textarea, [role='button']";

/**
 * Makes Enter act as the "Continue" button on a feedback screen, wherever the
 * keyboard focus happens to be.
 *
 * Listening on the answer <input> is not enough: the moment the answer is
 * graded that input is read-only or gone, and clicking "Check" (or the replay
 * speaker) moves focus onto a button that then disappears — after which focus
 * is on <body> and an Enter press reached nothing at all. A window-level
 * listener has no such blind spot.
 *
 * Deliberately ignores: key auto-repeat (holding Enter must not skip several
 * screens), the first `graceMs` after the screen appears (a double-tap of
 * Enter, one press to check and a reflex second one, would otherwise skip the
 * feedback unread), modified presses, and Enter on a focused button or link,
 * whose native activation already does the right thing (so Enter on "Try
 * again" retries instead of continuing).
 */
export function useEnterToContinue(active: boolean, onEnter: () => void, graceMs = 250): void {
  const handlerRef = useRef(onEnter);
  handlerRef.current = onEnter;

  useEffect(() => {
    if (!active) return;
    const shownAt = Date.now();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Enter" || event.repeat || event.isComposing) return;
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      if (event.defaultPrevented) return;
      if (event.target instanceof Element && event.target.closest(NATIVE_ENTER_TARGETS)) return;
      event.preventDefault();
      if (Date.now() - shownAt < graceMs) return;
      handlerRef.current();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, graceMs]);
}
