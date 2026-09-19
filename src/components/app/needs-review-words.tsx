"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import type { WeakWordItem } from "@/lib/weak-words/types";

/**
 * "Review All Words" — the one place src/lib/weak-words' derived signal
 * currently surfaces (see that module's doc comment: an interpretation of
 * existing mistake/review data, not a second progress system). Omitted
 * entirely rather than shown empty (see the caller) — the same pattern
 * LibraryHome already uses for its own Continue Reading section, so a
 * learner with no current weak words sees this page exactly as it always
 * looked, not a "nothing to show" block taking up space.
 *
 * A hero card, not a list of pill links: opening it goes straight into
 * /learn/word-lists/review (see WordReviewSession), which quizzes ONLY
 * these specific words, one at a time, until each is answered correctly —
 * clearing it from this list via the exact same markMistakeCorrectedAction/
 * markReviewCompletedAction "Fix Your Mistakes" already uses, just reached
 * from Word Lists instead of a lesson completion screen.
 */
export function NeedsReviewWords({ words }: { words: WeakWordItem[] }) {
  const { t, dir } = useLocale();
  if (words.length === 0) return null;

  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <Link
      href="/learn/word-lists/review"
      className="border-border from-primary/10 hover:border-primary/40 focus-visible:ring-ring focus-visible:ring-offset-background group relative mb-10 flex flex-col gap-5 overflow-hidden rounded-2xl border bg-gradient-to-br via-transparent to-transparent p-6 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:flex-row sm:items-center sm:gap-8 sm:p-8"
    >
      {/* Brand-toned "sticker" chip (bg-brand-muted/text-primary, same tokens
          as the rest of the site's violet identity, so it adapts correctly
          in dark mode) — a chunky bottom-edge shadow in --brand itself plus
          a slight resting tilt that straightens on hover is what reads as a
          playful, cartoon-ish badge rather than a plain stat tile. */}
      <div
        dir="ltr"
        className="bg-brand-muted text-primary flex shrink-0 -rotate-2 flex-col items-center justify-center self-start rounded-2xl px-6 py-4 shadow-[0_3px_0_0_var(--brand),0_10px_20px_-8px_rgba(0,0,0,0.45)] transition-transform duration-200 group-hover:rotate-0 sm:self-center sm:px-8 sm:py-6"
      >
        <span className="text-4xl font-extrabold tracking-tight sm:text-5xl">{words.length}</span>
        <span className="text-xs font-semibold tracking-wide uppercase opacity-70">
          {t.wordLists.wordsUnit}
        </span>
      </div>
      <div className="min-w-0 flex-1" dir={dir}>
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
          {t.wordLists.needsReviewHeading}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {t.wordLists.needsReviewSubtitle}
        </p>
      </div>
      <Chevron
        aria-hidden="true"
        className="text-muted-foreground group-hover:text-foreground size-5 shrink-0 self-end transition-colors sm:self-center"
      />
    </Link>
  );
}
