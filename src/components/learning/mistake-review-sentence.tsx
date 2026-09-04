"use client";

import { useMemo, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";

import { TypingText } from "@/components/learning/typing-text";
import { useTypingEngine } from "@/hooks/use-typing-engine";
import { tokenize } from "@/lib/typing";

/**
 * "Fix Your Mistakes"' typing state — deliberately NOT VocabularySentence:
 * that component hides the target word until typed (obscureUntyped), because
 * it's a recall-from-nothing drill. This is a recall-in-context correction —
 * the whole sentence, including the target word itself, stays visible and
 * readable the entire time; only `target` is the single word `targetWord`
 * (not the full sentence), so only that word is actually interactive/typed.
 * TypingText's own default (non-obscured) letter coloring already renders an
 * untyped word muted-gray and a correctly-typed one back to full foreground
 * (see typing-text.tsx's Letter component) — so "muted target that resolves
 * to normal as it's typed" needs zero new styling here, just not passing
 * obscureUntyped. Wrong-letter shake, backspace, and completion timing are
 * exactly useTypingEngine's own defaults (no errorDelayMs/completeDelayMs
 * override), matching every other real lesson sentence rather than
 * VocabularySentence's deliberately-slower gap timing.
 */
export function MistakeReviewSentence({
  sentence,
  targetWord,
  errorIndexes,
  onComplete,
  onCorrectLetter,
  onErrorLetter,
  inputRef,
  fontFamily,
}: {
  sentence: string;
  /** The exact, correctly-cased occurrence of the mistake word as it appears in `sentence` (see MistakeQueueItem.displayWord) — used both as the typing target and to locate the word for the prefix/suffix split below. */
  targetWord: string;
  /** Every letter the learner previously got wrong (see MistakeQueueItem.errorIndexes) — passed straight through to TypingText's highlightIndexes, which is the only thing that turns them into the red-letter hint; an empty array renders exactly like today, with no highlight at all. */
  errorIndexes: number[];
  onComplete: (wpm: number) => void;
  /** Admin -> Fonts' Fix Your Mistakes override (see resolveSectionFontFamily) — applied to the whole displayed line (prefix, target word, and suffix alike) so the sentence reads as one consistent font, not just the interactive word standing out. */
  fontFamily?: string;
  onCorrectLetter: () => void;
  onErrorLetter?: () => void;
  /** Owned by the parent (FixYourMistakesSession) so PronunciationButton's post-click refocus keeps working across the automatic word-to-word transition — same reasoning as VocabularySentence's identical prop. */
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const reducedMotion = useReducedMotion() ?? false;
  const highlightIndexSet = useMemo(() => new Set(errorIndexes), [errorIndexes]);
  const engine = useTypingEngine({
    target: targetWord,
    resetKey: targetWord,
    onComplete,
    onCorrectChar: onCorrectLetter,
    onErrorChar: onErrorLetter,
    inputRef,
  });

  const [prefix, suffix] = useMemo(() => {
    const tokens = tokenize(sentence);
    const index = tokens.indexOf(targetWord);
    if (index === -1) return [sentence, ""];
    return [
      tokens.slice(0, index).join("").trim(),
      tokens
        .slice(index + 1)
        .join("")
        .trim(),
    ];
  }, [sentence, targetWord]);

  return (
    <div
      dir="ltr"
      onClick={engine.focus}
      style={fontFamily ? { fontFamily } : undefined}
      className="flex flex-wrap items-baseline gap-x-3 gap-y-2 text-[clamp(1.8rem,1.2rem+2.6vw,3.5rem)] leading-tight font-medium text-balance"
    >
      {/* Prefix/suffix render muted and at normal weight — deliberately
          quieter than the interactive target word (font-bold below) so the
          sentence reads as "context around the word you're fixing" rather
          than one undifferentiated line of equally-weighted text. */}
      {prefix && <span className="text-muted-foreground">{prefix} </span>}
      <span className="text-foreground font-bold">
        <TypingText
          target={targetWord}
          typed={engine.typed}
          letterStates={engine.letterStates}
          inputRef={engine.inputRef}
          onChange={engine.handleChange}
          onPaste={engine.handlePaste}
          reducedMotion={reducedMotion}
          className="inline-block"
          highlightIndexes={highlightIndexSet}
        />
      </span>
      {suffix && <span className="text-muted-foreground"> {suffix}</span>}
    </div>
  );
}
