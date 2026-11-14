"use client";

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";

import { PassageButton } from "@/components/passages/passage-button";
import type { PassageAnswer } from "@/components/passages/passage-question-dock";
import { useLocale } from "@/components/providers/locale-provider";
import { useEnterToContinue } from "@/hooks/use-enter-to-continue";
import { posterArtFor, speakerClassFor } from "@/lib/passages/art";
import { isTrueFalseQuestion } from "@/lib/passages/exam";
import type { Passage, PassageQuestion, PassageSentence } from "@/lib/passages/types";
import { cn } from "@/lib/utils";

/**
 * The full exam, between a passage's last part and its end screen: the whole
 * text from its first word to its last on one side, five new questions on the
 * other, each side scrolling on its own (on a phone they are two tabs). Unlike
 * the quick check after a part, nothing is decided at the first tap: the
 * learner picks all five answers, may change any of them, and then presses one
 * button. The answers are then checked one after another — the question comes
 * into view, the right choice fills with green, a wrong pick shakes, and the
 * score ring at the bottom grows with every right answer — and "Continue"
 * opens the usual end screen.
 */

/** How long after the button the first answer is checked, and how long each one after it takes. */
const FIRST_REVEAL_MS = 380;
const NEXT_REVEAL_MS = 760;

const RING_RADIUS = 21;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

