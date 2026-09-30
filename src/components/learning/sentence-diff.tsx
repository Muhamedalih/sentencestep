import type { CSSProperties, ReactNode } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { wrongLetterPositions } from "@/lib/features/dictation";
import type { DictationResult, DictationWordStatus } from "@/lib/features/dictation";
import { cn } from "@/lib/utils";

/** Shared color language for a graded word: green = right, amber = a near miss worth another look, red = wrong/missing/extra. */
function wordColors(status: DictationWordStatus | "extra"): string {
  switch (status) {
    case "correct":
      return "text-success";
    case "close":
      return "bg-accent/15 text-accent";
    default:
      return "bg-danger/15 text-danger";
  }
}

/** A wrong letter inside a word: heavier and underlined so a one-letter slip is impossible to miss. */
const MARKED_LETTER = "font-bold underline decoration-[3px] underline-offset-[6px]";

function Letters({ text, marked }: { text: string; marked: ReadonlySet<number> }): ReactNode {
  return Array.from(text).map((char, index) =>
    marked.has(index) ? (
      <span key={index} className={MARKED_LETTER}>
        {char}
      </span>
    ) : (
      char
    ),
  );
}

const WORD_CHIP = "rounded-lg px-2 py-0.5";

/**
 * The graded sentence shown after Dictation and From-memory: the correct
 * sentence in large type with every word the learner missed picked out as a
 * chip and the exact wrong letters underlined, and, above it, what they
 * typed with its own wrong letters marked. For an exact answer it shows just
 * the correct sentence in green.
 */
export function SentenceDiff({
  result,
  sentence,
  textStyle,
}: {
  result: DictationResult;
  /** The plain sentence, shown as-is for an exact answer. */
  sentence: string;
  textStyle?: CSSProperties;
}) {
  const { t } = useLocale();

  const panel =
    "border-border/60 bg-muted/30 flex flex-col gap-5 rounded-2xl border p-4 sm:p-6 text-balance";
  const label = "text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase";

  if (result.exact) {
    return (
      <div className={panel}>
        <p dir="ltr" className="text-success text-3xl leading-snug sm:text-4xl" style={textStyle}>
          {sentence}
        </p>
      </div>
    );
  }

  return (
    <div className={panel}>
      <div>
        <p className={label}>{t.dictation.youTyped}</p>
        <p
          dir="ltr"
          className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-2xl leading-snug sm:text-3xl"
          style={textStyle}
        >
          {result.typedWords.map((word, index) => (
            <span
              key={index}
              className={cn(
                word.status === "correct"
                  ? wordColors("correct")
                  : cn(WORD_CHIP, wordColors("wrong")),
                word.status === "extra" && "line-through decoration-2",
              )}
            >
              {word.status === "wrong" && word.against ? (
                <Letters
                  text={word.text}
                  marked={new Set(wrongLetterPositions(word.text, word.against))}
                />
              ) : (
                word.text
              )}
            </span>
          ))}
        </p>
      </div>

      <div>
        <p className={label}>{t.dictation.correctSentence}</p>
        <p
          dir="ltr"
          className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-3xl leading-snug sm:text-4xl"
          style={textStyle}
        >
          {result.words.map((word, index) => (
            <span
              key={index}
              className={cn(
                word.status === "correct"
                  ? wordColors("correct")
                  : cn(WORD_CHIP, wordColors(word.status)),
              )}
            >
              <Letters text={word.raw} marked={new Set(word.errorIndexes)} />
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
