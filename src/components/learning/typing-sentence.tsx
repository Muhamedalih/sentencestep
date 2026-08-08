"use client";

import { BookOpen } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { PronunciationButton } from "@/components/learning/pronunciation-button";
import { TypingText } from "@/components/learning/typing-text";
import { useTypingEngine } from "@/hooks/use-typing-engine";
import { fadeIn } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { LearningMode, Sentence } from "@/types/content";

interface TypingSentenceProps {
  sentence: Sentence;
  mode: LearningMode;
  onComplete: () => void;
  onCorrectLetter: () => void;
  onErrorLetter?: () => void;
}

export function TypingSentence({
  sentence,
  mode,
  onComplete,
  onCorrectLetter,
  onErrorLetter,
}: TypingSentenceProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const engine = useTypingEngine({
    target: sentence.en,
    resetKey: sentence.id,
    onComplete,
    onCorrectChar: onCorrectLetter,
    onErrorChar: onErrorLetter,
  });

  const enterExit = {
    variants: fadeIn,
    initial: "hidden" as const,
    animate: "visible" as const,
    exit: reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, transition: { duration: 0.2 } },
  };

  function renderText(sizeClass: string) {
    return (
      <TypingText
        target={sentence.en}
        typed={engine.typed}
        letterStates={engine.letterStates}
        inputRef={engine.inputRef}
        onChange={engine.handleChange}
        onPaste={engine.handlePaste}
        reducedMotion={reducedMotion}
        textClassName={sizeClass}
      />
    );
  }

  if (mode === "conversation") {
    const isReplier = sentence.speaker === "B";
    return (
      <motion.div
        {...enterExit}
        className={cn("flex", isReplier ? "justify-end" : "justify-start")}
      >
        <div
          className={cn(
            "flex max-w-[92%] items-start gap-3 sm:max-w-[75%]",
            isReplier && "flex-row-reverse",
          )}
        >
          <div
            aria-hidden="true"
            className={cn(
              "mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              isReplier ? "bg-primary text-primary-foreground" : "bg-brand-muted text-primary",
            )}
          >
            {sentence.speaker}
          </div>
          <div
            className={cn(
              "border-border min-w-0 rounded-2xl border p-5 sm:p-6",
              isReplier ? "bg-primary/5 rounded-tr-sm" : "bg-card rounded-tl-sm",
            )}
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">{renderText("text-xl sm:text-2xl")}</div>
              <PronunciationButton text={sentence.en} />
            </div>
            <p className="text-muted-foreground mt-4 text-sm" dir="rtl">
              {sentence.ar}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (mode === "stories") {
    return (
      <motion.div
        {...enterExit}
        className="bg-card border-border border-l-brand relative overflow-hidden rounded-2xl border border-l-4 p-8 sm:p-12"
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-primary inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
            <BookOpen className="size-3.5" aria-hidden="true" />
            Story
          </span>
          <PronunciationButton text={sentence.en} />
        </div>
        {renderText("text-2xl sm:text-3xl")}
        <p className="text-muted-foreground mt-6 text-base" dir="rtl">
          {sentence.ar}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      {...enterExit}
      className="bg-card border-border relative overflow-hidden rounded-2xl border p-8 sm:p-12"
    >
      <div className="mb-2 flex justify-end">
        <PronunciationButton text={sentence.en} />
      </div>
      {renderText("text-2xl sm:text-3xl")}
      <p className="text-muted-foreground mt-6 text-base" dir="rtl">
        {sentence.ar}
      </p>
    </motion.div>
  );
}
