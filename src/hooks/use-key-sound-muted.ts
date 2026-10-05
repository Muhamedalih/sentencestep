"use client";

import { useCallback, useSyncExternalStore } from "react";

/** The learner's "mute the typing sound" choice, remembered per browser so it survives lesson changes (a per-viewer convenience, so localStorage — never the source of truth for anything that matters). */
const STORAGE_KEY = "sentencestep:key-sound-muted";

const listeners = new Set<() => void>();
/** The value every subscriber reads; null until first read. Also what keeps the choice working for the rest of the tab when storage is blocked (private windows). */
let cached: boolean | null = null;

function readMuted(): boolean {
  if (cached === null) {
    try {
      cached = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      cached = false;
    }
  }
  return cached;
}

function writeMuted(next: boolean): void {
  cached = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    // Preference is a convenience only.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // Another tab flipping the switch is picked up too.
  function handleStorage(event: StorageEvent) {
    if (event.key !== STORAGE_KEY) return;
    cached = event.newValue === "1";
    listener();
  }
  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

/**
 * Whether the learner has muted the keystroke sound, shared by every
 * component on the page — the typing-sounds switch in the lesson settings
 * panel (LessonSettings) and useTypingSound, which skips play() while muted — so
 * flipping it in one place takes effect on the very next keystroke
 * everywhere. Server-rendered as "not muted" and corrected right after
 * hydration, so it never causes a hydration mismatch.
 */
export function useKeySoundMuted() {
  const muted = useSyncExternalStore(subscribe, readMuted, () => false);
  const toggle = useCallback(() => writeMuted(!readMuted()), []);
  return { muted, toggle };
}
