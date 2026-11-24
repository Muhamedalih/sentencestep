"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { Check, Snowflake, Volume2, VolumeX, X } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { todayLocalISODate } from "@/lib/progress/streak";
import { recordBankWordAction } from "@/lib/word-bank/actions";
import {
  submitDailyScoreAction,
  trackWordDropAction,
  type DailyOutcome,
} from "@/lib/word-drop/actions";
import { isPlausibleDay } from "@/lib/word-drop/scores";
import {
  newToken,
  friendSeed,
  parseSeed,
  seededRandom,
  type RoundSeed,
} from "@/lib/word-drop/seed";
import type { RoundKind, WordDropReport } from "@/lib/word-drop/tracking";
import { renderShareCard, shareImage, shareLink } from "@/lib/word-drop/share-card";
import type { DailyBoard } from "@/lib/word-drop/store";
import {
  CHALLENGE_POINTS,
  FREEZE_EVERY,
  FREEZE_SECONDS,
  FREEZE_SLOW,
  FREEZE_SPAWN_CLOCK,
  LEVEL_EVERY,
  MAX_CHARGES,
  MAX_ON_SCREEN,
  MIN_HARD_WORDS,
  MIN_SENTENCES,
  ROUND_SECONDS,
  SPAWN_Y,
  START_LIVES,
  WORD_DROP_MODES,
  accuracyPercent,
  createDeck,
  fallLeft,
  findSpot,
  isChallengeTile,
  levelFor,
  mergePools,
  pickTarget,
  pointsForText,
  spawnGapMs,
  speedAfterCorrect,
  speedAfterMiss,
  tileScaleFor,
  tileSize,
  wordCountOf,
  wordsPerMinute,
  type Deck,
  type DropWord,
  type WordDropMode,
} from "@/lib/word-drop/engine";
import {
  isSoundOn,
  playBuffered,
  preloadClip,
  setSoundOn,
  sfx,
  unlockAudio,
} from "@/lib/word-drop/sound";
import { wordDropStrings } from "@/lib/word-drop/strings";
import { cn } from "@/lib/utils";

import { WORD_DROP_CSS } from "./word-drop-styles";

/** The page's own look: a deep ink board, one cobalt accent, red only for danger, pale word tiles. */
const PALETTE = {
  "--wd-bg": "oklch(0.14 0.016 265)",
  "--wd-board": "oklch(0.175 0.022 265)",
  "--wd-line": "oklch(0.27 0.015 265)",
  "--wd-mute": "oklch(0.66 0.01 265)",
  "--wd-acc": "oklch(0.72 0.15 262)",
  "--wd-acc-ink": "oklch(0.45 0.17 262)",
  "--wd-acc-a": "oklch(0.72 0.15 262 / 0.2)",
  "--wd-red": "oklch(0.65 0.21 25)",
  "--wd-tile": "oklch(0.925 0.012 85)",
  "--wd-tile-ink": "oklch(0.2 0.02 265)",
  "--wd-tile-mute": "oklch(0.5 0.015 265)",
} as CSSProperties;

const BEST_KEY = "wordDropBest";
/** A silent one-sample recording: played on the tap on Start to unlock the audio element. */
const SILENT_CLIP =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
/** How fast a round runs: seconds a tile takes to cross the screen at speed 1, the gap between tiles (a multiple of the usual), and how many can be on screen. Sentences are slower and fewer: they are longer to type. */
const PACE: Record<WordDropMode, { fall: number; gap: number; max: number }> = {
  easy: { fall: 22, gap: 1, max: MAX_ON_SCREEN },
  mid: { fall: 22, gap: 1, max: MAX_ON_SCREEN },
  // Hard also needs a moment to hear the word and play it again.
  hard: { fall: 24, gap: 1.15, max: 3 },
  sentences: { fall: 30, gap: 2.2, max: 2 },
};
/** A tile whose bottom edge passes (field height - this) has hit the bottom. */
const BOTTOM_MARGIN = 6;
/** The room the fall keeps under a tile's height, so the speed does not depend on the tile. */
const FALL_ROOM = 84;
/** A free round puts the learner's own words first only when there are at least this many. */
const MIN_PERSONAL = 4;

interface Live {
  uid: number;
  word: DropWord;
  /** The tile's left edge in pixels, its size, and its top: fixed when it appears so two tiles are kept apart (see findSpot). */
  x: number;
  w: number;
  h: number;
  font: number;
  y: number;
  /** A challenge word: it always pays the most a word can. */
  challenge: boolean;
  el: HTMLDivElement | null;
}

interface Pop {
  id: number;
  text: string;
  /** Where across the field the note sits, 0 to 1. */
  frac: number;
  y: number;
  bad: boolean;
}

interface Round {
  running: boolean;
  lives: number;
  score: number;
  combo: number;
  best: number;
  correct: number;
  typed: number;
  wrong: number;
  chars: number;
  live: Live[];
  missed: DropWord[];
  factor: number;
  remaining: number;
  /** Game time (ms of the round that has actually run), and the game time the last tile appeared at: tiles are paced by the game's own clock, so a slow phone does not pile them up. */
  elapsedMs: number;
  lastSpawn: number;
  last: number;
  deck: Deck;
  /** How many tiles have appeared: a seeded round draws each tile's place from its own number, so the places do not depend on the timing of the frames. */
  spawned: number;
  uid: number;
  mode: WordDropMode;
  prevLen: number;
  /** The letters now in the input (the screen's own copy lives in state). */
  typedValue: string;
  /** Freeze: charges earned, seconds of freeze left, and the correct words in a row that earn the next charge. */
  charges: number;
  freezeLeft: number;
  streak: number;
  /** One entry per word that was typed (how much of the fall was left, 0 to 1) or fell (null), in order: the end page's pace chart. */
  rhythm: (number | null)[];
}

interface Hud {
  score: number;
  lives: number;
  combo: number;
  seconds: number;
  correct: number;
  charges: number;
  frozen: boolean;
}

/** A word caught or missed this round, for the side list. */
interface Caught {
  id: number;
  word: DropWord;
  miss: boolean;
}

const EMPTY_HUD: Hud = {
  score: 0,
  lives: START_LIVES,
  combo: 0,
  seconds: ROUND_SECONDS,
  correct: 0,
  charges: 0,
  frozen: false,
};

interface Result {
  score: number;
  accuracy: number;
  wpm: number;
  words: number;
  bestCombo: number;
  missed: DropWord[];
  /** Points above the previous best (this browser's), or null when this was not a new best. */
  beat: number | null;
  rhythm: (number | null)[];
}

