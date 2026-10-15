"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Plays a passage part's narrated sentences — one clip per sentence, one after
 * the other — and tells the screen which sentence is speaking so it can light
 * it up.
 *
 * Why per-sentence clips and not one clip per part: the highlight needs no
 * timestamps (the sentence that is playing IS the active one), a learner can
 * tap any sentence to hear just that one, and a character's sentences can be
 * spoken by that character's own voice. One <audio> element is reused for
 * every sentence, so a phone that allowed the first play (a tap) allows the
 * rest of the part too. The next clip is fetched ahead while the current one
 * speaks, so the gap between sentences is a short, natural pause and not a
 * download.
 *
 * Nothing here generates audio. A part is only offered for listening once
 * EVERY one of its sentences has a clip (`hasAudio`): a part narrated halfway
 * — say a generation run that stopped — would read out some sentences and skip
 * others, which is worse than reading it silently, so it reports
 * `hasAudio: false` and the screen says the audio is not ready yet.
 *
 * `rate` is the learner's chosen speed (see PLAYBACK_RATES): it is applied to
 * every clip as it starts and to the one playing when it changes.
 */

export interface PassageAudioLine {
  id: string;
  audioUrl: string | null;
}

export interface PassageAudioState {
  /** Index of the sentence being spoken (or paused on); null when idle. */
  activeIndex: number | null;
  /** True while a clip is playing. */
  playing: boolean;
  /** True from the moment a clip is requested until it starts — for a spinner, never a blocker. */
  loading: boolean;
  /** Whether the whole part is being read through (true) or a single tapped sentence (false). */
  readingThrough: boolean;
  /** True only after the learner pressed pause — the short gap between two sentences is NOT a pause, so a button that shows pause/listen follows this, not `playing`. */
  paused: boolean;
  /** True once a read-through has played to its last sentence (until the next one starts) — the listen-only screen uses it to say "finished". */
  finished: boolean;
}

const IDLE: PassageAudioState = {
  activeIndex: null,
  playing: false,
  loading: false,
  readingThrough: false,
  paused: false,
  finished: false,
};

/** The pause between two sentences of a part being read through — long enough to hear a change of speaker, short enough not to drag. */
const GAP_BETWEEN_LINES_MS = 320;

export function usePassageAudio(lines: readonly PassageAudioLine[], rate = 1) {
  const [state, setState] = useState<PassageAudioState>(IDLE);

  const linesRef = useRef(lines);
  linesRef.current = lines;
  const rateRef = useRef(rate);
  rateRef.current = rate;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  /** Bumped by every new request to play or stop, so a clip that ends after the learner moved on can never start the next sentence. */
  const runRef = useRef(0);
  const gapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasAudio = lines.length > 0 && lines.every((line) => Boolean(line.audioUrl));

  const clearGapTimer = useCallback(() => {
    if (gapTimerRef.current) {
      clearTimeout(gapTimerRef.current);
      gapTimerRef.current = null;
    }
  }, []);

  const getAudio = useCallback((): HTMLAudioElement => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = "auto";
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  /** Starts fetching the clip after `index` so it is ready when the current sentence ends. */
  const preloadAfter = useCallback((index: number) => {
    const next = linesRef.current.slice(index + 1).find((line) => line.audioUrl);
    if (!next?.audioUrl) return;
    if (!preloadRef.current) {
      preloadRef.current = new Audio();
      preloadRef.current.preload = "auto";
    }
    if (preloadRef.current.src !== next.audioUrl) preloadRef.current.src = next.audioUrl;
  }, []);

  const stop = useCallback(() => {
    runRef.current += 1;
    clearGapTimer();
    const audio = audioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
    }
    setState(IDLE);
  }, [clearGapTimer]);

  const playFrom = useCallback(
    (startIndex: number, readThrough: boolean) => {
      runRef.current += 1;
      const run = runRef.current;
      clearGapTimer();

      const finish = (naturalEnd: boolean) => {
        if (run === runRef.current) setState({ ...IDLE, finished: naturalEnd });
      };

      const playIndex = (index: number) => {
        if (run !== runRef.current) return;

        // Skip a sentence that has no clip; at the end of the part, stop.
        let target = index;
        while (target < linesRef.current.length && !linesRef.current[target]?.audioUrl) {
          if (!readThrough) return finish(false);
          target += 1;
        }
        const line = linesRef.current[target];
        if (!line?.audioUrl) return finish(readThrough);

        const audio = getAudio();
        audio.onended = null;
        audio.onerror = null;
        audio.src = line.audioUrl;
        // Loading a new source resets the rate to the default one, so both are set.
        audio.defaultPlaybackRate = rateRef.current;
        audio.playbackRate = rateRef.current;
        audio.currentTime = 0;

        setState({
          activeIndex: target,
          playing: true,
          loading: true,
          readingThrough: readThrough,
          paused: false,
          finished: false,
        });
        preloadAfter(target);

        audio.onended = () => {
          if (run !== runRef.current) return;
          if (!readThrough || target >= linesRef.current.length - 1) return finish(readThrough);
          setState((current) => ({ ...current, playing: false }));
          gapTimerRef.current = setTimeout(() => playIndex(target + 1), GAP_BETWEEN_LINES_MS);
        };
        audio.onerror = () => {
          if (run !== runRef.current) return;
          // A clip that will not load must not freeze the part — move on, or stop.
          if (readThrough && target < linesRef.current.length - 1) playIndex(target + 1);
          else finish(false);
        };

        audio
          .play()
          .then(() => {
            if (run === runRef.current) setState((current) => ({ ...current, loading: false }));
          })
          .catch(() => {
            // Blocked by the browser or interrupted by a newer request: nothing to retry.
            finish(false);
          });
      };

      playIndex(startIndex);
    },
    [clearGapTimer, getAudio, preloadAfter],
  );

  /** Reads the whole part from the first sentence. */
  const playAll = useCallback(() => playFrom(0, true), [playFrom]);

  /** Plays just one sentence, the one a learner tapped. */
  const playLine = useCallback((index: number) => playFrom(index, false), [playFrom]);

  const pause = useCallback(() => {
    clearGapTimer();
    audioRef.current?.pause();
    setState((current) => ({ ...current, playing: false, loading: false, paused: true }));
  }, [clearGapTimer]);

  /** Continues a paused read-through where it stopped (or restarts the part when there is nothing to continue). */
  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || state.activeIndex === null) return playAll();
    setState((current) => ({ ...current, playing: true, loading: true, paused: false }));
    audio
      .play()
      .then(() => setState((current) => ({ ...current, loading: false })))
      .catch(() => stop());
  }, [playAll, state.activeIndex, stop]);

  /**
   * How far through the clip that is playing the voice is, 0 to 1. A getter and not state on
   * purpose: the highlight reads it on every animation frame, and a re-render of the whole page
   * sixty times a second would be the wrong way to follow a voice.
   */
  const getProgress = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return 0;
    return Math.min(1, Math.max(0, audio.currentTime / audio.duration));
  }, []);

  // A new speed applies at once to the clip that is playing, not only from the next one.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.defaultPlaybackRate = rate;
    audio.playbackRate = rate;
  }, [rate]);

  // Leaving the part (or the page) silences it.
  useEffect(() => {
    return () => {
      runRef.current += 1;
      if (gapTimerRef.current) clearTimeout(gapTimerRef.current);
      const audio = audioRef.current;
      if (audio) {
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
      }
    };
  }, []);

  return { ...state, hasAudio, playAll, playLine, pause, resume, stop, getProgress };
}
