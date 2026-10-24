"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Check,
  CheckCircle2,
  CircleQuestionMark,
  Clock,
  Headphones,
  Lightbulb,
  PencilLine,
  Quote,
  Target,
  X,
} from "lucide-react";

import { PronunciationButton } from "@/components/learning/pronunciation-button";
import type {
  PronunciationButtonHandle,
  PronunciationStatus,
} from "@/components/learning/pronunciation-button";
import { NO_AUTOFILL_ATTRS } from "@/components/learning/shared-input";
import { useLocale } from "@/components/providers/locale-provider";
import { ReviewCorrection } from "@/components/sentence-bank/review-correction";
import { Button, buttonVariants } from "@/components/ui/button";
import { useEnterToContinue } from "@/hooks/use-enter-to-continue";
import { usePassageChime } from "@/hooks/use-passage-chime";
import { compareDictation, firstLetterHint } from "@/lib/features/dictation";
import type { DictationResult } from "@/lib/features/dictation";
import {
  finishSentenceCheckAction,
  recordPassageLineReviewAction,
  recordSentenceCheckAnswerAction,
  recordSentenceReviewAction,
  trackSentenceCheckStartedAction,
  trackSentenceReviewAction,
} from "@/lib/sentence-bank/actions";
import { answerFeedback } from "@/lib/sentence-bank/feedback";
import type { AnswerFeedback } from "@/lib/sentence-bank/feedback";
import type { ReviewScreenItem } from "@/lib/sentence-bank/items";
import { gradeMasked, maskedTokenIndexes, sentenceTokens } from "@/lib/sentence-bank/mask";
import { outcomeForSentence } from "@/lib/sentence-bank/review";
import type { SentenceOutcome } from "@/lib/sentence-bank/review";
import { queueAfterAnswer, startQueue, summarizeReview } from "@/lib/sentence-bank/session";
import type { ReviewResult } from "@/lib/sentence-bank/session";
import { cn } from "@/lib/utils";

interface Graded {
  result: DictationResult;
  /** Every word typed right and the answer was not given up on. */
  exact: boolean;
  outcome: SentenceOutcome;
  /** What the test says about the answer: right, a few letters away, further off, given up on. */
  feedback: AnswerFeedback;
}

/** The answer is a blank writing line, not a box: the sentence goes where the line is. */
const ANSWER_LINE =
  "caret-primary border-border focus-visible:border-primary w-full rounded-none border-0 border-b-2 bg-transparent px-1 pt-3 pb-2.5 text-start text-2xl outline-none transition-colors sm:text-3xl";

const TAG = "border-border text-muted-foreground rounded-full border px-3 py-1 text-xs font-medium";

const SECONDARY_BUTTON =
  "focus-visible:ring-ring inline-flex min-h-11 min-w-36 flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-center text-sm leading-tight font-medium transition-colors outline-none focus-visible:ring-2";

/** The test's frame: the site's own black page, with the test in the middle of it. */
function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="lesson-shell bg-background text-foreground flex min-h-svh w-full items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      <section className="w-full max-w-2xl">{children}</section>
    </div>
  );
}

/** The resting shape of the sound wave, tallest in the middle. */
const WAVE_BARS = [0.35, 0.6, 0.85, 0.5, 1, 0.7, 0.9, 0.55, 1, 0.75, 0.45, 0.65, 0.3];

/**
 * The question's sound, drawn as a wave that moves while the sentence plays and rests in between.
 * It is also the way to hear it again: one press replays it.
 */
function SoundWave({
  playing,
  onReplay,
  label,
  hint,
}: {
  playing: boolean;
  onReplay: () => void;
  label: string;
  hint: string;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const moving = playing && !reduceMotion;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={onReplay}
        aria-label={label}
        className="focus-visible:ring-ring flex h-16 cursor-pointer items-center justify-center gap-[5px] rounded-xl px-6 outline-none focus-visible:ring-2"
      >
        {WAVE_BARS.map((height, position) => (
          <motion.span
            key={position}
            aria-hidden="true"
            className="bg-primary h-14 w-[5px] rounded-full"
            animate={{ scaleY: moving ? [0.2, 1, 0.2] : 0.2 + height * 0.3 }}
            transition={
              moving
                ? {
                    duration: 0.6 + (position % 4) * 0.14,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: position * 0.04,
                  }
                : { duration: 0.3 }
            }
          />
        ))}
      </button>
      <span className="text-muted-foreground/80 text-xs" dir="auto">
        {hint}
      </span>
    </div>
  );
}

