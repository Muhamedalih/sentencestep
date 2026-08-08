"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, PartyPopper } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TypingSentence } from "@/components/learning/typing-sentence";
import { useProgress } from "@/hooks/use-progress";
import { useTypingSound } from "@/hooks/use-typing-sound";
import { popIn } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { LessonUnit } from "@/types/content";

export function LessonSession({ unit, nextLesson }: { unit: LessonUnit; nextLesson?: LessonUnit }) {
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const { markComplete } = useProgress();
  const { play } = useTypingSound();
  const correctCountRef = useRef(0);
  const errorCountRef = useRef(0);

  const total = unit.sentences.length;
  const sentence = unit.sentences[sentenceIndex];

  function handleSentenceComplete() {
    if (sentenceIndex + 1 < total) {
      setSentenceIndex((index) => index + 1);
    } else {
      play("complete");
      const attempts = correctCountRef.current + errorCountRef.current;
      const accuracy = attempts === 0 ? 1 : correctCountRef.current / attempts;
      markComplete(unit.mode, unit.id, accuracy);
      setIsComplete(true);
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link
          href={`/learn/${unit.mode}`}
          className="text-muted-foreground hover:text-foreground inline-flex min-w-0 items-center gap-1.5 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="size-4 shrink-0" />
          <span className="truncate">{unit.title}</span>
        </Link>
        <span className="text-muted-foreground shrink-0 text-sm font-medium">
          {Math.min(sentenceIndex + 1, total)} / {total}
        </span>
      </div>

      <div className="mb-6 flex gap-1.5" aria-hidden="true">
        {unit.sentences.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              index < sentenceIndex || isComplete
                ? "bg-success"
                : index === sentenceIndex
                  ? "bg-primary"
                  : "bg-muted",
            )}
          />
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        {isComplete ? "Lesson complete" : `Sentence ${sentenceIndex + 1} of ${total}`}
      </p>

      <AnimatePresence mode="wait">
        {isComplete ? (
          <motion.div
            key="complete"
            variants={popIn}
            initial="hidden"
            animate="visible"
            className="border-border bg-card flex flex-col items-center gap-4 rounded-2xl border p-12 text-center"
          >
            <div className="bg-success/15 text-success flex size-14 items-center justify-center rounded-full">
              <PartyPopper className="size-7" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Lesson complete</h2>
              <p className="text-muted-foreground mt-1">
                Great work — that&rsquo;s one more lesson learned.
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <Button variant="outline" asChild>
                <Link href={`/learn/${unit.mode}`}>Back to lessons</Link>
              </Button>
              {nextLesson && (
                <Button asChild>
                  <Link href={`/learn/${unit.mode}/${nextLesson.id}`}>
                    Next lesson
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          sentence && (
            <TypingSentence
              key={sentence.id}
              sentence={sentence}
              onComplete={handleSentenceComplete}
              onCorrectLetter={() => {
                correctCountRef.current += 1;
                play("letter");
              }}
              onErrorLetter={() => {
                errorCountRef.current += 1;
              }}
            />
          )
        )}
      </AnimatePresence>
    </div>
  );
}
