"use client";

import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";

import { solveFitZoom } from "@/lib/today/fit-zoom";

/** The `roomy` screens of globals.css: laptop-wide and at least 720px tall. Smaller ones keep the compact layout. */
const ROOMY = "(min-width: 1024px) and (min-height: 720px)";
/** The boxes never grow past this, however tall the screen is. */
const MAX_ZOOM = 1.5;
/** What is left between the last box and the bottom of the window. */
const BOTTOM_GAP = 16;

/** The room the page itself keeps under the element: the bottom padding, border and margin of every container around it. */
function spaceBelow(element: HTMLElement): number {
  let total = 0;
  for (let node: HTMLElement | null = element; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    const parentSide =
      node === element ? 0 : parseFloat(style.paddingBottom) + parseFloat(style.borderBottomWidth);
    const margin = parseFloat(style.marginBottom);
    total +=
      (Number.isFinite(parentSide) ? parentSide : 0) + (Number.isFinite(margin) ? margin : 0);
  }
  return total;
}

/**
 * Fits the new Home page's boxes to the height of the window. It measures how much room is left
 * under the top of the boxes and sets one number, `--home-zoom`, which the boxes inside use as their
 * `zoom` (see TodayBox, HomeLessonCard, TestYourselfCard): the largest it can be while everything
 * still ends above the bottom edge. The widths do not change, only the size of what is inside, so
 * a tall screen no longer ends in an empty black strip and a short one scrolls no more than before.
 * It measures again when the window or the content changes (the boxes stream in one by one, and the
 * test card comes and goes). Until it has run — and where scripts do not — the boxes use their
 * fixed fallback of 1.1.
 */
export function FitHome({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const roomy = window.matchMedia(ROOMY);
    let frame = 0;

    const fit = () => {
      if (!roomy.matches) {
        element.style.removeProperty("--home-zoom");
        return;
      }
      const top = element.getBoundingClientRect().top + window.scrollY;
      const available = window.innerHeight - top - spaceBelow(element) - BOTTOM_GAP;
      const zoom = solveFitZoom(
        (candidate) => {
          element.style.setProperty("--home-zoom", String(candidate));
          return element.getBoundingClientRect().height;
        },
        available,
        { min: 1, max: MAX_ZOOM },
      );
      element.style.setProperty("--home-zoom", String(zoom));
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };

    fit();
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
