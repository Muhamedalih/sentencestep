"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  resolvePronunciationAudioAction,
  type VoiceAudioContentType,
} from "@/lib/voice/voice-audio";
import { lookupWordTimings, type WordTiming } from "@/lib/voice/word-timing";

/**
 * The three playback-speed states a learner can cycle through for spoken
 * pronunciation (see PronunciationSpeedControl). Multiplier is applied on
 * top of whatever "normal" already means for a given playback source —
 * HTMLAudioElement.playbackRate for a recorded/Kokoro clip (native pace is
 * 1), or the admin-configured browser-TTS rate (see DEFAULT_VOICE_SETTINGS)
 * for the speech-synthesis fallback — never a fixed absolute rate, so
 * "Normal" always matches whatever this deployment already sounds like.
 * 0.75/0.5 are the two most common language-learning slow-down bands: each
 * step is clearly, audibly slower than the last while staying well above
 * the point (well under ~0.5x) where browsers' pitch-preserving playback
 * and speech-synthesis engines start to sound dragged out or robotic.
 */
export const PRONUNCIATION_SPEED_STEPS = [
  { key: "normal", multiplier: 1 },
  { key: "slow", multiplier: 0.75 },
  { key: "very-slow", multiplier: 0.5 },
] as const;

interface PronunciationSettingsValue {
  /** False outside a PronunciationSettingsProvider (e.g. the Admin content preview, which reuses LessonSession directly) — the hint/speed UI render nothing in that case rather than showing dead controls, while PronunciationButton itself still works unaffected (multiplier just stays 1). */
  isActive: boolean;
  speedIndex: number;
  speedMultiplier: number;
  cycleSpeed: () => void;
  /** Called by the currently-mounted PronunciationButton so the global Shift shortcut always replays whichever sentence/word is actually on screen. */
  registerReplay: (replay: (() => void) | null) => void;
  replayCurrent: () => void;
  /** Increments every time a real standalone Shift press triggers a replay — purely a UI signal so ShiftReplayHint can play its brief "key pressed" animation; carries no data of its own. */
  shiftPulse: number;
  /**
   * Cross-mount resolved-audio cache, keyed by contentId (a sentence or
   * word id) — separate from, and a superset of, each PronunciationButton's
   * own local `kokoroUrl` state. That local state only survives for as long
   * as ONE specific sentence/word stays mounted; this one survives for the
   * whole learning session, so a sentence resolved once (via its own
   * on-demand resolve, via page-load pre-resolution, or via
   * prefetchPronunciation below) never pays the resolve round trip again if
   * the learner returns to it, and — combined with prefetchPronunciation —
   * lets the NEXT sentence's audio already be sitting here by the time the
   * learner actually reaches it.
   */
  getResolvedAudio: (contentId: string) => string | undefined;
  registerResolvedAudio: (contentId: string, audioUrl: string) => void;
  /**
   * The single entry point for resolving a sentence/word's audio, used by
   * BOTH prefetchPronunciation below AND PronunciationButton's own on-demand
   * resolve — deliberately the same function, not two, so a prefetch that's
   * still in flight when the learner reaches that sentence is *joined*
   * (returns the same in-progress promise) rather than triggering a second,
   * duplicate resolvePronunciationAudioAction call (and, on a cache miss, a
   * second concurrent Kokoro generation) for identical content. Returns the
   * cached URL synchronously-resolved if already known.
   */
  resolveAudio: (input: {
    contentType: VoiceAudioContentType;
    contentId: string;
    voiceId: string;
  }) => Promise<string | null>;
  /**
   * Fire-and-forget wrapper around resolveAudio — resolves (and caches) a
   * sentence/word's audio in the background, without playing it and without
   * touching any loading UI. A no-op if already cached or already in
   * flight, so calling it repeatedly (e.g. once per render) is safe.
   */
  prefetchPronunciation: (input: {
    contentType: VoiceAudioContentType;
    contentId: string;
    voiceId: string;
  }) => void;
  /**
   * Word-timing lookup (see word-timing.ts) — cache-only, mirrors
   * resolveAudio's own dedup/caching shape (a session-lifetime Map, joins an
   * in-flight lookup rather than duplicating it) but is otherwise
   * independent: a miss here (no row, or a sentence Whisper couldn't align
   * cleanly) just means the caller falls back to resolveAudio's own
   * isolated-word path exactly as it did before this existed. `contentType`
   * here is the SENTENCE's type ("sentence"/"book_sentence"), never
   * "sentence_word" — this resolves timing for the WHOLE sentence's word
   * list in one call, not one word at a time.
   */
  resolveWordTimings: (input: {
    contentType: "sentence" | "book_sentence";
    contentId: string;
    voiceId: string;
  }) => Promise<WordTiming[] | null>;
}

