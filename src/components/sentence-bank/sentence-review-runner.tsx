"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Lightbulb } from "lucide-react";

import { ContinueButton } from "@/components/learning/feedback-actions";
import { PronunciationButton } from "@/components/learning/pronunciation-button";
import { NO_AUTOFILL_ATTRS } from "@/components/learning/shared-input";
import { SentenceDiff } from "@/components/learning/sentence-diff";
import { useLocale } from "@/components/providers/locale-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEnterToContinue } from "@/hooks/use-enter-to-continue";
import { compareDictation, firstLetterHint } from "@/lib/features/dictation";
import type { DictationResult } from "@/lib/features/dictation";
import { recordSentenceReviewAction, trackSentenceReviewAction } from "@/lib/sentence-bank/actions";
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
  "border-border/70 bg-background/60 focus-visible:border-ring focus-visible:ring-ring/40 w-full rounded-xl border-2 px-4 py-3.5 text-2xl outline-none focus-visible:ring-4 sm:text-3xl";

/**
 * The sentence review (the /learn/today/sentences route): a few sentences the learner typed on
 * earlier days come back with their text hidden — heard with a word or two missing, heard alone, or
 * seen only by their meaning — and the learner types them. The first answer to each sentence goes to
 * the schedule (a miss comes back tomorrow); a sentence missed is shown written out and asked once
 * more at the end, for practice only. Enter checks, and then continues; one help (the first letters)
 * holds a sentence where it is, and "I don't remember" is a miss. Calm by design: one sentence on
 * the screen, no clock, no score while going.
 */
export function SentenceReviewRunner({
  items,
  todayISO,
  afterHref,
}: {
  items: ReviewScreenItem[];
  /** The learner-local day the sentences were chosen for; sent with every answer. */
  todayISO: string;
  /** Where "finish" goes: back to Home, or on to the finish screen of Today's session. */
  afterHref: string;
}) {
  const { t } = useLocale();
  const copy = t.sentenceBank;

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
  }, [items]);

  // Once at the end: how the first answers went.
  useEffect(() => {
    if (!finished || finishedRef.current || results.length === 0) return;
    finishedRef.current = true;
    const summary = summarizeReview(results);
    void trackSentenceReviewAction({
      event: "finished",
      count: summary.total,
      clean: summary.clean,
      assisted: summary.assisted,
      missed: summary.missed,
      ...summary.forms,
    }).catch(() => {});
  }, [finished, results]);

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
      void recordSentenceReviewAction({ sentenceId: item.id, outcome, todayISO }).catch(() => {});
    }
    setQueue((current) => queueAfterAnswer(current, index, outcome));
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
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-5 px-6 py-16 text-center">
        <CheckCircle2 className="text-success size-12" aria-hidden="true" />
        <h2 className="text-3xl font-semibold tracking-tight" dir="auto">
          {copy.summaryHeading}
        </h2>
        <p className="text-muted-foreground text-lg" dir="auto">
          {copy.summaryBody
            .replace("{clean}", String(summary.clean))
            .replace("{total}", String(summary.total))}
        </p>
        {summary.missed > 0 && (
          <p className="text-muted-foreground text-sm" dir="auto">
            {copy.summaryMissed}
          </p>
        )}
        <Link href={afterHref} className={buttonVariants({ size: "lg" })}>
          <span dir="auto">{afterHref === "/learn" ? copy.backToToday : copy.finishSession}</span>
        </Link>
      </div>
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

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8 lg:py-12">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/learn"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          <span dir="auto">{copy.exit}</span>
        </Link>
        <span className="text-muted-foreground text-sm font-medium tabular-nums" dir="ltr">
          {index + 1} / {queue.length}
        </span>
      </div>
      <Progress value={(index / queue.length) * 100} className="h-1" />

      <div className="flex flex-col gap-3">
        <p
          dir="auto"
          className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium"
        >
          <span>
            {copy.title} · {instruction}
          </span>
          {entry.attempt === 1 && (
            <span className="border-border rounded-full border px-2 py-0.5 text-xs font-semibold">
              {copy.secondChance}
            </span>
          )}
        </p>

        {item.form === "translate" && (
          <p className="text-3xl leading-snug font-semibold text-balance sm:text-4xl" dir="auto">
            {item.prompt}
          </p>
        )}
        {hasSound && !graded && (
          <div>
            <PronunciationButton
              text={item.en}
              audioUrl={item.audioUrl}
              autoPlay
              resetKey={`${item.id}-${entry.attempt}`}
              disableSpeechFallback
              variant="outline"
              size="default"
              label={copy.listen}
              inputRef={item.form === "partial" ? firstBlankRef : inputRef}
            />
          </div>
        )}
      </div>

      {!graded ? (
        <>
          {item.form === "partial" ? (
            <p
              dir="ltr"
              className="flex flex-wrap items-baseline gap-x-3 gap-y-4 text-3xl leading-snug sm:text-4xl"
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
                      style={{ width: `${Math.max(token.core.length, 3) + 1}ch`, font: "inherit" }}
                      className="border-foreground/40 focus-visible:border-primary placeholder:text-muted-foreground/60 border-0 border-b-2 bg-transparent px-1 text-center outline-none"
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
                <p dir="ltr" className="text-muted-foreground text-xl tracking-wide">
                  {firstLetterHint(item.en)}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={() => check()} disabled={!filled}>
              {t.dictation.check}
            </Button>
            {helps === 0 && (
              <Button type="button" variant="outline" onClick={() => setHelps(1)}>
                <Lightbulb className="size-4" aria-hidden="true" />
                {t.fromMemory.showFirstLetters}
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={() => check(true)}>
              {copy.dontRemember}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-4" aria-live="polite">
          <p
            dir="auto"
            className={cn(
              "flex items-center gap-2 text-2xl font-bold",
              graded.exact ? "text-success" : "text-foreground",
            )}
          >
            {graded.exact && <CheckCircle2 className="size-6" aria-hidden="true" />}
            {graded.exact ? t.dictation.perfect : t.dictation.almost}
          </p>
          <SentenceDiff result={graded.result} sentence={item.en} />
          {item.form !== "translate" && item.prompt && (
            <p dir="auto" className="text-muted-foreground text-lg">
              {item.prompt}
            </p>
          )}
          {graded.outcome === "missed" && (
            <p dir="auto" className="text-muted-foreground text-sm">
              {entry.attempt === 0 ? copy.missedFirst : copy.missedSecond}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <ContinueButton onClick={next}>{t.dictation.continue}</ContinueButton>
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
            <span className="text-muted-foreground text-sm" dir="auto">
              {t.dictation.pressEnterContinue}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
