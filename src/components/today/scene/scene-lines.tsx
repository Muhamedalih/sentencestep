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
  type RefObject,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Eye, Gauge, RotateCcw, X } from "lucide-react";

import { CurrentWordLabel } from "@/components/learning/current-word-label";
import {
  PronunciationButton,
  type PronunciationButtonHandle,
  type PronunciationStatus,
} from "@/components/learning/pronunciation-button";
import { SharedInputHost, SharedInputProvider } from "@/components/learning/shared-input";
import { ShiftReplayHint } from "@/components/learning/shift-replay-hint";
import { TapToStartOverlay } from "@/components/learning/typing-sentence";
import { TypingStats } from "@/components/learning/typing-stats";
import { TypingText } from "@/components/learning/typing-text";
import { useLessonFontSettings } from "@/components/providers/lesson-font-settings-provider";
import { useLocale } from "@/components/providers/locale-provider";
import {
  PRONUNCIATION_SPEED_STEPS,
  usePronunciationSettings,
} from "@/components/providers/pronunciation-settings-provider";
import { useTypingSoundSettings } from "@/components/providers/typing-sound-settings-provider";
import { useAudioClip } from "@/hooks/use-audio-clip";
import { useIsMobileViewport } from "@/hooks/use-is-mobile-viewport";
import { useTypingEngine } from "@/hooks/use-typing-engine";
import { useTypingSound } from "@/hooks/use-typing-sound";
import { resolveSectionFontFamily } from "@/lib/admin/lesson-font-settings";
import { resolveSectionSentenceCompleteSound } from "@/lib/admin/typing-sound-settings";
import { foldsDiacritics, languageOfContentId } from "@/lib/learn-language";
import { isTrackableWord, normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { episodeOf, seriesLabels, type EpisodeInfo } from "@/lib/passages/series";
import { todayLocalISODate } from "@/lib/progress/streak";
import {
  bareWord,
  givenRanges,
  nameWordIndexes,
  passageNames,
  stageRows,
  targetWordIndexes,
  typedWords,
} from "@/lib/today/scene";
import type { Scene, SceneStep, StageRow } from "@/lib/today/scene";
import { makeSceneWordClipAction, recordSceneLinesAction } from "@/lib/today/scene-actions";
import { sceneStrings } from "@/lib/today/scene-strings";
import type { SceneStrings } from "@/lib/today/scene-strings";
import { locateWordAtCharIndex } from "@/lib/typing";
import { cn } from "@/lib/utils";
import { termOf } from "@/lib/word-ladder/options";

/** The same light buzz a lesson's keys give. */
function vibrateLightly(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(10);
}

/** The slide from one line to the next: the typing cursor waits for it to end. */
const SLIDE_MS = 750;

/** The size of every line but the current one, whose own is set in CSS (px, wide screen / phone). */
const SIZES = {
  wide: { prev: 22, old: 15, next: 22, far: 18, gap: 36, anchor: 76, firstAnchor: 12 },
  phone: { prev: 17, old: 12, next: 17, far: 15, gap: 22, anchor: 64, firstAnchor: 8 },
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
const TARGET_TEXT = "text-[#3d46c9] dark:text-[#a9adff]";
/** On the line being typed the colours go through the letters' own variables (see TypingText). */
const NAME_WORD =
  "[--lesson-letter-correct:#5a66a8] [--lesson-letter-pending:#5a66a8] dark:[--lesson-letter-correct:#7d87b8] dark:[--lesson-letter-pending:#7d87b8]";
const TARGET_WORD =
  "[--lesson-letter-correct:#3d46c9] [--lesson-letter-pending:#9aa0e8] dark:[--lesson-letter-correct:#a9adff] dark:[--lesson-letter-pending:#555a9c]";

/**
 * The second step of the day's scene (permission dailyScene): a stage. The line to be typed stands in
 * the middle, large; the line before it shrinks and fades above it, the one before that almost
 * vanishes, and the next one waits faintly below. The line itself is typed exactly as a Stories
 * sentence is (the same text, engine, underlines, sounds, translation and numbers); only the names are
 * written already and the day's words have their own colour. A wrong letter says that one word. The
 * scene's words stand beside it with their meanings, the current one level with its sentence. After
 * the last line the day's second task is recorded and the way on is the words.
 */
export function SceneLines({
  scene,
  title,
  passageId,
  wordClips,
}: {
  scene: Scene;
  title: string;
  passageId: string;
  /** word (normalized) -> its recorded clip. */
  wordClips: Record<string, string>;
}) {
  const { locale, t } = useLocale();
  const strings = sceneStrings(locale);
  const reducedMotion = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);
  const [settledIndex, setSettledIndex] = useState<number | null>(null);
  /** The sentence is written out, to be typed over. Every new line starts hidden. */
  const [shown, setShown] = useState(false);
  const [audio, setAudio] = useState<PronunciationStatus>({
    supported: true,
    loading: false,
    playing: false,
  });
  const totalsRef = useRef({ clean: 0, mistakes: 0 });
  const lineMistakesRef = useRef(0);
  const recordedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<PronunciationButtonHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
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

  const soundSettings = useTypingSoundSettings();
  const { play, playSentenceComplete } = useTypingSound({
    pack: soundSettings.soundPack,
    enabled: soundSettings.enabled,
    volume: soundSettings.volume,
    sentenceCompleteSound: soundSettings.sentenceCompleteSound,
  });

  // One word, from a recording: the line's narration stops for it.
  const wordClip = useAudioClip(undefined, { shared: true });
  const madeRef = useRef<Record<string, string>>({});
  const askedRef = useRef(0);
  const lastWordRef = useRef<string | null>(null);
  const sayWord = useCallback(
    async (word: string) => {
      if (!isTrackableWord(word)) return;
      const key = normalizeMistakeWord(word);
      // A word already being said is left to finish.
      if (lastWordRef.current === key && wordClip.status === "playing") return;
      lastWordRef.current = key;
      const request = ++askedRef.current;
      audioRef.current?.stop();
      let url = wordClips[key] ?? madeRef.current[key] ?? null;
      if (!url) {
        url = await makeSceneWordClipAction(key).catch(() => null);
        if (url) madeRef.current[key] = url;
      }
      if (url && request === askedRef.current) wordClip.play(url);
    },
    [wordClips, wordClip],
  );

  // The cursor is measured on screen, so it appears once the line has arrived.
  useEffect(() => {
    const timer = window.setTimeout(() => setSettledIndex(index), reducedMotion ? 0 : SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [index, reducedMotion]);

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

  /** Puts the lines where they belong (the CSS slides them there) and the current word beside its sentence. */
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
    // High on the screen, and higher still with no line above; always in view above a phone keyboard.
    const wanted = items.some((item) => item.distance < 0) ? sizes.anchor : sizes.firstAnchor;
    const anchor = Math.max(8, Math.min(wanted, stage.clientHeight - currentHeight - 16));
    const tops: number[] = [];
    tops[current] = anchor;
    for (let i = current - 1, y: number = anchor; i >= 0; i--) {
      y -= heights[i]! + sizes.gap / (i === current - 1 ? 1 : 2.5);
      tops[i] = y;
    }
    for (let i = current + 1, y = anchor + currentHeight + sizes.gap; i < items.length; i++) {
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

    // The word's card is always centred on the middle of the sentence being typed.
    const rail = railRef.current;
    const sentence = items[current]!.node.querySelector<HTMLElement>("[data-scene-sentence]");
    const cards = rail?.querySelectorAll<HTMLElement>("[data-current-card]");
    if (!rail || !sentence || !cards || cards.length === 0) return;
    const first = cards[0]!;
    const last = cards[cards.length - 1]!;
    const sentenceMiddle = anchor + sentence.offsetTop + sentence.offsetHeight / 2;
    const cardsMiddle = (first.offsetTop + last.offsetTop + last.offsetHeight) / 2;
    rail.style.transform = `translateY(${sentenceMiddle - cardsMiddle}px)`;
  }, []);

  useLayoutEffect(() => {
    arrange();
  });
  // The line's own height changes while it is typed (a wrap, the word's label), without a render here.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(arrange);
    observer.observe(stage);
    const current = stage.querySelector("[data-stage-line][data-distance='0']");
    if (current) observer.observe(current);
    document.fonts?.ready?.then(arrange).catch(() => {});
    return () => observer.disconnect();
  }, [arrange, allDone, index]);

  function finishLine() {
    playSentenceComplete(resolveSectionSentenceCompleteSound(soundSettings, "stories"));
    if (lineMistakesRef.current === 0) totalsRef.current.clean += 1;
    lineMistakesRef.current = 0;
    setShown(false);
    setIndex((current) => current + 1);
  }

  function toggleSentence() {
    setShown((current) => !current);
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
  const words = scene.steps.flatMap((entry, position) =>
    entry.words.map((word) => ({
      word,
      current: !allDone && position === index,
      done: position < index,
    })),
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
                position < index
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
                    {shown ? entry.word.word : blanks(entry.word.word)}
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
            <div className="flex min-h-0 flex-1 overflow-y-auto">
              <SceneDone
                strings={strings}
                reducedMotion={reducedMotion}
                episode={episodeOf(passageId, locale)}
                nextLabel={seriesLabels(locale).next}
              />
            </div>
          ) : (
            <div
              ref={stageRef}
              onClick={() => inputRef.current?.focus()}
              className="relative max-w-[900px] min-w-0 flex-1 overflow-hidden text-[length:clamp(29px,3.75vw,48px)]"
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
                      <span className="mb-1 block font-sans text-[15px] font-semibold tracking-[.02em] text-[#6b6f80] dark:text-[#8f93a5]">
                        {row.line.speaker}
                      </span>
                    )}
                    {row.role === "current" && row.step ? (
                      <CurrentLine
                        step={row.step}
                        names={names}
                        inputRef={inputRef}
                        hasStarted={hasStarted}
                        settled={settledIndex === index}
                        shown={shown}
                        reducedMotion={reducedMotion}
                        onCorrect={() => {
                          play("letter");
                          vibrateLightly();
                        }}
                        onWrong={(word) => {
                          totalsRef.current.mistakes += 1;
                          lineMistakesRef.current += 1;
                          play("error");
                          vibrateLightly();
                          if (word) void sayWord(word);
                        }}
                        onWordClick={(word) => {
                          lastWordRef.current = null;
                          void sayWord(word);
                        }}
                        onComplete={finishLine}
                      />
                    ) : (
                      <StageText row={row} names={names} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {!allDone && (
            <SceneWordRail words={words} shown={shown} strings={strings} railRef={railRef} />
          )}
        </div>
      </div>
    </SharedInputProvider>
  );
}

/**
 * The line being typed, drawn as TypingSentence draws a Stories sentence: the word's meaning above
 * (for the day's words, the ones with a written meaning), the sentence with its moving underlines,
 * the translation and the live numbers below. Its letters are hidden until typed, unless the
 * learner asks to see the sentence; names and punctuation are always written.
 */
function CurrentLine({
  step,
  names,
  inputRef,
  hasStarted,
  settled,
  shown,
  reducedMotion,
  onCorrect,
  onWrong,
  onWordClick,
  onComplete,
}: {
  step: SceneStep;
  names: ReadonlySet<string>;
  inputRef: RefObject<HTMLInputElement | null>;
  hasStarted: boolean;
  /** The line has finished sliding in. */
  settled: boolean;
  shown: boolean;
  reducedMotion: boolean;
  onCorrect: () => void;
  onWrong: (word: string | null) => void;
  onWordClick: (word: string) => void;
  onComplete: () => void;
}) {
  const { dir } = useLocale();
  const font = resolveSectionFontFamily(useLessonFontSettings(), "stories");
  const targets = useMemo(() => targetWordIndexes(step.typed, step.words), [step]);
  const given = useMemo(() => {
    const found = [...nameWordIndexes(step.typed, names)].filter((word) => !targets.has(word));
    // A line made only of names is typed whole: there would be nothing to do.
    return new Set(found.length < typedWords(step.typed).length ? found : []);
  }, [step, names, targets]);
  const ranges = useMemo(() => givenRanges(step.typed, given), [step, given]);

  // Where the cursor stands now, for the wrong-letter callback.
  const positionRef = useRef(0);
  const engine = useTypingEngine({
    target: step.typed,
    resetKey: step.line.id,
    inputRef,
    autoFocus: hasStarted,
    givenRanges: ranges,
    foldDiacritics: foldsDiacritics(languageOfContentId(step.line.id)),
    onComplete,
    onCorrectChar: onCorrect,
    onErrorChar: () =>
      onWrong(locateWordAtCharIndex(step.typed, positionRef.current)?.word ?? null),
  });
  positionRef.current = engine.typed.length;

  // A new array when the line arrives or is shown, so the underline is measured again where it now stands.
  const letterStates = useMemo(
    () => (settled || shown ? [...engine.letterStates] : engine.letterStates),
    [engine.letterStates, settled, shown],
  );

  const currentIndex =
    typedWords(step.typed).findLast((word) => word.start <= engine.typed.length)?.index ?? 0;
  const labelled = targets.has(currentIndex)
    ? step.words.find(
        (word) =>
          normalizeMistakeWord(word.word) ===
          bareWord(typedWords(step.typed)[currentIndex]!.text).toLowerCase(),
      )
    : undefined;

  return (
    <div>
      {step.before.trim() && (
        <p className="text-muted-foreground mb-3 text-[clamp(16px,2vw,24px)] leading-[1.7] dark:text-[#6f7382] [html[data-keyboard]_&]:hidden">
          {step.before.trim()}
        </p>
      )}
      <div className="mb-1 min-h-9 font-sans sm:min-h-[52px] [html[data-keyboard]_&]:hidden">
        <CurrentWordLabel
          word={
            labelled ? { en: shown ? labelled.word : "", text: termOf(labelled.hintAr) } : undefined
          }
          dir={dir}
        />
      </div>
      <div data-scene-sentence="" className={cn(!settled && "[--lesson-underline:transparent]")}>
        <TypingText
          target={step.typed}
          typed={engine.typed}
          letterStates={letterStates}
          inputRef={engine.inputRef}
          onChange={engine.handleChange}
          onPaste={engine.handlePaste}
          reducedMotion={reducedMotion}
          obscureUntyped={!shown}
          writtenWords={given}
          errorChar={engine.errorChar}
          textClassName="font-serif max-sm:text-[2rem] text-[clamp(3rem,1.4rem+4.5vw,7rem)] lg:text-[68px] lesson-sentence max-md:[html[data-keyboard]_&]:text-[24px]"
          textStyle={font ? { fontFamily: font } : undefined}
          onWordClick={settled ? onWordClick : undefined}
          wordClassName={(word) =>
            targets.has(word) ? TARGET_WORD : given.has(word) ? NAME_WORD : undefined
          }
          autoFocus={hasStarted}
        />
      </div>
      {step.after.trim() && (
        <p className="text-muted-foreground mt-3 text-[clamp(16px,2vw,24px)] leading-[1.7] dark:text-[#6f7382] [html[data-keyboard]_&]:hidden">
          {step.after.trim()}
        </p>
      )}
      <p
        className="mt-4 font-sans text-xl font-normal text-[var(--lesson-subtitle)] select-none sm:text-2xl [html[data-keyboard]_&]:text-base"
        dir={dir}
      >
        {step.line.ar}
      </p>
      <div className="compact-hide font-sans text-base font-normal">
        <TypingStats wpm={engine.wpm} accuracy={engine.accuracy} centered />
      </div>
    </div>
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

/**
 * On a wide screen: the scene's words with their meanings; the current one large, each written one
 * ticked. The whole list is moved so the current card is centred on its sentence (see arrange).
 */
function SceneWordRail({
  words,
  shown,
  strings,
  railRef,
}: {
  words: {
    word: { id: string; word: string; hintAr: string };
    current: boolean;
    done: boolean;
  }[];
  /** The current line is written out, so its word may be too. */
  shown: boolean;
  strings: SceneStrings;
  railRef: RefObject<HTMLDivElement | null>;
}) {
  const { dir } = useLocale();
  return (
    <aside className="relative ml-auto hidden w-[220px] shrink-0 overflow-hidden px-2.5 md:block lg:w-[270px]">
      <div
        ref={railRef}
        className="absolute inset-x-2.5 top-0 flex flex-col gap-2.5 [transition:transform_.7s_cubic-bezier(.22,.8,.2,1)] motion-reduce:[transition:none]"
      >
        <h5 className="text-muted-foreground text-sm font-semibold" dir={dir}>
          {strings.sideTitle}
        </h5>
        <ul className="contents">
          {words.map(({ word, current, done }) => {
            const english = done || (current && shown) ? word.word : blanks(word.word);
            return (
              <li
                key={word.id}
                data-current-card={current ? "" : undefined}
                className={cn(
                  "flex flex-col gap-0.5 rounded-[14px] border",
                  current
                    ? "border-brand/70 bg-brand/14 px-4 py-[18px]"
                    : "bg-card px-3.5 py-[9px] dark:bg-[#0c0c0f]",
                  !current &&
                    (done ? "border-success/35 opacity-[.62]" : "border-foreground/9 opacity-45"),
                )}
              >
                <span
                  className={cn(
                    "overflow-hidden font-semibold tracking-[.02em] whitespace-nowrap",
                    current ? "text-[30px] leading-[1.3]" : "text-[15px]",
                    done && "text-[#1f7a4d] dark:text-[#bfeccf]",
                  )}
                  // The blanks of a long word are drawn smaller so they all fit.
                  style={
                    current && !shown && word.word.length > 8
                      ? { fontSize: 250 / word.word.length }
                      : undefined
                  }
                  lang="en"
                >
                  {done ? "✓ " : ""}
                  {english}
                </span>
                <span
                  className={cn(
                    current
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
      </div>
    </aside>
  );
}

/** After the last line: one calm mark and one button to the words. */
function SceneDone({
  strings,
  reducedMotion,
  episode,
  nextLabel,
}: {
  strings: SceneStrings;
  reducedMotion: boolean;
  /** A series episode ends on the question the next one answers. */
  episode: EpisodeInfo | null;
  nextLabel: string;
}) {
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="m-auto flex w-full max-w-[460px] flex-col items-center py-4 text-center"
    >
      <span className="border-success/40 bg-success/15 text-success grid size-[84px] place-items-center rounded-full border">
        <Check className="size-11" strokeWidth={2.4} aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-[28px] leading-snug font-bold md:text-[34px]" dir="auto">
        {strings.doneTitle}
      </h1>
      <p className="text-muted-foreground mt-2 text-[17px] md:text-[19px]" dir="auto">
        {strings.doneBody}
      </p>
      {episode && (
        <div className="border-primary/25 bg-primary/10 mt-8 w-full rounded-2xl border px-6 py-5">
          <span className="text-muted-foreground block text-[15px]" dir="auto">
            {nextLabel}
          </span>
          <b className="mt-2 block text-[20px] leading-relaxed md:text-[22px]" dir="auto">
            {episode.next}
          </b>
        </div>
      )}
      <Link
        href="/learn/today/go?step=words"
        className={cn(
          "focus-visible:ring-ring inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-slate-900 text-[18px] font-bold text-white outline-none focus-visible:ring-2 dark:bg-white dark:text-slate-900",
          episode ? "mt-4" : "mt-8",
        )}
      >
        <span dir="auto">{strings.toWords}</span>
        <ArrowRight className="size-5" aria-hidden="true" />
      </Link>
    </motion.div>
  );
}
