"use client";

import { Fragment } from "react";
import type { ReactNode } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import type { DictationResult, DictationWordStatus } from "@/lib/features/dictation";
import { cn } from "@/lib/utils";

/** A wrong letter inside a word: heavier and underlined, so a one-letter slip is easy to see. */
const MARKED_LETTER = "font-bold underline decoration-2 underline-offset-4";

/** The words the learner missed are picked out quietly: a typo in the brand tint, a different or missing word in the soft red. */
function chip(status: DictationWordStatus): string {
  return cn(
    "rounded-lg px-2 py-0.5",
    status === "close" ? "bg-primary/15 text-primary" : "bg-danger/15 text-danger",
  );
}

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

/**
 * What the exam shows after an answer: the correct sentence in plain large type with only the words
 * the learner missed picked out, and — when something was typed and was not exact — what they wrote,
 * small and muted underneath. A calmer cousin of SentenceDiff (which colours every word and shows the
 * typed text as large as the answer), made for a screen that is looked at many times a day.
 */
export function ReviewCorrection({
  result,
  sentence,
}: {
  result: DictationResult;
  /** The plain sentence, shown as it is for an exact answer. */
  sentence: string;
}) {
  const { t } = useLocale();
  return (
    <div className="flex flex-col items-center gap-4">
      <p dir="ltr" className="text-2xl leading-relaxed text-balance sm:text-3xl">
        {result.exact
          ? sentence
          : result.words.map((word, index) => (
              <Fragment key={index}>
                {index > 0 && " "}
                {word.status === "correct" ? (
                  word.raw
                ) : (
                  <span className={chip(word.status)}>
                    <Letters text={word.raw} marked={new Set(word.errorIndexes)} />
                  </span>
                )}
              </Fragment>
            ))}
      </p>
      {!result.exact && result.typedWords.length > 0 && (
        <div className="flex flex-col items-center gap-1">
          <p className="text-muted-foreground/80 text-xs font-semibold" dir="auto">
            {t.dictation.youTyped}
          </p>
          <p dir="ltr" className="text-muted-foreground text-base text-balance">
            {result.typedWords.map((word, index) => (
              <Fragment key={index}>
                {index > 0 && " "}
                <span
                  className={cn(
                    word.status === "wrong" && "text-danger",
                    word.status === "extra" && "decoration-danger/70 line-through",
                  )}
                >
                  {word.text}
                </span>
              </Fragment>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}
