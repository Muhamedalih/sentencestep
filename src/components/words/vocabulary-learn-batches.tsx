"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";

import { PronunciationButton } from "@/components/learning/pronunciation-button";
import { ShiftReplayHint } from "@/components/learning/shift-replay-hint";
import { useLocale } from "@/components/providers/locale-provider";
import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/words/count-up";
import { MasteryRing } from "@/components/words/mastery-ring";
import { WordPosBadge } from "@/components/words/word-pos-badge";
import { cn } from "@/lib/utils";
import { splitWordHint } from "@/lib/word-lists-hint";
import { formatIpa } from "@/lib/word-lists-ipa";
import { chunk } from "@/lib/word-mastery/dashboard";
import { recordLearnChoiceAction } from "@/lib/word-mastery/actions";
import type { LearnChoice } from "@/lib/word-mastery/types";
import { BLANK_TOKEN } from "@/types/word-lists";
import type { VocabularyWord, WordGroup } from "@/types/word-lists";

/** Cards per batch: five words is what a learner can hold in mind at once, instead of walking through 25 cards in a row. */
export const LEARN_BATCH_SIZE = 5;

/** A drag this far (px), or this fast (px/s), turns the card. */
const SWIPE_DISTANCE = 70;
const SWIPE_VELOCITY = 500;

const cardVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction === 0 ? 0 : direction > 0 ? 48 : -48,
    scale: 0.96,
  }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction === 0 ? 0 : direction > 0 ? -48 : 48,
    scale: 0.96,
  }),
};

/**
 * The redesigned Learn: the topic's words in batches of five, one card at a
 * time — the word, how it sounds (IPA), its type, what it means and the
 * sentence it lives in. A card turns with the arrows (or the arrow keys) or by
 * swiping it, and each card asks one thing: "I know it" or "Still learning".
 * That answer is stored on the learner's review schedule (see
 * recordLearnChoiceAction): words they are still learning come back tomorrow,
 * and one they already know starts at the first rung without being credited as
 * recalled. After the five, a summary says how it went and opens the next batch;
 * after the last, it hands over to practice.
 *
 * Nothing here is graded, and nothing is written for a guest or when Smart word
 * practice is off (`spaced` false): the buttons then just keep the visit's tally
 * for the summary.
 */