/** Fire-and-forget: a report that fails is not worth a word to the learner, who is already playing. */
function report(details: WordDropReport): void {
  void trackWordDropAction(details).catch(() => undefined);
}

function readBest(): number {
  try {
    const raw = window.localStorage.getItem(BEST_KEY);
    const value = raw === null ? 0 : Number.parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function writeBest(score: number): void {
  try {
    window.localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // The best score is a nicety: a blocked store just means it is not remembered.
  }
}

/** What a note says when a word lands or falls: the word and, when it has one, its meaning. */
function popLabel(word: DropWord): string {
  return word.meaning ? `${word.en} · ${word.meaning}` : word.en;
}

interface WordDropGameProps {
  pool: DropWord[];
  /** The learner's own words (weakest first), which a free round can put in front. */
  personal: DropWord[];
  /** Short sentences for sentences mode (level 2 and 3 only; empty otherwise). */
  sentencePool: DropWord[];
  bankOpen: boolean;
  signedIn: boolean;
  /** The level the words belong to. */
  level: 1 | 2 | 3;
  /** The seed of a daily or friend's challenge, or null for a free round. */
  seed: RoundSeed | null;
  /** A friend's score to beat (friend's challenge only). */
  beat: number | null;
  /** Where the daily challenge starts (a link to this page with today's seed). */
  dailyHref: string;
  /** The day's ranking, for the start page's daily card. */
  board: DailyBoard | null;
}

/** Country names in the learner's own language, from the browser's own tables. */
function countryName(code: string, locale: string | null): string {
  try {
    return (
      new Intl.DisplayNames([locale ?? "ar"], { type: "region" }).of(code.toUpperCase()) ?? code
    );
  } catch {
    return code.toUpperCase();
  }
}

export function WordDropGame({
  pool,
  personal,
  sentencePool,
  bankOpen,
  signedIn,
  level,
  seed,
  beat,
  dailyHref,
  board,
}: WordDropGameProps) {
  const { locale } = useLocale();
  const strings = wordDropStrings(locale);

  const [screen, setScreen] = useState<"start" | "play" | "end">("start");
  const [mode, setMode] = useState<WordDropMode>(seed ? seed.mode : "easy");
  // The learner's own words first: on whenever there are enough of them (a round like that cannot be sent as a challenge).
  const [useMine, setUseMine] = useState(personal.length >= MIN_PERSONAL);
  /** What the round just played was: its seed (null when it cannot be sent as a challenge) and its kind, for the end page and the reports. */
  const [played, setPlayed] = useState<{
    seed: RoundSeed | null;
    kind: RoundKind;
    mode: WordDropMode;
    own: boolean;
  }>({ seed, kind: seed ? seed.kind : "free", mode, own: false });
  const [daily, setDaily] = useState<DailyOutcome | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [hud, setHud] = useState<Hud>(EMPTY_HUD);
  /** The line under the typing line (the word just caught or missed), the side list, the note flashed on the field, and the sound switch. */
  const [caption, setCaption] = useState<Caught | null>(null);
  const [log, setLog] = useState<Caught[]>([]);
  const [banner, setBanner] = useState<{ id: number; text: string } | null>(null);
  const [soundOn, setSoundState] = useState(true);
  /** The refused letter, shown for a moment in red above the caret. */
  const [ghost, setGhost] = useState<{ id: number; ch: string } | null>(null);
  const [liveView, setLiveView] = useState<Live[]>([]);
  const [pops, setPops] = useState<Pop[]>([]);
  const [typed, setTyped] = useState("");
  const [lockUid, setLockUid] = useState<number | null>(null);
  const [shake, setShake] = useState(false);
  const [wrongScript, setWrongScript] = useState(false);
  const [hit, setHit] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [saved, setSaved] = useState<ReadonlySet<string>>(new Set());

  const fieldRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const round = useRef<Round | null>(null);
  const frame = useRef(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const timers = useRef<number[]>([]);
  const popSeq = useRef(0);
  const noteSeq = useRef(0);
  const lastHud = useRef<Hud | null>(null);

  const mineOn = !seed && useMine && personal.length >= MIN_PERSONAL;
  const freePool = useMemo(
    () => (mineOn ? mergePools(personal, pool) : pool),
    [mineOn, personal, pool],
  );
  const hardOk = freePool.filter((word) => word.audioUrl !== null).length >= MIN_HARD_WORDS;
  const sentencesOk = !seed && sentencePool.length >= MIN_SENTENCES;
  /** The modes offered on the start page: sentences only where the pool has enough of them. */
  const modes = WORD_DROP_MODES.filter((m) => m !== "sentences" || sentencesOk);
  const poolEmpty = pool.length === 0 && sentencePool.length === 0;

  const later = useCallback((ms: number, run: () => void) => {
    const id = window.setTimeout(run, ms);
    timers.current.push(id);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      cancelAnimationFrame(frame.current);
      pending.forEach((id) => window.clearTimeout(id));
      audio.current?.pause();
    };
  }, []);

  /** One audio element for the whole game, so the tap on Start can unlock it (a phone only lets a clip play that a tap allowed) and every later clip reuses it. */
  const clipPlayer = useCallback((): HTMLAudioElement | null => {
    try {
      if (!audio.current) audio.current = new Audio();
      return audio.current;
    } catch {
      return null;
    }
  }, []);

  const playClip = useCallback(
    (url: string | null) => {
      if (!url) return;
      try {
        const clip = clipPlayer();
        if (!clip) return;
        clip.muted = false;
        clip.src = url;
        clip.currentTime = 0;
        void clip.play().catch(() => undefined);
      } catch {
        // A clip that will not play just stays silent; the word is still on screen as a hint.
      }
    },
    [clipPlayer],
  );

  /** A word's recording: from the decoded copy when it is ready (instant), otherwise the audio element fetches it. */
  const playWord = useCallback(
    (url: string | null) => {
      if (!url) return;
      if (!playBuffered(url)) playClip(url);
    },
    [playClip],
  );

  const flashBanner = useCallback(
    (text: string) => {
      noteSeq.current += 1;
      const id = noteSeq.current;
      setBanner({ id, text });
      later(1600, () => setBanner((current) => (current?.id === id ? null : current)));
    },
    [later],
  );

  /** A burst of small squares and one ring from the middle of a caught tile: the field reacts to the catch. */
  const burst = useCallback(
    (cx: number, cy: number) => {
      const field = fieldRef.current;
      if (!field || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const ring = document.createElement("div");
      ring.className = "wd-rip";
      ring.style.left = `${cx}px`;
      ring.style.top = `${cy}px`;
      field.appendChild(ring);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          ring.style.transform = "scale(14)";
          ring.style.opacity = "0";
        }),
      );
      later(850, () => ring.remove());
      for (let i = 0; i < 10; i += 1) {
        const dot = document.createElement("div");
        dot.className = "wd-pt";
        dot.style.left = `${cx}px`;
        dot.style.top = `${cy}px`;
        dot.style.background = i % 3 === 0 ? "var(--wd-tile)" : "var(--wd-acc)";
        field.appendChild(dot);
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 50;
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            dot.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) rotate(${i * 60}deg) scale(0.4)`;
            dot.style.opacity = "0";
          }),
        );
        later(700, () => dot.remove());
      }
    },
    [later],
  );

  const popAt = useCallback(
    (text: string, frac: number, y: number, bad: boolean) => {
      popSeq.current += 1;
      const id = popSeq.current;
      setPops((current) => [...current, { id, text, frac, y, bad }]);
      later(1000, () => setPops((current) => current.filter((pop) => pop.id !== id)));
    },
    [later],
  );

  const syncHud = useCallback((r: Round) => {
    const next: Hud = {
      score: r.score,
      lives: r.lives,
      combo: r.combo,
      seconds: Math.max(0, Math.ceil(r.remaining)),
      correct: r.correct,
      charges: r.charges,
      frozen: r.freezeLeft > 0,
    };
    const prev = lastHud.current;
    if (
      prev &&
      prev.score === next.score &&
      prev.lives === next.lives &&
      prev.combo === next.combo &&
      prev.seconds === next.seconds &&
      prev.correct === next.correct &&
      prev.charges === next.charges &&
      prev.frozen === next.frozen
    ) {
      return;
    }
    lastHud.current = next;
    setHud(next);
  }, []);

  const finish = useCallback(
    (r: Round) => {
      if (!r.running) return;
      r.running = false;
      cancelAnimationFrame(frame.current);
      const previous = readBest();
      const beat = r.score > previous && previous > 0 ? r.score - previous : null;
      if (r.score > previous) writeBest(r.score);
      setResult({
        score: r.score,
        accuracy: accuracyPercent(r.typed, r.wrong),
        wpm: wordsPerMinute(r.chars, ROUND_SECONDS - Math.max(0, r.remaining)),
        words: r.correct,
        bestCombo: r.best,
        missed: r.missed,
        beat,
        rhythm: r.rhythm,
      });
      setSaved(new Set());
      setDaily(null);
      const accuracy = accuracyPercent(r.typed, r.wrong);
      report({
        event: "finished",
        mode: r.mode,
        kind: seed ? seed.kind : "free",
        level,
        score: r.score,
        accuracy,
        words: r.correct,
      });
      // The daily challenge keeps the better score of the day for a signed-in learner and answers with the ranking
      // (a daily link of a past day can still be played, but it is not recorded).
      if (seed?.kind === "daily" && signedIn && isPlausibleDay(seed.key)) {
        void submitDailyScoreAction({
          day: seed.key,
          level: seed.level,
          score: r.score,
          accuracy,
          wpm: wordsPerMinute(r.chars, ROUND_SECONDS - Math.max(0, r.remaining)),
          words: r.correct,
        })
          .then(setDaily)
          .catch(() => setDaily({ ok: false }));
      }
      later(700, () => setScreen("end"));
    },
    [later, level, seed, signedIn],
  );

  /** Puts the next word on screen where it does not sit on another tile; false (and nothing taken from the deck) when the tiles near the top leave no room yet. */
  const spawn = useCallback(
    (r: Round, now: number): boolean => {
      const word = r.deck.peek();
      const fieldWidth = fieldRef.current?.clientWidth ?? 320;
      const size = tileSize(r.mode, word, fieldWidth, tileScaleFor(fieldWidth));
      // A seeded round draws each tile's place from its own number; a free round just rolls.
      const rand = seed ? seededRandom(`${seed.raw}.p${r.spawned}`) : Math.random;
      const x = findSpot({
        fieldWidth,
        tile: size,
        others: r.live.map((other) => ({ x: other.x, y: other.y, w: other.w, h: other.h })),
        rand,
      });
      if (x === null) return false;
      r.deck.next();
      r.uid += 1;
      r.spawned += 1;
      r.live.push({
        uid: r.uid,
        word,
        x,
        w: size.w,
        h: size.h,
        font: size.font,
        y: SPAWN_Y,
        challenge: isChallengeTile(r.mode, r.spawned - 1),
        el: null,
      });
      r.lastSpawn = now;
      setLiveView([...r.live]);
      // This word's recording, and the next one's, are decoded now: by the time a word is typed it plays at once.
      preloadClip(word.audioUrl);
      preloadClip(r.deck.peek().audioUrl);
      if (r.mode === "hard") playWord(word.audioUrl);
      return true;
    },
    [playWord, seed],
  );

  const missWord = useCallback(
    (r: Round, live: Live) => {
      r.live = r.live.filter((other) => other.uid !== live.uid);
      if (!r.missed.some((word) => word.id === live.word.id)) r.missed.push(live.word);
      r.deck.requeue(live.word);
      r.lives -= 1;
      r.combo = 0;
      r.streak = 0;
      r.rhythm.push(null);
      r.factor = speedAfterMiss(r.factor);
      setLiveView([...r.live]);
      sfx.miss();
      noteSeq.current += 1;
      const missedNote: Caught = { id: noteSeq.current, word: live.word, miss: true };
      setCaption(missedNote);
      setLog((current) => [missedNote, ...current].slice(0, 7));
      // The word the learner was part-way through may be the one that just fell: drop the stale letters so the input is not stuck.
      const target = pickTarget(
        r.typedValue,
        r.live.map((other) => ({ en: other.word.en, y: other.y, other })),
      );
      if (r.typedValue !== "" && target === null) {
        r.typedValue = "";
        r.prevLen = 0;
        setTyped("");
      }
      setLockUid(target ? target.other.uid : null);
      setHit((count) => count + 1);
      popAt(
        popLabel(live.word),
        live.x / Math.max(1, fieldRef.current?.clientWidth ?? 320),
        (fieldRef.current?.clientHeight ?? 300) - 110,
        true,
      );
      syncHud(r);
      if (r.lives <= 0) finish(r);
    },
    [finish, popAt, syncHud],
  );

  const spendFreeze = useCallback(() => {
    const r = round.current;
    if (!r || !r.running || r.charges < 1 || r.freezeLeft > 0) return;
    r.charges -= 1;
    r.freezeLeft = FREEZE_SECONDS;
    sfx.freeze();
    flashBanner(strings.freezeLabel);
    syncHud(r);
  }, [flashBanner, strings.freezeLabel, syncHud]);

  const tick = useCallback(
    (now: number) => {
      const r = round.current;
      if (!r || !r.running) return;
      const dt = Math.min(0.05, (now - r.last) / 1000);
      r.last = now;
      r.remaining -= dt;
      const height = fieldRef.current?.clientHeight ?? 400;
      const pace = PACE[r.mode];
      const frozen = r.freezeLeft > 0;
      if (frozen) r.freezeLeft = Math.max(0, r.freezeLeft - dt);
      const speed = ((height - FALL_ROOM) / pace.fall) * r.factor * (frozen ? FREEZE_SLOW : 1);
      r.elapsedMs += dt * 1000 * (frozen ? FREEZE_SPAWN_CLOCK : 1);
      if (r.live.length < pace.max && r.elapsedMs - r.lastSpawn > spawnGapMs(r.factor) * pace.gap) {
        spawn(r, r.elapsedMs);
      }
      let danger = 0;
      for (const live of [...r.live]) {
        live.y += speed * dt;
        const close = Math.max(0, Math.min(1, (live.y + live.h - height * 0.6) / (height * 0.4)));
        danger = Math.max(danger, close);
        if (live.el) {
          live.el.style.transform = `translateY(${live.y}px)`;
          live.el.style.setProperty("--wd-d", close.toFixed(2));
          const hintEl = live.el.querySelector<HTMLElement>("[data-hint]");
          if (hintEl) hintEl.textContent = live.y > height * 0.45 ? `${live.word.en[0]} …` : "";
        }
        if (live.y + live.h > height - BOTTOM_MARGIN) missWord(r, live);
      }
      fieldRef.current?.style.setProperty("--wd-danger", danger.toFixed(2));
      syncHud(r);
      if (r.remaining <= 0) {
        finish(r);
        return;
      }
      frame.current = requestAnimationFrame(tick);
    },
    [finish, missWord, spawn, syncHud],
  );

  const start = useCallback(() => {
    cancelAnimationFrame(frame.current);
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    // Which words, and which seed. A seeded page plays its seed. A free round of the level's words is seeded
    // on the spot (a fresh friend's seed), so the challenge link it ends with deals exactly these words in
    // this order; a round of the learner's own words, of Hard (clips differ) or of sentences cannot be.
    let words: DropWord[];
    let roundSeed: RoundSeed | null = seed;
    let own = false;
    let priority: ReadonlySet<string> = new Set();
    if (seed) {
      words = pool;
    } else if (mode === "sentences") {
      words = sentencePool;
      roundSeed = null;
    } else if (mode === "hard") {
      words = freePool.filter((word) => word.audioUrl !== null);
      roundSeed = null;
      own = mineOn;
      if (mineOn) priority = new Set(personal.map((word) => word.id));
    } else if (mineOn) {
      words = freePool;
      roundSeed = null;
      own = true;
      priority = new Set(personal.map((word) => word.id));
    } else {
      words = pool;
      roundSeed = parseSeed(friendSeed(newToken(), level, mode === "easy" ? "easy" : "mid"));
    }
    if (words.length === 0) return;
    const now = performance.now();
    const r: Round = {
      running: true,
      lives: START_LIVES,
      score: 0,
      combo: 0,
      best: 0,
      correct: 0,
      typed: 0,
      wrong: 0,
      chars: 0,
      live: [],
      missed: [],
      factor: 1,
      remaining: ROUND_SECONDS,
      elapsedMs: 0,
      lastSpawn: 0,
      last: now,
      // A seeded round deals the same words in the same order to everyone who plays the seed.
      deck: createDeck(
        words,
        roundSeed ? seededRandom(`${roundSeed.raw}.deck`) : Math.random,
        priority,
      ),
      spawned: 0,
      uid: 0,
      mode,
      prevLen: 0,
      typedValue: "",
      charges: 0,
      freezeLeft: 0,
      streak: 0,
      rhythm: [],
    };
    round.current = r;
    lastHud.current = null;
    unlockAudio();
    preloadClip(r.deck.peek().audioUrl);
    const kind: RoundKind = seed ? seed.kind : "free";
    setPlayed({ seed: roundSeed, kind, mode, own });
    report({ event: "started", mode, kind, level });
    // The tap on Start also unlocks the game's audio element (a silent clip), so the word's recording can play after it is typed.
    try {
      const clip = clipPlayer();
      if (clip) {
        clip.muted = true;
        clip.src = SILENT_CLIP;
        void clip
          .play()
          .then(() => {
            clip.pause();
            clip.muted = false;
          })
          .catch(() => {
            clip.muted = false;
          });
      }
    } catch {
      // No audio on this browser: the game is played in silence.
    }
    // Flushed so the input exists when focus is asked for inside this tap, which is what lets a phone open its keyboard.
    flushSync(() => {
      setScreen("play");
      setTyped("");
      setLockUid(null);
      setPops([]);
      setLiveView([]);
      setResult(null);
      setDaily(null);
      setHud(EMPTY_HUD);
      setCaption(null);
      setLog([]);
      setBanner(null);
    });
    fieldRef.current?.style.setProperty("--wd-danger", "0");
    inputRef.current?.focus({ preventScroll: true });
    spawn(r, 0);
    frame.current = requestAnimationFrame(tick);
  }, [clipPlayer, freePool, level, mineOn, mode, personal, pool, seed, sentencePool, spawn, tick]);

  useEffect(() => {
    setSoundState(isSoundOn());
  }, []);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field || hit === 0) return;
    field.classList.remove("shake");
    void field.offsetWidth;
    field.classList.add("shake");
    const id = window.setTimeout(() => field.classList.remove("shake"), 320);
    return () => window.clearTimeout(id);
  }, [hit]);

  // Space spends a freeze charge (not in sentences mode, where it is a letter of the sentence).
  useEffect(() => {
    if (screen !== "play" || played.mode === "sentences") return;
    function onKey(event: KeyboardEvent) {
      if (event.code !== "Space" || event.ctrlKey || event.metaKey || event.altKey) return;
      event.preventDefault();
      spendFreeze();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, played.mode, spendFreeze]);

  const complete = useCallback(
    (r: Round, live: Live) => {
      r.live = r.live.filter((other) => other.uid !== live.uid);
      const levelBefore = levelFor(r.correct);
      r.correct += 1;
      r.combo += 1;
      r.streak += 1;
      r.best = Math.max(r.best, r.combo);
      // The recording of the word plays once it is typed right (Hard already played it as the tile appeared).
      if (r.mode === "easy" || r.mode === "mid") playWord(live.word.audioUrl);
      sfx.chime(r.combo);
      r.chars += live.word.en.replace(/ /g, "").length;
      const points = live.challenge
        ? CHALLENGE_POINTS
        : pointsForText(r.combo, wordCountOf(live.word.en));
      r.score += points;
      r.factor = speedAfterCorrect(r.factor);
      const height = fieldRef.current?.clientHeight ?? 400;
      r.rhythm.push(fallLeft(live.y + live.h, SPAWN_Y + live.h, height - BOTTOM_MARGIN));
      setLiveView([...r.live]);
      popAt(
        `+${points}`,
        live.x / Math.max(1, fieldRef.current?.clientWidth ?? 320),
        live.y - 8,
        false,
      );
      burst(live.x + live.w / 2, live.y + live.h / 2);
      noteSeq.current += 1;
      const caughtNote: Caught = { id: noteSeq.current, word: live.word, miss: false };
      setCaption(caughtNote);
      setLog((current) => [caughtNote, ...current].slice(0, 7));
      if (r.streak % FREEZE_EVERY === 0 && r.charges < MAX_CHARGES) {
        r.charges += 1;
        flashBanner(strings.bannerFreezeGain);
      } else if (r.combo > 0 && r.combo % 5 === 0) {
        flashBanner(strings.bannerStreak.replace("{n}", String(r.combo)));
      }
      const levelAfter = levelFor(r.correct);
      if (levelAfter > levelBefore) {
        sfx.level();
        flashBanner(strings.levelLabel.replace("{n}", String(levelAfter)));
      }
      syncHud(r);
    },
    [burst, flashBanner, playWord, popAt, strings, syncHud],
  );

  function onType(value: string) {
    const r = round.current;
    if (!r || !r.running) return;
    setWrongScript(/[؀-ۿ]/.test(value));
    // A sentence is typed with its spaces (never a leading space or two in a row); a word is letters only.
    const clean =
      r.mode === "sentences"
        ? value
            .toLowerCase()
            .replace(/[^a-z ]/g, "")
            .replace(/^ +/, "")
            .replace(/ {2,}/g, " ")
        : value.toLowerCase().replace(/[^a-z]/g, "");
    let next = clean;
    if (clean.length > r.prevLen) {
      r.typed += 1;
      if (
        !pickTarget(
          clean,
          r.live.map((live) => ({ en: live.word.en, y: live.y, live })),
        )
      ) {
        // A letter that starts no falling word is refused, and counted against the accuracy.
        r.wrong += 1;
        next = clean.slice(0, -1);
        setShake(true);
        sfx.bad();
        noteSeq.current += 1;
        const ghostId = noteSeq.current;
        setGhost({ id: ghostId, ch: clean.slice(-1) });
        later(320, () => setGhost((current) => (current?.id === ghostId ? null : current)));
        later(260, () => setShake(false));
      } else {
        sfx.tick();
      }
    }
    const exact = r.live.filter((live) => live.word.en === next).sort((a, b) => b.y - a.y)[0];
    if (exact) {
      complete(r, exact);
      next = "";
    }
    r.prevLen = next.length;
    r.typedValue = next;
    setTyped(next);
    const target = pickTarget(
      next,
      r.live.map((live) => ({ en: live.word.en, y: live.y, live })),
    );
    setLockUid(target ? target.live.uid : null);
  }

  async function saveMissed(word: DropWord) {
    playWord(word.audioUrl);
    // A sentence is not a word of the bank: only the clip (none for a sentence) and the screen's own list.
    if (!bankOpen || saved.has(word.id) || word.en.includes(" ")) return;
    const answer = await recordBankWordAction({
      word: word.en,
      outcome: "missed",
      todayISO: todayLocalISODate(),
      source: "star",
      ar: word.meaning,
      homeSentence: word.sentence ?? undefined,
    });
    if (answer.ok) setSaved((current) => new Set(current).add(word.id));
    else say(strings.saveFailed);
  }

  function say(text: string) {
    setNotice(text);
    later(2200, () => setNotice(null));
  }

  /** The point difference to the friend whose challenge this round answered, or null. */
  const versus = seed?.kind === "friend" && beat !== null && result ? result.score - beat : null;

  function versusLine(): string | null {
    if (versus === null) return null;
    if (versus > 0) return strings.beatFriend.replace("{n}", String(versus));
    if (versus < 0) return strings.missFriend.replace("{n}", String(-versus));
    return strings.tieFriend;
  }

  function placeLine(): string | null {
    const mine = daily?.board?.mine;
    if (!mine) return null;
    return strings.yourPlace
      .replace("{rank}", String(mine.rank))
      .replace("{total}", String(mine.total));
  }

  async function onShareCard() {
    if (!result) return;
    const blob = await renderShareCard({
      score: result.score,
      accuracy: result.accuracy,
      wpm: result.wpm,
      scoreLabel: strings.cardScore,
      accuracyLabel: strings.cardAccuracy,
      speedLabel: strings.cardSpeed,
      tagline: strings.cardTagline,
      footer: placeLine() ?? versusLine(),
    });
    if (!blob) {
      say(strings.shareFailed);
      return;
    }
    const outcome = await shareImage(blob, strings.shareText.replace("{n}", String(result.score)));
    if (outcome === "saved") say(strings.cardSaved);
    else if (outcome === "failed") say(strings.shareFailed);
    if (outcome !== "failed") report({ event: "shared", how: "card", kind: played.kind });
  }

  /** The challenge link of the round just played: the same seed, so a friend gets exactly these words in this order. */
  async function onChallenge() {
    if (!result || !played.seed) return;
    const url = `${window.location.origin}/learn/word-drop?seed=${played.seed.raw}&beat=${result.score}`;
    const outcome = await shareLink(
      url,
      strings.challengeText.replace("{n}", String(result.score)),
    );
    if (outcome === "copied") say(strings.linkCopied);
    else if (outcome === "failed") say(strings.shareFailed);
    if (outcome !== "failed") report({ event: "shared", how: "link", kind: played.kind });
  }

  const modeLabel: Record<WordDropMode, { name: string; hint: string }> = {
    easy: { name: strings.easy, hint: strings.easyHint },
    mid: { name: strings.mid, hint: strings.midHint },
    hard: { name: strings.hard, hint: strings.hardHint },
    sentences: { name: strings.sentences, hint: strings.sentencesHint },
  };

  const sampleWord = "spouse";
  const levelNow = levelFor(hud.correct);

  function modeSample(m: WordDropMode) {
    const letters = [...sampleWord];
    if (m === "easy") {
      return (
        <>
          <span className="mw">
            {letters.map((c, i) => (
              <i key={i} style={{ animationDelay: `${i * 0.16}s` }}>
                {c}
              </i>
            ))}
          </span>
          <small dir="auto">{strings.sampleMeaning}</small>
        </>
      );
    }
    if (m === "sentences") {
      return (
        <>
          <span className="sent">{strings.sampleSentence}</span>
          <small dir="auto">{strings.sampleSentenceMeaning}</small>
        </>
      );
    }
    const slots = (
      <span className="ms">
        {letters.map((c, i) => (
          <i key={i}>
            <b style={{ animationDelay: `${i * 0.16}s` }}>{c}</b>
          </i>
        ))}
      </span>
    );
    if (m === "mid") {
      return (
        <>
          <span className="ar" dir="auto">
            {strings.sampleMeaning}
          </span>
          {slots}
        </>
      );
    }
    return (
      <>
        <span className="wd-spk">
          <Volume2 className="size-3.5" aria-hidden="true" />
        </span>
        {slots}
      </>
    );
  }

  return (
    // h-app: the site's own height that follows a phone's keyboard (see KeyboardViewport), so the input stays above the keys.
    <div
      dir="ltr"
      style={PALETTE}
      className="wd-root h-app fixed inset-x-0 top-0 z-50 overflow-hidden text-white"
    >
      <style>{WORD_DROP_CSS}</style>

      <div className="wd-stage">
        {screen === "start" && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="wd-top">
              <span className="wd-eyebrow">Word Drop</span>
              <Link href="/learn" aria-label={strings.exit} className="wd-xbtn">
                <X className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="wd-st">
              <div className="wd-st-left">
                <h1 dir="auto">
                  {seed?.kind === "daily"
                    ? strings.dailyHeadline1
                    : seed?.kind === "friend"
                      ? strings.friendHeadline1
                      : strings.headline1}
                  <br />
                  <span>
                    {seed?.kind === "daily"
                      ? strings.dailyHeadline2
                      : seed?.kind === "friend"
                        ? strings.friendHeadline2
                        : strings.headline2}
                  </span>
                </h1>
                <p className="src" dir="auto">
                  {strings.source}
                </p>
              </div>

              <div className="wd-st-right">
                {seed && (
                  <div className="wd-seedcard">
                    <p dir="auto" className="text-[15px] font-bold">
                      {seed.kind === "daily" ? strings.dailyMode : strings.friendMode}
                    </p>
                    {seed.kind === "friend" && beat !== null && (
                      <p
                        dir="auto"
                        className="mt-1 text-[22px] font-extrabold text-[var(--wd-acc)]"
                      >
                        {strings.toBeat.replace("{n}", String(beat))}
                      </p>
                    )}
                  </div>
                )}
                {poolEmpty && (
                  <p
                    dir="auto"
                    role="status"
                    className="rounded-[18px] border border-[var(--wd-red)] px-4 py-3.5 text-right text-[15px]"
                  >
                    {strings.emptyPool}
                  </p>
                )}
                {!seed && (
                  <div className="flex flex-col gap-2.5" role="radiogroup">
                    {modes.map((m) => {
                      const disabled = m === "hard" && !hardOk;
                      const selected = mode === m && !disabled;
                      return (
                        <button
                          key={m}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          disabled={disabled}
                          onClick={() => setMode(m)}
                          className="wd-mode"
                        >
                          <div className="wd-mini">{modeSample(m)}</div>
                          <span dir="auto" className="mt">
                            <b>{modeLabel[m].name}</b>
                            <span>{disabled ? strings.hardUnavailable : modeLabel[m].hint}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {!seed && personal.length >= MIN_PERSONAL && mode !== "sentences" && (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={useMine}
                    onClick={() => setUseMine((on) => !on)}
                    className="wd-rowbox"
                  >
                    <span dir="auto">
                      <b>{strings.myWordsTitle}</b>
                      <span className="l">
                        {strings.myWordsLine.replace("{n}", String(personal.length))}
                      </span>
                    </span>
                    <span className="wd-sw" aria-hidden="true">
                      <i />
                    </span>
                  </button>
                )}
                {!seed && (
                  <div className="wd-rowbox" style={{ gridTemplateColumns: "1fr" }}>
                    <div dir="auto">
                      <b>{strings.dailyTitle}</b>
                      <span className="l">{strings.dailyLine}</span>
                    </div>
                    {board && board.countries.length > 0 && (
                      <div>
                        {board.countries.slice(0, 3).map((row, index) => (
                          <div key={row.country} dir="auto" className="wd-row3">
                            <span
                              dir="ltr"
                              className={cn(
                                "font-extrabold tabular-nums",
                                index === 0 ? "text-[var(--wd-acc)]" : "text-[var(--wd-mute)]",
                              )}
                            >
                              {index + 1}
                            </span>
                            <span>
                              {countryName(row.country, locale)}
                              <span className="ms-2 text-[11.5px] text-[var(--wd-mute)]">
                                {strings.playersCount.replace("{n}", String(row.players))}
                              </span>
                            </span>
                            <b dir="ltr" className="tabular-nums">
                              {row.average}
                            </b>
                          </div>
                        ))}
                      </div>
                    )}
                    <Link href={dailyHref} prefetch={false} className="wd-btn">
                      {strings.dailyStart}
                    </Link>
                  </div>
                )}
              </div>

              <div className="wd-st-foot">
                <button
                  type="button"
                  onClick={start}
                  disabled={poolEmpty || (mode !== "sentences" && pool.length === 0)}
                  className="wd-btn main"
                >
                  {strings.start}
                </button>
              </div>
            </div>
          </div>
        )}

        {screen === "play" && (
          <div className="wd-play">
            <div className="wd-hud">
              <div className="wd-score">
                <b>{hud.score}</b>
                <small dir="auto">{strings.points}</small>
                {hud.combo >= 2 && (
                  <span key={hud.combo} className="wd-combo">
                    ×{hud.combo}
                  </span>
                )}
              </div>
              <div className="wd-hr">
                <button
                  type="button"
                  onClick={spendFreeze}
                  aria-label={strings.freezeLabel}
                  className={cn(
                    "wd-frz",
                    hud.frozen && "active",
                    hud.charges > 0 && !hud.frozen && "ready",
                  )}
                >
                  <Snowflake className="size-3.5" aria-hidden="true" />
                  <span className="pips">
                    {Array.from({ length: MAX_CHARGES }, (_, i) => (
                      <i key={i} className={i < hud.charges ? "on" : undefined} />
                    ))}
                  </span>
                  <span className="lbl" dir="auto">
                    {strings.freezeLabel}
                  </span>
                  {played.mode !== "sentences" && <kbd>Space</kbd>}
                </button>
                <div className="wd-lives" aria-label={`${hud.lives}`}>
                  {Array.from({ length: START_LIVES }, (_, i) => (
                    <i key={i} className={i >= hud.lives ? "off" : undefined} />
                  ))}
                </div>
                <button
                  type="button"
                  className="wd-xbtn"
                  aria-pressed={soundOn}
                  aria-label={strings.soundToggle}
                  onClick={() => {
                    const next = !soundOn;
                    setSoundOn(next);
                    setSoundState(next);
                  }}
                >
                  {soundOn ? (
                    <Volume2 className="size-4" aria-hidden="true" />
                  ) : (
                    <VolumeX className="size-4" aria-hidden="true" />
                  )}
                </button>
                <Link href="/learn" aria-label={strings.exit} className="wd-xbtn">
                  <X className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div
              ref={fieldRef}
              onPointerDown={() => inputRef.current?.focus({ preventScroll: true })}
              style={{ "--wd-heat": Math.min(1, hud.combo / 12) } as CSSProperties}
              className={cn("wd-field", hud.frozen && "frozen", lockUid !== null && "has-lock")}
            >
              <div className="wd-timeline" aria-hidden="true">
                <i style={{ transform: `scaleX(${Math.max(0, hud.seconds / ROUND_SECONDS)})` }} />
              </div>
              <span className="wd-floor" aria-hidden="true" />
              {hit > 0 && <span key={hit} aria-hidden="true" className="wd-flash" />}
              {banner && (
                <div key={banner.id} className="wd-banner" dir="auto">
                  {banner.text}
                </div>
              )}
              {liveView.map((live) => {
                const locked = live.uid === lockUid;
                const n = locked ? typed.length : 0;
                const en = live.word.en;
                const tileMode = played.mode;
                const letters = [...en];
                return (
                  <div
                    key={live.uid}
                    ref={(el) => {
                      live.el = el;
                      if (el) el.style.transform = `translateY(${live.y}px)`;
                    }}
                    className={cn(
                      "wd-tile",
                      locked && "lock",
                      live.challenge && "boss",
                      locked && shake && "bad",
                    )}
                    style={{ left: live.x, width: live.w }}
                  >
                    <div
                      className={cn("wd-card", locked && shake && "wd-nudge")}
                      style={{ fontSize: live.font, minHeight: live.h }}
                    >
                      {live.challenge && <span className="wd-x3">{CHALLENGE_POINTS}</span>}
                      {tileMode === "easy" && (
                        <>
                          <span className="wd-w" style={{ fontSize: "1.1em" }}>
                            {letters.map((c, i) => (
                              <i key={i} className={cn(i < n && "ok", locked && i === n && "on")}>
                                {c}
                              </i>
                            ))}
                          </span>
                          <span dir="auto" className="wd-m">
                            {live.word.meaning}
                          </span>
                        </>
                      )}
                      {tileMode === "mid" && (
                        <>
                          <span dir="auto" className="wd-m1" style={{ fontSize: "1.1em" }}>
                            {live.word.meaning}
                          </span>
                          <span className="wd-mask">
                            {letters.map((c, i) => (
                              <i
                                key={i}
                                className={cn(i < n ? "f" : "e", locked && i === n && "on")}
                              >
                                {i < n ? c : "·"}
                              </i>
                            ))}
                          </span>
                        </>
                      )}
                      {tileMode === "hard" && (
                        <>
                          <button
                            type="button"
                            aria-label={strings.soundLabel}
                            onPointerDown={(event) => {
                              event.preventDefault();
                              playWord(live.word.audioUrl);
                            }}
                            className="wd-spk"
                          >
                            <Volume2 className="size-4" aria-hidden="true" />
                          </button>
                          <span data-hint="" className="wd-hint" />
                          <span className="wd-mask">
                            {letters.map((c, i) => (
                              <i
                                key={i}
                                className={cn(i < n ? "f" : "e", locked && i === n && "on")}
                              >
                                {i < n ? c : "·"}
                              </i>
                            ))}
                          </span>
                        </>
                      )}
                      {tileMode === "sentences" && (
                        <>
                          <span dir="ltr" className="wd-sentence">
                            <span className="ok">{en.slice(0, n)}</span>
                            {en.slice(n)}
                          </span>
                          <span dir="auto" className="wd-m line-clamp-2">
                            {live.word.meaning}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {pops.map((pop) => (
                <div
                  key={pop.id}
                  dir="auto"
                  className="wd-pop"
                  style={{
                    left: `${Math.min(70, Math.max(2, pop.frac * 70))}%`,
                    top: pop.y,
                    color: pop.bad ? "var(--wd-red)" : "var(--wd-acc)",
                  }}
                >
                  {pop.text}
                </div>
              ))}
            </div>

            <div
              className="wd-typer"
              onPointerDown={() => inputRef.current?.focus({ preventScroll: true })}
            >
              {wrongScript && (
                <p dir="auto" className="wd-warn">
                  {strings.switchKeyboard}
                </p>
              )}
              <div className="wd-typed" dir="ltr" aria-hidden="true">
                {typed.length === 0 ? (
                  <>
                    <span className="wd-caretwrap">
                      <b className="wd-caret" />
                      {ghost && (
                        <span key={ghost.id} className="wd-ghost">
                          {ghost.ch}
                        </span>
                      )}
                    </span>
                    <span className="ph" dir="auto">
                      {strings.placeholder}
                    </span>
                  </>
                ) : (
                  <>
                    {[...typed].map((c, i) => (
                      <span key={i} className={cn("c", i === typed.length - 1 && "n")}>
                        {c === " " ? <>&nbsp;</> : c}
                      </span>
                    ))}
                    <span className="wd-caretwrap">
                      <b className="wd-caret" />
                      {ghost && (
                        <span key={ghost.id} className="wd-ghost">
                          {ghost.ch}
                        </span>
                      )}
                    </span>
                  </>
                )}
              </div>
              <div className={cn("wd-caption", caption?.miss && "miss")}>
                {caption && (
                  <button
                    key={caption.id}
                    type="button"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      playWord(caption.word.audioUrl);
                    }}
                  >
                    {caption.miss && <em dir="auto">{strings.missedTag}</em>}
                    <b>{caption.word.en}</b>
                    {caption.word.meaning && <span dir="auto">{caption.word.meaning}</span>}
                    <Volume2 className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              <input
                ref={inputRef}
                value={typed}
                onChange={(event) => onType(event.target.value)}
                type="text"
                inputMode="text"
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="done"
                dir="ltr"
                placeholder={strings.placeholder}
                aria-label={strings.placeholder}
                className="wd-inp"
              />
            </div>

            <aside className="wd-side" aria-label={strings.caughtTitle}>
              <div className="wd-sd-h">
                <b dir="auto">{strings.caughtTitle}</b>
                <span dir="auto">{strings.levelLabel.replace("{n}", String(levelNow))}</span>
              </div>
              <div className="wd-lvbar" aria-hidden="true">
                <i style={{ width: `${((hud.correct % LEVEL_EVERY) / LEVEL_EVERY) * 100}%` }} />
              </div>
              {log.length === 0 ? (
                <p className="wd-sd-empty" dir="auto">
                  {strings.caughtEmpty}
                </p>
              ) : (
                <ul className="wd-log">
                  {log.map((item) => (
                    <li key={item.id} className={item.miss ? "miss" : undefined}>
                      <button
                        type="button"
                        onPointerDown={(event) => {
                          event.preventDefault();
                          playWord(item.word.audioUrl);
                        }}
                      >
                        <span className="en">{item.word.en}</span>
                        <span className="ar" dir="auto">
                          {item.word.meaning}
                        </span>
                        <Volume2 className="size-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>
        )}

        {screen === "end" && result && (
          <div className="wd-en">
            <div className="wd-en-left">
              <div>
                <span className="wd-eyebrow" dir="auto">
                  {strings.roundEnd}
                </span>
                <div className="big">{result.score}</div>
                <div className="unit" dir="auto">
                  {strings.points}
                </div>
              </div>
              {result.beat !== null && (
                <p dir="auto" className="text-[15px]">
                  {strings.newBest.replace("{n}", String(result.beat))}
                </p>
              )}
              {versusLine() && (
                <p
                  dir="auto"
                  className={cn(
                    "text-[17px] font-bold",
                    versus !== null && versus > 0 ? "text-[var(--wd-acc)]" : "text-white",
                  )}
                >
                  {versusLine()}
                </p>
              )}
              {seed?.kind === "daily" && signedIn && daily && !daily.ok && (
                <p dir="auto" className="text-[15px] text-[var(--wd-mute)]">
                  {daily.reason === "limit" ? strings.rankLimit : strings.rankFailed}
                </p>
              )}
              {seed?.kind === "daily" && !signedIn && (
                <p dir="auto" className="text-[15px] text-[var(--wd-mute)]">
                  {strings.signInToRank}
                </p>
              )}
              {placeLine() && (
                <div dir="auto">
                  <p className="text-[17px] font-bold text-[var(--wd-acc)]">{placeLine()}</p>
                  {daily?.improved === false && daily.best !== undefined && (
                    <p className="text-[13px] text-[var(--wd-mute)]">
                      {strings.dayBest.replace("{n}", String(daily.best))}
                    </p>
                  )}
                </div>
              )}
              {daily?.board && daily.board.countries.length > 0 && (
                <div>
                  <p dir="auto" className="py-1 text-[12.5px] text-[var(--wd-mute)]">
                    {strings.countriesTitle}
                  </p>
                  {daily.board.countries.slice(0, 5).map((row, index) => (
                    <div key={row.country} dir="auto" className="wd-row3">
                      <span
                        dir="ltr"
                        className={cn(
                          "font-extrabold tabular-nums",
                          index === 0 ? "text-[var(--wd-acc)]" : "text-[var(--wd-mute)]",
                        )}
                      >
                        {index + 1}
                      </span>
                      <span>{countryName(row.country, locale)}</span>
                      <b dir="ltr" className="tabular-nums">
                        {row.average}
                      </b>
                    </div>
                  ))}
                </div>
              )}
              <div className="wd-stats">
                {[
                  { n: `${result.accuracy}%`, label: strings.accuracy },
                  { n: String(result.wpm), label: strings.wordsPerMinute },
                  { n: String(result.words), label: strings.wordsTyped },
                  { n: String(result.bestCombo), label: strings.bestCombo },
                ].map((item) => (
                  <div key={item.label}>
                    <b>{item.n}</b>
                    <span dir="auto">{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="wd-en-act">
                {notice && (
                  <p role="status" dir="auto" className="wd-notice">
                    {notice}
                  </p>
                )}
                {played.own && (
                  <p dir="auto" className="text-center text-[12.5px] text-[var(--wd-mute)]">
                    {strings.noChallengeOwn}
                  </p>
                )}
                <div className={cn("grid gap-2.5", played.seed ? "grid-cols-2" : "grid-cols-1")}>
                  {played.seed && (
                    <button type="button" onClick={() => void onChallenge()} className="wd-btn">
                      {strings.challengeFriend}
                    </button>
                  )}
                  <button type="button" onClick={() => void onShareCard()} className="wd-btn">
                    {strings.shareResult}
                  </button>
                </div>
                <button type="button" onClick={() => setScreen("start")} className="wd-btn main">
                  {strings.again}
                </button>
                <Link href="/learn" className="wd-btn">
                  {strings.back}
                </Link>
              </div>
            </div>

            <div className="wd-en-right">
              {result.rhythm.length > 0 && (
                <div className="wd-rh">
                  <div className="hd">
                    <span dir="auto">{strings.rhythmHint}</span>
                    <span dir="auto">{strings.rhythmTitle}</span>
                  </div>
                  <div className="wd-bars" aria-hidden="true">
                    {result.rhythm.map((value, i) =>
                      value === null ? (
                        <b key={i} style={{ animationDelay: `${i * 18}ms` }} />
                      ) : (
                        <i
                          key={i}
                          className={value < 0.3 ? "slow" : undefined}
                          style={{
                            height: `${Math.max(8, Math.round(value * 100))}%`,
                            animationDelay: `${i * 18}ms`,
                          }}
                        />
                      ),
                    )}
                  </div>
                </div>
              )}
              <div>
                <p dir="auto" className="mb-3 text-right text-[13px] text-[var(--wd-mute)]">
                  {result.missed.length === 0
                    ? strings.noMisses
                    : `${strings.missedTitle}${bankOpen && played.mode !== "sentences" ? ` · ${strings.tapToSave}` : ""}`}
                </p>
                {result.missed.length > 0 && (
                  <div className="wd-mg">
                    {result.missed.map((word) => {
                      const isSaved = saved.has(word.id);
                      return (
                        <button
                          key={word.id}
                          type="button"
                          onClick={() => void saveMissed(word)}
                          className={cn("wd-mc", isSaved && "saved")}
                        >
                          <b>{word.en}</b>
                          <span dir="auto" className="m">
                            {word.meaning}
                          </span>
                          {isSaved && (
                            <span dir="auto" className="tag">
                              <Check className="size-3" aria-hidden="true" />
                              {strings.saved}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
