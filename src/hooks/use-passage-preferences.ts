"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_PLAYBACK_RATE,
  PASSAGE_PREF_KEYS,
  nextPlaybackRate,
  parsePlaybackRate,
  type PlaybackRate,
} from "@/lib/passages/prefs";

/**
 * The reader's per-device preferences: translation on/off, listen-only on/off
 * and the narration speed. They live in localStorage only — a convenience, never
 * state that matters — so every read and write is guarded (private windows and
 * blocked storage just mean the choice does not stick), and the first render
 * uses the defaults so the server and the client agree; the stored values arrive
 * right after mount (`ready`).
 */

function readString(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeString(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the preference lasts for this visit only.
  }
}

export interface PassagePreferences {
  /** Stored values have been read (until then the defaults are shown). */
  ready: boolean;
  translation: boolean;
  listenOnly: boolean;
  rate: PlaybackRate;
  toggleTranslation: () => void;
  toggleListenOnly: () => void;
  cycleRate: () => void;
}

export function usePassagePreferences(): PassagePreferences {
  const [ready, setReady] = useState(false);
  const [translation, setTranslation] = useState(false);
  const [listenOnly, setListenOnly] = useState(false);
  const [rate, setRate] = useState<PlaybackRate>(DEFAULT_PLAYBACK_RATE);

  useEffect(() => {
    setTranslation(readString(PASSAGE_PREF_KEYS.translation) === "1");
    setListenOnly(readString(PASSAGE_PREF_KEYS.listenOnly) === "1");
    setRate(parsePlaybackRate(readString(PASSAGE_PREF_KEYS.rate)));
    setReady(true);
  }, []);

  const toggleTranslation = useCallback(() => {
    setTranslation((current) => {
      writeString(PASSAGE_PREF_KEYS.translation, current ? null : "1");
      return !current;
    });
  }, []);

  const toggleListenOnly = useCallback(() => {
    setListenOnly((current) => {
      writeString(PASSAGE_PREF_KEYS.listenOnly, current ? null : "1");
      return !current;
    });
  }, []);

  const cycleRate = useCallback(() => {
    setRate((current) => {
      const next = nextPlaybackRate(current);
      writeString(PASSAGE_PREF_KEYS.rate, String(next));
      return next;
    });
  }, []);

  return { ready, translation, listenOnly, rate, toggleTranslation, toggleListenOnly, cycleRate };
}

/** The one-time "before you begin" card: whether it has been dismissed on this device. */
export function readTipsSeen(): boolean {
  return readString(PASSAGE_PREF_KEYS.tipsSeen) === "1";
}

export function writeTipsSeen(): void {
  writeString(PASSAGE_PREF_KEYS.tipsSeen, "1");
}
