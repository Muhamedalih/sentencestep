"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { timingsKey, timingsOf } from "@/lib/video-dictation/timings";
import { saveVideoTimingsAction } from "@/lib/video-dictation/timings-actions";
import type { VideoSentence } from "@/lib/video-dictation/types";

/** saved: what is on screen is what everyone plays; unsaved: edited, waiting to be saved; failed: the save was refused. */
export type StopsSaveState = "saved" | "unsaved" | "saving" | "failed";

/** The times must stay untouched this long before they are saved by themselves (so a run of small nudges is one save). */
export const AUTOSAVE_DELAY_MS = 1200;

/**
 * Saves the Admin's hand-set times for everyone as soon as they stop moving them. The editor works on a
 * copy of the times in the page, and the Admin's own screen plays that copy: a time that was moved but
 * never saved sounded right on his screen while every other viewer still played the old one. So an edit
 * is never left only on the screen: it is saved a moment after the last change, "Save" saves at once, and
 * `state` says which of the two is true so the page can show it.
 */
export function useStopsAutosave({
  enabled,
  videoId,
  sentences,
  savedSentences,
}: {
  enabled: boolean;
  videoId: string;
  /** The times as they are on screen now. */
  sentences: readonly VideoSentence[];
  /** The times the page was loaded with: what the database held then. Read once. */
  savedSentences: readonly VideoSentence[];
}): { state: StopsSaveState; error: string | null; saveNow: () => void } {
  const [savedKey, setSavedKey] = useState(() => timingsKey(savedSentences));
  const savedKeyRef = useRef(savedKey);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const latest = useRef(sentences);
  latest.current = sentences;
  const busy = useRef(false);
  const key = timingsKey(sentences);

  const flush = useCallback(async () => {
    // A save that is running looks again when it ends, so edits made meanwhile are not left behind.
    if (busy.current) return;
    busy.current = true;
    try {
      for (;;) {
        const sending = latest.current;
        const sendingKey = timingsKey(sending);
        if (sendingKey === savedKeyRef.current) return;
        setSaving(true);
        setFailure(null);
        const result = await saveVideoTimingsAction(videoId, timingsOf(sending));
        if (result.error) {
          setFailure({ key: sendingKey, message: result.error });
          return;
        }
        savedKeyRef.current = sendingKey;
        setSavedKey(sendingKey);
      }
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }, [videoId]);

  useEffect(() => {
    if (!enabled || key === savedKeyRef.current) return;
    const timer = window.setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, key, flush]);

  const state: StopsSaveState = !enabled || key === savedKey
    ? "saved"
    : failure?.key === key
      ? "failed"
      : saving
        ? "saving"
        : "unsaved";

  // Leaving with an edit that is not saved yet asks first (the save itself cannot finish while the page unloads).
  useEffect(() => {
    if (state === "saved") return;
    const ask = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", ask);
    return () => window.removeEventListener("beforeunload", ask);
  }, [state]);

  return {
    state,
    error: state === "failed" ? (failure?.message ?? null) : null,
    saveNow: () => void flush(),
  };
}
