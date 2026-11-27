"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Play, X } from "lucide-react";

import { DictationText } from "@/components/learning/dictation-text";
import { LessonSettings } from "@/components/learning/lesson-settings";
import type { PronunciationButtonHandle } from "@/components/learning/pronunciation-button";
import { SharedInputHost, SharedInputProvider } from "@/components/learning/shared-input";
import { ShiftReplayHint } from "@/components/learning/shift-replay-hint";
import { TapToStartOverlay } from "@/components/learning/typing-sentence";
import { useLocale } from "@/components/providers/locale-provider";
import { useTypingSoundSettings } from "@/components/providers/typing-sound-settings-provider";
import { useEnterToContinue } from "@/hooks/use-enter-to-continue";
import { useIsMobileViewport } from "@/hooks/use-is-mobile-viewport";
import { useTypingSound } from "@/hooks/use-typing-sound";
import { resolveSectionSentenceCompleteSound } from "@/lib/admin/typing-sound-settings";
import {
  applyStrictDictationInput,
  dictationView,
  isDictationComplete,
} from "@/lib/features/dictation";
import { todayLocalISODate } from "@/lib/progress/streak";
import { sceneScript } from "@/lib/today/scene";
import type { Scene, ScriptRow } from "@/lib/today/scene";
import { recordSceneLinesAction } from "@/lib/today/scene-actions";
import { sceneStrings } from "@/lib/today/scene-strings";
import type { SceneStrings } from "@/lib/today/scene-strings";
import { cn } from "@/lib/utils";

/** How long a shown word stays up (the same as Dictation's). */
const PEEK_MS = 1500;
/** How long a wrong letter stays on its blank, shaking. */
const REJECTION_MS = 350;
/** A finished line stays lit this long before the next one (Enter skips the wait). */
const NEXT_MS = 900;
const CHIP =
  "border-brand/35 bg-brand/10 text-brand shrink-0 rounded-full border px-[9px] py-0.5 text-[11px] whitespace-nowrap dark:text-[#c9cbff]";

interface Rejection {
  word: number;
  letter: number;
  char: string;
  nonce: number;
}

/**
 * The second step of the day's scene (permission dailyScene): the passage's script with some lines
 * missing. Each missing line is heard in the passage's own voice and typed letter by letter onto its
 * blanks (Dictation's own engine, so it grades the same way); the rest of the line and the lines
 * around it stay in view. Every finished line goes back into place and the scene's word in it lights
 * up in the side list. After the last one the day's second task is recorded and the way on is the
 * words.
 */
