"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, X, Zap } from "lucide-react";

import { PronunciationButton } from "@/components/learning/pronunciation-button";
import { useLocale } from "@/components/providers/locale-provider";
import { easeOut, transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { StoryWordQuizQuestion } from "@/lib/content/story-word-quiz";

type Phase = "choosing" | "feedback" | "reveal";

/** How long the picked answer shows green/red before the wrong ones leave, and how long the right one is then left on its own before the story carries on. */
const FEEDBACK_MS = 650;
const REVEAL_MS = 1100;

const kbdClass =
  "border-border rounded border px-1.5 py-0.5 font-sans text-[11px] font-medium text-foreground/70";

/**
 * The quick "pick the meaning" question a Story asks right after the sentence
 * that holds one of its target words (see buildStoryWordQuiz), shown in place
 * of the typing view until it's answered. One pick settles it, right or wrong:
 * the pick turns green or red, the wrong options then dissolve so only the
 * right meaning is left on screen, and a beat later the lesson carries on by
 * itself (Enter/Space just carries on sooner). `onResult` fires at the pick
 * (the session plays its chime there); `onDone` fires once, at the end.
 *
 * The word is played in the story's own narrator voice — the same
 * "story_vocab_word" clip the words screen uses — and replays on the button
 * or the global Shift shortcut like any other pronunciation.
 */
export function StoryWordQuiz({
  question,
  voiceId,
  number,
  total,
  onResult,
  onDone,
}: {
  question: StoryWordQuizQuestion;
  /** The story's narrator voice (or the site default) — null/undefined falls back to the browser voice. */
  voiceId?: string | null;
  /** 1-based position of this question among all the ones the lesson asks, and how many that is. */
  number: number;
  total: number;
  onResult: (correct: boolean) => void;
  onDone: () => void;
}) {
  const { t, dir } = useLocale();
  const reducedMotion = useReducedMotion() ?? false;
  const promptId = useId();
  const [phase, setPhase] = useState<Phase>("choosing");
  const [picked, setPicked] = useState<number | null>(null);
  // The options list keeps the height it had while four options were showing, so the
  // word above it doesn't jump (the session centers this view) when three of them leave.
  const [listHeight, setListHeight] = useState<number>();
  const listRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);

  // Latest callbacks via refs: the timers below outlive the render that started them.
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const answered = picked !== null;
  const correct = picked === question.answerIndex;

  const choose = useCallback(
    (index: number) => {
      if (phase !== "choosing") return;
      setListHeight(listRef.current?.offsetHeight);
      setPicked(index);
      setPhase("feedback");
      onResultRef.current(index === question.answerIndex);
    },
    [phase, question.answerIndex],
  );

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onDoneRef.current();
  }, []);

  useEffect(() => {
    if (phase === "choosing") return;
    const timer = window.setTimeout(
      phase === "feedback" ? () => setPhase("reveal") : finish,
      phase === "feedback" ? FEEDBACK_MS : REVEAL_MS,
    );
    return () => window.clearTimeout(timer);
  }, [phase, finish]);

  useEffect(() => {
    const optionCount = question.options.length;
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      if (phase === "choosing" && /^[1-9]$/.test(event.key)) {
        const index = Number(event.key) - 1;
        if (index >= optionCount) return;
        event.preventDefault();
        choose(index);
      } else if (phase === "reveal" && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        finish();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, question.options.length, choose, finish]);

  const swap = reducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
      };

  return (
    <motion.section
      initial={reducedMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.smooth}
      className="relative lg:flex lg:h-full lg:flex-col"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold tracking-wide text-[var(--lesson-story-label)]">
          <Zap className="size-4" aria-hidden="true" />
          {t.lesson.wordQuiz.title}
        </h2>
        {total > 1 && (
          <div
            role="img"
            aria-label={t.lesson.wordQuiz.progressAria
              .replace("{n}", String(number))
              .replace("{total}", String(total))}
            className="flex items-center gap-1.5"
          >
            {Array.from({ length: total }, (_, index) => (
              <span
                key={index}
                className={cn(
                  "h-1 w-7 rounded-full transition-colors duration-300",
                  index < number ? "bg-foreground" : "bg-foreground/20",
                )}
              />
            ))}
          </div>
        )}
      </div>

      <div className="lg:flex lg:flex-1 lg:flex-col lg:justify-center">
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex items-center justify-between gap-4">
            <p
              dir="ltr"
              lang="en"
              className="min-w-0 font-serif text-[clamp(2.75rem,1.7rem+3.4vw,4.75rem)] leading-none font-semibold tracking-tight break-words"
            >
              {question.word}
            </p>
            {/* mouse-down is cancelled so a tap here, like on the options, leaves the typing
                input focused and the phone keyboard as it was for the next sentence. */}
            <div className="shrink-0" onMouseDown={(event) => event.preventDefault()}>
              <PronunciationButton
                text={question.word}
                autoPlay
                resetKey={question.id}
                kokoroVoiceId={voiceId}
                contentType="story_vocab_word"
                contentId={question.id}
                variant="outline"
                size="icon"
                className="size-12 rounded-xl"
              />
            </div>
          </div>

          <span id={promptId} className="sr-only">
            {t.lesson.wordQuiz.prompt}
          </span>
          <div className="mt-6 mb-3 flex h-7 items-center" aria-live="polite" dir={dir}>
            <AnimatePresence mode="wait" initial={false}>
              {answered ? (
                <motion.p
                  key="verdict"
                  {...swap}
                  transition={transitions.snappy}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-base font-semibold",
                    correct ? "text-success" : "text-danger",
                  )}
                >
                  {correct ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    <X className="size-4" aria-hidden="true" />
                  )}
                  {correct ? t.lesson.wordQuiz.correct : t.lesson.wordQuiz.wrong}
                </motion.p>
              ) : (
                <motion.p
                  key="prompt"
                  {...swap}
                  transition={transitions.snappy}
                  className="text-muted-foreground text-base"
                  aria-hidden="true"
                >
                  {t.lesson.wordQuiz.prompt}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div
            ref={listRef}
            role="group"
            aria-labelledby={promptId}
            style={{ minHeight: listHeight }}
            className="relative flex flex-col justify-center gap-2.5"
          >
            <AnimatePresence mode="popLayout">
              {question.options.map((text, index) => {
                const isAnswer = index === question.answerIndex;
                // Only the right meaning stays once the wrong ones have had their moment.
                if (phase === "reveal" && !isAnswer) return null;
                const isPicked = picked === index;
                const showsRight = answered && isAnswer;
                const showsWrong = isPicked && !isAnswer;
                const dimmed = answered && !showsRight && !showsWrong;

                return (
                  <motion.div
                    key={index}
                    layout={reducedMotion ? false : "position"}
                    initial={reducedMotion ? false : { opacity: 0, y: 14 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { ...transitions.smooth, delay: 0.08 + index * 0.06 },
                    }}
                    exit={
                      reducedMotion
                        ? { opacity: 0, transition: { duration: 0.15 } }
                        : {
                            opacity: 0,
                            scale: 0.92,
                            filter: "blur(6px)",
                            transition: { duration: 0.38, ease: easeOut, delay: index * 0.04 },
                          }
                    }
                  >
                    <motion.button
                      type="button"
                      onClick={() => choose(index)}
                      // Keeps the typing input focused (see the pronunciation button above).
                      onMouseDown={(event) => event.preventDefault()}
                      aria-keyshortcuts={String(index + 1)}
                      aria-disabled={phase !== "choosing"}
                      animate={
                        reducedMotion
                          ? undefined
                          : showsWrong
                            ? { x: [0, -9, 9, -6, 6, 0] }
                            : showsRight && phase === "reveal"
                              ? { x: 0, scale: [1, 1.03, 1] }
                              : { x: 0, scale: 1 }
                      }
                      transition={{ duration: 0.45, ease: "easeOut" }}
                      className={cn(
                        "group focus-visible:ring-ring focus-visible:ring-offset-background flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-start text-xl font-medium transition-[background-color,border-color,color,box-shadow] duration-300 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:py-4 sm:text-2xl",
                        showsRight &&
                          "border-success bg-success/10 text-success shadow-[0_0_0_4px_color-mix(in_oklch,var(--success)_14%,transparent)]",
                        showsWrong && "border-danger bg-danger/10 text-danger",
                        dimmed && "border-border/50 bg-card/30 text-foreground/40",
                        !answered &&
                          "border-border bg-card/50 hover:bg-card cursor-pointer hover:border-[var(--lesson-primary)]/60 active:scale-[0.99]",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-md border text-xs font-semibold tabular-nums transition-colors duration-300",
                          showsRight || showsWrong
                            ? "border-current/40"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        {index + 1}
                      </span>
                      <span dir={dir} className="min-w-0 flex-1 text-balance">
                        {text}
                      </span>
                      {(showsRight || showsWrong) && (
                        <motion.span
                          aria-hidden="true"
                          initial={reducedMotion ? false : { scale: 0.4, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 420, damping: 22 }}
                          className="shrink-0"
                        >
                          {showsRight ? <Check className="size-5" /> : <X className="size-5" />}
                        </motion.span>
                      )}
                    </motion.button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <p
            aria-hidden="true"
            className="compact-hide text-muted-foreground mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs max-sm:hidden pointer-coarse:hidden"
          >
            <span className="inline-flex items-center gap-1.5">
              <kbd className={kbdClass}>1–{question.options.length}</kbd>
              {t.lesson.wordQuiz.hintChoose}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className={kbdClass}>Shift</kbd>
              {t.lesson.wordQuiz.hintListen}
            </span>
          </p>
        </div>
      </div>
    </motion.section>
  );
}