/** The card's top line: the way out on one side, the name in the middle, how far along on the other. */
function Header({
  Icon,
  title,
  position,
  total,
}: {
  Icon: LucideIcon;
  title: string;
  position: number;
  total: number;
}) {
  const { t } = useLocale();
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 pt-5 sm:px-9 sm:pt-7">
      <Link
        href="/learn"
        className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring -ms-2.5 inline-flex h-9 w-fit items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2"
      >
        <X className="size-4" aria-hidden="true" />
        <span dir="auto">{t.sentenceBank.exit}</span>
      </Link>
      <span className="text-primary inline-flex items-center gap-2">
        <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
        <span className="text-sm font-semibold" dir="auto">
          {title}
        </span>
      </span>
      <span
        className="text-muted-foreground justify-self-end text-sm font-medium tabular-nums"
        dir="ltr"
      >
        {position} / {total}
      </span>
    </header>
  );
}

/** One bar a question; the ones behind are full, the one on screen half. */
function Segments({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {Array.from({ length: total }, (_unused, position) => (
        <span
          key={position}
          className={cn(
            "h-1.5 flex-1 rounded-full",
            position < current
              ? "bg-primary"
              : position === current
                ? "bg-primary/45"
                : "bg-border/70",
          )}
        />
      ))}
    </div>
  );
}

/** How one sentence went, as the finish screen lists it: a tick, a used help, or "comes back" — never a red cross. */
function OutcomeIcon({ outcome, label }: { outcome: SentenceOutcome; label: string }) {
  const Icon = outcome === "clean" ? Check : outcome === "assisted" ? Lightbulb : Clock;
  return (
    <span
      className={cn(
        "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full",
        outcome === "clean" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
      )}
      role="img"
      aria-label={label}
    >
      <Icon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
    </span>
  );
}

/**
 * What the test says right after an answer: one short line, and under it, when there is something
 * to add, a second. A sentence typed right is told so with a round tick that settles into place;
 * one a few letters away says how many ("so close — one letter"); one further off only asks for a
 * look at the marked words. Never "wrong", never a score.
 */
