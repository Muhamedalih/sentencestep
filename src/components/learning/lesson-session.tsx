"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import { LessonCompletion } from "@/components/learning/lesson-completion";
import { LessonProgress } from "@/components/learning/lesson-progress";
import { TypingSentence } from "@/components/learning/typing-sentence";
import { useProgress } from "@/hooks/use-progress";
import { useTypingSound } from "@/hooks/use-typing-sound";
import type { LessonUnit } from "@/types/content";

export function LessonSession({ unit, nextLesson }: { unit: LessonUnit; nextLesson?: LessonUnit }) {
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [finalAccuracy, setFinalAccuracy] = useState(1);
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
      setFinalAccuracy(accuracy);
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

      <LessonProgress total={total} currentIndex={sentenceIndex} isComplete={isComplete} />

      <p className="sr-only" aria-live="polite">
        {isComplete ? "Lesson complete" : `Sentence ${sentenceIndex + 1} of ${total}`}
      </p>

      <AnimatePresence mode="wait">
        {isComplete ? (
          <LessonCompletion
            key="complete"
            mode={unit.mode}
            accuracy={finalAccuracy}
            nextLesson={nextLesson}
          />
        ) : (
          sentence && (
            <TypingSentence
              key={sentence.id}
              sentence={sentence}
              mode={unit.mode}
              onComplete={handleSentenceComplete}
              onCorrectLetter={() => {
                correctCountRef.current += 1;
                play("letter");
              }}
              onErrorLetter={() => {
                errorCountRef.current += 1;
                play("error");
              }}
            />
          )
        )}
      </AnimatePresence>
    </div>
  );
}
