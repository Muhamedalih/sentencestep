"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Whether this device has opened the phone bar's «More» sheet once, remembered per browser (a per-viewer convenience, so localStorage — it only decides whether a small dot is drawn on the tab). */
const STORAGE_KEY = "sentencestep:phone-more-seen";

const listeners = new Set<() => void>();
/** The value every subscriber reads; null until first read. Also what keeps the dot gone for the rest of the tab when storage is blocked (private windows), where it could not be remembered anyway. */
let cached: boolean | null = null;

function readSeen(): boolean {
  if (cached === null) {
    try {
      cached = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      cached = true;
    }
  }
  return cached;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Whether the learner has already opened the phone bar's «More» sheet on this device, and a function
 * that records it. Server-rendered as "seen" (no dot) and corrected right after hydration, so it never
 * causes a hydration mismatch.
 */
export function usePhoneMoreSeen() {
  const seen = useSyncExternalStore(subscribe, readSeen, () => true);
  const markSeen = useCallback(() => {
    if (readSeen()) return;
    cached = true;
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // The dot is a convenience only.
    }
    for (const listener of listeners) listener();
  }, []);
  return { seen, markSeen };
}