export function SceneLines({ scene, title }: { scene: Scene; title: string }) {
  const { locale, t } = useLocale();
  const strings = sceneStrings(locale);
  const reducedMotion = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [lineDone, setLineDone] = useState(false);
  const [peekWord, setPeekWord] = useState<number | null>(null);
  const [rejection, setRejection] = useState<Rejection | null>(null);
  /** Lines in a row written with no word shown. */
  const [noHelp, setNoHelp] = useState(0);
  const helpedRef = useRef(false);
  const totalsRef = useRef({ clean: 0, mistakes: 0 });
  const nonceRef = useRef(0);
  const timersRef = useRef<{ peek?: number; rejection?: number }>({});
  const recordedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<PronunciationButtonHandle>(null);
  const currentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobileViewport();
  const [tapped, setTapped] = useState(false);
  // The server draws no tap gate: it appears only after the first client render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const hasStarted = mounted && (!isMobile || tapped);

  const total = scene.steps.length;
  const step = scene.steps[index];
  const allDone = index >= total;

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
    setValue("");
    setLineDone(false);
    setPeekWord(null);
    setRejection(null);
    setIndex((current) => (current === from ? current + 1 : current));
  }, []);

  useEnterToContinue(lineDone, () => advance(index));
  // A finished line stays lit a moment, then the next one comes.
  useEffect(() => {
    if (!lineDone) return;
    const timer = window.setTimeout(() => advance(index), NEXT_MS);
    return () => window.clearTimeout(timer);
  }, [lineDone, index, advance]);

  // The keyboard goes to the line being typed, and stays there from line to line.
  useEffect(() => {
    if (hasStarted && !allDone) inputRef.current?.focus();
  }, [hasStarted, index, allDone]);

  // Typing wins the keyboard whatever was clicked last (replay, speed, the word list).
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

  useEffect(() => {
    currentRef.current?.scrollIntoView({
      block: "nearest",
      behavior: reducedMotion ? "auto" : "smooth",
    });
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

  const view = step ? dictationView(step.typed, value) : null;

  function finishLine() {
    setLineDone(true);
    setPeekWord(null);
    setRejection(null);
    playSentenceComplete(resolveSectionSentenceCompleteSound(soundSettings, "stories"));
    if (helpedRef.current) {
      setNoHelp(0);
    } else {
      totalsRef.current.clean += 1;
      setNoHelp((count) => count + 1);
    }
  }

  function handleChange(next: string) {
    if (!step || lineDone) return;
    const result = applyStrictDictationInput(step.typed, value, next);
    if (result.value !== value) {
      if (result.value.length > value.length) {
        play("letter");
        setPeekWord(null);
      }
      setValue(result.value);
    }
    if (result.rejected !== null && result.at) {
      totalsRef.current.mistakes += 1;
      nonceRef.current += 1;
      setRejection({ ...result.at, char: result.rejected, nonce: nonceRef.current });
      window.clearTimeout(timersRef.current.rejection);
      timersRef.current.rejection = window.setTimeout(() => setRejection(null), REJECTION_MS);
      play("error");
    }
    if (isDictationComplete(step.typed, result.value)) finishLine();
  }

  function replay() {
    settingsRef.current?.replay();
    inputRef.current?.focus();
  }

  function showWord() {
    const word = view?.cursor?.word;
    if (word === undefined || lineDone) return;
    helpedRef.current = true;
    setNoHelp(0);
    setPeekWord(word);
    window.clearTimeout(timersRef.current.peek);
    timersRef.current.peek = window.setTimeout(() => setPeekWord(null), PEEK_MS);
    inputRef.current?.focus();
  }

  const rows = sceneScript(scene, allDone ? total : index);

  return (
    <SharedInputProvider>
      <div className="h-app relative flex w-full flex-col">
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
        <div className="mx-auto flex min-h-0 w-full max-w-[900px] flex-1 flex-col px-4 pt-3 pb-4 md:px-5 md:pt-3.5 md:pb-5">
          <header className="mb-2 flex items-center gap-2.5" dir="ltr">
            <Link
              href="/learn"
              aria-label={strings.exit}
              className="text-muted-foreground hover:text-foreground grid size-8 shrink-0 place-items-center rounded-lg"
            >
              <X className="size-5" aria-hidden="true" />
            </Link>
            <span className="flex min-w-0 flex-1 flex-col leading-[1.4]">
              <small className="text-muted-foreground text-left text-[11px]" dir="auto">
                {strings.position(Math.min(index + 1, total), total)}
              </small>
              <b className="truncate text-[13.5px]">{title}</b>
            </span>
            {noHelp > 0 && !allDone && (
              <span className={cn(CHIP, "max-sm:hidden")} dir="auto">
                {strings.noHelp(noHelp)}
              </span>
            )}
            {step && (
              <LessonSettings
                ref={settingsRef}
                text={step.line.en}
                audioUrl={step.line.audioUrl}
                autoPlay={hasStarted}
                resetKey={step.line.id}
                inputRef={inputRef}
                contentType="sentence"
                contentId={step.line.id}
                noBrowserVoice
                // The line has its own play button and the foot its replay.
                touchReplay={false}
              />
            )}
          </header>

          <div className="flex gap-[5px]" aria-hidden="true" dir="ltr">
            {scene.steps.map((entry, position) => (
              <i
                key={entry.line.id}
                className={cn(
                  "h-1 flex-1 rounded-[3px]",
                  position < index || (position === index && lineDone)
                    ? "bg-brand"
                    : position === index
                      ? "bg-brand/45"
                      : "bg-foreground/12",
                )}
              />
            ))}
          </div>
          {/* On a phone the chip has no room beside the title: it sits under the progress line. */}
          <div className="mb-3.5 flex min-h-3.5 justify-end sm:min-h-0" dir="ltr">
            {noHelp > 0 && !allDone && (
              <span className={cn(CHIP, "mt-2 sm:hidden")} dir="auto">
                {strings.noHelp(noHelp)}
              </span>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-[22px] md:flex-row">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              {allDone ? (
                <SceneDone strings={strings} reducedMotion={reducedMotion} />
              ) : (
                <div className="flex min-h-0 flex-1 flex-col gap-[9px] overflow-y-auto md:gap-[11px]">
                  {rows.map((row, position) =>
                    row.kind === "current" ? (
                      <div
                        key={`current-${row.step.line.id}`}
                        ref={currentRef}
                        className={cn(
                          // The blanks at this small size need the stronger pending colour.
                          "flex shrink-0 items-start gap-2.5 rounded-[14px] border p-3 transition-colors [--lesson-letter-pending:color-mix(in_oklch,var(--muted-foreground)_72%,transparent)]",
                          lineDone
                            ? "border-success/40 bg-success/10"
                            : "border-brand/35 bg-brand/10",
                        )}
                        dir="ltr"
                      >
                        <button
                          type="button"
                          aria-label={strings.playLine}
                          title={strings.playLine}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={replay}
                          className="focus-visible:ring-ring grid size-[38px] shrink-0 place-items-center rounded-full outline-none focus-visible:ring-2"
                          style={{
                            background:
                              "radial-gradient(circle at 32% 26%, #6c94ff, #3058dc 58%, #2241b0)",
                          }}
                        >
                          <Play className="size-[18px] fill-white text-white" aria-hidden="true" />
                        </button>
                        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-[9px] gap-y-1.5 pt-1.5 text-[15px] leading-[1.7]">
                          {row.step.line.speaker && <Speaker name={row.step.line.speaker} />}
                          {row.step.before.trim() && (
                            <span className="text-muted-foreground" lang="en">
                              {row.step.before.trim()}
                            </span>
                          )}
                          {view && (
                            <div className="max-w-full min-w-0 [&_[data-dictation-word]]:whitespace-nowrap">
                              <DictationText
                                key={row.step.line.id}
                                view={view}
                                value={value}
                                inputRef={inputRef}
                                onChange={handleChange}
                                onEnter={() => lineDone && advance(index)}
                                ariaLabel={strings.typeLine}
                                showBlanks
                                reducedMotion={reducedMotion}
                                textClassName="text-[15px] leading-[1.7] font-normal tracking-normal sm:leading-[1.7] [&>span[aria-hidden=true]]:min-w-[0.6em]"
                                rejection={rejection}
                                peekWord={peekWord}
                                finished={lineDone}
                              />
                            </div>
                          )}
                          {row.step.after.trim() && (
                            <span className="text-muted-foreground" lang="en">
                              {row.step.after.trim()}
                            </span>
                          )}
                        </div>
                        <span className="sr-only" role="status">
                          {rejection ? strings.wrongLetter : ""}
                        </span>
                      </div>
                    ) : (
                      <ScriptLine key={`${row.kind}-${position}`} row={row} />
                    ),
                  )}
                </div>
              )}
              {!allDone && (
                <div className="mt-3.5 flex gap-2">
                  <FootButton onClick={replay} label={strings.replay} />
                  <FootButton onClick={showWord} label={strings.showWord} disabled={lineDone} />
                </div>
              )}
            </div>
            <SceneWordList scene={scene} index={allDone ? total : index} strings={strings} />
          </div>
        </div>
      </div>
    </SharedInputProvider>
  );
}

function Speaker({ name }: { name: string }) {
  return (
    <em className="text-muted-foreground text-[11.5px] not-italic" lang="en">
      {name}
    </em>
  );
}

/** Every line of the script but the one being typed. */
function ScriptLine({ row }: { row: Exclude<ScriptRow, { kind: "current" }> }) {
  if (row.kind === "done") {
    return (
      <p
        className="text-foreground/95 shrink-0 px-0.5 text-sm leading-[1.55] md:text-[15px]"
        dir="ltr"
        lang="en"
      >
        {row.step.line.speaker && (
          <>
            <Speaker name={row.step.line.speaker} />{" "}
          </>
        )}
        {row.step.line.en}{" "}
        <Check
          aria-hidden="true"
          className="text-success inline size-3.5 align-[-2px]"
          strokeWidth={2.6}
        />
      </p>
    );
  }
  if (row.kind === "context") {
    return <ContextLine line={row.line} />;
  }
  if (row.kind === "gap") {
    // A wide screen shows the line before the next one; a phone just marks that lines were left out.
    return (
      <>
        <p
          className={cn(
            "text-muted-foreground/70 shrink-0 px-0.5 text-[13px]",
            row.context && "md:hidden",
          )}
        >
          …
        </p>
        {row.context && <ContextLine line={row.context} className="hidden md:block" />}
      </>
    );
  }
  return (
    <p className="flex shrink-0 flex-col gap-[7px] px-0.5 pt-[3px]" aria-hidden="true">
      <span className="bg-foreground/8 block h-2 w-[92%] rounded-md" />
      <span className="bg-foreground/8 block h-2 w-[48%] rounded-md md:hidden" />
    </p>
  );
}

function ContextLine({
  line,
  className,
}: {
  line: { speaker: string | null; en: string };
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-muted-foreground/70 shrink-0 px-0.5 text-[13px] leading-[1.55] md:text-[15px]",
        className,
      )}
      dir="ltr"
      lang="en"
    >
      {line.speaker && (
        <>
          <Speaker name={line.speaker} />{" "}
        </>
      )}
      {line.en}
    </p>
  );
}

function FootButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className="border-foreground/15 text-foreground/80 hover:bg-foreground/5 focus-visible:ring-ring flex-1 rounded-[10px] border px-2 py-2 text-[12.5px] transition-colors outline-none focus-visible:ring-2 disabled:opacity-50"
    >
      <span dir="auto">{label}</span>
    </button>
  );
}

/** On a wide screen: the scene's words, lighting up as their lines are written. */
function SceneWordList({
  scene,
  index,
  strings,
}: {
  scene: Scene;
  index: number;
  strings: SceneStrings;
}) {
  return (
    <aside className="border-foreground/10 bg-card hidden w-[200px] shrink-0 self-start rounded-[14px] border p-3 md:block dark:bg-[#0c0c0f]">
      <h5 className="mb-2 text-[13px] font-semibold" dir="auto">
        {strings.sideTitle}
      </h5>
      <ul className="flex flex-col gap-1.5">
        {scene.steps.flatMap((entry, position) =>
          entry.words.map((word) => (
            <li
              key={word.id}
              className={cn(
                "flex items-center gap-2 rounded-[10px] border px-2.5 py-1.5 text-[13px]",
                position < index
                  ? "border-success/40 bg-success/10 text-foreground"
                  : position === index
                    ? "border-brand/60 bg-brand/16 text-foreground"
                    : "border-foreground/12 text-muted-foreground",
              )}
              dir="ltr"
            >
              {position < index && (
                <Check
                  className="text-success size-3.5 shrink-0"
                  strokeWidth={2.6}
                  aria-hidden="true"
                />
              )}
              <span lang="en">{word.word}</span>
            </li>
          )),
        )}
      </ul>
      <p
        className="text-muted-foreground mt-2.5 text-[11.5px] leading-[1.55] dark:text-[#a3a6d6]"
        dir="auto"
      >
        {strings.sideHint}
      </p>
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
      className="flex flex-1 flex-col items-center justify-center gap-2.5 text-center"
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