export function VocabularyLearnBatches({
  group,
  defaultVoiceId,
  spaced,
}: {
  group: WordGroup;
  defaultVoiceId?: string | null;
  /** The learner's answers are stored on their schedule. */
  spaced: boolean;
}) {
  const { t, dir } = useLocale();
  const copy = t.wordLists.redesign;
  const reducedMotion = useReducedMotion() ?? false;

  const batches = useMemo(
    () =>
      chunk(
        [...group.words].sort((a, b) => a.order - b.order),
        LEARN_BATCH_SIZE,
      ),
    [group.words],
  );
  const [batchIndex, setBatchIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [answers, setAnswers] = useState<ReadonlyMap<string, LearnChoice>>(() => new Map());

  const batch = useMemo(() => batches[batchIndex] ?? [], [batches, batchIndex]);
  const word: VocabularyWord | undefined = batch[cardIndex];
  const isLastBatch = batchIndex >= batches.length - 1;

  const goNext = useCallback(() => {
    setDirection(1);
    if (cardIndex + 1 >= batch.length) setShowSummary(true);
    else setCardIndex(cardIndex + 1);
  }, [cardIndex, batch.length]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    if (showSummary) setShowSummary(false);
    else if (cardIndex > 0) setCardIndex(cardIndex - 1);
  }, [cardIndex, showSummary]);

  // Arrow keys turn the card, like the buttons.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowRight") goNext();
      else if (event.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  // Resolve the neighbouring cards' pronunciation in the background (both directions: the
  // learner can go back), so their speaker finds it cached instead of paying a round trip.
  const { prefetchPronunciation } = usePronunciationSettings();
  useEffect(() => {
    if (!defaultVoiceId) return;
    for (const neighbor of [batch[cardIndex + 1], batch[cardIndex - 1]]) {
      if (!neighbor || neighbor.audioUrl) continue;
      prefetchPronunciation({
        contentType: "word",
        contentId: neighbor.id,
        voiceId: defaultVoiceId,
      });
    }
  }, [batch, cardIndex, defaultVoiceId, prefetchPronunciation]);

  function choose(target: VocabularyWord, choice: LearnChoice) {
    setAnswers((previous) => new Map(previous).set(target.id, choice));
    if (spaced) {
      recordLearnChoiceAction({ wordId: target.id, choice }).catch((error: unknown) => {
        console.error("[word-lists] recordLearnChoiceAction failed", error);
      });
    }
    goNext();
  }

  function openBatch(index: number) {
    setBatchIndex(index);
    setCardIndex(0);
    setDirection(0);
    setShowSummary(false);
  }

  const known = batch.filter((item) => answers.get(item.id) === "known").length;
  const stillLearning = batch.filter((item) => answers.get(item.id) === "learning").length;
  const unanswered = batch.length - known - stillLearning;

  if (batch.length === 0) return null;

  return (
    <div className="flex h-svh w-full flex-col">
      <ShiftReplayHint />

      <div className="shrink-0 px-6 pt-4 lg:px-16 lg:pt-5">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4">
          <Link
            href={`/learn/word-lists/${group.id}/words`}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span dir="ltr">{group.title}</span>
          </Link>
          {word && !showSummary && (
            <PronunciationButton
              text={word.targetWord}
              audioUrl={word.audioUrl}
              autoPlay
              resetKey={word.id}
              kokoroVoiceId={defaultVoiceId}
              contentType="word"
              contentId={word.id}
              label={t.wordLists.replayAction}
              variant="outline"
              size="sm"
            />
          )}
        </div>

        <div className="mx-auto mt-3 w-full max-w-2xl" dir={dir}>
          <div className="text-muted-foreground mb-1.5 flex items-center justify-between text-xs font-semibold">
            <span>
              {copy.learnBatchTitle
                .replace("{current}", String(batchIndex + 1))
                .replace("{total}", String(batches.length))}
            </span>
            {!showSummary && (
              <span className="tabular-nums" dir="ltr">
                {copy.learnCounter
                  .replace("{current}", String(cardIndex + 1))
                  .replace("{total}", String(batch.length))}
              </span>
            )}
          </div>
          <div className="flex gap-1" dir="ltr">
            {batches.map((_, index) => (
              <span
                key={index}
                className="bg-muted-foreground/20 h-1.5 flex-1 overflow-hidden rounded-full"
              >
                <span
                  className="bg-primary block h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
                  style={{
                    width: `${
                      index < batchIndex
                        ? 100
                        : index === batchIndex
                          ? ((showSummary ? batch.length : cardIndex) / batch.length) * 100
                          : 0
                    }%`,
                  }}
                />
              </span>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait" custom={direction} initial={false}>
        {showSummary ? (
          <motion.div
            key={`summary-${batchIndex}`}
            custom={direction}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 340, damping: 32, mass: 0.9 }}
            className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-6 text-center"
            dir={dir}
          >
            <MasteryRing
              bands={{
                total: batch.length,
                mastered: known,
                learning: stillLearning,
                new: unanswered,
              }}
              size={120}
              stroke={11}
              label={copy.learnBatchSummary
                .replace("{known}", String(known))
                .replace("{total}", String(batch.length))
                .replace("{learning}", String(stillLearning))}
            >
              <span className="text-3xl font-bold tabular-nums" dir="ltr">
                <CountUp value={known} />
                <span className="text-muted-foreground text-base font-semibold">
                  {" "}
                  / {batch.length}
                </span>
              </span>
            </MasteryRing>

            <div className="max-w-md">
              <h2 className="text-2xl font-semibold tracking-tight">{copy.learnBatchDone}</h2>
              <p className="text-muted-foreground mt-1.5">
                {copy.learnBatchSummary
                  .replace("{known}", String(known))
                  .replace("{total}", String(batch.length))
                  .replace("{learning}", String(stillLearning))}
              </p>
              {unanswered > 0 && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {copy.learnUnanswered.replace("{n}", String(unanswered))}
                </p>
              )}
              {spaced && (
                <p className="text-muted-foreground/80 mt-3 text-xs">{copy.learnSavedNote}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="outline" className="gap-1.5" onClick={() => openBatch(batchIndex)}>
                <RotateCcw className="size-4" aria-hidden="true" />
                {copy.learnRepeatBatch}
              </Button>
              {isLastBatch ? (
                <Button asChild size="lg">
                  <Link href={`/learn/word-lists/${group.id}`}>{copy.learnStartPractice}</Link>
                </Button>
              ) : (
                <Button size="lg" onClick={() => openBatch(batchIndex + 1)}>
                  {copy.learnNextBatch.replace(
                    "{n}",
                    String(batches[batchIndex + 1]?.length ?? LEARN_BATCH_SIZE),
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          word && (
            <LearnCard
              key={word.id}
              word={word}
              direction={direction}
              reducedMotion={reducedMotion}
              answer={answers.get(word.id)}
              onChoose={(choice) => choose(word, choice)}
              onPrev={goPrev}
              onNext={goNext}
              position={cardIndex}
              batchLength={batch.length}
            />
          )
        )}
      </AnimatePresence>
    </div>
  );
}

function LearnCard({
  word,
  direction,
  reducedMotion,
  answer,
  onChoose,
  onPrev,
  onNext,
  position,
  batchLength,
}: {
  word: VocabularyWord;
  direction: number;
  reducedMotion: boolean;
  answer: LearnChoice | undefined;
  onChoose: (choice: LearnChoice) => void;
  onPrev: () => void;
  onNext: () => void;
  position: number;
  batchLength: number;
}) {
  const { t, dir } = useLocale();
  const copy = t.wordLists.redesign;

  const hint = word.supportHint ?? word.hintAr;
  const { term, definition } = hint
    ? splitWordHint(hint)
    : { term: undefined, definition: undefined };
  const ipa = formatIpa(word.ipa);
  const [prefix, suffix] = useMemo(() => {
    const parts = word.sentence.split(BLANK_TOKEN);
    return [parts[0]?.trim() ?? "", parts[1]?.trim() ?? ""];
  }, [word.sentence]);

  return (
    <motion.div
      custom={direction}
      variants={cardVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", stiffness: 340, damping: 32, mass: 0.9 }}
      // Swiping turns the card; vertical movement stays the page's own scroll.
      drag={reducedMotion ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.5}
      style={{ touchAction: "pan-y" }}
      onDragEnd={(_, info) => {
        if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) onNext();
        else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) onPrev();
      }}
      className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 overflow-y-auto px-6 py-6"
    >
      <div className="flex w-full max-w-2xl flex-col items-center gap-2 text-center">
        <WordPosBadge pos={word.pos} />
        {term && (
          <p
            className="text-foreground text-[clamp(1.75rem,1.4rem+1.6vw,2.25rem)] leading-tight font-bold text-balance"
            dir={dir}
          >
            {term}
          </p>
        )}
        {definition && (
          <p
            className="text-muted-foreground text-[clamp(0.85rem,0.8rem+0.3vw,1rem)] font-medium"
            dir={dir}
          >
            {definition}
          </p>
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        <p
          dir="ltr"
          className="text-primary text-[clamp(3rem,1.6rem+6vw,7rem)] leading-none font-extrabold tracking-tight"
        >
          {word.targetWord}
        </p>
        {ipa && (
          <p dir="ltr" className="text-muted-foreground text-lg font-medium tracking-wide">
            {ipa}
          </p>
        )}
      </div>

      <p
        dir="ltr"
        className="text-foreground w-full max-w-2xl text-center text-[clamp(1.2rem,1.05rem+1.2vw,1.6rem)] leading-relaxed font-medium text-balance"
      >
        {prefix && <span>{prefix} </span>}
        <span className="bg-primary/10 text-primary mx-1 inline-block rounded-md px-2 py-0.5 font-semibold">
          {word.targetWord}
        </span>
        {suffix && <span> {suffix}</span>}
      </p>

      <div className="mt-1 flex w-full max-w-md flex-col items-center gap-4">
        <div className="flex w-full gap-3" dir={dir}>
          <Button
            type="button"
            variant="outline"
            size="lg"
            aria-pressed={answer === "learning"}
            onClick={() => onChoose("learning")}
            className={cn(
              "flex-1",
              answer === "learning" && "border-primary bg-primary/10 text-primary",
            )}
          >
            {copy.learnStill}
          </Button>
          <Button
            type="button"
            size="lg"
            aria-pressed={answer === "known"}
            onClick={() => onChoose("known")}
            className={cn("flex-1 gap-1.5", answer === "known" && "ring-success ring-2")}
          >
            {answer === "known" && <Check className="size-4" aria-hidden="true" />}
            {copy.learnKnown}
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onPrev}
            disabled={position === 0}
            aria-label={t.wordLists.prevWordAria}
            className="text-muted-foreground hover:text-foreground hover:border-primary/40 border-border flex size-9 items-center justify-center rounded-full border transition-colors disabled:opacity-30"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </button>
          <span className="text-muted-foreground flex items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: batchLength }, (_, index) => (
              <span
                key={index}
                className={cn(
                  "size-1.5 rounded-full transition-colors",
                  index === position ? "bg-primary" : "bg-muted-foreground/30",
                )}
              />
            ))}
          </span>
          <button
            type="button"
            onClick={onNext}
            aria-label={t.wordLists.nextWordAria}
            className="text-muted-foreground hover:text-foreground hover:border-primary/40 border-border flex size-9 items-center justify-center rounded-full border transition-colors"
          >
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
        <p className="text-muted-foreground/80 text-xs" dir={dir}>
          {copy.learnSwipeHint}
        </p>
      </div>
    </motion.div>
  );
}