const noop = () => {};

const DEFAULT_VALUE: PronunciationSettingsValue = {
  isActive: false,
  speedIndex: 0,
  speedMultiplier: PRONUNCIATION_SPEED_STEPS[0].multiplier,
  cycleSpeed: noop,
  registerReplay: noop,
  replayCurrent: noop,
  shiftPulse: 0,
  getResolvedAudio: () => undefined,
  registerResolvedAudio: noop,
  resolveAudio: () => Promise.resolve(null),
  resolveWordTimings: () => Promise.resolve(null),
  prefetchPronunciation: noop,
};

const PronunciationSettingsContext = createContext<PronunciationSettingsValue>(DEFAULT_VALUE);

/**
 * Ceiling on how many prefetchPronunciation-driven network round trips run
 * at once — added (2026-09-12) after tracing reader reports of a book
 * section transition taking minutes: a single Books section can queue over
 * a hundred individual prefetchPronunciation calls in quick succession (one
 * sentence-narration resolve plus one per trackable word, across the
 * current+next PAGE of sentences — see BookReadingSession's own prefetch
 * effect), each a separate Server Action round trip. Browsers cap
 * concurrent connections per origin at ~6, so a burst that size saturated
 * that pool outright — and any request issued while it was still draining,
 * including the section-boundary fetchSectionAfterAction call the reader
 * was actually waiting on, simply queued behind it in the SAME connection
 * pool, sometimes for minutes. The per-call setTimeout stagger already in
 * place (see that effect's own doc comment) spaces out when each prefetch
 * STARTS but does nothing to cap how many are simultaneously in flight once
 * started, so a burst large enough (or with even a few slow individual
 * resolves) still saturated the pool the same way. This queue caps actual
 * concurrent network activity outright, independent of how many calls are
 * queued or how long any one of them takes — on-demand resolves (a real
 * word click, a real replay) go through resolveAudio directly and are never
 * queued here, so they stay instant regardless of how much background
 * prefetch is pending.
 *
 * Lowered from 2 to 1 (still 2026-09-12, same investigation): measured live
 * against production — 10 concurrent calls to an otherwise-fast (~300ms)
 * Supabase-backed route split cleanly into a fast group (~1.3s) and a slow
 * group (~6.8s), meaning the backend itself (Supabase's connection pool,
 * Netlify's function concurrency, or both) starts queueing well before the
 * browser's own ~6-per-origin connection limit would. Background prefetch
 * competing for even 2 of those slots was enough to occasionally push a
 * real, concurrent request (the section-boundary fetch, or another
 * reader's request) into that slow group. 1 keeps this at essentially the
 * cost of a single extra concurrent reader, not a meaningful one.
 */
const MAX_CONCURRENT_PREFETCH_REQUESTS = 1;

/**
 * Shared, session-scoped state for the two global learning-audio features
 * (Shift-to-replay and the speed toggle) — mounted once in
 * src/app/learn/layout.tsx so it covers Normal, Stories, Conversation, and
 * Word Lists alike without any of them duplicating this state or the Shift
 * key handling. The current sentence/word to replay is whatever the
 * currently-mounted PronunciationButton last registered (see
 * registerReplay) — there is only ever one active at a time in the existing
 * UI, so "current" naturally tracks whichever sentence/word is on screen.
 */
