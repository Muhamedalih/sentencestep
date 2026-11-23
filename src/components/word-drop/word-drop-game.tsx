"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { Check, Volume2, X } from "lucide-react";

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
  MAX_ON_SCREEN,
  MIN_HARD_WORDS,
  MIN_SENTENCES,
  ROUND_SECONDS,
  SPAWN_Y,
  START_LIVES,
  WORD_DROP_MODES,
  accuracyPercent,
  createDeck,
  findSpot,
  mergePools,
  pickTarget,
  pointsForText,
  spawnGapMs,
  speedAfterCorrect,
  speedAfterMiss,
  tileSize,
  wordCountOf,
  wordsPerMinute,
  type Deck,
  type DropWord,
  type WordDropMode,
} from "@/lib/word-drop/engine";
import { wordDropStrings } from "@/lib/word-drop/strings";
import { cn } from "@/lib/utils";

/** The page's own look: the black finish-page identity (pure black, big numerals, green for right, red for missed, pale word tiles). */
const PALETTE = {
  "--wd-green": "oklch(0.72 0.19 150)",
  "--wd-green-ink": "oklch(0.48 0.14 150)",
  "--wd-red": "oklch(0.62 0.22 27)",
  "--wd-line": "oklch(0.25 0 0)",
  "--wd-panel": "oklch(0.11 0 0)",
  "--wd-mute": "oklch(0.62 0.005 260)",
  "--wd-tile": "oklch(0.925 0.012 85)",
  "--wd-tile-ink": "oklch(0.2 0.01 260)",
  "--wd-tile-mute": "oklch(0.5 0.01 260)",
} as CSSProperties;

const BEST_KEY = "wordDropBest";
/** How fast a round runs: seconds a tile takes to cross the screen at speed 1, the gap between tiles (a multiple of the usual), and how many can be on screen. Sentences are slower and fewer: they are longer to type. */
const PACE: Record<WordDropMode, { fall: number; gap: number; max: number }> = {
  easy: { fall: 10, gap: 1, max: MAX_ON_SCREEN },
  mid: { fall: 10, gap: 1, max: MAX_ON_SCREEN },
  hard: { fall: 10, gap: 1, max: MAX_ON_SCREEN },
  sentences: { fall: 17, gap: 2.4, max: 2 },
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
}

interface Hud {
  score: number;
  lives: number;
  combo: number;
  seconds: number;
}

