"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type Section = "stories" | "daily_lessons";

const SECTIONS: Section[] = ["stories", "daily_lessons"];
/** Active time in a section at which one Clarity event is sent (once per section per tab session). */
const MILESTONES_SECONDS = [10, 30, 60, 120, 300, 600];
/** A pause between two actions longer than this means the learner walked away: that pause is not counted. */
const IDLE_MS = 30_000;
const STORAGE_KEY = "looma:section-active-ms";

function sectionOf(pathname: string): Section | null {
  if (pathname === "/learn/stories" || pathname.startsWith("/learn/stories/")) return "stories";
  if (pathname === "/learn/normal" || pathname.startsWith("/learn/normal/")) return "daily_lessons";
  return null;
}

/** Totals survive a full page reload within the tab, so a reload neither restarts the clock nor re-sends milestones. */
function loadTotals(): Record<Section, number> {
  const totals = { stories: 0, daily_lessons: 0 };
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && typeof saved === "object") {
      for (const section of SECTIONS) {
        const value = (saved as Record<string, unknown>)[section];
        if (typeof value === "number" && Number.isFinite(value) && value > 0) {
          totals[section] = value;
        }
      }
    }
  } catch {
    // Storage blocked or unreadable: start from zero.
  }
  return totals;
}

function sendToClarity(method: "set" | "event", ...args: string[]) {
  const clarity = (window as unknown as { clarity?: (...params: string[]) => void }).clarity;
  if (typeof clarity === "function") clarity(method, ...args);
}

/**
 * Measures how long a learner really spends in Stories and in Daily Lessons and
 * reports it to Microsoft Clarity. Clarity itself only has session-wide numbers
 * (its "active time" is one figure for the whole visit and only counts input it
 * recognises), so it cannot say how many seconds went to one section; this counts
 * them directly instead. The time between two consecutive actions (key, pointer,
 * touch, scroll) counts when it is 30 seconds or less, so reading and thinking
 * between actions is included but walking away is not, and time in a hidden tab
 * never is. The section comes from the URL: /learn/stories/* is Stories,
 * /learn/normal/* is Daily Lessons.
 *
 * What shows up in Clarity:
 * - Smart events `stories_10s … stories_600s` and `daily_lessons_10s … daily_lessons_600s`,
 *   each sent once the section's active time in the tab session reaches that mark
 *   (Dashboard / Filters / Recordings: "sessions that spent 2+ minutes in Stories").
 * - Custom tags `stories_seconds` and `daily_lessons_seconds` holding the exact total
 *   so far, refreshed whenever the learner leaves a section or hides the tab. Clarity
 *   keeps every value a tag is given in a session, so the highest one is the total.
 *
 * Renders nothing and talks only to Clarity — no Supabase or server load.
 */
export function SectionTimeTracker() {
  const pathname = usePathname();
  const sectionRef = useRef<Section | null>(null);
  const flushRef = useRef<() => void>(() => {});

  useEffect(() => {
    const totals = loadTotals();
    const sent = {
      stories: Math.floor(totals.stories / 1000),
      daily_lessons: Math.floor(totals.daily_lessons / 1000),
    };
    // The last action, or the moment the tab became visible again.
    let lastActivity = Date.now();

    const save = () => {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(totals));
      } catch {
        // Storage blocked: the clock just restarts after a reload.
      }
    };
    const flush = () => {
      for (const section of SECTIONS) {
        const seconds = Math.floor(totals[section] / 1000);
        if (seconds > sent[section]) {
          sent[section] = seconds;
          sendToClarity("set", `${section}_seconds`, String(seconds));
        }
      }
    };
    const onActivity = () => {
      const now = Date.now();
      const gap = now - lastActivity;
      lastActivity = now;
      const section = sectionRef.current;
      if (!section || gap > IDLE_MS) return;
      const before = Math.floor(totals[section] / 1000);
      totals[section] += gap;
      const after = Math.floor(totals[section] / 1000);
      if (after === before) return;
      for (const mark of MILESTONES_SECONDS) {
        if (before < mark && after >= mark) sendToClarity("event", `${section}_${mark}s`);
      }
      save();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
      else lastActivity = Date.now();
    };

    flushRef.current = flush;
    const activityEvents = [
      "keydown",
      "pointerdown",
      "pointermove",
      "touchstart",
      "wheel",
      "scroll",
    ];
    for (const name of activityEvents) {
      window.addEventListener(name, onActivity, { capture: true, passive: true });
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);

    return () => {
      for (const name of activityEvents) window.removeEventListener(name, onActivity, true);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  useEffect(() => {
    // Moving between sections (or out of them): report the section just left, then switch.
    flushRef.current();
    sectionRef.current = sectionOf(pathname);
  }, [pathname]);

  return null;
}
