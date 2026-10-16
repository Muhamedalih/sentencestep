"use client";

import { useCallback, useSyncExternalStore } from "react";

import { isLearnerSoundTone } from "@/lib/typing-sound-packs";
import type { LearnerSoundTone } from "@/lib/typing-sound-packs";

/** Which typing-sound tone the learner picked, remembered per browser until they pick another (a per-viewer convenience like the mute switch, so localStorage). */
const STORAGE_KEY = "sentencestep:key-sound-tone";

const listeners = new Set<() => void>();
/** The value every subscriber reads; undefined until first read, null = never chosen. Also what keeps the choice working for the rest of the tab when storage is blocked (private windows). */
let cached: LearnerSoundTone | null | undefined;

function readTone(): LearnerSoundTone | null {
  if (cached === undefined) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      cached = isLearnerSoundTone(stored) ? stored : null;
    } catch {
      cached = null;
    }
  }
  return cached;
}

function writeTone(next: LearnerSoundTone): void {
  cached = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Preference is a convenience only.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // Another tab changing the tone is picked up too.
  function handleStorage(event: StorageEvent) {
    if (event.key !== STORAGE_KEY) return;
    cached = isLearnerSoundTone(event.newValue) ? event.newValue : null;
    listener();
  }
  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

/**
 * The learner's own typing-sound tone, shared by every component on the page —
 * the picker in the lesson settings panel (LessonSettings) and useTypingSound,
 * which plays it in place of the admin's pack — so a pick takes effect on the
 * very next keystroke everywhere. `tone` is null until the learner chooses,
 * which means "keep the sound the app is set to". Server-rendered as null and
 * corrected right after hydration, so it never causes a hydration mismatch.
 */
export function useKeySoundTone() {
  const tone = useSyncExternalStore(subscribe, readTone, () => null);
  const setTone = useCallback((next: LearnerSoundTone) => writeTone(next), []);
  return { tone, setTone };
}
