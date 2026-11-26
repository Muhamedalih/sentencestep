"use client";

import { useEffect, useSyncExternalStore } from "react";

/** Whether this device has opened a section once, remembered per browser (a per-viewer convenience, so localStorage — it only decides whether the small «new» word is drawn on that section's button). */
const KEYS = {
  video: "sentencestep:video-seen",
  words: "sentencestep:words-seen",
  german: "sentencestep:german-seen",
} as const;

const listeners = new Set<() => void>();
/** The value every subscriber reads per section; absent until first read. Also what keeps the word gone for the rest of the tab when storage is blocked, where it could not be remembered anyway. */
const cached = new Map<string, boolean>();

function readSeen(key: string): boolean {
  let value = cached.get(key);
  if (value === undefined) {
    try {
      value = window.localStorage.getItem(key) === "1";
    } catch {
      value = true;
    }
    cached.set(key, value);
  }
  return value;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Remembers that the section was seen (this tab at least; this browser when storage allows) and tells every subscriber. */
function markSeen(storageKey: string): void {
  if (readSeen(storageKey)) return;
  cached.set(storageKey, true);
  try {
    window.localStorage.setItem(storageKey, "1");
  } catch {
    // The word is a convenience only.
  }
  for (const listener of listeners) listener();
}

function useSectionNew(storageKey: string, onSection: boolean): boolean {
  const seen = useSyncExternalStore(
    subscribe,
    () => readSeen(storageKey),
    () => true,
  );

  useEffect(() => {
    if (onSection) markSeen(storageKey);
  }, [onSection, storageKey]);

  return !seen;
}

/**
 * True until the learner has opened Video on this device: the Video button wears a small «new» word
 * meanwhile, and the visit itself (`onVideo`) retires it for good. Server-rendered as "seen" (no word)
 * and corrected right after hydration, so it never causes a hydration mismatch.
 */
export function useVideoNew(onVideo: boolean): boolean {
  return useSectionNew(KEYS.video, onVideo);
}

/** The same small «new» word for the Words (Word Lists) section. */
export function useWordsNew(onWords: boolean): boolean {
  return useSectionNew(KEYS.words, onWords);
}

/**
 * True until the learner has chosen German once (or closed the announcement): the language chip wears a
 * small dot, German's row in its list wears «new», and the English Home shows the announcement strip.
 * Choosing German (`german`) retires all three for good on this device.
 */
export function useGermanNew(german: boolean): boolean {
  return useSectionNew(KEYS.german, german);
}

/** Closes the German announcement for good on this device (the strip's × button). */
export function dismissGermanNew(): void {
  markSeen(KEYS.german);
}