function Verdict({ feedback }: { feedback: AnswerFeedback }) {
  const { t } = useLocale();
  const copy = t.sentenceBank;
  const reduced = useReducedMotion();

  let title: string;
  let note: string | null = null;
  if (feedback.kind === "exact") {
    title = copy.answerExact;
    note = copy.answerExactNote;
  } else if (feedback.kind === "close") {
    title =
      feedback.letters === 1
        ? copy.answerCloseOne
        : feedback.letters === 2
          ? copy.answerCloseTwo
          : copy.answerCloseFew;
    note =
      feedback.letters === 1
        ? copy.answerLettersOne
        : feedback.letters === 2
          ? copy.answerLettersTwo
          : copy.answerLettersMany.replace("{n}", String(feedback.letters));
  } else {
    title = feedback.kind === "gaveUp" ? copy.answerGaveUp : copy.answerOff;
  }

  const Mark = feedback.kind === "exact" ? CheckCircle2 : feedback.kind === "close" ? Target : null;
  return (
    <div className="flex flex-col items-center gap-3">
      {Mark && (
        <motion.span
          aria-hidden="true"
          className={cn(
            "grid size-14 place-items-center rounded-full ring-1",
            feedback.kind === "exact"
              ? "bg-success/15 text-success ring-success/25"
              : "bg-primary/15 text-primary ring-primary/25",
          )}
          initial={reduced ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
        >
          <Mark className="size-7" strokeWidth={1.8} />
        </motion.span>
      )}
      <div className="flex flex-col items-center gap-1">
        <p
          dir="auto"
          className={cn(
            "text-2xl font-semibold tracking-tight",
            feedback.kind === "exact" ? "text-success" : "text-foreground",
          )}
        >
          {title}
        </p>
        {note && (
          <p dir="auto" className="text-muted-foreground text-base">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * The day's test (the /learn/today/sentences route): a few sentences of the passage and the story
 * finished today come back with their text hidden — the learner hears each one and types it whole,
 * from memory, so the day ends with proof that it was learned. The first answer to each sentence
 * goes to the schedule when it is a story's sentence (a miss comes back tomorrow) and to the day's
 * task either way; the way a sentence went is told in one calm line — a soft chime and a tick when
 * it was typed right, "so close" with the number of letters when it was a few away. Enter checks,
 * and then continues; one help (the first letters) holds a sentence where it is, and "I don't
 * remember" is a miss. One sentence on the screen, no clock, no score while going — the score
 * comes at the end.
 *
 * `mode="check"` is the weekly test (the /learn/today/check route) on the same screen: every
 * sentence from its meaning, no help and no second chance, each answer moves the schedule like a
 * review does but does not count for the day's task, and the end saves the test's own result — how
 * many were typed right of how many were asked — which is all the finish screen says.
 */
export function SentenceReviewRunner({
  items,
  todayISO,
  afterHref,
  mode = "review",
  written = 0,
}: {
  items: ReviewScreenItem[];
  /** The learner-local day the sentences were chosen for; sent with every answer. */
  todayISO: string;
  /** Where "finish" goes: back to Home, or on to the finish screen of Today's session. */
  afterHref: string;
  /** The weekly test instead of the day's. */
  mode?: "review" | "check";
  /** The weekly test only: how many sentences the learner typed in the week it is about. */
  written?: number;
}) {
  const { t } = useLocale();
  const copy = t.sentenceBank;
  const isCheck = mode === "check";
  const { playCorrect } = usePassageChime();

  const [queue, setQueue] = useState(() => startQueue(items));
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<ReviewResult[]>([]);
  const [typed, setTyped] = useState("");
  const [blanks, setBlanks] = useState<string[]>([]);
  const [helps, setHelps] = useState(0);
  const [graded, setGraded] = useState<Graded | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const firstBlankRef = useRef<HTMLInputElement | null>(null);
  const blankRefs = useRef<(HTMLInputElement | null)[]>([]);
  const startedRef = useRef(false);
  const finishedRef = useRef(false);
  const soundRef = useRef<PronunciationButtonHandle>(null);
  const [sound, setSound] = useState<PronunciationStatus>({
    supported: true,
    loading: false,
    playing: false,
  });

  const entry = queue[index];
  const item = entry?.item;
  const finished = index >= queue.length;
  const tokens = useMemo(() => (item ? sentenceTokens(item.en) : []), [item]);
  // The second chance at a partial sentence hides other words than the first go did.
  const masked = useMemo(() => {
    if (!item) return [];
    if (entry?.attempt === 1 && item.form === "partial") {
      return maskedTokenIndexes(item.en, {
        strength: item.strength,
        seed: `${item.id}:retry`,
        avoid: item.masked,
      });
    }
    return item.masked;
  }, [item, entry?.attempt]);

  // Once on arrival: how many sentences, in which forms.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (isCheck) {
      void trackSentenceCheckStartedAction(items.length).catch(() => {});
      return;
    }
    const { forms } = summarizeReview(
      items.map((entryItem) => ({
        sentenceId: entryItem.id,
        form: entryItem.form,
        outcome: "clean",
      })),
    );
    void trackSentenceReviewAction({ event: "started", count: items.length, ...forms }).catch(
      () => {},
    );
  }, [items, isCheck]);

  // Once at the end: how the first answers went.
  useEffect(() => {
    if (!finished || finishedRef.current || results.length === 0) return;
    finishedRef.current = true;
    const summary = summarizeReview(results);
    if (isCheck) {
      void finishSentenceCheckAction({
        todayISO,
        asked: summary.total,
        remembered: summary.clean,
        written: Math.max(written, summary.total),
      }).catch(() => {});
      return;
    }
    void trackSentenceReviewAction({
      event: "finished",
      count: summary.total,
      clean: summary.clean,
      assisted: summary.assisted,
      missed: summary.missed,
      ...summary.forms,
    }).catch(() => {});
  }, [finished, results, isCheck, todayISO, written]);

  // The cursor is always where the next letter goes.
  useEffect(() => {
    if (finished || graded || !item) return;
    if (item.form === "partial") blankRefs.current[0]?.focus();
    else inputRef.current?.focus();
  }, [index, finished, graded, item]);

  const filled =
    item?.form === "partial"
      ? masked.every((_unused, position) => (blanks[position] ?? "").trim().length > 0)
      : typed.trim().length > 0;

  function check(gaveUp = false) {
    if (!item || !entry || graded) return;
    if (!gaveUp && !filled) return;
    let exact: boolean;
    let sentence: string;
    if (item.form === "partial") {
      const answer = gradeMasked(
        item.en,
        masked,
        masked.map((_unused, position) => blanks[position] ?? ""),
      );
      exact = answer.exact;
      sentence = answer.sentence;
    } else {
      exact = compareDictation(item.en, typed).exact;
      sentence = typed;
    }
    const outcome = outcomeForSentence({ exact, helps, gaveUp });
    const result = compareDictation(item.en, sentence);
    const feedback = answerFeedback({ exact, errorChars: result.errorChars }, gaveUp);
    setGraded({ result, exact: exact && !gaveUp, outcome, feedback });
    // A sentence typed right is met with the soft chime (it follows the site's one sound setting).
    if (feedback.kind === "exact") playCorrect();
    // The schedule hears about the first go only; the second chance is practice.
    if (entry.attempt === 0) {
      setResults((current) => [...current, { sentenceId: item.id, form: item.form, outcome }]);
      if (isCheck) {
        void recordSentenceCheckAnswerAction({ sentenceId: item.id, outcome, todayISO }).catch(
          () => {},
        );
      } else if (item.source === "passage") {
        void recordPassageLineReviewAction({ lineId: item.id, outcome, todayISO }).catch(() => {});
      } else {
        void recordSentenceReviewAction({ sentenceId: item.id, outcome, todayISO }).catch(() => {});
      }
    }
    // No second chance in the weekly test: it measures, it does not teach.
    if (!isCheck) setQueue((current) => queueAfterAnswer(current, index, outcome));
  }

  function next() {
    if (!graded) return;
    setIndex(index + 1);
    setTyped("");
    setBlanks([]);
    setHelps(0);
    setGraded(null);
  }

  // Enter checks while typing (in the answer boxes below); once the correction is on screen it continues.
  useEnterToContinue(graded !== null && !finished, next);

  if (finished) {
    const summary = summarizeReview(results);
    const byId = new Map(items.map((entryItem) => [entryItem.id, entryItem]));
    const statusLabel: Record<SentenceOutcome, string> = {
      clean: copy.statusClean,
      assisted: copy.statusAssisted,
      missed: copy.statusMissed,
    };
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4 px-5 py-8 text-center sm:px-9 sm:py-10">
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight" dir="auto">
            <CheckCircle2 className="text-success size-6 shrink-0" aria-hidden="true" />
            {isCheck ? copy.checkSummaryHeading : copy.summaryHeading}
          </h2>
          <p className="text-5xl font-semibold tabular-nums" dir="ltr">
            {summary.clean} / {summary.total}
          </p>
          <p className="text-muted-foreground text-base" dir="auto">
            {isCheck
              ? copy.checkSummaryBody
                  .replace("{remembered}", String(summary.clean))
                  .replace("{asked}", String(summary.total))
              : copy.summaryBody
                  .replace("{clean}", String(summary.clean))
                  .replace("{total}", String(summary.total))}
          </p>
          {!isCheck && summary.total > 0 && summary.clean === summary.total && (
            <p className="text-success text-sm font-semibold" dir="auto">
              {copy.summaryTodayAll}
            </p>
          )}
          {!isCheck && (
            <ul className="border-border/60 divide-border/60 mt-1 flex w-full flex-col divide-y rounded-2xl border text-start">
              {results.map((result) => {
                const done = byId.get(result.sentenceId);
                if (!done) return null;
                // A passage line is not on the schedule, so a miss on it does not "come back tomorrow".
                const status =
                  result.outcome === "missed" && done.source === "passage"
                    ? copy.statusReview
                    : statusLabel[result.outcome];
                return (
                  <li key={result.sentenceId} className="flex items-start gap-3 px-4 py-3">
                    <OutcomeIcon outcome={result.outcome} label={status} />
                    <div className="min-w-0 flex-1">
                      <p dir="ltr" className="text-base leading-snug">
                        {done.en}
                      </p>
                      <p className="text-muted-foreground/80 mt-0.5 text-xs" dir="auto">
                        {status} · {done.source === "passage" ? copy.tagPassage : copy.tagStory}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {isCheck && summary.missed > 0 && (
            <p className="text-muted-foreground text-sm" dir="auto">
              {copy.summaryMissed}
            </p>
          )}
          <Link
            href={afterHref}
            className={cn(buttonVariants({ size: "lg" }), "mt-2 w-full max-w-xs")}
          >
            <span dir="auto">{afterHref === "/learn" ? copy.backToToday : copy.finishSession}</span>
          </Link>
        </div>
      </Shell>
    );
  }

  if (!item || !entry) return null;

  const instruction =
    item.form === "partial"
      ? masked.length > 1
        ? copy.formPartialMany
        : copy.formPartialOne
      : item.form === "audio"
        ? copy.formAudio
        : copy.formTranslate;
  const lastBlank = masked.length - 1;
  // Every question has its clip in the lesson's voice; the meaning-only form keeps it for after the answer.
  const hasSound = item.form !== "translate";
  // Whether the miss on screen is going to be asked again at the end of the visit.
  const askedAgain = queue.some(
    (other, position) => position > index && other.attempt === 1 && other.item.id === item.id,
  );
  const HeaderIcon = item.form === "translate" ? Quote : Headphones;

  return (
    <Shell>
      <Header
        Icon={HeaderIcon}
        title={isCheck ? copy.checkTitle : copy.title}
        position={index + 1}
        total={queue.length}
      />
      <div className="mt-4 px-5 sm:px-9">
        <Segments total={queue.length} current={index} />
      </div>

      <div className="flex flex-col gap-8 px-5 pt-8 pb-7 text-center sm:px-9 sm:pt-10 sm:pb-9">
        {!graded && (
          <div className="flex flex-col items-center gap-3">
            {(!isCheck || entry.attempt === 1) && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {!isCheck && (
                  <span className={TAG} dir="auto">
                    {item.source === "passage" ? copy.tagPassage : copy.tagStory}
                  </span>
                )}
                {entry.attempt === 1 && (
                  <span className={TAG} dir="auto">
                    {copy.secondChance}
                  </span>
                )}
              </div>
            )}
            <p className="text-muted-foreground text-base" dir="auto">
              {instruction}
            </p>
          </div>
        )}

        {!graded ? (
          <>
            {item.form === "translate" && (
              <p className="text-3xl leading-snug font-semibold text-balance" dir="auto">
                {item.prompt}
              </p>
            )}
            {hasSound && (
              <>
                {/* Headless: it only plays (on arrival, and again on a press of the wave). */}
                <PronunciationButton
                  ref={soundRef}
                  headless
                  text={item.en}
                  audioUrl={item.audioUrl}
                  autoPlay
                  resetKey={`${item.id}-${entry.attempt}`}
                  disableSpeechFallback
                  onStatusChange={setSound}
                />
                <SoundWave
                  playing={sound.playing || sound.loading}
                  label={copy.listen}
                  hint={copy.replayHint}
                  onReplay={() => {
                    soundRef.current?.replay();
                    (item.form === "partial" ? firstBlankRef : inputRef).current?.focus();
                  }}
                />
              </>
            )}
            {item.form === "partial" ? (
              <p
                dir="ltr"
                className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-4 text-2xl leading-snug sm:text-3xl"
              >
                {tokens.map((token, tokenIndex) => {
                  const blank = masked.indexOf(tokenIndex);
                  if (blank < 0) return <span key={tokenIndex}>{token.text}</span>;
                  const hint = `${token.core.charAt(0)}${"·".repeat(Math.max(0, token.core.length - 1))}`;
                  return (
                    <span key={tokenIndex} className="inline-flex items-baseline">
                      {token.before}
                      <input
                        ref={(element) => {
                          blankRefs.current[blank] = element;
                          if (blank === 0) firstBlankRef.current = element;
                        }}
                        value={blanks[blank] ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          setBlanks((current) => {
                            const updated = [...current];
                            updated[blank] = value;
                            return updated;
                          });
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter") return;
                          event.preventDefault();
                          if (blank < lastBlank) blankRefs.current[blank + 1]?.focus();
                          else check();
                        }}
                        onPaste={(event) => event.preventDefault()}
                        aria-label={copy.blankLabel}
                        placeholder={helps > 0 ? hint : undefined}
                        {...NO_AUTOFILL_ATTRS}
                        enterKeyHint={blank < lastBlank ? "next" : "done"}
                        dir="ltr"
                        style={{
                          width: `${Math.max(token.core.length, 3) + 1}ch`,
                          font: "inherit",
                        }}
                        className="border-primary/60 focus-visible:border-primary placeholder:text-muted-foreground/60 border-0 border-b-2 bg-transparent px-1 text-center outline-none"
                      />
                      {token.after}
                    </span>
                  );
                })}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    event.preventDefault();
                    check();
                  }}
                  onPaste={(event) => event.preventDefault()}
                  aria-label={
                    item.form === "audio" ? t.dictation.inputLabel : t.fromMemory.placeholder
                  }
                  {...NO_AUTOFILL_ATTRS}
                  enterKeyHint="done"
                  dir="ltr"
                  className={ANSWER_LINE}
                />
                {helps > 0 ? (
                  <p dir="ltr" className="text-muted-foreground text-lg tracking-wide">
                    {firstLetterHint(item.en)}
                  </p>
                ) : (
                  <p
                    className="text-muted-foreground/80 flex items-center justify-center gap-1.5 text-[13px]"
                    dir="auto"
                  >
                    <PencilLine className="size-3.5 shrink-0" aria-hidden="true" />
                    {copy.writeHint}
                  </p>
                )}
              </div>
            )}
            <div className="flex flex-col items-stretch gap-3">
              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={() => check()}
                disabled={!filled}
              >
                {t.dictation.check}
              </Button>
              <div className="flex flex-wrap items-stretch justify-center gap-2.5">
                {!isCheck && helps === 0 && (
                  <button
                    type="button"
                    onClick={() => setHelps(1)}
                    className={cn(
                      SECONDARY_BUTTON,
                      "border-primary/35 bg-primary/10 text-primary hover:bg-primary/15",
                    )}
                  >
                    <Lightbulb className="size-4 shrink-0" aria-hidden="true" />
                    <span dir="auto">{t.fromMemory.showFirstLetters}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => check(true)}
                  className={cn(
                    SECONDARY_BUTTON,
                    "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <CircleQuestionMark className="size-4 shrink-0" aria-hidden="true" />
                  <span dir="auto">{copy.dontRemember}</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-6" aria-live="polite">
            <Verdict feedback={graded.feedback} />
            <ReviewCorrection result={graded.result} sentence={item.en} />
            {item.prompt && (
              <p dir="auto" className="text-muted-foreground text-lg">
                {item.prompt}
              </p>
            )}
            {/* "Comes back tomorrow" is only true of a sentence on the schedule, which a passage line is not. */}
            {graded.outcome === "missed" && item.source === "sentence" && (
              <p className="text-muted-foreground flex items-center gap-1.5 text-sm" dir="auto">
                <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                {askedAgain ? copy.missedFirst : copy.missedSecond}
              </p>
            )}
            <div className="mt-1 flex w-full flex-col items-stretch gap-3">
              <Button type="button" size="lg" className="w-full" onClick={next}>
                {t.dictation.continue}
              </Button>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <PronunciationButton
                  text={item.en}
                  audioUrl={item.audioUrl}
                  resetKey={`feedback-${item.id}-${entry.attempt}`}
                  disableSpeechFallback
                  variant="outline"
                  size="default"
                  label={copy.listen}
                />
                <span className="text-muted-foreground text-xs max-sm:hidden" dir="auto">
                  {t.dictation.pressEnterContinue}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
