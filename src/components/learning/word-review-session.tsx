"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { PronunciationButton } from "@/components/learning/pronunciation-button";
import { PronunciationSpeedControl } from "@/components/learning/pronunciation-speed-control";
import { ShiftReplayHint } from "@/components/learning/shift-replay-hint";
import { VocabularySentence } from "@/components/learning/vocabulary-sentence";
import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { useTypingSoundSettings } from "@/components/providers/typing-sound-settings-provider";
import { Button } from "@/components/ui/button";
import { useLessonFontSettings } from "@/components/providers/lesson-font-settings-provider";
import { useTypingSound } from "@/hooks/use-typing-sound";
import { resolveSectionFontFamily } from "@/lib/admin/lesson-font-settings";
import { resolveSectionSentenceCompleteSound } from "@/lib/admin/typing-sound-settings";
import { masterMistakeWordAction } from "@/lib/mistakes/actions";
import { markVocabularyRecallCompletedAction } from "@/lib/vocabulary-recall/actions";
import { popIn } from "@/lib/motion";
import type { WeakWordReason } from "@/lib/weak-words/types";
import { splitWordHint } from "@/lib/word-lists-hint";
import type { VoiceAudioContentType } from "@/lib/voice/voice-audio";
import type { VocabularyWord } from "@/types/word-lists";

export interface ReviewWord extends VocabularyWord {
  /** No longer read here (see handleResult below) — kept on the type since fetchWeakWordsAction still reports it, and it's still meaningful data even though this screen's own completion no longer branches on it. */
  reason: WeakWordReason;
  /** Vocabulary Recall only (variant="recall") — the lesson/story title this word's sentence came from, shown as a small context line under it (see sourceLabel below). Absent for Word Lists' own review queue. */
  lessonTitle?: string;
  /** Vocabulary Recall only — how many days ago this word was first met, paired with lessonTitle in the same context line. */
  daysAgo?: number;
  /**
   * Overrides PronunciationButton's default `contentType="word"` (which
   * looks this word up against Word Lists' own vocabulary_words catalog by
   * `id`) — Vocabulary Recall words aren't in that catalog at all, so they
   * set this to "sentence_word" instead (see fetchVocabularyRecallWordsAction),
   * which re-resolves real, synthesized pronunciation from the actual
   * lesson/story sentence via resolvePronunciationAudioAction, never the
   * browser's speech synthesis. Absent (default "word") for Word Lists'
   * own queue, unchanged from before this field existed.
   */
  pronunciationContentType?: VoiceAudioContentType;
  /** Paired with pronunciationContentType — defaults to this word's own `id` (a real vocabulary_words id) when absent, exactly as before this field existed. */
  pronunciationContentId?: string;
}

/**
 * Quizzes a short, curated queue of words one at a time, until each is
 * answered correctly — not a re-skin of VocabularyPractice's 4x5-block
 * system: a review queue is already short (never a full 20-word group), so
 * it's a flat queue where wrong answers go to the back and keep coming back
 * until right, same retry feel, just without the block structure that only
 * makes sense for a full group.
 *
 * Two callers, picked via `variant`:
 *  - "wordLists" (default) — "Review All Words", quizzing exactly the words
 *    src/lib/weak-words flagged as currently weak. A right answer here fully
 *    clears the word (masterMistakeWordAction), the same as
 *    VocabularyPractice's own completion — not the gradual, multi-session
 *    schedule FixYourMistakesSession's own items still use. Answering
 *    correctly in a screen called "Review All Words" is the whole point of
 *    the visit: a learner who does that shouldn't find the same word back
 *    in this list days later just because it takes two clean passes to
 *    graduate under the ordinary spaced-repetition schedule.
 *  - "recall" — Vocabulary Recall (src/lib/vocabulary-recall), quizzing
 *    words met in Normal lessons/Stories. A right answer here instead
 *    advances a real multi-session spaced schedule
 *    (markVocabularyRecallCompletedAction) — this queue is explicitly
 *    allowed to hand the same word back days later, since "words you've
 *    met" is meant to resurface on purpose, not graduate on one pass.
 *
 * The completion action is picked internally from `variant` (see
 * handleResult) rather than accepted as a function prop: this component is
 * rendered from a Server Component page (see /learn/recall/page.tsx), and
 * Next.js can only pass a real Server Action across that boundary, never an
 * inline arrow function wrapping one — importing both actions directly here
 * and branching on `variant` avoids that boundary entirely.
 */