export function PronunciationSettingsProvider({ children }: { children: ReactNode }) {
  const [speedIndex, setSpeedIndex] = useState(0);
  const [shiftPulse, setShiftPulse] = useState(0);
  const replayRef = useRef<(() => void) | null>(null);
  // Plain refs, not state: writing to these must never trigger a re-render
  // (a background prefetch resolving is not a UI event), and every reader
  // (PronunciationButton.resolvePlaybackUrl) reads them imperatively at
  // call time anyway, never during render.
  const resolvedAudioRef = useRef<Map<string, string>>(new Map());
  const inFlightRef = useRef<Map<string, Promise<string | null>>>(new Map());
  // Separate cache/in-flight maps from resolveAudio's own — word timings and
  // resolved audio URLs are different data for (usually) the same contentId,
  // so sharing one map would collide.
  const wordTimingsRef = useRef<Map<string, WordTiming[] | null>>(new Map());
  const wordTimingsInFlightRef = useRef<Map<string, Promise<WordTiming[] | null>>>(new Map());
  // See MAX_CONCURRENT_PREFETCH_REQUESTS's own doc comment — pure in-memory
  // bookkeeping (never state), since queueing/draining a background prefetch
  // is not a UI event.
  const prefetchQueueRef = useRef<
    Array<{ contentType: VoiceAudioContentType; contentId: string; voiceId: string }>
  >([]);
  const activePrefetchesRef = useRef(0);

  const getResolvedAudio = useCallback(
    (contentId: string) => resolvedAudioRef.current.get(contentId),
    [],
  );

  const registerResolvedAudio = useCallback((contentId: string, audioUrl: string) => {
    resolvedAudioRef.current.set(contentId, audioUrl);
  }, []);

  const resolveAudio = useCallback(
    (input: {
      contentType: VoiceAudioContentType;
      contentId: string;
      voiceId: string;
    }): Promise<string | null> => {
      const { contentId } = input;

      const cached = resolvedAudioRef.current.get(contentId);
      if (cached) return Promise.resolve(cached);

      // A prefetch already in flight for this exact content — join it
      // instead of starting a second, duplicate resolve (and, on a cache
      // miss, a second concurrent Kokoro generation) for the same
      // (voice, text) pair.
      const inFlight = inFlightRef.current.get(contentId);
      if (inFlight) return inFlight;

      const promise = resolvePronunciationAudioAction(input)
        .then((url) => {
          if (url) resolvedAudioRef.current.set(contentId, url);
          return url;
        })
        .catch((error: unknown) => {
          console.error("[pronunciation] resolve failed", { contentId, error });
          return null;
        })
        .finally(() => {
          inFlightRef.current.delete(contentId);
        });
      inFlightRef.current.set(contentId, promise);
      return promise;
    },
    [],
  );

  const resolveWordTimings = useCallback(
    (input: {
      contentType: "sentence" | "book_sentence";
      contentId: string;
      voiceId: string;
    }): Promise<WordTiming[] | null> => {
      const key = `${input.contentType}:${input.contentId}:${input.voiceId}`;

      if (wordTimingsRef.current.has(key)) {
        return Promise.resolve(wordTimingsRef.current.get(key) ?? null);
      }
      const inFlight = wordTimingsInFlightRef.current.get(key);
      if (inFlight) return inFlight;

      const promise = lookupWordTimings(input.contentType, input.contentId, input.voiceId)
        .then((words) => {
          wordTimingsRef.current.set(key, words);
          return words;
        })
        .catch((error: unknown) => {
          console.error("[pronunciation] word-timing lookup failed", { key, error });
          return null;
        })
        .finally(() => {
          wordTimingsInFlightRef.current.delete(key);
        });
      wordTimingsInFlightRef.current.set(key, promise);
      return promise;
    },
    [],
  );

  // See MAX_CONCURRENT_PREFETCH_REQUESTS's own doc comment. Recurses into
  // itself from the `.finally()` below to pull the next queued item the
  // instant a slot frees — by the time that callback actually runs (a real
  // network round trip later), `runPrefetchTask` is already fully assigned,
  // so the self-reference through the closure is safe.
  const runPrefetchTask = useCallback(
    (input: { contentType: VoiceAudioContentType; contentId: string; voiceId: string }) => {
      activePrefetchesRef.current += 1;
      void resolveAudio(input)
        .then((url) => {
          if (!url) return;
          // Resolving the URL alone isn't the whole story: measured
          // separately, a sentence whose URL was already known but whose
          // audio bytes the browser had never fetched still took ~800ms from
          // play() to the audible "playing" event — a cold Supabase Storage
          // GET, not a resolve delay. A plain fetch() here, discarded once
          // read, lets the browser cache the response per the bucket's own
          // Cache-Control headers (no different from a real learner's
          // browser having visited the URL before) — never bypassed or
          // duplicated, and irrelevant to on-demand resolves that are about
          // to play immediately anyway (see resolveAudio, called directly
          // there without this).
          fetch(url).catch(() => {});
        })
        .finally(() => {
          activePrefetchesRef.current -= 1;
          const next = prefetchQueueRef.current.shift();
          if (next) runPrefetchTask(next);
        });
    },
    [resolveAudio],
  );

  const prefetchPronunciation = useCallback(
    (input: { contentType: VoiceAudioContentType; contentId: string; voiceId: string }) => {
      if (activePrefetchesRef.current < MAX_CONCURRENT_PREFETCH_REQUESTS) {
        runPrefetchTask(input);
      } else {
        prefetchQueueRef.current.push(input);
      }
    },
    [runPrefetchTask],
  );

  const cycleSpeed = useCallback(() => {
    setSpeedIndex((index) => (index + 1) % PRONUNCIATION_SPEED_STEPS.length);
  }, []);

  const registerReplay = useCallback((replay: (() => void) | null) => {
    replayRef.current = replay;
  }, []);

  const replayCurrent = useCallback(() => {
    replayRef.current?.();
  }, []);

  // Makes a speed change immediately audible instead of making the learner
  // press Shift/replay again to hear it. Deliberately an effect keyed on
  // speedIndex — not called directly from cycleSpeed's caller — because
  // replayRef.current only reflects the NEW speed once the currently-active
  // PronunciationButton has re-rendered with the updated speedMultiplier
  // from context (see its playReplayRef, refreshed every render); an effect
  // runs after that render has committed, a same-tick call would not.
  // isFirstRunRef skips the initial mount so nothing plays before the
  // learner has touched the control at all.
  const isFirstSpeedRunRef = useRef(true);
  useEffect(() => {
    if (isFirstSpeedRunRef.current) {
      isFirstSpeedRunRef.current = false;
      return;
    }
    replayRef.current?.();
  }, [speedIndex]);

  // Global "standalone Shift press" shortcut. Deliberately does NOT fire for:
  // - Shift+<key> combos (Shift+Tab, Shift+ArrowLeft for text selection, ...)
  // - Ctrl+Shift / Alt+Shift, regardless of which key goes down first
  // - Shift held during a mouse selection (no key involved at all)
  // `shiftAlone` tracks whether the Shift currently held down has stayed a
  // lone press since it went down; only a keyup that finds it still true
  // triggers a replay.
  useEffect(() => {
    let shiftAlone = true;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Shift") {
        // A modifier already held when Shift goes down means Shift is
        // starting a combo (e.g. Ctrl held, then Shift), not a standalone
        // press — covers combo order the plain `shiftKey` check below can't.
        shiftAlone = !(event.ctrlKey || event.altKey || event.metaKey);
        return;
      }
      if (event.shiftKey) shiftAlone = false;
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.key !== "Shift") return;
      if (shiftAlone) {
        replayRef.current?.();
        setShiftPulse((pulse) => pulse + 1);
      }
      shiftAlone = true;
    }

    function handleMouseDown(event: MouseEvent) {
      if (event.shiftKey) shiftAlone = false;
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", handleMouseDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  const value = useMemo<PronunciationSettingsValue>(
    () => ({
      isActive: true,
      speedIndex,
      // speedIndex only ever comes from the modulo cycling in cycleSpeed, so
      // it's always a valid index — the fallback here is just to satisfy
      // noUncheckedIndexedAccess, never expected to actually be hit.
      speedMultiplier: (PRONUNCIATION_SPEED_STEPS[speedIndex] ?? PRONUNCIATION_SPEED_STEPS[0])
        .multiplier,
      cycleSpeed,
      registerReplay,
      replayCurrent,
      shiftPulse,
      getResolvedAudio,
      registerResolvedAudio,
      resolveAudio,
      prefetchPronunciation,
      resolveWordTimings,
    }),
    [
      speedIndex,
      cycleSpeed,
      registerReplay,
      replayCurrent,
      shiftPulse,
      getResolvedAudio,
      registerResolvedAudio,
      resolveAudio,
      prefetchPronunciation,
      resolveWordTimings,
    ],
  );

  return (
    <PronunciationSettingsContext.Provider value={value}>
      {children}
    </PronunciationSettingsContext.Provider>
  );
}

export function usePronunciationSettings(): PronunciationSettingsValue {
  return useContext(PronunciationSettingsContext);
}
