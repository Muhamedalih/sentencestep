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
import { markMistakeCorrectedAction, markReviewCompletedAction } from "@/lib/mistakes/actions";
import { popIn } from "@/lib/motion";
import type { WeakWordReason } from "@/lib/weak-words/types";
import type { VocabularyWord } from "@/types/word-lists";

export interface ReviewWord extends VocabularyWord {
  /** Same distinction as WeakWordItem.reason — which completion action a right answer triggers (see handleResult below). */
  reason: WeakWordReason;
}

/**
 * "Review All Words" — quizzes exactly the words src/lib/weak-words flagged
 * as currently weak, one at a time, until each is answered correctly. Not a
 * re-skin of VocabularyPractice's 4x5-block system: a review queue is
 * already a short, curated list (never a full 20-word group), so it's a
 * flat queue — wrong answers go to the back and keep coming back until
 * right, same retry feel, just without the block structure that only makes
 * sense for a full group.
 *
 * A right answer reuses the exact same completion actions "Fix Your
 * Mistakes" already calls (markMistakeCorrectedAction/
 * markReviewCompletedAction) — this screen is a second entry point into
 * that one account-wide mistake ledger, not a parallel tracking system.
 */
export function WordReviewSession({
  words,
  defaultVoiceId,
}: {
  words: ReviewWord[];
  /** Word Lists' one global voice (see VocabularyPractice's identical prop) — a review queue can span multiple word groups, so there's no single group-level voice to prefer here either. */
  defaultVoiceId?: string | null;
}) {
  const { t, dir } = useLocale();
  const [queue, setQueue] = useState<number[]>(() => words.map((_, i) => i));
  const [correctedCount, setCorrectedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  // Whether THIS presentation of the current word has had any wrong
  // Enter-submission yet — reset whenever the front of the queue changes
  // (a genuinely new word, or the same word coming back around after a
  // wrong attempt). Feeds markReviewCompletedAction's hadErrors param,
  // same as FixYourMistakesSession's identical per-item ref.
  const hadErrorRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    hadErrorRef.current = false;
  }, [currentIndex]);

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
      const action =
        word.reason === "review"
          ? markReviewCompletedAction(word.targetWord, hadErrorRef.current)
          : markMistakeCorrectedAction(word.targetWord);
      // Fire-and-forget, same reasoning as FixYourMistakesSession's
      // identical call: the word is already off the local queue below,
      // so a failed write is logged, not retried by re-blocking the learner.
      action.catch((error: unknown) => {
        console.error("[word-review] completion action failed", error);
      });
      setQueue((prev) => prev.slice(1));
    } else {
      play("error");
      hadErrorRef.current = true;
      setQueue((prev) => [...prev.slice(1), prev[0]!]);
    }
  }

  return (
    <div className="flex h-svh w-full flex-col">
      {!isComplete && <ShiftReplayHint />}
      <div className="shrink-0 px-6 pt-4 lg:px-16 lg:pt-5">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/learn/word-lists"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t.wordLists.navLabel}
          </Link>
          {!isComplete && (
            <span className="text-muted-foreground shrink-0 text-sm font-medium" dir="ltr">
              {correctedCount + 1} / {total}
            </span>
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
                <h2 className="text-2xl font-semibold tracking-tight">{t.mistakes.allCaughtUp}</h2>
                <p className="text-muted-foreground mt-1">
                  {t.mistakes.correctedCount.replace("{n}", String(correctedCount))}
                </p>
              </div>
              <Button asChild className="mt-2">
                <Link href="/learn/word-lists">{t.wordLists.backToWordLists}</Link>
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
              <div className="flex w-full max-w-2xl items-center justify-between">
                <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {t.wordLists.needsReviewHeading}
                </span>
                <div className="flex items-center gap-2">
                  <PronunciationSpeedControl inputRef={inputRef} />
                  <PronunciationButton
                    text={word.targetWord}
                    audioUrl={word.audioUrl}
                    onPlay={undefined}
                    autoPlay
                    resetKey={word.id}
                    inputRef={inputRef}
                    kokoroVoiceId={defaultVoiceId}
                    contentType="word"
                    contentId={word.id}
                  />
                </div>
              </div>

              {word.supportHint && (
                <p
                  className="text-foreground w-full max-w-2xl text-center text-2xl font-semibold text-balance sm:text-3xl"
                  dir={dir}
                >
                  {word.supportHint}
                </p>
              )}

              <div className="w-full max-w-2xl">
                <VocabularySentence
                  sentence={word.sentence}
                  targetWord={word.targetWord}
                  onResult={handleResult}
                  inputRef={inputRef}
                  fontFamily={sectionFontFamily}
                />
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
