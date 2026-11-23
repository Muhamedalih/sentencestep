"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { Check, Volume2, X } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { todayLocalISODate } from "@/lib/progress/streak";
import { recordBankWordAction } from "@/lib/word-bank/actions";
import {
  MAX_ON_SCREEN,
  MIN_HARD_WORDS,
  ROUND_SECONDS,
  START_LIVES,
  WORD_DROP_MODES,
  accuracyPercent,
  createDeck,
  pickTarget,
  pointsFor,
  spawnGapMs,
  speedAfterCorrect,
  speedAfterMiss,
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
/** Seconds a tile takes to cross the screen at speed 1. */
const FALL_SECONDS = 10;
/** The tile's height plus a margin: a word whose top passes (field height - this) has hit the bottom. */
const TILE_ROOM = 84;

interface Live {
  uid: number;
  word: DropWord;
  /** Where across the field the tile sits, 0 (left edge) to 1 (right edge). */
  frac: number;
  y: number;
  el: HTMLDivElement | null;
}

interface Pop {
  id: number;
  text: string;
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
  lastSpawn: number;
  last: number;
  deck: Deck;
  uid: number;
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

function clock(seconds: number): string {
  const whole = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export function WordDropGame({ pool, bankOpen }: { pool: DropWord[]; bankOpen: boolean }) {
  const { locale } = useLocale();
  const strings = wordDropStrings(locale);

  const [screen, setScreen] = useState<"start" | "play" | "end">("start");
  const [mode, setMode] = useState<WordDropMode>("easy");
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

  const hardOk = pool.filter((word) => word.audioUrl !== null).length >= MIN_HARD_WORDS;

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
      later(700, () => setScreen("end"));
    },
    [later],
  );

  const spawn = useCallback(
    (r: Round, now: number, activeMode: WordDropMode) => {
      const word = r.deck.next();
      r.uid += 1;
      // Pick a spot that does not sit on top of a tile that has only just appeared.
      let frac = Math.random();
      for (let tries = 0; tries < 8; tries += 1) {
        const candidate = Math.random();
        if (!r.live.some((other) => other.y < 100 && Math.abs(other.frac - candidate) < 0.3)) {
          frac = candidate;
          break;
        }
      }
      r.live.push({ uid: r.uid, word, frac, y: -10, el: null });
      r.lastSpawn = now;
      setLiveView([...r.live]);
      if (activeMode === "hard") playClip(word.audioUrl);
    },
    [playClip],
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
        `${live.word.en} · ${live.word.meaning}`,
        live.frac,
        (fieldRef.current?.clientHeight ?? 300) - 110,
        true,
      );
      syncHud(r);
      if (r.lives <= 0) finish(r);
    },
    [finish, popAt, syncHud],
  );

  const tick = useCallback(
    (now: number, activeMode: WordDropMode) => {
      const r = round.current;
      if (!r || !r.running) return;
      const dt = Math.min(0.05, (now - r.last) / 1000);
      r.last = now;
      r.remaining -= dt;
      const height = fieldRef.current?.clientHeight ?? 400;
      const speed = ((height - TILE_ROOM) / FALL_SECONDS) * r.factor;
      if (r.live.length < MAX_ON_SCREEN && now - r.lastSpawn > spawnGapMs(r.factor)) {
        spawn(r, now, activeMode);
      }
      for (const live of [...r.live]) {
        live.y += speed * dt;
        if (live.el) {
          live.el.style.transform = `translate(-${live.frac * 100}%, ${live.y}px)`;
          const hintEl = live.el.querySelector<HTMLElement>("[data-hint]");
          if (hintEl) hintEl.textContent = live.y > height * 0.45 ? `${live.word.en[0]} …` : "";
        }
        if (live.y > height - TILE_ROOM) missWord(r, live);
      }
      syncHud(r);
      if (r.remaining <= 0) {
        finish(r);
        return;
      }
      frame.current = requestAnimationFrame((t) => tick(t, activeMode));
    },
    [finish, missWord, spawn, syncHud],
  );

  const start = useCallback(() => {
    cancelAnimationFrame(frame.current);
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    const words = mode === "hard" ? pool.filter((word) => word.audioUrl !== null) : pool;
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
      lastSpawn: now,
      last: now,
      deck: createDeck(words),
      uid: 0,
      prevLen: 0,
      typedValue: "",
    };
    round.current = r;
    lastHud.current = null;
    // Flushed so the input exists when focus is asked for inside this tap, which is what lets a phone open its keyboard.
    flushSync(() => {
      setScreen("play");
      setTyped("");
      setLockUid(null);
      setPops([]);
      setLiveView([]);
      setResult(null);
      setHud({ score: 0, lives: START_LIVES, combo: 0, seconds: ROUND_SECONDS });
    });
    inputRef.current?.focus({ preventScroll: true });
    spawn(r, now, mode);
    frame.current = requestAnimationFrame((t) => tick(t, mode));
  }, [mode, pool, spawn, tick]);

  const complete = useCallback(
    (r: Round, live: Live) => {
      r.live = r.live.filter((other) => other.uid !== live.uid);
      r.correct += 1;
      r.combo += 1;
      r.best = Math.max(r.best, r.combo);
      r.chars += live.word.en.length;
      r.score += pointsFor(r.combo);
      r.factor = speedAfterCorrect(r.factor);
      setLiveView([...r.live]);
      popAt(`${live.word.en} · ${live.word.meaning}`, live.frac, live.y, false);
      syncHud(r);
    },
    [popAt, syncHud],
  );

  function onType(value: string) {
    const r = round.current;
    if (!r || !r.running) return;
    setWrongScript(/[؀-ۿ]/.test(value));
    const clean = value.toLowerCase().replace(/[^a-z]/g, "");
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
    if (!bankOpen || saved.has(word.id)) return;
    const answer = await recordBankWordAction({
      word: word.en,
      outcome: "missed",
      todayISO: todayLocalISODate(),
      source: "star",
      ar: word.meaning,
      homeSentence: word.sentence ?? undefined,
    });
    if (answer.ok) setSaved((current) => new Set(current).add(word.id));
  }

  const modeLabel: Record<WordDropMode, { name: string; hint: string }> = {
    easy: { name: strings.easy, hint: strings.easyHint },
    mid: { name: strings.mid, hint: strings.midHint },
    hard: { name: strings.hard, hint: strings.hardHint },
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

      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
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
            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pt-6 pb-4">
              <h1 dir="auto" className="text-right text-[34px] leading-[1.2] font-extrabold">
                {strings.headline1}
                <br />
                <span className="text-[var(--wd-green)]">{strings.headline2}</span>
              </h1>
              <div className="flex flex-col gap-2.5" role="radiogroup">
                {WORD_DROP_MODES.map((m, index) => {
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
            </div>
            <div className="flex flex-col gap-2.5 px-5 pb-5">
              <p dir="auto" className="text-center text-[12.5px] text-[var(--wd-mute)]">
                {strings.source}
              </p>
              <button
                type="button"
                onClick={start}
                disabled={pool.length === 0}
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
                return (
                  <div
                    key={live.uid}
                    ref={(el) => {
                      live.el = el;
                      if (el) el.style.transform = `translate(-${live.frac * 100}%, ${live.y}px)`;
                    }}
                    className="absolute top-0 will-change-transform"
                    style={{ left: `${live.frac * 100}%` }}
                  >
                    <div
                      className={cn(
                        "flex min-w-[84px] flex-col items-center gap-px rounded-2xl border-2 bg-[var(--wd-tile)] px-4 pt-2 pb-1.5 text-center text-[var(--wd-tile-ink)]",
                        locked
                          ? "border-[var(--wd-green)] shadow-[0_0_0_3px_oklch(0.72_0.19_150/0.25)]"
                          : "border-transparent",
                      )}
                    >
                      {mode === "easy" && (
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
                      {mode === "mid" && (
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
                      {mode === "hard" && (
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
                  "wd-anim h-14 w-full rounded-2xl border bg-black px-4 text-center text-[22px] font-bold tracking-wider text-white outline-none placeholder:text-[var(--wd-line)] focus:border-[var(--wd-green)]",
                  shake ? "border-[var(--wd-red)]" : "border-[var(--wd-line)]",
                )}
                style={shake ? { animation: "wd-shake .25s" } : undefined}
              />
            </div>
          </div>
        )}

        {screen === "end" && result && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pt-8 pb-4">
              <div dir="ltr" className="flex flex-wrap items-baseline justify-end gap-x-7 gap-y-1">
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

              <div>
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
              </div>

              <div className="grid grid-cols-3 border-y border-[var(--wd-line)]">
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

              <div>
                <p dir="auto" className="mb-2.5 text-right text-[12.5px] text-[var(--wd-mute)]">
                  {result.missed.length === 0
                    ? strings.noMisses
                    : `${strings.missedTitle}${bankOpen ? ` · ${strings.tapToSave}` : ""}`}
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
            <div className="flex flex-col gap-2.5 px-5 pb-5">
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
