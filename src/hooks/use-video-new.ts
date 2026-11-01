"use client";

import { useEffect, useSyncExternalStore } from "react";

/** Whether this device has opened Video once, remembered per browser (a per-viewer convenience, so localStorage — it only decides whether the small «new» word is drawn on the Video button). */
const STORAGE_KEY = "sentencestep:video-seen";

const listeners = new Set<() => void>();
/** The value every subscriber reads; null until first read. Also what keeps the word gone for the rest of the tab when storage is blocked, where it could not be remembered anyway. */
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
 * True until the learner has opened Video on this device: the Video button wears a small «new» word
 * meanwhile, and the visit itself (`onVideo`) retires it for good. Server-rendered as "seen" (no word)
 * and corrected right after hydration, so it never causes a hydration mismatch.
 */
export function useVideoNew(onVideo: boolean): boolean {
  const seen = useSyncExternalStore(subscribe, readSeen, () => true);

  useEffect(() => {
    if (!onVideo || readSeen()) return;
    cached = true;
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // The word is a convenience only.
    }
    for (const listener of listeners) listener();
  }, [onVideo]);

  return !seen;
}
