import type { CSSProperties } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import type { DictationResult } from "@/lib/features/dictation";
import { cn } from "@/lib/utils";

type Tone = "correct" | "close" | "wrong" | "missing" | "extra";

/** Shared color language for a graded sentence: green = right, amber = a near miss worth another look, red = wrong/missing/extra. */
export function wordTone(status: Tone): string {
  switch (status) {
    case "correct":
      return "text-success";
    case "close":
      return "text-accent";
    default:
      return "text-danger";
  }
}

/**
 * The "what you typed" / "the correct sentence" pair shown after Dictation
 * and From-memory grade an answer. Renders nothing for an exact answer —
 * callers show the plain sentence themselves in that case.
 */
export function SentenceDiff({
  result,
  textStyle,
}: {
  result: DictationResult;
  textStyle?: CSSProperties;
}) {
  const { t } = useLocale();
  if (result.exact) return null;

  return (
    <>
      <div>
        <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
          {t.dictation.youTyped}
        </p>
        <p dir="ltr" className="flex flex-wrap gap-x-2 text-xl sm:text-2xl" style={textStyle}>
          {result.typedWords.map((word, index) => (
            <span
              key={index}
              className={cn(
                word.status === "correct" ? wordTone("correct") : wordTone("wrong"),
                word.status === "extra" && "line-through",
              )}
            >
              {word.text}
            </span>
          ))}
        </p>
      </div>
      <div>
        <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
          {t.dictation.correctSentence}
        </p>
        <p dir="ltr" className="flex flex-wrap gap-x-2 text-xl sm:text-2xl" style={textStyle}>
          {result.words.map((word, index) => (
            <span
              key={index}
              className={cn(
                wordTone(word.status),
                word.status !== "correct" &&
                  "font-semibold underline decoration-2 underline-offset-4",
              )}
            >
              {word.raw}
            </span>
          ))}
        </p>
      </div>
    </>
  );
}
