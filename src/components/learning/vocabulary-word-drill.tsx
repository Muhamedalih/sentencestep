"use client";

import type { RefObject } from "react";
import { ArrowLeft } from "lucide-react";

import { VocabularySentence } from "@/components/learning/vocabulary-sentence";
import type { WordAttemptStatus } from "@/hooks/use-word-typing-engine";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { splitWordHint } from "@/lib/word-lists-hint";
import type { VocabularyWord } from "@/types/word-lists";

/**
 * Free practice of ONE word, opened from the Practice button on a row of the
 * block summary: the same screen as a word of the session (its meaning, then the
 * sentence with the blank and the big typing stage) but with nothing at stake.
 * It has no stars and no hints to spend, writes nothing to the learner's
 * progress, the weak-word list or the review schedule, and a wrong answer simply
 * shows the right spelling and lets the learner try again. A right answer, or
 * the Back button, returns to the summary.
 */
export function VocabularyWordDrill({
  word,
  inputRef,
  fontFamily,
  onSolved,
  onWrong,
  onBack,
}: {
  word: VocabularyWord;
  /** Owned by the practice screen, so the audio settings' refocus finds the input that is on screen. */
  inputRef: RefObject<HTMLInputElement | null>;
  fontFamily?: string;
  /** The word was typed right (after its pause): leave the drill. */
  onSolved: () => void;
  /** A wrong answer landed: for the error sound. */
  onWrong: () => void;
  onBack: () => void;
}) {
  const { t, dir } = useLocale();
  // The support-language meaning only — never a fall back to the Arabic hint for
  // another locale, same rule as the practice screen.
  const hint = word.supportHint
    ? splitWordHint(word.supportHint)
    : { term: undefined, definition: undefined };

  function handleStatusChange(status: WordAttemptStatus) {
    if (status === "incorrect") onWrong();
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-8 lg:px-16">
      {hint.term && (
        <div className="flex w-full max-w-2xl flex-col items-center gap-2 text-center">
          <p
            className="text-foreground/85 text-[1.8rem] font-bold text-balance sm:text-[2.16rem]"
            dir={dir}
          >
            {hint.term}
          </p>
          {hint.definition && (
            <p className="text-muted-foreground text-[1.2rem] font-medium" dir={dir}>
              {hint.definition}
            </p>
          )}
        </div>
      )}

      <div className="bg-border h-10 w-px" aria-hidden="true" />

      <div className="flex w-full max-w-2xl flex-col items-center gap-4">
        <VocabularySentence
          sentence={word.sentence}
          targetWord={word.targetWord}
          onResult={(correct) => {
            // A wrong answer has already shown the right spelling; the engine
            // clears itself and the learner types the word again.
            if (correct) onSolved();
          }}
          inputRef={inputRef}
          fontFamily={fontFamily}
          enlarged
          smart={{ alternates: word.alternates, onStatusChange: handleStatusChange }}
        />
        <p className="text-muted-foreground text-center text-xs" dir={dir}>
          {t.wordLists.drillNote}
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          // The answer field keeps focus, so typing carries on after the click.
          onMouseDown={(event) => event.preventDefault()}
          className="text-muted-foreground gap-1.5"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t.wordLists.drillBack}
        </Button>
      </div>
    </div>
  );
}
