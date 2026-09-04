"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, RotateCcw } from "lucide-react";

import { TypingSentence } from "@/components/learning/typing-sentence";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { useTypingSoundSettings } from "@/components/providers/typing-sound-settings-provider";
import { useTypingSound } from "@/hooks/use-typing-sound";
import { resolveSectionSentenceCompleteSound } from "@/lib/admin/typing-sound-settings";
import { fadeInUp, staggerChildren } from "@/lib/motion";
import type { Sentence } from "@/types/content";

/**
 * "Review my saves" — cycles through every sentence the learner has
 * bookmarked, using the exact same typing engine every ordinary lesson runs
 * on (TypingSentence in "normal" mode) rather than a passive flip-through
 * list. No XP/streak/mistake-tracking here, matching Fix Your Mistakes'
 * same choice for already-seen content (see that component's own doc
 * comment) — this is deliberately a pure practice loop, not a second way to
 * farm progress. No illustration either, same reasoning as Fix Your
 * Mistakes: the point is the sentence, not a scene to look at.
 */
export function SavedReviewSession({ sentences }: { sentences: Sentence[] }) {
  const [index, setIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const { t } = useLocale();
  const typingSoundSettings = useTypingSoundSettings();
  const { play, playSentenceComplete } = useTypingSound({
    pack: typingSoundSettings.soundPack,
    enabled: typingSoundSettings.enabled,
    volume: typingSoundSettings.volume,
    sentenceCompleteSound: typingSoundSettings.sentenceCompleteSound,
  });

  const total = sentences.length;
  const sentence = sentences[index];

  function handleComplete() {
    playSentenceComplete(resolveSectionSentenceCompleteSound(typingSoundSettings, "normal"));
    if (index + 1 < total) {
      setIndex((current) => current + 1);
    } else {
      setIsComplete(true);
    }
  }

  return (
    <div className="lg:h-full">
      <h1 className="sr-only">{t.bookLibrary.reviewSaves}</h1>
      <AnimatePresence mode="wait">
        {isComplete ? (
          <ReviewComplete key="complete" count={total} />
        ) : (
          <div key="content" className="flex flex-col lg:h-full">
            <div className="shrink-0 px-6 pt-4 lg:px-16 lg:pt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-primary text-xs font-semibold tracking-wide uppercase">
                  {t.bookLibrary.reviewSaves}
                </span>
                <span className="text-muted-foreground text-sm font-medium" dir="ltr">
                  {Math.min(index + 1, total)} / {total}
                </span>
              </div>
              <Progress value={(index / total) * 100} className="h-1" />
            </div>
            <div className="flex flex-1 flex-col justify-center px-6 pb-8 lg:justify-center lg:px-16">
              {sentence && (
                <TypingSentence
                  key={sentence.id}
                  sentence={sentence}
                  mode="normal"
                  onComplete={handleComplete}
                  onCorrectLetter={() => play("letter")}
                  onErrorLetter={() => play("error")}
                />
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReviewComplete({ count }: { count: number }) {
  const { t } = useLocale();

  return (
    <motion.div
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
      className="mx-auto flex h-full w-full max-w-sm flex-col items-center justify-center gap-4 px-6 py-16 text-center"
    >
      <motion.div
        variants={fadeInUp}
        className="bg-accent/15 text-accent flex size-14 items-center justify-center rounded-full"
      >
        <Bookmark className="size-7 fill-current" aria-hidden="true" />
      </motion.div>
      <motion.div variants={fadeInUp}>
        <h2 className="text-xl font-semibold tracking-tight">
          {t.bookLibrary.reviewCompleteHeading}
        </h2>
        <p className="text-muted-foreground mt-1.5 text-sm">
          {t.bookLibrary.reviewCompleteBody.replace("{n}", String(count))}
        </p>
      </motion.div>
      <motion.div variants={fadeInUp} className="mt-2 flex flex-col items-center gap-3">
        <Button asChild>
          <Link href="/learn/saved/review">
            <RotateCcw className="size-4" aria-hidden="true" />
            {t.wordLists.practiceAgain}
          </Link>
        </Button>
        <Link
          href="/learn/saved"
          className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
        >
          {t.nav.mySaves}
        </Link>
      </motion.div>
    </motion.div>
  );
}
