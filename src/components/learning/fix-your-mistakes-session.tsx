"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, Home, Loader2 } from "lucide-react";

import { CurrentWordCard } from "@/components/learning/current-word-card";
import {
  PrimaryActionButton,
  SecondaryActionButton,
} from "@/components/learning/lesson-completion";
import { MistakeReviewSentence } from "@/components/learning/mistake-review-sentence";
import {
  mistakeRevealDurationMs,
  MistakeWordPreview,
} from "@/components/learning/mistake-word-preview";
import { PronunciationButton } from "@/components/learning/pronunciation-button";
import { PronunciationSpeedControl } from "@/components/learning/pronunciation-speed-control";
import { ShiftReplayHint } from "@/components/learning/shift-replay-hint";
import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { useLessonCompletionTheme } from "@/components/providers/lesson-completion-theme-provider";
import { useTypingSoundSettings } from "@/components/providers/typing-sound-settings-provider";
import { useLessonFontSettings } from "@/components/providers/lesson-font-settings-provider";
import { useTypingSound } from "@/hooks/use-typing-sound";
import { deriveLessonCompletionStyles } from "@/lib/admin/lesson-completion-theme";
import { resolveSectionFontFamily } from "@/lib/admin/lesson-font-settings";
import { resolveSectionSentenceCompleteSound } from "@/lib/admin/typing-sound-settings";
import {
  fetchMistakesAction,
  markMistakeCorrectedAction,
  markReviewCompletedAction,
} from "@/lib/mistakes/actions";
import type { MistakeQueueItem } from "@/lib/mistakes/types";
import { fadeInUp, staggerChildren } from "@/lib/motion";
import type { NextLessonRef } from "@/types/content";

/** Reveal fully shown, then held, before the transition to typing — see the preview animation requirement ("hold the complete word visible for at least ~1000ms"). */
const REVEAL_HOLD_MS = 1000;

/**
 * The "Fix Your Mistakes" flow itself — mounted by LessonSession as a third
 * AnimatePresence branch (alongside the normal lesson content and the
 * ordinary completion screen), replacing lesson content entirely rather than
 * living on its own route: it fetches its own fresh, fully-ordered queue on
 * mount (see fetchMistakesAction — content order, not stored, not the stale
 * count LessonCompletion used to decide whether to show its CTA), works
 * through it one word at a time with automatic progression, and shows its
 * own small completion state once empty. No illustration is rendered here by
 * design (see the feature's own requirement) — everything else (typing
 * engine, pronunciation, speed control, Shift, sounds) is the exact same
 * shared machinery every other lesson screen uses.
 */
