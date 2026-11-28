"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Eye, Gauge, RotateCcw, X } from "lucide-react";

import { DictationHelp } from "@/components/learning/dictation-help";
import { DictationText } from "@/components/learning/dictation-text";
import {
  PronunciationButton,
  type PronunciationButtonHandle,
  type PronunciationStatus,
} from "@/components/learning/pronunciation-button";
import { SharedInputHost, SharedInputProvider } from "@/components/learning/shared-input";
import { ShiftReplayHint } from "@/components/learning/shift-replay-hint";
import { TapToStartOverlay } from "@/components/learning/typing-sentence";
import { useLocale } from "@/components/providers/locale-provider";
import {
  PRONUNCIATION_SPEED_STEPS,
  usePronunciationSettings,
} from "@/components/providers/pronunciation-settings-provider";
import { useTypingSoundSettings } from "@/components/providers/typing-sound-settings-provider";
import { useEnterToContinue } from "@/hooks/use-enter-to-continue";
import { useIsMobileViewport } from "@/hooks/use-is-mobile-viewport";
import { useTypingSound } from "@/hooks/use-typing-sound";
import { resolveSectionSentenceCompleteSound } from "@/lib/admin/typing-sound-settings";
import {
  advanceDictationGift,
  applyStrictDictationInput,
  dictationMissStarsLost,
  dictationStarCapacity,
  dictationStars,
  dictationView,
  dictationWordLengths,
  isDictationComplete,
} from "@/lib/features/dictation";
import { normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { todayLocalISODate } from "@/lib/progress/streak";
import {
  bareWord,
  fillGiven,
  nameWordIndexes,
  passageNames,
  showGiven,
  stageRows,
  targetWordIndexes,
} from "@/lib/today/scene";
import type { Scene, StageRow } from "@/lib/today/scene";
import { recordSceneLinesAction } from "@/lib/today/scene-actions";
import { sceneStrings } from "@/lib/today/scene-strings";
import type { SceneStrings } from "@/lib/today/scene-strings";
import { cn } from "@/lib/utils";
import { termOf } from "@/lib/word-ladder/options";

/** The same rules as Stories' help: it comes after this many wrong letters at one blank. */
const HELP_AFTER_MISSES = 2;
/** How long a shown word stays up (the same as Dictation's). */
const PEEK_MS = 1500;
/** How long a wrong letter stays on its blank, shaking. */
const REJECTION_MS = 350;
/** A finished line stays lit this long before the next one (Enter skips the wait). */
const NEXT_MS = 1100;
/** The slide from one line to the next: the cursor waits for it to end. */
const SLIDE_MS = 750;

/** The size of every line but the current one, whose own is set in CSS (px, wide screen / phone). */
const SIZES = {
  wide: { prev: 22, old: 15, next: 22, far: 18, gap: 36, anchor: 140, help: 64 },
  phone: { prev: 17, old: 12, next: 17, far: 15, gap: 22, anchor: 130, help: 110 },
} as const;

type LineRole = "cur" | "prev" | "old" | "next" | "far";

const ROLE_CLASS: Record<LineRole, string> = {
  cur: "opacity-100",
  prev: "opacity-[.34] saturate-[.4]",
  old: "opacity-[.13]",
  next: "opacity-[.38] blur-[.4px]",
  far: "opacity-0",
};

const roleOf = (distance: number): LineRole =>
  distance === 0
    ? "cur"
    : distance === -1
      ? "prev"
      : distance < -1
        ? "old"
        : distance === 1
          ? "next"
          : "far";

/** A name is written for the learner; the day's word stands out. */
const NAME_TEXT = "text-[#5a66a8] dark:text-[#7d87b8]";
const TARGET_TEXT = "text-[#3d46c9] dark:text-[#c9cbff]";
const NAME_WORD = "[--lesson-letter-correct:#5a66a8] dark:[--lesson-letter-correct:#7d87b8]";
const TARGET_WORD =
  "[--lesson-letter-correct:#3d46c9] dark:[--lesson-letter-correct:#c9cbff] [--lesson-letter-pending:var(--brand)] [&_[data-tick]]:!h-1";

interface Rejection {
  word: number;
  letter: number;
  char: string;
  nonce: number;
}

/**
 * The second step of the day's scene (permission dailyScene): a stage. The line to be typed stands in
 * the middle, large; the line before it shrinks and fades above it, the one before that almost
 * vanishes, and the next one waits faintly below. Each missing line is heard in the passage's own
 * voice and typed letter by letter onto its blanks (Dictation's own engine and help, with the same
 * stars as Stories); names are written already; the whole line can be shown to type over. The scene's
 * words stand beside it with their meanings, their English hidden until written. After the last line
 * the day's second task is recorded and the way on is the words.
 */
export function SceneLines({ scene, title }: { scene: Scene; title: string }) {
  const { locale, t, dir } = useLocale();
  const strings = sceneStrings(locale);
  const reducedMotion = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [lineDone, setLineDone] = useState(false);
  const [peekWord, setPeekWord] = useState<number | null>(null);
  const [rejection, setRejection] = useState<Rejection | null>(null);
  /** Wrong letters in a row at the same blank: what brings up the help. */
  const [streak, setStreak] = useState<{ word: number; letter: number; count: number } | null>(
    null,
  );
  const [missStarsLost, setMissStarsLost] = useState(0);
  const [helps, setHelps] = useState(0);
  const [spent, setSpent] = useState(false);
  const [capacity, setCapacity] = useState(() => dictationStarCapacity(0));
  /** The whole line is shown, to be typed over. Every new line starts hidden. */
  const [shown, setShown] = useState(false);
  const [settledIndex, setSettledIndex] = useState<number | null>(null);
  const [audio, setAudio] = useState<PronunciationStatus>({
    supported: true,
    loading: false,
    playing: false,
  });
  const missesByBlankRef = useRef<Map<string, number>>(new Map());
  const giftRef = useRef({ gifts: 0, run: 0 });
  /** This line had a word asked for or was shown whole. */
  const helpedRef = useRef(false);
  const totalsRef = useRef({ clean: 0, mistakes: 0 });
  const nonceRef = useRef(0);
  const timersRef = useRef<{ peek?: number; rejection?: number }>({});
  const recordedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<PronunciationButtonHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobileViewport();
  const [tapped, setTapped] = useState(false);
  // The server draws no tap gate: it appears only after the first client render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const hasStarted = mounted && (!isMobile || tapped);
  const { speedIndex, setSpeed } = usePronunciationSettings();

  const total = scene.steps.length;
  const step = scene.steps[index];
  const allDone = index >= total;

  const names = useMemo(() => passageNames(scene.lines), [scene]);
  const targets = useMemo(
    () => (step ? targetWordIndexes(step.typed, step.words) : new Set<number>()),
    [step],
  );
  /** The words of this line the learner does not type. */
  const given = useMemo(() => {
    if (!step) return new Set<number>();
    const found = [...nameWordIndexes(step.typed, names)].filter((word) => !targets.has(word));
    // A line made only of names is typed whole: there would be nothing to do.
    return new Set(found.length < dictationWordLengths(step.typed).length ? found : []);
  }, [step, names, targets]);
  const answer = step ? fillGiven(step.typed, value, given) : "";
  const view = step ? showGiven(dictationView(step.typed, answer), given) : null;

  const soundSettings = useTypingSoundSettings();
  const { play, playSentenceComplete } = useTypingSound({
    pack: soundSettings.soundPack,
    enabled: soundSettings.enabled,
    volume: soundSettings.volume,
    sentenceCompleteSound: soundSettings.sentenceCompleteSound,
  });

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      window.clearTimeout(timers.peek);
      window.clearTimeout(timers.rejection);
    };
  }, []);

  /** On to the line after `from`; a second call for the same line does nothing. */
  const advance = useCallback((from: number) => {
    window.clearTimeout(timersRef.current.peek);
    helpedRef.current = false;
    missesByBlankRef.current = new Map();
    setValue("");
    setLineDone(false);
    setPeekWord(null);
    setRejection(null);
    setStreak(null);
    setMissStarsLost(0);
    setHelps(0);
    setSpent(false);
    setShown(false);
    setCapacity(dictationStarCapacity(giftRef.current.gifts));
    setIndex((current) => (current === from ? current + 1 : current));
  }, []);

  useEnterToContinue(lineDone, () => advance(index));
  // A finished line stays lit a moment, then the next one comes.
  useEffect(() => {
    if (!lineDone) return;
    const timer = window.setTimeout(() => advance(index), NEXT_MS);
    return () => window.clearTimeout(timer);
  }, [lineDone, index, advance]);

  // The cursor is measured on screen, so it appears once the line has arrived.
  useEffect(() => {
    const timer = window.setTimeout(() => setSettledIndex(index), reducedMotion ? 0 : SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [index, reducedMotion]);

  // The keyboard goes to the line being typed, and stays there from line to line.
  useEffect(() => {
    if (hasStarted && !allDone) inputRef.current?.focus();
  }, [hasStarted, index, allDone]);

  // Typing wins the keyboard whatever was clicked last (replay, speed, a word card).
  useEffect(() => {
    if (allDone) return;
    function refocus(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
      if (event.key.length !== 1 && event.key !== "Backspace") return;
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
      inputRef.current?.focus();
    }
    document.addEventListener("keydown", refocus);
    return () => document.removeEventListener("keydown", refocus);
  }, [allDone]);

  // The last line is in: the day's second task is done.
  useEffect(() => {
    if (!allDone || recordedRef.current) return;
    recordedRef.current = true;
    void recordSceneLinesAction({
      todayISO: todayLocalISODate(),
      lines: total,
      clean: totalsRef.current.clean,
      mistakes: Math.min(2000, totalsRef.current.mistakes),
    }).catch(() => {});
  }, [allDone, total]);

  /** Puts the lines (and the help under the current one) where they belong; the CSS slides them there. */
  const arrange = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const sizes = window.matchMedia("(min-width: 768px)").matches ? SIZES.wide : SIZES.phone;
    const base = parseFloat(getComputedStyle(stage).fontSize) || 29;
    const items = [...stage.querySelectorAll<HTMLElement>("[data-stage-line]")].map((node) => {
      const distance = Number(node.dataset.distance);
      const role = roleOf(distance);
      const scale = role === "cur" ? 1 : sizes[role] / base;
      node.style.width = `${100 / scale}%`;
      return { node, distance, scale };
    });
    const heights = items.map((item) => item.node.offsetHeight * item.scale);
    const current = items.findIndex((item) => item.distance === 0);
    if (current < 0) return;
    const currentHeight = heights[current]!;
    const helpHeight = helpRef.current?.offsetHeight ?? 0;
    // High enough that the line and its help stay in view above a phone keyboard.
    const anchor = Math.max(
      8,
      Math.min(sizes.anchor, stage.clientHeight - currentHeight - sizes.help - 16),
    );
    const tops: number[] = [];
    tops[current] = anchor;
    for (let i = current - 1, y: number = anchor; i >= 0; i--) {
      y -= heights[i]! + sizes.gap / (i === current - 1 ? 1 : 2.5);
      tops[i] = y;
    }
    const below = anchor + currentHeight + (helpHeight ? helpHeight + 14 : 0) + sizes.gap;
    for (let i = current + 1, y = below; i < items.length; i++) {
      tops[i] = y;
      y += heights[i]! + sizes.gap / 2;
    }
    items.forEach(({ node, scale }, i) => {
      const placed = node.dataset.placed === "1";
      // A line seen for the first time appears where it belongs instead of flying there.
      if (!placed) node.style.transition = "none";
      node.style.transform = `translateY(${tops[i]}px) scale(${scale})`;
      if (!placed) {
        void node.offsetHeight;
        node.style.transition = "";
        node.dataset.placed = "1";
      }
    });
    // On a very short screen the help covers the foot of the line rather than leaving the stage.
    if (helpRef.current) {
      const top = Math.min(anchor + currentHeight + 14, stage.clientHeight - helpHeight - 4);
      helpRef.current.style.top = `${Math.max(0, top)}px`;
    }
  }, []);

  useLayoutEffect(() => {
    arrange();
  });
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(arrange);
    observer.observe(stage);
    document.fonts?.ready?.then(arrange).catch(() => {});
    return () => observer.disconnect();
  }, [arrange, allDone]);

  function finishLine() {
    setLineDone(true);
    setPeekWord(null);
    setRejection(null);
    setStreak(null);
    playSentenceComplete(resolveSectionSentenceCompleteSound(soundSettings, "stories"));
    const usedStar = helpedRef.current || missStarsLost + helps > 0;
    giftRef.current = advanceDictationGift(giftRef.current, usedStar);
    if (!helpedRef.current) totalsRef.current.clean += 1;
  }

  function handleChange(next: string) {
    // Only letters are added: what is already in is right, so nothing is erased.
    if (!step || lineDone || next.length < answer.length) return;
    const result = applyStrictDictationInput(step.typed, answer, next);
    let filled = answer;
    if (result.value !== answer) {
      filled = fillGiven(step.typed, result.value, given);
      play("letter");
      setPeekWord(null);
      setStreak(null);
      setValue(filled);
    }
    if (result.rejected !== null && result.at) {
      const { word, letter } = result.at;
      totalsRef.current.mistakes += 1;
      const blank = `${word}:${letter}`;
      missesByBlankRef.current.set(blank, (missesByBlankRef.current.get(blank) ?? 0) + 1);
      setMissStarsLost(dictationMissStarsLost(missesByBlankRef.current.values()));
      setStreak((current) =>
        current && current.word === word && current.letter === letter
          ? { ...current, count: current.count + 1 }
          : { word, letter, count: 1 },
      );
      nonceRef.current += 1;
      setRejection({ word, letter, char: result.rejected, nonce: nonceRef.current });
      window.clearTimeout(timersRef.current.rejection);
      timersRef.current.rejection = window.setTimeout(() => setRejection(null), REJECTION_MS);
      play("error");
      // A guess costs a listen, but a line already being said is left to finish.
      if (!audio.playing && !audio.loading) audioRef.current?.replay();
    }
    if (isDictationComplete(step.typed, filled)) finishLine();
  }

  const liveStars = dictationStars(capacity, missStarsLost + helps, spent);
  const stuck = !allDone && !shown && !lineDone && (streak?.count ?? 0) >= HELP_AFTER_MISSES;

  function showWord() {
    const word = view?.cursor?.word;
    if (word === undefined || lineDone) return;
    helpedRef.current = true;
    setHelps((count) => count + 1);
    // The word shown at the last star spends it.
    if (liveStars <= 1) setSpent(true);
    setPeekWord(word);
    window.clearTimeout(timersRef.current.peek);
    timersRef.current.peek = window.setTimeout(() => setPeekWord(null), PEEK_MS);
    inputRef.current?.focus();
  }

  function toggleSentence() {
    if (lineDone || allDone) return;
    if (!shown) {
      // A line seen whole keeps no stars.
      helpedRef.current = true;
      setSpent(true);
      setPeekWord(null);
    }
    setStreak(null);
    setShown(!shown);
    inputRef.current?.focus();
  }

  function replay() {
    audioRef.current?.replay();
    inputRef.current?.focus();
  }

  function cycleSpeed() {
    setSpeed((speedIndex + 1) % PRONUNCIATION_SPEED_STEPS.length);
    inputRef.current?.focus();
  }

  const rows = allDone ? [] : stageRows(scene, index);
  const wordClass = (word: number) =>
    targets.has(word) ? TARGET_WORD : given.has(word) ? NAME_WORD : undefined;
  const words = scene.steps.flatMap((entry, position) =>
    entry.words.map((word) => {
      const current = !allDone && position === index;
      const done = position < index || (current && lineDone);
      return { word, current, done, written: done || (current && shown) };
    }),
  );

  return (
    <SharedInputProvider>
      <div className="h-app relative flex w-full flex-col overflow-hidden" dir="ltr">
        <SharedInputHost />
        {!allDone && <ShiftReplayHint />}
        {mounted && !hasStarted && !allDone && (
          <TapToStartOverlay
            heading={t.lesson.tapToStartHeading}
            body={t.lesson.tapToStartBody}
            onStart={() => {
              inputRef.current?.focus();
              setTapped(true);
            }}
          />
        )}
        {step && (
          <PronunciationButton
            ref={audioRef}
            text={step.line.en}
            audioUrl={step.line.audioUrl}
            autoPlay={hasStarted}
            resetKey={step.line.id}
            inputRef={inputRef}
            contentType="sentence"
            contentId={step.line.id}
            noBrowserVoice
            headless
            onStatusChange={setAudio}
          />
        )}

        <header className="flex shrink-0 items-center gap-2.5 px-3.5 pt-3 md:gap-3.5 md:px-7 md:pt-4">
          <Link
            href="/learn"
            aria-label={strings.exit}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring grid size-8 shrink-0 place-items-center rounded-lg outline-none focus-visible:ring-2"
          >
            <X className="size-[22px]" aria-hidden="true" />
          </Link>
          <span className="flex min-w-0 flex-col leading-[1.4]">
            <small
              className="text-muted-foreground truncate text-left text-[11px] md:text-[13px]"
              dir="auto"
            >
              {strings.position(Math.min(index + 1, total), total)}
            </small>
            <b className="truncate text-[15px] md:text-[17px]">{title}</b>
          </span>
          {!allDone && (
            <div className="bg-foreground/6 ml-auto flex shrink-0 items-center gap-0.5 rounded-2xl p-1">
              <ToolButton
                label={strings.showSentence}
                icon={<Eye className="size-4" aria-hidden="true" />}
                pressed={shown}
                disabled={lineDone}
                onClick={toggleSentence}
              />
              <ToolButton
                label={t.lessonSettings.speedTitle}
                icon={<Gauge className="size-4" aria-hidden="true" />}
                onClick={cycleSpeed}
              >
                <span className="min-w-[2.2rem] text-left tabular-nums">
                  {PRONUNCIATION_SPEED_STEPS[speedIndex]?.multiplier}×
                </span>
              </ToolButton>
              <ToolButton
                label={strings.replay}
                icon={<RotateCcw className="size-4" aria-hidden="true" />}
                active={audio.playing}
                onClick={replay}
              />
            </div>
          )}
        </header>

        <div className="mx-3.5 mt-2.5 flex shrink-0 gap-1.5 md:mx-7 md:mt-3" aria-hidden="true">
          {scene.steps.map((entry, position) => (
            <i
              key={entry.line.id}
              className={cn(
                "h-1 flex-1 rounded-[3px] transition-colors duration-400",
                position < index || (position === index && lineDone)
                  ? "bg-brand"
                  : position === index
                    ? "bg-brand/45"
                    : "bg-foreground/12",
              )}
            />
          ))}
        </div>

        {/* On a phone the words of this line stand under the progress line. */}
        {!allDone && (
          <ul className="mx-3.5 mt-2 flex shrink-0 flex-col gap-1.5 md:hidden">
            {words
              .filter((entry) => entry.current)
              .map((entry) => (
                <li
                  key={entry.word.id}
                  className="border-brand/70 bg-brand/14 flex items-center justify-between gap-3 rounded-[14px] border px-3.5 py-2"
                >
                  <span className="text-[19px] font-semibold tracking-[.02em]" lang="en">
                    {entry.written ? entry.word.word : blanks(entry.word.word)}
                  </span>
                  <span className="text-foreground text-[17px] dark:text-[#e6e7ff]" dir="auto">
                    {termOf(entry.word.hintAr)}
                  </span>
                </li>
              ))}
          </ul>
        )}

        <div className="mx-auto mt-[18px] flex min-h-0 w-full max-w-[1280px] flex-1 gap-6 px-[18px] pb-2 md:mt-[26px] md:pr-7 md:pl-8 lg:gap-[46px] lg:pl-14 [html[data-keyboard]_&]:mt-1.5">
          {allDone ? (
            <SceneDone strings={strings} reducedMotion={reducedMotion} />
          ) : (
            <div
              ref={stageRef}
              onClick={() => inputRef.current?.focus()}
              className="relative max-w-[900px] min-w-0 flex-1 overflow-hidden text-[length:clamp(29px,3.75vw,48px)] max-md:[html[data-keyboard]_&]:text-[length:24px]"
            >
              {rows.map((row) => {
                const role = roleOf(row.distance);
                return (
                  <div
                    key={row.line.id}
                    data-stage-line=""
                    data-distance={row.distance}
                    className={cn(
                      "font-quote absolute top-0 left-0 w-full origin-top-left leading-[1.5] font-medium [transition:transform_.7s_cubic-bezier(.22,.8,.2,1),opacity_.6s,filter_.6s] motion-reduce:[transition:none]",
                      ROLE_CLASS[role],
                      role !== "cur" && "overflow-hidden text-ellipsis whitespace-nowrap",
                    )}
                    lang="en"
                  >
                    {row.role !== "locked" && row.line.speaker && (
                      <span className="mb-[.4em] block font-sans text-[.38em] font-semibold tracking-[.02em] text-[#6b6f80] dark:text-[#8f93a5]">
                        {row.line.speaker}
                      </span>
                    )}
                    {row.role === "current" && row.step && view ? (
                      <div className="[--lesson-letter-pending:color-mix(in_oklch,var(--muted-foreground)_72%,transparent)] dark:[--lesson-letter-pending:#6e7386] dark:[--lesson-underline:#fff]">
                        {row.step.before.trim() && (
                          <p className="text-muted-foreground mb-[.5em] text-[.52em] leading-[1.7] dark:text-[#6f7382] [html[data-keyboard]_&]:hidden">
                            {row.step.before.trim()}
                          </p>
                        )}
                        <DictationText
                          view={view}
                          value={answer}
                          inputRef={inputRef}
                          onChange={handleChange}
                          onEnter={() => lineDone && advance(index)}
                          ariaLabel={strings.typeLine}
                          showBlanks
                          reducedMotion={reducedMotion}
                          textClassName="font-quote text-[1em] leading-[1.5] font-medium tracking-normal sm:leading-[1.5] [&_[data-tick]]:h-[3px]"
                          rejection={rejection}
                          peekWord={peekWord}
                          reveal={shown && !lineDone}
                          wordClassName={wordClass}
                          // Also while the line is still sliding in: the cursor waits for it.
                          finished={lineDone || settledIndex !== index}
                          after={
                            lineDone && (
                              <span className="text-success ml-[.3em] text-[.6em]">✓</span>
                            )
                          }
                        />
                        {row.step.after.trim() && (
                          <p className="text-muted-foreground mt-[.5em] text-[.52em] leading-[1.7] dark:text-[#6f7382] [html[data-keyboard]_&]:hidden">
                            {row.step.after.trim()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <StageText row={row} names={names} />
                    )}
                  </div>
                );
              })}
              {/* Above a phone's keyboard there is room for one row: the stars and the button. */}
              <div
                ref={helpRef}
                className="absolute inset-x-0 top-0 flex justify-center max-md:[html[data-keyboard]_&_[role=group]>div>span:first-child]:hidden"
              >
                {stuck && (
                  <DictationHelp
                    dir={dir}
                    prompt={t.dictation.stuckPrompt}
                    stars={liveStars}
                    maxStars={capacity}
                    showStakes
                    starsLabel={t.dictation.starsLabel}
                    lastStarCosts
                    hintStaysOpen
                    stablePrice
                    keepFocus
                    noStarsLabel={t.dictation.noStars}
                    onShowWord={showWord}
                    showWordLabel={t.dictation.help}
                    showWordTitle={t.dictation.helpTitle}
                    showingWord={peekWord !== null}
                    costLabel={t.dictation.costLabel}
                    costRecorded={t.dictation.costRecorded}
                    giveUpLabel={t.dictation.giveUp}
                    giveUpTitle={t.dictation.giveUpTitle}
                  />
                )}
              </div>
              <span className="sr-only" role="status">
                {rejection ? strings.wrongLetter : ""}
              </span>
            </div>
          )}
          <SceneWordRail words={words} strings={strings} />
        </div>
      </div>
    </SharedInputProvider>
  );
}

/** A word still to be written: a blank for each letter. */
const blanks = (word: string) => Array.from(word, () => "_").join(" ");

/** One of the corner toolbar's buttons (as in the passage reader); a phone keeps only the icon. */
function ToolButton({
  label,
  icon,
  children,
  pressed,
  active,
  disabled,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  /** Shown instead of the label, on every screen (the speed). */
  children?: ReactNode;
  /** A switch: drawn lifted while it is on. */
  pressed?: boolean;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      className={cn(
        "focus-visible:ring-ring flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-[13px] font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 disabled:opacity-50 md:px-3 pointer-coarse:h-10",
        pressed
          ? "bg-background text-brand shadow-[0_1px_2px_rgba(0,0,0,.28),0_0_0_1px_rgba(124,131,240,.38)] dark:bg-black"
          : "text-muted-foreground hover:bg-foreground/6 hover:text-foreground",
        active && "text-brand",
      )}
    >
      {icon}
      {children ?? (
        <span className="max-md:hidden" dir="auto">
          {label}
        </span>
      )}
    </button>
  );
}

/** Any line but the one being typed: what was written, the passage around it, or only a bar. */
function StageText({ row, names }: { row: StageRow; names: ReadonlySet<string> }) {
  if (row.role === "locked") {
    return (
      <span
        aria-hidden="true"
        className="bg-foreground/10 inline-block h-[.45em] w-[70%] rounded-md align-middle"
      />
    );
  }
  const targets = new Set(row.step?.words.map((word) => normalizeMistakeWord(word.word)));
  const text = row.step ? row.step.typed : row.line.en;
  return (
    <>
      {text.split(/(\s+)/).map((piece, position) => {
        const bare = bareWord(piece);
        const tone = targets.has(bare.toLowerCase())
          ? TARGET_TEXT
          : names.has(bare)
            ? NAME_TEXT
            : null;
        return tone ? (
          <span key={position} className={tone}>
            {piece}
          </span>
        ) : (
          piece
        );
      })}
      {row.role === "done" && <span className="text-success ml-[.3em] text-[.6em]">✓</span>}
    </>
  );
}

/** On a wide screen: the scene's words with their meanings; the current one large, each written one ticked. */
function SceneWordRail({
  words,
  strings,
}: {
  words: {
    word: { id: string; word: string; hintAr: string };
    current: boolean;
    done: boolean;
    written: boolean;
  }[];
  strings: SceneStrings;
}) {
  const { dir } = useLocale();
  return (
    <aside className="mt-1 ml-auto hidden w-[200px] shrink-0 flex-col gap-2.5 self-start md:flex lg:w-[250px]">
      <h5 className="text-muted-foreground text-sm font-semibold" dir={dir}>
        {strings.sideTitle}
      </h5>
      <ul className="flex flex-col gap-2.5">
        {words.map(({ word, current, done, written }) => {
          const large = current;
          const english = written ? word.word : blanks(word.word);
          return (
            <li
              key={word.id}
              className={cn(
                "flex origin-left flex-col gap-0.5 rounded-[14px] border [transition:all_.55s_cubic-bezier(.22,.8,.2,1)] motion-reduce:[transition:none]",
                large
                  ? "border-brand/70 bg-brand/14 scale-[1.06] px-4 py-[18px]"
                  : "bg-card px-3.5 py-[9px] dark:bg-[#0c0c0f]",
                !large &&
                  (done ? "border-success/35 opacity-[.62]" : "border-foreground/9 opacity-45"),
              )}
            >
              <span
                className={cn(
                  "overflow-hidden font-semibold tracking-[.02em] whitespace-nowrap",
                  large ? "text-[30px] leading-[1.3]" : "text-[15px]",
                  done && !large && "text-[#1f7a4d] dark:text-[#bfeccf]",
                )}
                // The blanks of a long word are drawn smaller so they all fit.
                style={
                  large && !written && word.word.length > 8
                    ? { fontSize: 250 / word.word.length }
                    : undefined
                }
                lang="en"
              >
                {done && !large ? "✓ " : ""}
                {english}
              </span>
              <span
                className={cn(
                  large
                    ? "text-foreground text-[21px] dark:text-[#e6e7ff]"
                    : "text-[13px] text-[#4a4f8f] dark:text-[#a3a6d6]",
                )}
                dir="auto"
              >
                {termOf(word.hintAr)}
              </span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

/** After the last line: one calm mark and one button to the words. */
function SceneDone({ strings, reducedMotion }: { strings: SceneStrings; reducedMotion: boolean }) {
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex max-w-[900px] flex-1 flex-col items-center justify-center gap-2.5 text-center"
    >
      <span className="border-success/40 bg-success/15 text-success grid size-[52px] place-items-center rounded-full border">
        <Check className="size-[26px]" strokeWidth={2.4} aria-hidden="true" />
      </span>
      <h1 className="text-[17px] font-bold" dir="auto">
        {strings.doneTitle}
      </h1>
      <p className="text-muted-foreground text-[13px]" dir="auto">
        {strings.doneBody}
      </p>
      <Link
        href="/learn/today/go?step=words"
        className="focus-visible:ring-ring mt-2 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-[13.5px] font-bold text-white outline-none focus-visible:ring-2 dark:bg-white dark:text-slate-900"
      >
        <span dir="auto">{strings.toWords}</span>
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </motion.div>
  );
}