interface Result {
  score: number;
  accuracy: number;
  wpm: number;
  words: number;
  bestCombo: number;
  missed: DropWord[];
  /** Points above the previous best (this browser's), or null when this was not a new best. */
  beat: number | null;
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

function clock(seconds: number): string {
  const whole = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
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
  const [hud, setHud] = useState<Hud>({
    score: 0,
    lives: START_LIVES,
    combo: 0,
    seconds: ROUND_SECONDS,
  });
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

  const playClip = useCallback((url: string | null) => {
    if (!url) return;
    try {
      audio.current?.pause();
      const clip = new Audio(url);
      audio.current = clip;
      void clip.play().catch(() => undefined);
    } catch {
      // A clip that will not play just stays silent; the word is still on screen as a hint.
    }
  }, []);

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
    };
    const prev = lastHud.current;
    if (
      prev &&
      prev.score === next.score &&
      prev.lives === next.lives &&
      prev.combo === next.combo &&
      prev.seconds === next.seconds
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
      const size = tileSize(r.mode, word, fieldWidth);
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
        el: null,
      });
      r.lastSpawn = now;
      setLiveView([...r.live]);
      if (r.mode === "hard") playClip(word.audioUrl);
      return true;
    },
    [playClip, seed],
  );

  const missWord = useCallback(
    (r: Round, live: Live) => {
      r.live = r.live.filter((other) => other.uid !== live.uid);
      if (!r.missed.some((word) => word.id === live.word.id)) r.missed.push(live.word);
      r.deck.requeue(live.word);
      r.lives -= 1;
      r.combo = 0;
      r.factor = speedAfterMiss(r.factor);
      setLiveView([...r.live]);
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

  const tick = useCallback(
    (now: number) => {
      const r = round.current;
      if (!r || !r.running) return;
      const dt = Math.min(0.05, (now - r.last) / 1000);
      r.last = now;
      r.remaining -= dt;
      const height = fieldRef.current?.clientHeight ?? 400;
      const pace = PACE[r.mode];
      const speed = ((height - FALL_ROOM) / pace.fall) * r.factor;
      r.elapsedMs += dt * 1000;
      if (r.live.length < pace.max && r.elapsedMs - r.lastSpawn > spawnGapMs(r.factor) * pace.gap) {
        spawn(r, r.elapsedMs);
      }
      for (const live of [...r.live]) {
        live.y += speed * dt;
        if (live.el) {
          live.el.style.transform = `translateY(${live.y}px)`;
          const hintEl = live.el.querySelector<HTMLElement>("[data-hint]");
          if (hintEl) hintEl.textContent = live.y > height * 0.45 ? `${live.word.en[0]} …` : "";
        }
        if (live.y + live.h > height - BOTTOM_MARGIN) missWord(r, live);
      }
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
    };
    round.current = r;
    lastHud.current = null;
    const kind: RoundKind = seed ? seed.kind : "free";
    setPlayed({ seed: roundSeed, kind, mode, own });
    report({ event: "started", mode, kind, level });
    // Flushed so the input exists when focus is asked for inside this tap, which is what lets a phone open its keyboard.
    flushSync(() => {
      setScreen("play");
      setTyped("");
      setLockUid(null);
      setPops([]);
      setLiveView([]);
      setResult(null);
      setDaily(null);
      setHud({ score: 0, lives: START_LIVES, combo: 0, seconds: ROUND_SECONDS });
    });
    inputRef.current?.focus({ preventScroll: true });
    spawn(r, 0);
    frame.current = requestAnimationFrame(tick);
  }, [freePool, level, mineOn, mode, personal, pool, seed, sentencePool, spawn, tick]);

  const complete = useCallback(
    (r: Round, live: Live) => {
      r.live = r.live.filter((other) => other.uid !== live.uid);
      r.correct += 1;
      r.combo += 1;
      r.best = Math.max(r.best, r.combo);
      r.chars += live.word.en.replace(/ /g, "").length;
      r.score += pointsForText(r.combo, wordCountOf(live.word.en));
      r.factor = speedAfterCorrect(r.factor);
      setLiveView([...r.live]);
      popAt(
        popLabel(live.word),
        live.x / Math.max(1, fieldRef.current?.clientWidth ?? 320),
        live.y,
        false,
      );
      syncHud(r);
    },
    [popAt, syncHud],
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
        later(260, () => setShake(false));
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
    playClip(word.audioUrl);
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

  return (
    // h-app: the site's own height that follows a phone's keyboard (see KeyboardViewport), so the input stays above the keys.
    <div
      dir="ltr"
      style={PALETTE}
      className="h-app fixed inset-x-0 top-0 z-50 flex flex-col overflow-hidden bg-black text-white"
    >
      <style>{`
        @keyframes wd-rise{0%{opacity:0;transform:translateY(0)}15%{opacity:1}100%{opacity:0;transform:translateY(-34px)}}
        @keyframes wd-shake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
        @keyframes wd-flash{0%{opacity:.8}100%{opacity:0}}
        @media (prefers-reduced-motion:reduce){.wd-anim{animation-duration:.01s !important}}
      `}</style>

      <div
        className={cn(
          "mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col",
          // Tablet and laptop: the play field gets room, the start and end pages become two columns.
          screen === "play" ? "md:max-w-3xl" : "md:max-w-5xl",
        )}
      >
        {screen === "start" && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between px-5 pt-5">
              <span className="text-xs font-semibold tracking-[0.14em] text-[var(--wd-mute)] uppercase">
                Word Drop
              </span>
              <Link
                href="/learn"
                aria-label={strings.exit}
                className="grid size-9 place-items-center rounded-full border border-[var(--wd-line)] text-[var(--wd-mute)] hover:text-white"
              >
                <X className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pt-6 pb-4 md:px-8 md:pt-10",
                !seed && "md:grid md:grid-cols-2 md:content-start md:items-start md:gap-x-12",
                seed && "md:mx-auto md:w-full md:max-w-xl",
              )}
            >
              <h1
                dir="auto"
                className="text-right text-[34px] leading-[1.2] font-extrabold md:col-span-2 md:text-[48px]"
              >
                {seed?.kind === "daily"
                  ? strings.dailyHeadline1
                  : seed?.kind === "friend"
                    ? strings.friendHeadline1
                    : strings.headline1}
                <br />
                <span className="text-[var(--wd-green)]">
                  {seed?.kind === "daily"
                    ? strings.dailyHeadline2
                    : seed?.kind === "friend"
                      ? strings.friendHeadline2
                      : strings.headline2}
                </span>
              </h1>
              {seed && (
                <div className="rounded-[18px] border border-[var(--wd-green)] px-4 py-3.5 text-right">
                  <p dir="auto" className="text-[15px] font-bold">
                    {seed.kind === "daily" ? strings.dailyMode : strings.friendMode}
                  </p>
                  {seed.kind === "friend" && beat !== null && (
                    <p
                      dir="auto"
                      className="mt-1 text-[22px] font-extrabold text-[var(--wd-green)]"
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
              <div
                className={cn("flex flex-col gap-2.5 md:gap-3", seed && "hidden")}
                role="radiogroup"
              >
                {modes.map((m, index) => {
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
                      className={cn(
                        "grid grid-cols-[auto_1fr] items-center gap-4 rounded-[18px] border bg-black px-4 py-3.5 text-right transition-colors",
                        selected ? "border-[var(--wd-green)]" : "border-[var(--wd-line)]",
                        disabled && "opacity-45",
                      )}
                    >
                      <span
                        className={cn(
                          "text-[30px] leading-none font-extrabold tabular-nums",
                          selected ? "text-[var(--wd-green)]" : "text-[var(--wd-line)]",
                        )}
                      >
                        {index + 1}
                      </span>
                      <span dir="auto">
                        <span
                          className={cn(
                            "block text-[17px] font-bold",
                            selected && "text-[var(--wd-green)]",
                          )}
                        >
                          {modeLabel[m].name}
                        </span>
                        <span className="block text-[13px] text-[var(--wd-mute)]">
                          {disabled ? strings.hardUnavailable : modeLabel[m].hint}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="contents md:flex md:flex-col md:gap-6">
                {!seed && personal.length >= MIN_PERSONAL && mode !== "sentences" && (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={useMine}
                    onClick={() => setUseMine((on) => !on)}
                    className={cn(
                      "grid grid-cols-[1fr_auto] items-center gap-4 rounded-[18px] border bg-black px-4 py-3 text-right transition-colors",
                      useMine ? "border-[var(--wd-green)]" : "border-[var(--wd-line)]",
                    )}
                  >
                    <span dir="auto">
                      <span
                        className={cn(
                          "block text-[15px] font-bold",
                          useMine && "text-[var(--wd-green)]",
                        )}
                      >
                        {strings.myWordsTitle}
                      </span>
                      <span className="block text-[12.5px] text-[var(--wd-mute)]">
                        {strings.myWordsLine.replace("{n}", String(personal.length))}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex h-6 w-11 items-center rounded-full border px-0.5 transition-colors",
                        useMine
                          ? "justify-end border-[var(--wd-green)] bg-[var(--wd-green)]"
                          : "justify-start border-[var(--wd-line)]",
                      )}
                    >
                      <span
                        className={cn(
                          "size-4 rounded-full",
                          useMine ? "bg-black" : "bg-[var(--wd-mute)]",
                        )}
                      />
                    </span>
                  </button>
                )}
                {!seed && (
                  <div className="flex flex-col gap-3 rounded-[18px] border border-[var(--wd-line)] px-4 py-3.5">
                    <div dir="auto" className="text-right">
                      <p className="text-[15px] font-bold">{strings.dailyTitle}</p>
                      <p className="text-[12.5px] text-[var(--wd-mute)]">{strings.dailyLine}</p>
                    </div>
                    {board && board.countries.length > 0 && (
                      <div className="border-t border-[var(--wd-line)]">
                        {board.countries.slice(0, 3).map((row, index) => (
                          <div
                            key={row.country}
                            dir="auto"
                            className="grid grid-cols-[28px_1fr_auto] items-baseline gap-3 border-b border-[var(--wd-line)] py-2.5 text-[14px]"
                          >
                            <span
                              dir="ltr"
                              className={cn(
                                "font-extrabold tabular-nums",
                                index === 0 ? "text-[var(--wd-green)]" : "text-[var(--wd-mute)]",
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
                    <Link
                      href={dailyHref}
                      prefetch={false}
                      className="grid min-h-12 place-items-center rounded-2xl border border-[var(--wd-line)] text-[15px] font-bold hover:border-[var(--wd-green)] hover:text-[var(--wd-green)]"
                    >
                      {strings.dailyStart}
                    </Link>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2.5 px-5 pb-5 md:mx-auto md:w-full md:max-w-md md:px-0 md:pb-8">
              <p dir="auto" className="text-center text-[12.5px] text-[var(--wd-mute)]">
                {strings.source}
              </p>
              <button
                type="button"
                onClick={start}
                disabled={poolEmpty || (mode !== "sentences" && pool.length === 0)}
                className="min-h-[54px] rounded-2xl border border-[var(--wd-green)] bg-black text-[17px] font-bold text-[var(--wd-green)] transition-colors hover:bg-[var(--wd-green)] hover:text-black active:bg-[var(--wd-green)] active:text-black disabled:opacity-45"
              >
                {strings.start}
              </button>
            </div>
          </div>
        )}

        {screen === "play" && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-end justify-between px-5 pt-4 pb-3">
              <div>
                <div className="text-[38px] leading-none font-extrabold tabular-nums">
                  {hud.score}
                </div>
                <div className="mt-1 text-xs text-[var(--wd-mute)]" dir="auto">
                  {strings.points}
                </div>
              </div>
              {hud.combo >= 2 && (
                <span className="rounded-full border border-[var(--wd-green)] px-2.5 py-0.5 text-xs font-bold text-[var(--wd-green)] tabular-nums">
                  ×{hud.combo}
                </span>
              )}
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5" aria-label={`${hud.lives}`}>
                    {Array.from({ length: START_LIVES }, (_, i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-[5px] w-[22px] rounded-[3px] transition-colors",
                          i < hud.lives ? "bg-[var(--wd-green)]" : "bg-[var(--wd-line)]",
                        )}
                      />
                    ))}
                  </div>
                  <Link
                    href="/learn"
                    aria-label={strings.exit}
                    className="text-[var(--wd-mute)] hover:text-white"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Link>
                </div>
                <span className="text-sm font-semibold text-[var(--wd-mute)] tabular-nums">
                  {clock(hud.seconds)}
                </span>
              </div>
            </div>

            <div
              ref={fieldRef}
              onPointerDown={() => inputRef.current?.focus({ preventScroll: true })}
              className="relative mx-3 min-h-0 flex-1 touch-manipulation overflow-hidden rounded-[20px] border border-[var(--wd-line)] bg-[var(--wd-panel)]"
            >
              <span
                className="absolute inset-x-0 bottom-0 h-[3px] bg-[var(--wd-red)]"
                aria-hidden="true"
              />
              {hit > 0 && (
                <span
                  key={hit}
                  aria-hidden="true"
                  className="wd-anim pointer-events-none absolute inset-0 opacity-0"
                  style={{
                    boxShadow: "inset 0 -50px 50px -30px var(--wd-red)",
                    animation: "wd-flash .5s",
                  }}
                />
              )}
              {liveView.map((live) => {
                const locked = live.uid === lockUid;
                const n = locked ? typed.length : 0;
                const en = live.word.en;
                const mask = n > 0 ? `${en.slice(0, n)} ${"·".repeat(en.length - n)}` : "";
                const tileMode = played.mode;
                return (
                  <div
                    key={live.uid}
                    ref={(el) => {
                      live.el = el;
                      if (el) el.style.transform = `translateY(${live.y}px)`;
                    }}
                    className="absolute top-0 will-change-transform"
                    style={{ left: live.x, width: live.w }}
                  >
                    <div
                      className={cn(
                        "flex w-full flex-col items-center gap-px overflow-hidden rounded-2xl border-2 bg-[var(--wd-tile)] px-3 pt-2 pb-1.5 text-center text-[var(--wd-tile-ink)]",
                        locked
                          ? "border-[var(--wd-green)] shadow-[0_0_0_3px_oklch(0.72_0.19_150/0.25)]"
                          : "border-transparent",
                      )}
                    >
                      {tileMode === "easy" && (
                        <>
                          <span className="text-[19px] leading-tight font-extrabold whitespace-nowrap">
                            <span className="text-[var(--wd-green-ink)]">{en.slice(0, n)}</span>
                            {en.slice(n)}
                          </span>
                          <span dir="auto" className="min-h-4 text-xs text-[var(--wd-tile-mute)]">
                            {live.word.meaning}
                          </span>
                        </>
                      )}
                      {tileMode === "mid" && (
                        <>
                          <span
                            dir="auto"
                            className="text-[19px] leading-tight font-extrabold whitespace-nowrap"
                          >
                            {live.word.meaning}
                          </span>
                          <span className="min-h-[18px] text-[13px] font-extrabold tracking-[0.16em] text-[var(--wd-green-ink)]">
                            {mask}
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
                              playClip(live.word.audioUrl);
                            }}
                            className="my-0.5 grid size-[30px] place-items-center rounded-full bg-[var(--wd-tile-ink)] text-[var(--wd-tile)]"
                          >
                            <Volume2 className="size-4" aria-hidden="true" />
                          </button>
                          <span
                            data-hint=""
                            className="min-h-4 text-xs font-semibold text-[var(--wd-tile-mute)]"
                          />
                          <span className="min-h-[18px] text-[13px] font-extrabold tracking-[0.16em] text-[var(--wd-green-ink)]">
                            {mask}
                          </span>
                        </>
                      )}
                      {tileMode === "sentences" && (
                        <>
                          <span
                            dir="ltr"
                            className="text-[16px] leading-snug font-extrabold"
                            style={{ overflowWrap: "anywhere" }}
                          >
                            <span className="text-[var(--wd-green-ink)]">{en.slice(0, n)}</span>
                            {en.slice(n)}
                          </span>
                          <span
                            dir="auto"
                            className="line-clamp-2 min-h-4 text-xs text-[var(--wd-tile-mute)]"
                          >
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
                  className={cn(
                    "wd-anim pointer-events-none absolute z-10 text-[13px] font-bold whitespace-nowrap",
                    pop.bad ? "text-[var(--wd-red)]" : "text-[var(--wd-green)]",
                  )}
                  style={{
                    left: `${Math.min(70, Math.max(2, pop.frac * 70))}%`,
                    top: pop.y,
                    animation: "wd-rise .95s ease-out forwards",
                  }}
                >
                  {pop.text}
                </div>
              ))}
            </div>

            <div className="px-3 pt-2.5 pb-3">
              {wrongScript && (
                <p dir="auto" className="mb-1.5 text-center text-xs text-[var(--wd-red)]">
                  {strings.switchKeyboard}
                </p>
              )}
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
                className={cn(
                  "wd-anim h-14 w-full rounded-2xl border bg-black px-4 text-center text-[22px] font-bold tracking-wider text-white outline-none placeholder:text-[var(--wd-line)] focus:border-[var(--wd-green)] md:h-16 md:text-[26px]",
                  shake ? "border-[var(--wd-red)]" : "border-[var(--wd-line)]",
                )}
                style={shake ? { animation: "wd-shake .25s" } : undefined}
              />
            </div>
          </div>
        )}

        {screen === "end" && result && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pt-8 pb-4 md:grid md:grid-cols-2 md:content-start md:items-start md:gap-x-12 md:px-8 md:pt-12">
              <div
                dir="ltr"
                className="flex flex-wrap items-baseline justify-end gap-x-7 gap-y-1 md:col-start-1"
              >
                <div className="flex items-baseline gap-2">
                  <small dir="auto" className="text-[15px] text-[var(--wd-mute)]">
                    {strings.points}
                  </small>
                  <b className="text-[clamp(54px,17vw,76px)] leading-none font-extrabold tabular-nums">
                    {result.score}
                  </b>
                </div>
                <div className="flex items-baseline gap-2">
                  <small dir="auto" className="text-[15px] text-[var(--wd-mute)]">
                    {strings.accuracy}
                  </small>
                  <b className="text-[clamp(54px,17vw,76px)] leading-none font-extrabold text-[var(--wd-green)] tabular-nums">
                    {result.accuracy}%
                  </b>
                </div>
              </div>

              <div className="md:col-start-1">
                <p dir="auto" className="mb-2.5 text-right text-[15px]">
                  {strings.accuracyLine}
                </p>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--wd-panel)]">
                  <div
                    className="h-full rounded-full bg-[var(--wd-green)]"
                    style={{ width: `${result.accuracy}%` }}
                  />
                </div>
                {result.beat !== null && (
                  <p dir="auto" className="mt-2.5 text-right text-[15px] text-[var(--wd-mute)]">
                    {strings.newBest.replace("{n}", String(result.beat))}
                  </p>
                )}
                {versusLine() && (
                  <p
                    dir="auto"
                    className={cn(
                      "mt-2.5 text-right text-[17px] font-bold",
                      versus !== null && versus > 0 ? "text-[var(--wd-green)]" : "text-white",
                    )}
                  >
                    {versusLine()}
                  </p>
                )}
                {seed?.kind === "daily" && signedIn && daily && !daily.ok && (
                  <p dir="auto" className="mt-2.5 text-right text-[15px] text-[var(--wd-mute)]">
                    {daily.reason === "limit" ? strings.rankLimit : strings.rankFailed}
                  </p>
                )}
                {seed?.kind === "daily" && !signedIn && (
                  <p dir="auto" className="mt-2.5 text-right text-[15px] text-[var(--wd-mute)]">
                    {strings.signInToRank}
                  </p>
                )}
                {placeLine() && (
                  <div dir="auto" className="mt-2.5 text-right">
                    <p className="text-[17px] font-bold text-[var(--wd-green)]">{placeLine()}</p>
                    {daily?.improved === false && daily.best !== undefined && (
                      <p className="text-[13px] text-[var(--wd-mute)]">
                        {strings.dayBest.replace("{n}", String(daily.best))}
                      </p>
                    )}
                  </div>
                )}
                {daily?.board && daily.board.countries.length > 0 && (
                  <div className="mt-3 border-t border-[var(--wd-line)]">
                    <p dir="auto" className="py-2 text-right text-[12.5px] text-[var(--wd-mute)]">
                      {strings.countriesTitle}
                    </p>
                    {daily.board.countries.slice(0, 5).map((row, index) => (
                      <div
                        key={row.country}
                        dir="auto"
                        className="grid grid-cols-[28px_1fr_auto] items-baseline gap-3 border-t border-[var(--wd-line)] py-2.5 text-[14px]"
                      >
                        <span
                          dir="ltr"
                          className={cn(
                            "font-extrabold tabular-nums",
                            index === 0 ? "text-[var(--wd-green)]" : "text-[var(--wd-mute)]",
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
              </div>

              <div className="grid grid-cols-3 border-y border-[var(--wd-line)] md:col-start-1">
                {[
                  { n: result.wpm, label: strings.wordsPerMinute },
                  { n: result.words, label: strings.wordsTyped },
                  { n: result.bestCombo, label: strings.bestCombo },
                ].map((item, index) => (
                  <div
                    key={item.label}
                    className={cn(
                      "px-1 py-3 text-center",
                      index > 0 && "border-l border-[var(--wd-line)]",
                    )}
                  >
                    <b className="block text-[22px] tabular-nums">{item.n}</b>
                    <span dir="auto" className="block text-xs text-[var(--wd-mute)]">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="md:col-start-2 md:row-span-3 md:row-start-1">
                <p dir="auto" className="mb-2.5 text-right text-[12.5px] text-[var(--wd-mute)]">
                  {result.missed.length === 0
                    ? strings.noMisses
                    : `${strings.missedTitle}${bankOpen && played.mode !== "sentences" ? ` · ${strings.tapToSave}` : ""}`}
                </p>
                {result.missed.length > 0 && (
                  <div className="grid grid-cols-3 gap-2.5 pb-2">
                    {result.missed.map((word) => {
                      const isSaved = saved.has(word.id);
                      return (
                        <button
                          key={word.id}
                          type="button"
                          onClick={() => void saveMissed(word)}
                          className={cn(
                            "relative flex flex-col gap-0.5 rounded-[18px] border-2 bg-[var(--wd-tile)] px-1 pt-3.5 pb-3 text-center text-[var(--wd-tile-ink)]",
                            isSaved ? "border-[var(--wd-green)]" : "border-transparent",
                          )}
                        >
                          <b className="text-[18px]">{word.en}</b>
                          <span dir="auto" className="text-[13px] text-[var(--wd-tile-mute)]">
                            {word.meaning}
                          </span>
                          {isSaved && (
                            <span
                              dir="auto"
                              className="absolute -bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-[var(--wd-green)] px-2 py-px text-[10.5px] font-bold whitespace-nowrap text-black"
                            >
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
            <div className="relative flex flex-col gap-2.5 px-5 pb-5 md:mx-auto md:w-full md:max-w-md md:px-0 md:pb-8">
              {notice && (
                <p
                  role="status"
                  dir="auto"
                  className="absolute inset-x-5 -top-11 rounded-xl bg-white px-3 py-2 text-center text-[13px] font-semibold text-black"
                >
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
                  <button
                    type="button"
                    onClick={() => void onChallenge()}
                    className="min-h-[50px] rounded-2xl border border-[var(--wd-line)] bg-black px-2 text-[14.5px] font-bold hover:border-[var(--wd-mute)]"
                  >
                    {strings.challengeFriend}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void onShareCard()}
                  className="min-h-[50px] rounded-2xl border border-[var(--wd-line)] bg-black px-2 text-[14.5px] font-bold hover:border-[var(--wd-mute)]"
                >
                  {strings.shareResult}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setScreen("start")}
                className="min-h-[54px] rounded-2xl border border-[var(--wd-green)] bg-black text-[17px] font-bold text-[var(--wd-green)] transition-colors hover:bg-[var(--wd-green)] hover:text-black active:bg-[var(--wd-green)] active:text-black"
              >
                {strings.again}
              </button>
              <Link
                href="/learn"
                className="grid min-h-[54px] place-items-center rounded-2xl border border-[var(--wd-line)] bg-black text-[15px] font-bold hover:border-[var(--wd-mute)]"
              >
                {strings.back}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
