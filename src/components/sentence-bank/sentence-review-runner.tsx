"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, Check, CheckCircle2, Clock, Headphones, Lightbulb, Quote } from "lucide-react";

import { PronunciationButton } from "@/components/learning/pronunciation-button";
import { NO_AUTOFILL_ATTRS } from "@/components/learning/shared-input";
import { useLocale } from "@/components/providers/locale-provider";
import { ReviewCorrection } from "@/components/sentence-bank/review-correction";
import { Button, buttonVariants } from "@/components/ui/button";
import { useEnterToContinue } from "@/hooks/use-enter-to-continue";
import { compareDictation, firstLetterHint } from "@/lib/features/dictation";
import type { DictationResult } from "@/lib/features/dictation";
import {
  finishSentenceCheckAction,
  recordSentenceCheckAnswerAction,
  recordSentenceReviewAction,
  trackSentenceCheckStartedAction,
  trackSentenceReviewAction,
} from "@/lib/sentence-bank/actions";
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
}

const ANSWER_INPUT =
  "border-border bg-background/40 focus-visible:border-primary/60 focus-visible:ring-primary/20 w-full rounded-2xl border px-5 py-4 text-start text-xl outline-none focus-visible:ring-4";

const TAG =
  "border-border text-muted-foreground rounded-full border px-2.5 py-0.5 text-xs font-medium";