function escapeForPattern(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** A line of the text, with the passage's own key words in bold (the words the end screen teaches). */
function LineText({ text, pattern }: { text: string; pattern: RegExp | null }) {
  if (!pattern) return <>{text}</>;
  const pieces = text.split(pattern);
  return (
    <>
      {pieces.map((piece, index) =>
        index % 2 === 1 ? (
          <strong
            key={index}
            className="decoration-foreground/35 font-semibold underline decoration-dotted decoration-1 underline-offset-[0.28em]"
          >
            {piece}
          </strong>
        ) : (
          <Fragment key={index}>{piece}</Fragment>
        ),
      )}
    </>
  );
}

export function PassageExam({
  passage,
  questions,
  translationAvailable,
  showTranslation,
  playCorrect,
  onContinue,
}: {
  passage: Passage;
  questions: PassageQuestion[];
  /** Arabic exists for this learner (their support language is Arabic). */
  translationAvailable: boolean;
  /** The reader's translation switch is on: every Arabic line shows. */
  showTranslation: boolean;
  /** The "right answer" chime of the reader. */
  playCorrect: () => void;
  onContinue: (answers: Record<string, PassageAnswer>) => void;
}) {
  const { t } = useLocale();
  const reduced = useReducedMotion();
  const total = questions.length;

  const [picks, setPicks] = useState<Record<string, number>>({});
  /** Null until "Check my answers" is pressed; then how many questions have been checked so far. */
  const [revealStep, setRevealStep] = useState<number | null>(null);
  const [tab, setTab] = useState<"text" | "questions">("questions");
  /** The questions whose Arabic was asked for one by one (with the reader's translation switch off). */
  const [translated, setTranslated] = useState<ReadonlySet<string>>(new Set());

  const answeredCount = questions.filter((question) => picks[question.id] !== undefined).length;
  const allAnswered = answeredCount === total;
  const checking = revealStep !== null;
  const done = revealStep !== null && revealStep >= total;
  const correctSoFar = questions
    .slice(0, revealStep ?? 0)
    .filter((question) => picks[question.id] === question.answer).length;

  // The two sides scroll on their own on a wide screen, so together they are exactly as tall as
  // what is left of the window under the reader's header — measured, since the header's height
  // is the reader's business (and anything the app puts above it, too).
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [paneHeight, setPaneHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    function measure() {
      const root = rootRef.current;
      if (!root) return;
      const top = root.getBoundingClientRect().top + window.scrollY;
      setPaneHeight(Math.max(window.innerHeight - top, 320));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // The checking itself: one question at a time, each brought into view as its turn comes.
  const picksRef = useRef(picks);
  picksRef.current = picks;
  useEffect(() => {
    if (revealStep === null || revealStep >= total) return;
    const timer = window.setTimeout(
      () => {
        const question = questions[revealStep];
        if (question && picksRef.current[question.id] === question.answer) playCorrect();
        document
          .getElementById(`exam-question-${revealStep}`)
          ?.scrollIntoView({ block: "center", behavior: "smooth" });
        setRevealStep(revealStep + 1);
      },
      revealStep === 0 ? FIRST_REVEAL_MS : NEXT_REVEAL_MS,
    );
    return () => window.clearTimeout(timer);
  }, [playCorrect, questions, revealStep, total]);

  function handleCheck() {
    if (!allAnswered || checking) return;
    // With reduced motion there is no sequence to watch: every answer shows at once.
    setRevealStep(reduced ? total : 0);
  }

  function handleContinue() {
    const answers: Record<string, PassageAnswer> = {};
    for (const question of questions) {
      const picked = picks[question.id] ?? -1;
      answers[question.id] = { picked, correct: picked === question.answer };
    }
    onContinue(answers);
  }

  useEnterToContinue(done, handleContinue, 600);

  const wordPattern = useMemo(() => {
    const words = passage.words.map((word) => escapeForPattern(word.word)).filter(Boolean);
    return words.length > 0 ? new RegExp(`\\b(${words.join("|")})\\b`, "gi") : null;
  }, [passage.words]);

  const speakers = useMemo(
    () => [
      ...new Set(
        passage.sections.flatMap((section) =>
          section.sentences
            .map((sentence) => sentence.speaker)
            .filter((name): name is string => Boolean(name)),
        ),
      ),
    ],
    [passage.sections],
  );

  const art = useMemo(
    () => posterArtFor(passage.tone, passage.order),
    [passage.tone, passage.order],
  );

  function renderLines(sentences: PassageSentence[], language: "en" | "ar") {
    return sentences.map((sentence, index) => {
      const showSpeaker =
        Boolean(sentence.speaker) && sentence.speaker !== sentences[index - 1]?.speaker;
      return (
        <Fragment key={sentence.id}>
          {showSpeaker && (
            <span
              dir="ltr"
              className={cn(
                "relative -top-[0.1em] me-[0.5em] font-sans text-[0.52em] font-bold tracking-[0.14em] uppercase",
                speakerClassFor(speakers.indexOf(sentence.speaker ?? "")),
              )}
            >
              {sentence.speaker}
            </span>
          )}
          {language === "en" ? (
            <LineText text={sentence.en} pattern={wordPattern} />
          ) : (
            sentence.ar
          )}{" "}
        </Fragment>
      );
    });
  }

  const paneVariants: Variants = reduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 14 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.07 },
        },
      };
  const itemVariants: Variants = reduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 340, damping: 30 } },
      };

  const resultLine =
    correctSoFar === total
      ? t.passages.examResultPerfect
      : correctSoFar / Math.max(total, 1) >= 0.6
        ? t.passages.examResultGood
        : t.passages.examResultLow;

  return (
    <div
      ref={rootRef}
      className="lg:grid lg:h-[var(--exam-height)] lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)]"
      style={{ "--exam-height": paneHeight ? `${paneHeight}px` : "100svh" } as React.CSSProperties}
    >
      {/* A phone has no room for two columns: the text and the questions are two tabs. */}
      <div className="px-4 pt-4 sm:px-6 lg:hidden">
        <div
          role="tablist"
          className="bg-foreground/[0.06] grid grid-cols-2 gap-0.5 rounded-2xl p-1 text-sm font-medium"
        >
          {(["text", "questions"] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "passage-btn focus-visible:ring-ring h-10 rounded-xl outline-none focus-visible:ring-2",
                tab === id
                  ? "bg-background text-primary shadow-[0_1px_2px_rgb(0_0_0/0.28),0_0_0_1px_color-mix(in_oklab,var(--primary)_38%,transparent)]"
                  : "text-muted-foreground",
              )}
            >
              {id === "text" ? t.passages.examTabText : t.passages.examTabQuestions}
              {id === "questions" && !checking && (
                <bdi className="ms-1.5 tabular-nums opacity-70">
                  {answeredCount}/{total}
                </bdi>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* The whole text, part after part. */}
      <motion.div
        variants={paneVariants}
        initial="hidden"
        animate="visible"
        id="exam-text"
        className={cn(
          "border-border/70 min-h-0 px-4 pt-7 pb-16 sm:px-6 lg:block lg:overflow-y-auto lg:border-r lg:px-10 lg:pt-10 xl:px-14",
          tab === "text" ? "block" : "hidden",
        )}
      >
        <div className="mx-auto max-w-[40rem]">
          {passage.sections.map((section) => (
            <motion.section key={section.id} variants={itemVariants} className="mb-10 last:mb-0">
              <h3
                className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase"
                dir="ltr"
                lang="en"
              >
                {section.title}
              </h3>
              <p
                className="font-quote text-foreground mt-3 text-[1.16rem] leading-[1.95] tracking-[-0.005em] sm:text-[1.28rem]"
                dir="ltr"
                lang="en"
              >
                {renderLines(section.sentences, "en")}
              </p>
              {showTranslation && (
                <p
                  className="text-muted-foreground border-border/70 mt-3 border-t pt-3 text-[1.02rem] leading-[2.05] sm:text-[1.08rem]"
                  dir="rtl"
                  lang="ar"
                >
                  {renderLines(section.sentences, "ar")}
                </p>
              )}
            </motion.section>
          ))}
        </div>
      </motion.div>

      {/* The questions, and under them the bar that checks them. */}
      <div className={cn("min-h-0 flex-col lg:flex", tab === "questions" ? "flex" : "hidden")}>
        <motion.div
          variants={paneVariants}
          initial="hidden"
          animate="visible"
          id="exam-questions"
          className="min-h-0 flex-1 px-4 pt-7 pb-10 sm:px-6 lg:overflow-y-auto lg:px-10 lg:pt-10 xl:px-14"
        >
          <div className="mx-auto max-w-[40rem]">
            <motion.header
              variants={itemVariants}
              className="border-border/70 flex items-center gap-3.5 border-b pb-6"
            >
              <span
                aria-hidden="true"
                className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg"
                style={{ backgroundImage: art.backgroundImage }}
              >
                {passage.posterUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={passage.posterUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="absolute inset-0 size-full object-cover"
                  />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold" dir="ltr" lang="en">
                  {passage.title}
                </p>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  <bdi>{t.passages.examLevel.replace("{level}", passage.level)}</bdi>
                </p>
              </div>
              <span className="bg-foreground text-background shrink-0 rounded-md px-2 py-1 text-[0.68rem] font-bold tracking-[0.08em] uppercase">
                {t.passages.examEyebrow}
              </span>
            </motion.header>

            <motion.p variants={itemVariants} className="text-muted-foreground mt-5 text-sm">
              <bdi>{t.passages.examIntro}</bdi>
            </motion.p>

            {questions.map((question, index) => {
              const picked = picks[question.id];
              const revealed = revealStep !== null && index < revealStep;
              const right = revealed && picked === question.answer;
              const trueFalse = isTrueFalseQuestion(question);
              const arabicShown = showTranslation || translated.has(question.id);

              return (
                <motion.section
                  key={question.id}
                  id={`exam-question-${index}`}
                  variants={itemVariants}
                  className="border-border/60 relative border-b py-8 last:border-b-0"
                >
                  {/* The mark that runs down the question's edge once it has been checked. */}
                  {revealed && (
                    <motion.span
                      aria-hidden="true"
                      className={cn(
                        "absolute top-8 bottom-8 -left-4 w-[3px] origin-top rounded-full sm:-left-5",
                        right ? "bg-success" : "bg-danger",
                      )}
                      initial={reduced ? false : { scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}

                  <div className="flex items-start gap-3">
                    <h3
                      className="min-w-0 flex-1 text-[1.25rem] leading-snug font-medium sm:text-[1.4rem]"
                      dir="ltr"
                      lang="en"
                    >
                      <span className="text-muted-foreground me-2 font-semibold tabular-nums">
                        {index + 1}.
                      </span>
                      {question.prompt}
                    </h3>
                    {revealed && (
                      <motion.span
                        role="img"
                        aria-label={right ? t.passages.correct : t.passages.notQuiteNoLine}
                        initial={reduced ? false : { scale: 0, rotate: -50 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 520, damping: 16 }}
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                          right ? "bg-success/15 text-success" : "bg-danger/15 text-danger",
                        )}
                      >
                        {right ? (
                          <Check className="size-[1.1rem]" strokeWidth={3} aria-hidden="true" />
                        ) : (
                          <X className="size-[1.1rem]" strokeWidth={3} aria-hidden="true" />
                        )}
                      </motion.span>
                    )}
                  </div>

                  {arabicShown ? (
                    <p className="text-muted-foreground mt-1.5 text-base" dir="rtl" lang="ar">
                      {question.promptAr}
                    </p>
                  ) : (
                    translationAvailable && (
                      <button
                        type="button"
                        onClick={() =>
                          setTranslated((current) => new Set(current).add(question.id))
                        }
                        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring mt-1.5 rounded text-sm outline-none focus-visible:ring-2"
                      >
                        {t.passages.examTranslate}
                      </button>
                    )
                  )}

                  <div
                    role="radiogroup"
                    aria-label={question.prompt}
                    className={cn("mt-4 flex gap-3", trueFalse ? "flex-row flex-wrap" : "flex-col")}
                  >
                    {question.options.map((option, optionIndex) => {
                      const isPicked = picked === optionIndex;
                      const isAnswer = optionIndex === question.answer;
                      const showRight = revealed && isAnswer;
                      const showWrong = revealed && isPicked && !isAnswer;
                      return (
                        <motion.button
                          key={optionIndex}
                          type="button"
                          role="radio"
                          aria-checked={isPicked}
                          disabled={checking}
                          onClick={() =>
                            setPicks((current) => ({ ...current, [question.id]: optionIndex }))
                          }
                          whileTap={checking ? undefined : { scale: 0.985 }}
                          animate={showWrong && !reduced ? { x: [0, -9, 9, -6, 6, 0] } : { x: 0 }}
                          transition={{ duration: 0.45 }}
                          className={cn(
                            "relative isolate flex items-center gap-3 overflow-hidden rounded-xl border text-start transition-[border-color,background-color,box-shadow,opacity] duration-200 outline-none",
                            "focus-visible:ring-ring focus-visible:ring-2",
                            trueFalse
                              ? "min-w-[7.5rem] justify-center px-6 py-3.5 text-[1.05rem] font-bold tracking-[0.04em] uppercase"
                              : "w-full px-5 py-3.5 text-[1.08rem] sm:text-[1.15rem]",
                            !revealed &&
                              !isPicked &&
                              "border-border enabled:hover:border-primary/50 enabled:hover:bg-muted",
                            !revealed &&
                              isPicked &&
                              "border-primary bg-primary/10 shadow-[0_0_0_1px_var(--primary)]",
                            showRight && "border-success text-foreground",
                            showWrong && "border-danger bg-danger/10 text-foreground",
                            revealed &&
                              !showRight &&
                              !showWrong &&
                              "border-border text-muted-foreground opacity-55",
                          )}
                        >
                          {showRight && (
                            <motion.span
                              aria-hidden="true"
                              className="bg-success/15 absolute inset-0 -z-10 origin-left"
                              initial={reduced ? false : { scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            />
                          )}
                          <span
                            className={cn(
                              "flex min-w-0 flex-col gap-0.5",
                              !trueFalse &&
                                "flex-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
                            )}
                          >
                            <span dir="ltr" lang="en">
                              {option.en}
                            </span>
                            {arabicShown && (
                              <span
                                className="text-muted-foreground shrink-0 text-sm font-normal tracking-normal normal-case sm:text-base"
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
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 18,
                                delay: 0.12,
                              }}
                              className="text-success shrink-0"
                            >
                              <Check className="size-5" aria-hidden="true" />
                            </motion.span>
                          )}
                          {showWrong && (
                            <X className="text-danger size-5 shrink-0" aria-hidden="true" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.section>
              );
            })}
          </div>
        </motion.div>

        {/* The bar under the questions: how many are answered and the button; then the score. */}
        <div className="border-border/70 bg-background/92 sticky bottom-0 z-20 border-t backdrop-blur-md lg:static">
          <div className="mx-auto flex max-w-[44rem] items-center gap-4 px-4 py-3.5 sm:px-6 lg:px-10 xl:px-14">
            {checking ? (
              <div className="relative size-14 shrink-0">
                <svg viewBox="0 0 52 52" className="size-14 -rotate-90" aria-hidden="true">
                  <circle
                    cx="26"
                    cy="26"
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth="4.5"
                    className="stroke-border"
                  />
                  <motion.circle
                    cx="26"
                    cy="26"
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    className="stroke-success"
                    strokeDasharray={RING_LENGTH}
                    initial={{ strokeDashoffset: RING_LENGTH }}
                    animate={{
                      strokeDashoffset: RING_LENGTH * (1 - correctSoFar / Math.max(total, 1)),
                    }}
                    transition={{ duration: reduced ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
                  />
                </svg>
                <motion.span
                  key={correctSoFar}
                  initial={reduced ? false : { scale: 1.45 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 15 }}
                  className="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums"
                >
                  {correctSoFar}
                </motion.span>
                {/* Full marks: a few sparks leave the ring, once. */}
                {done && correctSoFar === total && !reduced && (
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0">
                    {Array.from({ length: 10 }, (_, spark) => {
                      const angle = (spark / 10) * Math.PI * 2;
                      return (
                        <motion.i
                          key={spark}
                          className="bg-success absolute top-1/2 left-1/2 size-1.5 rounded-full"
                          initial={{ x: -3, y: -3, opacity: 0, scale: 0.4 }}
                          animate={{
                            x: Math.cos(angle) * 44 - 3,
                            y: Math.sin(angle) * 44 - 3,
                            opacity: [0, 1, 0],
                            scale: [0.4, 1, 0.3],
                          }}
                          transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
                        />
                      );
                    })}
                  </span>
                )}
              </div>
            ) : null}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {questions.map((question, index) => {
                  const revealed = revealStep !== null && index < revealStep;
                  const right = picks[question.id] === question.answer;
                  return (
                    <motion.span
                      key={question.id}
                      animate={revealed && !reduced ? { scale: [1, 1.5, 1] } : { scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className={cn(
                        "h-1.5 w-7 rounded-full transition-colors duration-300",
                        revealed
                          ? right
                            ? "bg-success"
                            : "bg-danger/80"
                          : picks[question.id] !== undefined
                            ? "bg-primary"
                            : "bg-border",
                      )}
                    />
                  );
                })}
              </div>
              <p className="mt-1.5 truncate text-sm" role="status">
                {done ? (
                  <>
                    <span className="font-semibold">
                      <bdi>
                        {t.passages.examScore
                          .replace("{correct}", String(correctSoFar))
                          .replace("{total}", String(total))}
                      </bdi>
                    </span>
                    <span className="text-muted-foreground max-sm:hidden">
                      {" · "}
                      <bdi>{resultLine}</bdi>
                    </span>
                  </>
                ) : checking ? (
                  <bdi className="text-muted-foreground">{t.passages.examChecking}</bdi>
                ) : (
                  <span className="text-muted-foreground">
                    <bdi>
                      {t.passages.examAnswered
                        .replace("{n}", String(answeredCount))
                        .replace("{total}", String(total))}
                    </bdi>
                    {/* The hint needs room: a phone shows the count alone (its button is visibly off). */}
                    {!allAnswered && (
                      <span className="max-sm:hidden">
                        {" · "}
                        <bdi>{t.passages.examAnswerAll}</bdi>
                      </span>
                    )}
                  </span>
                )}
              </p>
            </div>

            {done ? (
              <motion.div
                initial={reduced ? false : { opacity: 0, x: 16, scale: 0.94 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 24, delay: 0.35 }}
              >
                <PassageButton
                  size="lg"
                  keyHint="↵"
                  trailingIcon={<ArrowRight className="size-4" aria-hidden="true" />}
                  onClick={handleContinue}
                >
                  {t.passages.examContinue}
                </PassageButton>
              </motion.div>
            ) : (
              <PassageButton size="lg" disabled={!allAnswered || checking} onClick={handleCheck}>
                {t.passages.examCheck}
              </PassageButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
