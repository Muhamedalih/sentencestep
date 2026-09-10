"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AudioClipStatus = "idle" | "loading" | "playing" | "error";

export interface UseAudioClipOptions {
  /**
   * Retries the SAME url in place, silently, before ever reporting "error" —
   * added for Book Learning Engine playback (see PronunciationButton's
   * disableSpeechFallback), where a transient network/decode hiccup on the
   * real narration clip used to surface as an immediate "error" status,
   * which in turn triggered a fallback to a different voice entirely. Most
   * such hiccups clear up within one retry, so this closes the gap without
   * ever needing another voice to fill it. Defaults to 0 (no retries — the
   * original behavior) for every caller that doesn't opt in.
   */
  maxRetries?: number;
  /** Delay before each retry. Defaults to 300ms. */
  retryDelayMs?: number;
}

/**
 * Minimal reusable player for a single audio-file URL. HTMLAudioElement
 * under the hood today, but callers only ever see play/stop/status, so the
 * source (uploaded file, Supabase Storage, a CDN, ...) can change later
 * without touching any component that uses this hook. Not tied to
 * pronunciation specifically — it just plays a URL.
 */
export function useAudioClip(src?: string | null, options?: UseAudioClipOptions) {
  const maxRetries = options?.maxRetries ?? 0;
  const retryDelayMs = options?.retryDelayMs ?? 300;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<AudioClipStatus>("idle");

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    setStatus("idle");
  }, []);

  const play = useCallback(
    (overrideSrc?: string, rate?: number) => {
      // Lets a caller play a just-resolved URL immediately in the same tick
      // it learned it, rather than waiting a render cycle for `src` (passed
      // into this hook) to catch up — this closure otherwise only sees `src`
      // as of whenever this callback was last recreated (its `[src]` dep).
      const resolvedSrc = overrideSrc ?? src;
      if (!resolvedSrc) return;

      // Replace any in-flight playback so repeated/rapid clicks never overlap.
      audioRef.current?.pause();

      function attempt(url: string, retriesLeft: number) {
        const audio = new Audio(url);
        // Same file, just played back slower — never a separate audio asset
        // per speed (see PronunciationSettingsProvider). preservesPitch keeps
        // a slowed-down clip sounding natural rather than a dragged-out
        // growl; it's the modern standard property (formerly
        // vendor-prefixed), on by default in evergreen browsers, set
        // explicitly here for certainty.
        audio.playbackRate = rate ?? 1;
        audio.preservesPitch = true;
        audioRef.current = audio;
        setStatus("loading");

        // A rapid second play() call starts a new Audio element before the
        // previous one's async "loading"/"playing"/"error" events have
        // necessarily fired yet. Without this guard, an old element's late
        // event (including a retry's own late failure) could overwrite the
        // status of the element that's actually current — only apply an
        // event if it's still the one audioRef points at.
        const isCurrent = () => audioRef.current === audio;

        function handleFailure() {
          if (!isCurrent()) return;
          if (retriesLeft > 0) {
            window.setTimeout(() => {
              if (isCurrent()) attempt(url, retriesLeft - 1);
            }, retryDelayMs);
            return;
          }
          setStatus("error");
        }

        audio.addEventListener("playing", () => {
          if (!isCurrent()) return;
          setStatus("playing");
        });
        audio.addEventListener("ended", () => isCurrent() && setStatus("idle"));
        audio.addEventListener("error", handleFailure);

        audio.play().catch(handleFailure);
      }

      attempt(resolvedSrc, maxRetries);
    },
    [src, maxRetries, retryDelayMs],
  );

  return { play, stop, status };
}
