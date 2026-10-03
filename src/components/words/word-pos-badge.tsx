"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";
import type { WordPos } from "@/types/word-lists";

/**
 * The word type (noun, verb, adjective, adverb) as a small badge — on the
 * redesigned practice screen it sits above the meaning, so the learner knows
 * what kind of word fits the blank before typing. Renders nothing for a word
 * whose type is unknown. The label is in the support language (it is a
 * classification, like the meaning beside it); the badge itself is neutral, not
 * a color per type, so it never competes with the answer.
 */
export function WordPosBadge({
  pos,
  className,
}: {
  pos: WordPos | null | undefined;
  className?: string;
}) {
  const { t, dir } = useLocale();
  if (!pos) return null;

  const labels: Record<WordPos, string> = {
    noun: t.wordLists.redesign.posNoun,
    verb: t.wordLists.redesign.posVerb,
    adjective: t.wordLists.redesign.posAdjective,
    adverb: t.wordLists.redesign.posAdverb,
  };

  return (
    <span
      dir={dir}
      className={cn(
        "border-border/70 bg-muted/60 text-muted-foreground inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        className,
      )}
    >
      {labels[pos]}
    </span>
  );
}
