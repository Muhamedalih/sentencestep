"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, Check, EyeOff, X } from "lucide-react";

import { PassageButton } from "@/components/passages/passage-button";
import { useLocale } from "@/components/providers/locale-provider";
import { useEnterToContinue } from "@/hooks/use-enter-to-continue";
import type { PassageQuestion } from "@/lib/passages/types";
import { cn } from "@/lib/utils";

export interface PassageAnswer {
  picked: number;
  correct: boolean;
}

/**
 * The quick check, shown only once the learner has finished reading the part:
 * it rises from the bottom of the screen as a card (a spring, not a fade), the
 * prompt and then each choice slide in one after another, the right answer
 * fills with green from the left while a wrong pick shakes and turns red, and
 * the "next" button arrives last. The text stays visible above the card —
 * stepped back, with the sentence that holds the answer lit after a miss — so a
 * wrong answer teaches where to look. Keys 1-4 choose, Enter moves on.
 */
export function PassageQuestionDock({
  question,
  questionNumber,
  questionTotal,
  answer,
  showTranslation,
  nextLabel,
  onAnswer,
  onNext,
}: {
  question: PassageQuestion;
  questionNumber: number;
  questionTotal: number;
  answer: PassageAnswer | undefined;
  showTranslation: boolean;
  /** "Next part", "Finish" or "Next question" — decided by where this question sits. */
  nextLabel: string;
  onAnswer: (picked: number) => void;
  onNext: () => void;
}) {
  const { t, dir } = useLocale();
  const reduced = useReducedMotion();
  const cardRef = useRef<HTMLElement | null>(null);

  // The card takes focus as it arrives, so a keyboard or screen-reader user lands on the question.
  useEffect(() => {
    cardRef.current?.focus({ preventScroll: true });
  }, []);

  // Keys 1-4 choose while the question is open…
  useEffect(() => {
    if (answer) return;
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const number = Number(event.key);
      if (Number.isInteger(number) && number >= 1 && number <= question.options.length) {
        event.preventDefault();
        onAnswer(number - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, onAnswer, question.options.length]);

  // …and, once it is answered, Enter moves on (the same hook the other check-and-continue screens use).
  useEnterToContinue(Boolean(answer), onNext);

  const cardVariants: Variants = reduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { y: 150, opacity: 0, scale: 0.97 },
        visible: {
          y: 0,
          opacity: 1,
          scale: 1,
          transition: {
            type: "spring",
            stiffness: 250,
            damping: 27,
            mass: 0.9,
            when: "beforeChildren",
            staggerChildren: 0.07,
            delayChildren: 0.05,
          },
        },
      };

  const itemVariants: Variants = reduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 380, damping: 30 } },
      };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
      {/* A soft fade behind the card, so the card reads as lifted off the page. */}
      <motion.div
        aria-hidden="true"
        className="from-background via-background/85 absolute inset-x-0 bottom-0 h-[26rem] bg-gradient-to-t to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      />
      <motion.section
        id="passage-dock"
        ref={cardRef}
        tabIndex={-1}
        role="region"
        aria-label={t.passages.quickCheck}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="border-border bg-card pointer-events-auto relative mx-auto w-full max-w-2xl rounded-t-[1.75rem] border border-b-0 px-5 pt-5 pb-6 shadow-[0_-30px_90px_-30px_rgba(0,0,0,0.55)] outline-none sm:mb-6 sm:rounded-3xl sm:border-b sm:px-7 sm:pt-6"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-between gap-3">
          <span className="bg-foreground text-background rounded-md px-2 py-1 text-[0.68rem] font-bold tracking-[0.12em] uppercase">
            {t.passages.quickCheck}
          </span>
          {questionTotal > 1 && (
            <span className="text-muted-foreground text-xs tabular-nums">
              <bdi>
                {t.passages.questionOf
                  .replace("{n}", String(questionNumber))
                  .replace("{total}", String(questionTotal))}
              </bdi>
            </span>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="mt-3">
          <h2 className="text-xl leading-snug font-semibold sm:text-[1.4rem]" dir="ltr" lang="en">
            {question.prompt}
          </h2>
          {showTranslation && (
            <p className="text-muted-foreground mt-1 text-base" dir="rtl" lang="ar">
              {question.promptAr}
            </p>
          )}
        </motion.div>

        <div className="mt-4 flex flex-col gap-2.5" role="group" aria-label={question.prompt}>
          {question.options.map((option, index) => {
            const picked = answer?.picked === index;
            const right = index === question.answer;
            const showRight = Boolean(answer) && right;
            const showWrong = Boolean(answer) && picked && !right;
            return (
              <motion.div key={index} variants={itemVariants}>
                <motion.button
                  type="button"
                  disabled={Boolean(answer)}
                  onClick={() => onAnswer(index)}
                  whileTap={answer ? undefined : { scale: 0.985 }}
                  animate={showWrong && !reduced ? { x: [0, -9, 9, -6, 6, 0] } : { x: 0 }}
                  transition={{ duration: 0.45 }}
                  className={cn(
                    "relative isolate flex w-full items-center gap-3.5 overflow-hidden rounded-2xl border px-4 py-3 text-start text-base transition-colors duration-200 outline-none sm:text-lg",
                    "focus-visible:ring-ring focus-visible:ring-2",
                    !answer && "border-border hover:border-primary/50 hover:bg-muted",
                    showRight && "border-success text-foreground",
                    showWrong && "border-danger bg-danger/10 text-foreground",
                    answer &&
                      !showRight &&
                      !showWrong &&
                      "border-border text-muted-foreground opacity-60",
                  )}
                >
                  {showRight && (
                    <motion.span
                      aria-hidden="true"
                      className="bg-success/15 absolute inset-0 -z-10 origin-left"
                      initial={reduced ? false : { scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold transition-colors pointer-coarse:hidden",
                      showRight
                        ? "border-success text-success"
                        : showWrong
                          ? "border-danger text-danger"
                          : "border-border text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </span>
                  {/* English at one end, its Arabic at the other, on one row — the card stays short. */}
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <span dir="ltr" lang="en">
                      {option.en}
                    </span>
                    {showTranslation && (
                      <span
                        className="text-muted-foreground shrink-0 text-sm sm:text-base"
                        dir="rtl"
                        lang="ar"
                      >
                        {option.ar}
                      </span>
                    )}
                  </span>
                  {showRight && (
                    <motion.span
                      initial={reduced ? false : { scale: 0, rotate: -40 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.12 }}
                      className="text-success shrink-0"
                    >
                      <Check className="size-5" aria-hidden="true" />
                    </motion.span>
                  )}
                  {showWrong && <X className="text-danger size-5 shrink-0" aria-hidden="true" />}
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* The row is always there (so the card does not jump when the answer arrives); its content fades in. */}
        <div className="mt-3.5 flex min-h-12 items-center justify-between gap-3">
          {answer ? (
            <>
              <motion.p
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                role="status"
                dir={dir}
                className={cn(
                  "text-sm font-medium",
                  answer.correct ? "text-success" : "text-muted-foreground",
                )}
              >
                {answer.correct ? t.passages.correct : t.passages.notQuite}
              </motion.p>
              <motion.div
                initial={reduced ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 26 }}
              >
                <PassageButton
                  size="lg"
                  keyHint="↵"
                  trailingIcon={<ArrowRight className="size-4" aria-hidden="true" />}
                  onClick={onNext}
                >
                  {nextLabel}
                </PassageButton>
              </motion.div>
            </>
          ) : (
            // While the question is open this row tells the learner why the text is out of focus.
            <motion.p
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              dir={dir}
              className="text-muted-foreground flex items-center gap-2 text-sm"
            >
              <EyeOff className="size-4 shrink-0" aria-hidden="true" />
              {t.passages.recallHint}
            </motion.p>
          )}
        </div>
      </motion.section>
    </div>
  );
}
