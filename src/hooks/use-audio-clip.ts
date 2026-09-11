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
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [status, setStatus] = useState<AudioClipStatus>("idle");

  // Cancels any retry still in flight, and — critically — clears audioRef so
  // a pending retry's own isCurrent() check (see `attempt` below) reads
  // false and gives up instead of starting a brand-new Audio element and
  // calling play() on it. Without the audioRef clear here, a retry
  // scheduled by a PronunciationButton instance that has since UNMOUNTED
  // (the learner moved to the next/previous sentence) would still fire on
  // its own timer, since a plain setTimeout outlives the component that
  // scheduled it — confirmed live: a sentence the learner had already
  // skipped past would suddenly start speaking on its own moments later.
  // Pausing alone (the original cleanup) stops sound already playing, but
  // does nothing to stop a retry that hasn't created its Audio element yet.
  function invalidate() {
    if (retryTimeoutRef.current !== undefined) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = undefined;
    }
    audioRef.current?.pause();
    audioRef.current = null;
  }

  useEffect(() => {
    return () => {
      invalidate();
    };
  }, []);

  const stop = useCallback(() => {
    invalidate();
    setStatus("idle");
  }, []);

  const play = useCallback(
    (
      overrideSrc?: string,
      rate?: number,
      /**
       * Plays only the [start, end] slice (seconds) of the clip instead of
       * the whole thing — the word-timing feature's own use case (see
       * word-timing.ts): a word click plays a slice of the SENTENCE's own
       * already-loaded narration clip instead of a separate isolated-word
       * file. Omitted (the default, every pre-existing caller) plays the
       * whole clip from 0, exactly as before this parameter existed.
       */
      range?: { start: number; end: number },
    ) => {
      // Lets a caller play a just-resolved URL immediately in the same tick
      // it learned it, rather than waiting a render cycle for `src` (passed
      // into this hook) to catch up — this closure otherwise only sees `src`
      // as of whenever this callback was last recreated (its `[src]` dep).
      const resolvedSrc = overrideSrc ?? src;
      if (!resolvedSrc) return;

      // Replace any in-flight playback/retry so repeated/rapid clicks never
      // overlap, and so this fresh play() can't later race a still-pending
      // retry from whatever was playing before it.
      invalidate();

      // Books-only diagnostic (the only caller that opts into retries today
      // — see maxRetries below): times how long each attempt actually takes
      // from "asked the browser to play" to real sound, and flags a retry
      // firing at all, so a reported lag can be pinned on the specific
      // stage (server resolve — see PronunciationButton's own timing log —
      // vs. the audio FILE itself being slow to fetch, vs. a genuine
      // playback error needing a retry) instead of guessed at.
      const diagnostics = maxRetries > 0;

      function attempt(url: string, retriesLeft: number, resumeFromSeconds: number) {
        const attemptStartedAt = diagnostics ? performance.now() : 0;
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
        // event if it's still the one audioRef points at. Also false once
        // this hook has unmounted or stop()/a new play() has invalidated it
        // (audioRef.current is null then) — see invalidate() above.
        const isCurrent = () => audioRef.current === audio;

        // A single real failure reliably fires BOTH the element's "error"
        // event AND a rejection of the play() promise below — confirmed live
        // as the cause of audible overlap/echo on retry: each call scheduled
        // its own retry timer, so one failure produced TWO independent retry
        // chains, each eventually starting its own Audio element and playing
        // the same clip at the same time. `handled` makes this attempt's
        // failure path run at most once no matter which path (or both) fires.
        let handled = false;

        function handleFailure() {
          if (handled || !isCurrent()) return;
          handled = true;
          if (diagnostics) {
            console.debug(
              `[book-audio] playback attempt failed after ${Math.round(performance.now() - attemptStartedAt)}ms` +
                (retriesLeft > 0
                  ? ` — retrying in ${retryDelayMs}ms`
                  : " — giving up (no more retries)"),
            );
          }
          if (retriesLeft > 0) {
            // Resuming near where playback actually stopped — rather than
            // restarting the clip from 0:00 — is what keeps a transient
            // mid-sentence hiccup sounding like a brief stumble instead of
            // the sentence audibly restarting from the beginning.
            const resumePoint = audio.currentTime > 0 ? audio.currentTime : resumeFromSeconds;
            retryTimeoutRef.current = setTimeout(() => {
              retryTimeoutRef.current = undefined;
              if (isCurrent()) attempt(url, retriesLeft - 1, resumePoint);
            }, retryDelayMs);
            return;
          }
          setStatus("error");
        }

        if (resumeFromSeconds > 0) {
          audio.addEventListener(
            "loadedmetadata",
            () => {
              if (isCurrent() && resumeFromSeconds < audio.duration) {
                audio.currentTime = resumeFromSeconds;
              }
            },
            { once: true },
          );
        }

        audio.addEventListener("playing", () => {
          if (!isCurrent()) return;
          if (diagnostics) {
            const elapsedMs = Math.round(performance.now() - attemptStartedAt);
            if (elapsedMs > 250) {
              console.debug(
                `[book-audio] slow audio fetch (${elapsedMs}ms) before playback started`,
              );
            }
          }
          setStatus("playing");
        });
        audio.addEventListener("ended", () => isCurrent() && setStatus("idle"));
        audio.addEventListener("error", handleFailure);

        // Stops at the slice's own end instead of playing into whatever
        // comes after it in the underlying clip. Confirmed live to still
        // bleed into the next word even after a first attempt at this fix —
        // that attempt computed the remaining time as `range.end -
        // audio.currentTime` read inside the "playing" handler, which
        // trusted the just-issued seek (audio.currentTime = range.start, in
        // the loadedmetadata handler above) to have already fully landed by
        // the time "playing" fires. It doesn't reliably: this app's own
        // sentence clips are ~30-50KB, well within a browser's initial
        // buffer, so "playing" can fire before the seek the SAME tick
        // requested has actually taken effect — audio.currentTime then still
        // reads ~0, making "remaining" the word's END position instead of
        // its DURATION, playing for that many extra seconds into whatever
        // comes after it. Using the slice's own fixed duration
        // (range.end - range.start, known up front, never re-derived from
        // currentTime) removes that dependency entirely — confirmed live
        // (see the standalone timing harness this was verified against
        // before redeploying). A `timeupdate` listener stays as a backup
        // stop (belt-and-suspenders, e.g. if a timer somehow gets throttled)
        // — harmless if the precise timer above already stopped it first,
        // since pause() on an already-paused element is a no-op.
        if (range) {
          const sliceDurationSeconds = Math.max(0, range.end - range.start);
          audio.addEventListener(
            "playing",
            () => {
              if (!isCurrent()) return;
              const remainingMs = (sliceDurationSeconds / (audio.playbackRate || 1)) * 1000;
              setTimeout(() => {
                if (isCurrent() && !audio.paused) {
                  audio.pause();
                  setStatus("idle");
                }
              }, remainingMs);
            },
            { once: true },
          );
          audio.addEventListener("timeupdate", () => {
            if (isCurrent() && audio.currentTime >= range.end && !audio.paused) {
              audio.pause();
              setStatus("idle");
            }
          });
        }

        audio.play().catch(handleFailure);
      }

      attempt(resolvedSrc, maxRetries, range?.start ?? 0);
    },
    [src, maxRetries, retryDelayMs],
  );

  return { play, stop, status };
}