export function FixYourMistakesSession({
  lessonId,
  defaultVoiceId,
  nextLesson,
}: {
  /** The lesson whose completion screen opened this flow (see LessonSession) — scopes the fetched queue to only this lesson's own mistakes/due reviews (see fetchMistakesAction's own doc comment for why the underlying table is account-wide but this view isn't). */
  lessonId: string;
  /** The site-wide default Kokoro voice (see getDefaultVoiceId), passed down from the lesson page. Mistakes can originate from lessons with different per-lesson voice overrides; using one consistent voice for the whole review session (rather than switching voice mid-session per item) is a deliberate simplification — the same one Word Lists already makes for its own cross-lesson vocabulary practice. */
  defaultVoiceId?: string | null;
  /** Same "what's next" lesson the ordinary completion screen would have offered — FYM's own completion screen offers the identical destination as its secondary action. */
  nextLesson?: NextLessonRef;
}) {
  const { t } = useLocale();
  const [queue, setQueue] = useState<MistakeQueueItem[] | null>(null);
  const [correctedCount, setCorrectedCount] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sectionFontFamily = resolveSectionFontFamily(useLessonFontSettings(), "fixMistakes");
  const typingSoundSettings = useTypingSoundSettings();
  const { play, playSentenceComplete } = useTypingSound({
    pack: typingSoundSettings.soundPack,
    enabled: typingSoundSettings.enabled,
    volume: typingSoundSettings.volume,
    sentenceCompleteSound: typingSoundSettings.sentenceCompleteSound,
  });
  const { prefetchPronunciation, registerResolvedAudio } = usePronunciationSettings();

  useEffect(() => {
    let cancelled = false;
    fetchMistakesAction(lessonId)
      .then((items) => {
        if (!cancelled) setQueue(items);
      })
      .catch((error: unknown) => {
        console.error("[mistakes] fetchMistakesAction failed", error);
        if (!cancelled) {
          setLoadError(true);
          setQueue([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const current = queue?.[0];

  // Root-cause fix #1: an item's own server-side cache-only pre-resolution
  // (see fetchMistakesAction) only ever reached PronunciationButton's shared
  // resolved-audio cache once THAT item's own button actually mounted (see
  // its registration effect) — by which point there's no lead time left at
  // all, since only the CURRENT item is ever mounted. Registering every
  // item's already-known audioUrl here, as soon as the queue itself is
  // known, gives every already-cached word (the common case: voice_audio_
  // cache is keyed on voice+word text alone, so most mistake words were
  // already generated by some earlier learner mistyping them somewhere else
  // — see fetchMistakesAction's own doc comment) the exact same
  // zero-round-trip path word 1 always had, the moment the queue loads, not
  // whenever its own turn comes up. registerResolvedAudio is a plain
  // idempotent cache write, so re-running this on every queue change is
  // safe.
  useEffect(() => {
    if (!queue) return;
    for (const item of queue) {
      if (item.audioUrl) registerResolvedAudio(`${item.sentenceId}::${item.word}`, item.audioUrl);
    }
  }, [queue, registerResolvedAudio]);

  // Root-cause fix #2, for the remaining case (a word genuinely never
  // generated before, so the cache-only lookup above came back empty): a
  // single word's preview+typing cycle is far shorter than a full
  // sentence's, so prefetching only ONE item ahead (this effect's original
  // form) frequently didn't leave enough lead time for a real Kokoro
  // generation to finish in the background before that word's own turn —
  // playback would then still block on the tail of that same resolve,
  // which is the measured source of the residual "small but noticeable"
  // delay. Fix Your Mistakes queues are lesson-scoped and small (a handful
  // of items — see fetchMistakesAction), unlike a full lesson's entire
  // sentence list, so prefetching every remaining item up front — not just
  // the next one — is cheap and gives every item the maximum possible lead
  // time instead of just the previous item's. A no-op for anything already
  // cached or already in flight (see prefetchPronunciation/resolveAudio's
  // own dedup), so this never duplicates a request.
  useEffect(() => {
    if (!defaultVoiceId || !queue) return;
    for (const item of queue.slice(1)) {
      prefetchPronunciation({
        contentType: "sentence_word",
        contentId: `${item.sentenceId}::${item.word}`,
        voiceId: defaultVoiceId,
      });
    }
  }, [queue, defaultVoiceId, prefetchPronunciation]);

  /**
   * `hadErrors` is whether the learner made any mistake while retyping the
   * word THIS time — irrelevant for a first-ever correction (there's no
   * schedule yet to demote from), but it's what markReviewCompletedAction
   * uses to decide whether a due review advances the schedule or resets it
   * (see that action's doc comment).
   */
  function handleWordCorrected(hadErrors: boolean) {
    if (!current) return;
    playSentenceComplete(resolveSectionSentenceCompleteSound(typingSoundSettings, "fixMistakes"));
    setCorrectedCount((count) => count + 1);
    // Removed from the queue locally the moment it's corrected/reviewed —
    // the corresponding write (below) is fire-and-forget from the UI's
    // perspective, same pattern as useMistakes.recordSentenceMistakes: a
    // failed write is logged, not retried by re-blocking the learner, since
    // the row was already advanced → not by THIS action succeeding or
    // failing to re-render, only by the database write itself.
    const action = current.isReview
      ? markReviewCompletedAction(current.word, hadErrors)
      : markMistakeCorrectedAction(current.word);
    action.catch((error: unknown) => {
      console.error("[mistakes] completion action failed", error);
    });
    setQueue((previous) => (previous ? previous.slice(1) : previous));
  }

  return (
    <div className="flex flex-col lg:h-full">
      {queue !== null && queue.length > 0 && <ShiftReplayHint />}
      <div className="shrink-0 px-6 pt-4 lg:px-16 lg:pt-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-primary text-xs font-semibold tracking-wide uppercase">
            {current?.isReview ? t.mistakes.reviewLabel : t.lesson.fixMistakes}
          </span>
          {queue !== null && queue.length > 0 && (
            <span className="text-muted-foreground text-sm font-medium">
              {t.mistakes.itemsLeft.replace("{n}", String(correctedCount + queue.length))}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 pb-8 lg:px-16">
        {queue === null ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-16">
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            {t.mistakes.loading}
          </div>
        ) : current ? (
          <MistakeItemSession
            key={current.word}
            item={current}
            defaultVoiceId={defaultVoiceId}
            inputRef={inputRef}
            onWordCorrected={handleWordCorrected}
            onCorrectLetter={() => play("letter")}
            onErrorLetter={() => play("error")}
            fontFamily={sectionFontFamily}
          />
        ) : (
          <FixYourMistakesComplete
            correctedCount={correctedCount}
            nextLesson={nextLesson}
            loadError={loadError && correctedCount === 0}
          />
        )}
      </div>
    </div>
  );
}

function MistakeItemSession({
  item,
  defaultVoiceId,
  inputRef,
  onWordCorrected,
  onCorrectLetter,
  onErrorLetter,
  fontFamily,
}: {
  item: MistakeQueueItem;
  defaultVoiceId?: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  onWordCorrected: (hadErrors: boolean) => void;
  onCorrectLetter: () => void;
  onErrorLetter: () => void;
  /** Admin -> Fonts' Fix Your Mistakes override (see resolveSectionFontFamily), threaded down from the parent, which is the one that reads the settings context. */
  fontFamily?: string;
}) {
  const reducedMotion = useReducedMotion() ?? false;
  const [phase, setPhase] = useState<"preview" | "typing">("preview");
  const { dir } = useLocale();

  // Reset by this component remounting fresh per item (key={item.word} in
  // the parent) — whether THIS attempt at the word had any wrong keystroke,
  // reported to onWordCorrected so a due review can tell a clean pass from
  // a shaky one (see markReviewCompletedAction). Irrelevant for a
  // never-yet-corrected mistake, but always tracked/passed either way —
  // simpler than threading item.isReview through here just to skip it.
  const hadErrorRef = useRef(false);

  // Runs exactly once per mounted item (this component remounts fresh for
  // every new item via its `key={item.word}` in the parent, so there is no
  // resetKey to track): hold the fully-revealed word for REVEAL_HOLD_MS
  // before moving on, matching the "hold the complete word visible for at
  // least ~1000ms" requirement.
  useEffect(() => {
    const timer = setTimeout(
      () => setPhase("typing"),
      mistakeRevealDurationMs(item.displayWord) + REVEAL_HOLD_MS,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire exactly once on mount
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end gap-2">
        <PronunciationSpeedControl inputRef={inputRef} />
        <PronunciationButton
          text={item.displayWord}
          audioUrl={item.audioUrl}
          autoPlay
          resetKey={item.word}
          inputRef={inputRef}
          kokoroVoiceId={defaultVoiceId}
          contentType="sentence_word"
          contentId={`${item.sentenceId}::${item.word}`}
        />
      </div>

      <AnimatePresence mode="wait">
        {phase === "preview" ? (
          <motion.div
            key="preview"
            initial={reducedMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-3"
          >
            {/* Bound to the exact same "preview" branch as the word reveal
                itself, not a separately-timed element — the translation and
                the word are siblings inside one AnimatePresence branch keyed
                on `phase`, so React mounts and unmounts them together on the
                same phase flip. There is no separate timer to desync from. */}
            <CurrentWordCard word={item.wordTranslation} dir={dir} />
            <MistakeWordPreview word={item.displayWord} reducedMotion={reducedMotion} />
          </motion.div>
        ) : (
          <motion.div
            key="typing"
            initial={reducedMotion ? undefined : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Quote-card treatment: an accent-toned start border groups the
                sentence and its translation as one unit, rather than two
                disconnected lines of plain text floating on the page. */}
            <div className="border-primary/50 bg-card/60 rounded-xl border-s-[3px] px-5 py-5 sm:px-7 sm:py-6">
              <MistakeReviewSentence
                sentence={item.sentenceEn}
                targetWord={item.displayWord}
                errorIndexes={item.errorIndexes}
                onComplete={() => onWordCorrected(hadErrorRef.current)}
                onCorrectLetter={onCorrectLetter}
                onErrorLetter={() => {
                  hadErrorRef.current = true;
                  onErrorLetter();
                }}
                inputRef={inputRef}
                fontFamily={fontFamily}
              />
              <p className="text-muted-foreground mt-4 text-base sm:text-lg" dir={dir}>
                {item.sentenceSupportText ?? item.sentenceEn}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FixYourMistakesComplete({
  correctedCount,
  nextLesson,
  loadError,
}: {
  correctedCount: number;
  nextLesson?: NextLessonRef;
  loadError: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const { t } = useLocale();
  const theme = useLessonCompletionTheme();
  const styles = deriveLessonCompletionStyles(theme);
  const hasCount = correctedCount > 0 && !loadError;

  return (
    <motion.div
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
      style={{ color: styles.textPrimary, gap: `${theme.sectionSpacing}px` }}
      className="mx-auto flex w-full max-w-sm flex-col items-center py-8 text-center"
    >
      {/* Same rotated "sticker" hero as LessonCompletion's own accuracy
          card — this screen belongs to the same completion-screen family,
          not a separately-styled generic card. */}
      {hasCount ? (
        <motion.div
          variants={fadeInUp}
          dir="ltr"
          initial={reducedMotion ? undefined : { rotate: -9 }}
          animate={{ rotate: -2 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 140, damping: 9, delay: 0.1 }
          }
          style={{
            backgroundColor: "oklch(0.96 0.015 85)",
            color: "oklch(0.32 0.03 60)",
            boxShadow: "0 3px 0 0 oklch(0.85 0.03 80), 0 10px 20px -8px rgba(0,0,0,0.45)",
            padding: `${Math.round(theme.cardPadding * 0.9)}px ${theme.cardPadding * 1.6}px`,
          }}
          className="flex flex-col items-center gap-0.5 rounded-2xl"
        >
          <span
            style={{ fontSize: theme.heroNumberSize * 0.6 }}
            className="leading-none font-extrabold tabular-nums"
          >
            +{correctedCount}
          </span>
          <span className="text-xs font-semibold tracking-wide uppercase opacity-70">
            {t.mistakes.fixedLabel}
          </span>
        </motion.div>
      ) : (
        <motion.div
          variants={fadeInUp}
          className="bg-success/15 text-success flex size-14 items-center justify-center rounded-full"
        >
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </motion.div>
      )}

      <motion.div variants={fadeInUp} className="mt-2">
        <h2
          style={{ fontSize: theme.headingSize, fontWeight: theme.headingWeight }}
          className="tracking-tight"
        >
          {loadError ? t.mistakes.nothingToFix : t.mistakes.allCaughtUp}
        </h2>
        <p style={{ fontSize: theme.bodySize, color: styles.textSecondary }} className="mt-1.5">
          {loadError
            ? t.mistakes.loadError
            : correctedCount > 0
              ? t.mistakes.correctedCount.replace("{n}", String(correctedCount))
              : t.mistakes.noOutstanding}
        </p>
      </motion.div>

      <motion.div
        variants={fadeInUp}
        style={{ gap: theme.cardSpacing }}
        className="mt-2 flex flex-col items-center"
      >
        {nextLesson && (
          <PrimaryActionButton
            icon={ArrowRight}
            label={t.lesson.nextLesson}
            href={`/learn/${nextLesson.mode}/${nextLesson.id}`}
            theme={theme}
          />
        )}
        <SecondaryActionButton
          icon={Home}
          label={t.mistakes.learningHome}
          href="/learn"
          theme={theme}
          styles={styles}
        />
      </motion.div>
    </motion.div>
  );
}