/** The exam's frame: one calm card, centred, with the way out under it. */
function Shell({ children, exit }: { children: ReactNode; exit: string | null }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-6 sm:py-10 lg:py-14">
      <section className="border-border/60 bg-card w-full rounded-3xl border shadow-sm">
        {children}
      </section>
      {exit && (
        <Link
          href="/learn"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          <span dir="auto">{exit}</span>
        </Link>
      )}
    </div>
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
 * The day's exam (the /learn/today/sentences route): a few sentences come back with their text
 * hidden — some from the lessons finished today, so the day ends with proof that it was learned,
 * some from earlier days, the honest test of what stayed — heard with a word or two missing, heard
 * alone, or seen only by their meaning, and the learner types them. The first answer to each
 * sentence goes to the schedule (a miss comes back tomorrow); a sentence missed is shown written out
 * and asked once more at the end, for practice only. Enter checks, and then continues; one help (the
 * first letters) holds a sentence where it is, and "I don't remember" is a miss. Calm by design: one
 * sentence on the screen, no clock, no score while going — the score, split into today and before,
 * comes at the end.
 *
 * `mode="check"` is the weekly exam (the /learn/today/check route) on the same screen: every
 * sentence from its meaning, no help and no second chance, each answer moves the schedule like a
 * review does but does not count for the day's task, and the end saves the exam's own result — how
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
  /** The weekly exam instead of the day's. */
  mode?: "review" | "check";
  /** The weekly exam only: how many sentences the learner typed in the week it is about. */
  written?: number;
}) {
  const { t } = useLocale();
  const copy = t.sentenceBank;
  const isCheck = mode === "check";

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
    setGraded({ result: compareDictation(item.en, sentence), exact: exact && !gaveUp, outcome });
    // The schedule hears about the first go only; the second chance is practice.
    if (entry.attempt === 0) {
      setResults((current) => [...current, { sentenceId: item.id, form: item.form, outcome }]);
      const record = isCheck ? recordSentenceCheckAnswerAction : recordSentenceReviewAction;
      void record({ sentenceId: item.id, outcome, todayISO }).catch(() => {});
    }
    // No second chance in the weekly exam: it measures, it does not teach.
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
    const fromToday = (result: ReviewResult) => byId.get(result.sentenceId)?.reason === "today";
    const today = summarizeReview(results.filter(fromToday));
    const earlier = summarizeReview(results.filter((result) => !fromToday(result)));
    const statusLabel: Record<SentenceOutcome, string> = {
      clean: copy.statusClean,
      assisted: copy.statusAssisted,
      missed: copy.statusMissed,
    };
    return (
      <Shell exit={null}>
        <div className="flex flex-col items-center gap-3 px-6 py-7 text-center sm:px-9 sm:py-8">
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight" dir="auto">
            <CheckCircle2 className="text-success size-6 shrink-0" aria-hidden="true" />
            {isCheck ? copy.checkSummaryHeading : copy.summaryHeading}
          </h2>
          <p className="text-4xl font-semibold tabular-nums" dir="ltr">
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
          {!isCheck && today.total > 0 && (
            <div className="flex flex-col items-center gap-2">
              {today.clean === today.total && (
                <p className="text-success text-sm font-semibold" dir="auto">
                  {copy.summaryTodayAll}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className={TAG} dir="auto">
                  {copy.summaryTodayLine
                    .replace("{clean}", String(today.clean))
                    .replace("{total}", String(today.total))}
                </span>
                {earlier.total > 0 && (
                  <span className={TAG} dir="auto">
                    {copy.summaryEarlierLine
                      .replace("{clean}", String(earlier.clean))
                      .replace("{total}", String(earlier.total))}
                  </span>
                )}
              </div>
            </div>
          )}
          {!isCheck && (
            <ul className="border-border/60 divide-border/60 mt-1 flex w-full flex-col divide-y rounded-2xl border text-start">
              {results.map((result) => {
                const done = byId.get(result.sentenceId);
                if (!done) return null;
                return (
                  <li key={result.sentenceId} className="flex items-start gap-3 px-4 py-2.5">
                    <OutcomeIcon outcome={result.outcome} label={statusLabel[result.outcome]} />
                    <div className="min-w-0 flex-1">
                      <p dir="ltr" className="text-[15px] leading-snug">
                        {done.en}
                      </p>
                      <p className="text-muted-foreground/80 mt-0.5 text-xs" dir="auto">
                        {statusLabel[result.outcome]} ·{" "}
                        {done.reason === "today" ? copy.tagToday : copy.tagEarlier}
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
            className={cn(buttonVariants({ size: "lg" }), "mt-1 w-full max-w-xs")}
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
  const hasSound = item.form !== "translate" && item.audioUrl !== null;
  const HeaderIcon = item.form === "translate" ? Quote : Headphones;

  return (
    <Shell exit={copy.exit}>
      <header className="flex items-center justify-between gap-3 px-6 pt-5 sm:px-9">
        <span className="text-primary inline-flex items-center gap-2">
          <HeaderIcon className="size-4" strokeWidth={2} aria-hidden="true" />
          <span className="text-sm font-semibold" dir="auto">
            {isCheck ? copy.checkTitle : copy.title}
          </span>
        </span>
        <span className="text-muted-foreground text-sm font-medium tabular-nums" dir="ltr">
          {index + 1} / {queue.length}
        </span>
      </header>
      <div className="mt-3 px-6 sm:px-9">
        <Segments total={queue.length} current={index} />
      </div>

      <div className="flex flex-col gap-7 px-6 pt-7 pb-7 text-center sm:px-9 sm:pb-9">
        {!graded && (
          <div className="flex flex-col items-center gap-2.5">
            {(!isCheck || entry.attempt === 1) && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {!isCheck && (
                  <span className={TAG} dir="auto">
                    {item.reason === "today" ? copy.tagToday : copy.tagEarlier}
                  </span>
                )}
                {entry.attempt === 1 && (
                  <span className={TAG} dir="auto">
                    {copy.secondChance}
                  </span>
                )}
              </div>
            )}
            <p className="text-muted-foreground text-sm" dir="auto">
              {instruction}
            </p>
          </div>
        )}

        {!graded ? (
          <>
            {item.form === "translate" && (
              <p className="text-2xl leading-snug font-semibold text-balance" dir="auto">
                {item.prompt}
              </p>
            )}
            {hasSound && (
              <div className="flex justify-center">
                <PronunciationButton
                  text={item.en}
                  audioUrl={item.audioUrl}
                  autoPlay
                  resetKey={`${item.id}-${entry.attempt}`}
                  disableSpeechFallback
                  variant="outline"
                  size="icon"
                  className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 size-16 rounded-full [&_svg]:size-7"
                  inputRef={item.form === "partial" ? firstBlankRef : inputRef}
                />
              </div>
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
                  placeholder={
                    item.form === "audio" ? t.dictation.inputLabel : t.fromMemory.placeholder
                  }
                  aria-label={
                    item.form === "audio" ? t.dictation.inputLabel : t.fromMemory.placeholder
                  }
                  {...NO_AUTOFILL_ATTRS}
                  enterKeyHint="done"
                  dir="ltr"
                  className={ANSWER_INPUT}
                />
                {helps > 0 && (
                  <p dir="ltr" className="text-muted-foreground text-lg tracking-wide">
                    {firstLetterHint(item.en)}
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
              <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
                {!isCheck && helps === 0 && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => setHelps(1)}
                    >
                      <Lightbulb className="size-4" aria-hidden="true" />
                      {t.fromMemory.showFirstLetters}
                    </Button>
                    <span aria-hidden="true" className="bg-border h-4 w-px" />
                  </>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => check(true)}
                >
                  {copy.dontRemember}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-5" aria-live="polite">
            <p
              dir="auto"
              className={cn(
                "flex items-center gap-2 text-lg font-semibold",
                graded.exact ? "text-success" : "text-foreground",
              )}
            >
              {graded.exact && <CheckCircle2 className="size-5" aria-hidden="true" />}
              {graded.exact ? t.dictation.perfect : t.dictation.almost}
            </p>
            <ReviewCorrection result={graded.result} sentence={item.en} />
            {item.prompt && (
              <p dir="auto" className="text-muted-foreground text-base">
                {item.prompt}
              </p>
            )}
            {graded.outcome === "missed" && (
              <p className="text-muted-foreground flex items-center gap-1.5 text-sm" dir="auto">
                <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                {entry.attempt === 0 && !isCheck ? copy.missedFirst : copy.missedSecond}
              </p>
            )}
            <div className="mt-1 flex w-full flex-col items-stretch gap-3">
              <Button type="button" size="lg" className="w-full" onClick={next}>
                {t.dictation.continue}
              </Button>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {item.audioUrl && (
                  <PronunciationButton
                    text={item.en}
                    audioUrl={item.audioUrl}
                    resetKey={`feedback-${item.id}-${entry.attempt}`}
                    disableSpeechFallback
                    variant="outline"
                    size="default"
                    label={copy.listen}
                  />
                )}
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