export function WordReviewSession({
  words: initialWords,
  defaultVoiceId,
  variant = "wordLists",
  backHref,
}: {
  words: ReviewWord[];
  /** Word Lists' one global voice (see VocabularyPractice's identical prop) — a review queue can span multiple word groups, so there's no single group-level voice to prefer here either. */
  defaultVoiceId?: string | null;
  /**
   * Which flow this queue belongs to — picks copy, the back link, and the
   * completion action. "wordLists" (default) is the original "Review All
   * Words" flow this component was built for; "recall" is Vocabulary Recall
   * (src/lib/vocabulary-recall), sourced from Normal lesson/Story sentences
   * instead of Word Lists' own catalog, and framed as "words you've met"
   * rather than "words you got wrong."
   */
  variant?: "wordLists" | "recall";
  /**
   * Overrides variant's default back link (a plain string, not a function —
   * safe to pass from a Server Component, unlike onWordCompleted used to be).
   * Vocabulary Recall opens from a specific mode's own lesson-list page now
   * (see VocabularySectionRecallCard/`?mode=` on /learn/recall), so "back"
   * should return there, not to the generic /learn default.
   */
  backHref?: string;
}) {
  const { t, dir } = useLocale();
  // Snapshotted once at mount, deliberately NOT read live off the `words`
  // prop below: masterMistakeWordAction's own revalidatePath calls target
  // this exact page, since it's the one place they need to take effect on a
  // plain "go back" too (see that action's doc comment) — but that also
  // means completing a word HERE, on this already-mounted page, can trigger
  // Next's router to quietly refetch this route in the background and swap
  // in a fresh (now shorter, possibly reordered) `words` prop while a
  // session is still in progress. `queue` (below) already only ever holds
  // indices into whatever `words` looked like at mount — reading the LIVE
  // prop for anything else would silently misalign those indices against a
  // different array the moment that background refetch lands, which is
  // exactly what was pulling the current word out from under a learner
  // mid-keystroke. This local copy is what queue's indices actually index
  // into, for the entire lifetime of this session, regardless of anything
  // the server refetches in the meantime.
  const [words] = useState(initialWords);
  const [queue, setQueue] = useState<number[]>(() => words.map((_, i) => i));
  const [correctedCount, setCorrectedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Which word ids have had at least one wrong attempt so far this visit —
  // read once a word finally lands correct, to report hadErrors to the
  // recall completion action (see handleResult). A plain ref, not state: it
  // never drives a render itself, only what gets reported alongside the
  // next correct answer.
  const failedWordIdsRef = useRef<Set<string>>(new Set());
  const sectionFontFamily = resolveSectionFontFamily(useLessonFontSettings(), "wordLists");
  const typingSoundSettings = useTypingSoundSettings();
  const { play, playSentenceComplete } = useTypingSound({
    pack: typingSoundSettings.soundPack,
    enabled: typingSoundSettings.enabled,
    volume: typingSoundSettings.volume,
    sentenceCompleteSound: typingSoundSettings.sentenceCompleteSound,
  });

  const currentIndex: number | undefined = queue[0];
  const word = currentIndex !== undefined ? words[currentIndex] : undefined;
  const total = words.length;
  const hint = word?.supportHint
    ? splitWordHint(word.supportHint)
    : { term: undefined, definition: undefined };

  const resolvedBackHref = backHref ?? (variant === "recall" ? "/learn" : "/learn/word-lists");
  const backLabel = variant === "recall" ? t.mistakes.learningHome : t.wordLists.navLabel;
  const completeHeading =
    variant === "recall" ? t.vocabularyRecall.completeHeading : t.mistakes.allCaughtUp;
  const completeSubtitle = (
    variant === "recall" ? t.vocabularyRecall.completeSubtitle : t.mistakes.correctedCount
  ).replace("{n}", String(correctedCount));
  const contextLabel =
    variant === "recall" && word?.lessonTitle
      ? t.vocabularyRecall.sourceLabel
          .replace("{title}", word.lessonTitle)
          .replace("{n}", String(word.daysAgo ?? 1))
      : undefined;

  useEffect(() => {
    if (queue.length === 0) setIsComplete(true);
  }, [queue]);

  const { prefetchPronunciation } = usePronunciationSettings();
  const nextWord = queue.length > 1 ? words[queue[1]!] : undefined;
  useEffect(() => {
    if (!defaultVoiceId || !nextWord) return;
    prefetchPronunciation({ contentType: "word", contentId: nextWord.id, voiceId: defaultVoiceId });
  }, [nextWord, defaultVoiceId, prefetchPronunciation]);

  function handleResult(correct: boolean) {
    if (!word || currentIndex === undefined) return;
    if (correct) {
      playSentenceComplete(resolveSectionSentenceCompleteSound(typingSoundSettings, "wordLists"));
      setCorrectedCount((count) => count + 1);
      const hadErrors = failedWordIdsRef.current.delete(word.id);
      // Fire-and-forget, same reasoning as FixYourMistakesSession's
      // identical call: the word is already off the local queue below,
      // so a failed write is logged, not retried by re-blocking the learner.
      const complete =
        variant === "recall"
          ? markVocabularyRecallCompletedAction(word.targetWord, hadErrors)
          : masterMistakeWordAction(word.targetWord);
      complete.catch((error: unknown) => {
        console.error("[word-review] completion action failed", error);
      });
      setQueue((prev) => prev.slice(1));
    } else {
      play("error");
      failedWordIdsRef.current.add(word.id);
      setQueue((prev) => [...prev.slice(1), prev[0]!]);
    }
  }

  return (
    <div className="flex h-svh w-full flex-col">
      {!isComplete && <ShiftReplayHint />}
      <div className="shrink-0 px-6 pt-4 lg:px-16 lg:pt-5">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={resolvedBackHref}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {backLabel}
          </Link>
          {!isComplete && word && (
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-muted-foreground text-sm font-medium" dir="ltr">
                {correctedCount + 1} / {total}
              </span>
              <PronunciationSpeedControl inputRef={inputRef} />
              <PronunciationButton
                text={word.targetWord}
                audioUrl={word.audioUrl}
                autoPlay
                resetKey={word.id}
                inputRef={inputRef}
                kokoroVoiceId={defaultVoiceId}
                contentType={word.pronunciationContentType ?? "word"}
                contentId={word.pronunciationContentId ?? word.id}
                label={t.wordLists.replayAction}
                variant="outline"
                size="sm"
              />
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isComplete ? (
          <motion.div
            key="complete"
            className="flex flex-1 items-center justify-center px-6 py-8 lg:px-16"
          >
            <motion.div
              variants={popIn}
              initial="hidden"
              animate="visible"
              className="border-border bg-card flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border p-12 text-center"
            >
              <div className="bg-success/15 text-success flex size-14 items-center justify-center rounded-full">
                <CheckCircle2 className="size-7" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">{completeHeading}</h2>
                <p className="text-muted-foreground mt-1">{completeSubtitle}</p>
              </div>
              <Button asChild className="mt-2">
                <Link href={resolvedBackHref}>
                  {variant === "recall" ? backLabel : t.wordLists.backToWordLists}
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          word && (
            <motion.div
              key={word.id}
              initial={false}
              className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-8 lg:px-16"
            >
              {hint.term && (
                <div className="flex w-full max-w-2xl flex-col items-center gap-2 text-center">
                  <p
                    className="text-foreground text-[clamp(1.75rem,1.4rem+1.6vw,2.25rem)] leading-tight font-bold text-balance"
                    dir={dir}
                  >
                    {hint.term}
                  </p>
                  {hint.definition && (
                    <p
                      className="text-muted-foreground text-[clamp(0.85rem,0.8rem+0.3vw,1rem)] font-medium"
                      dir={dir}
                    >
                      {hint.definition}
                    </p>
                  )}
                </div>
              )}

              <div className="bg-border h-10 w-px" aria-hidden="true" />

              <div className="flex w-full max-w-2xl flex-col items-center gap-2">
                <VocabularySentence
                  sentence={word.sentence}
                  targetWord={word.targetWord}
                  onResult={handleResult}
                  inputRef={inputRef}
                  fontFamily={sectionFontFamily}
                />
                {contextLabel && (
                  <p className="text-muted-foreground text-xs font-medium">{contextLabel}</p>
                )}
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
