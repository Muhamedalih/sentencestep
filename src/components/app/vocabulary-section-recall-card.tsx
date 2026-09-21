"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { MIN_DUE_WORDS_TO_SHOW } from "@/lib/vocabulary-recall/constants";
import type { LearningMode } from "@/types/content";

/**
 * "Words you've met" — Vocabulary Recall (src/lib/vocabulary-recall)'s one
 * surface, rendered inside each mode's own lesson-list page (see
 * LessonListView, right under its title) rather than a single mode-agnostic
 * Home card: a learner browsing Stories should only ever see words from
 * Stories here, never a count mixing in Normal lessons. `mode` both scopes
 * the count this card is handed (see fetchVocabularyRecallCountAction) and
 * the review queue it links to (`/learn/recall?mode=`).
 *
 * Deliberately its own card rather than folded into NeedsReviewWords: a due
 * Recall word was never mistyped, so "mistake"/"fix"/"weak" framing would
 * misrepresent it — this is a lighter, curiosity-framed invitation ("see how
 * you used this word"), not a chore, and it's easy to ignore: omitted
 * entirely below MIN_DUE_WORDS_TO_SHOW (never shown for just one or two
 * words) and never blocks anything, costs no streak/XP, and carries no
 * repeated nagging if left untouched.
 *
 * Same "hero card, not a list of pills" shape as NeedsReviewWords, reusing
 * its exact sticker-chip/gradient-border language for visual consistency —
 * just an icon instead of a count in the chip (this card is about curiosity,
 * not a backlog number) and its own copy so it never reads as "you have
 * outstanding mistakes."
 */
export function VocabularySectionRecallCard({
  mode,
  count,
}: {
  mode: LearningMode;
  count: number;
}) {
  const { t, dir } = useLocale();
  if (count < MIN_DUE_WORDS_TO_SHOW) return null;

  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <Link
      href={`/learn/recall?mode=${mode}`}
      className="border-border from-primary/10 hover:border-primary/40 focus-visible:ring-ring focus-visible:ring-offset-background group relative mb-10 flex flex-col gap-5 overflow-hidden rounded-2xl border bg-gradient-to-br via-transparent to-transparent p-6 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:flex-row sm:items-center sm:gap-8 sm:p-8"
    >
      <div
        dir="ltr"
        className="flex shrink-0 rotate-2 flex-col items-center justify-center self-start rounded-2xl bg-[oklch(0.96_0.015_85)] px-6 py-4 text-[oklch(0.32_0.03_60)] shadow-[0_3px_0_0_oklch(0.85_0.03_80),0_10px_20px_-8px_rgba(0,0,0,0.45)] transition-transform duration-200 group-hover:rotate-0 sm:self-center sm:px-8 sm:py-6"
      >
        <Sparkles className="size-8 sm:size-9" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1" dir={dir}>
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
          {t.vocabularyRecall.cardHeading}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {t.vocabularyRecall.cardSubtitle}
        </p>
      </div>
      <Chevron
        aria-hidden="true"
        className="text-muted-foreground group-hover:text-foreground size-5 shrink-0 self-end transition-colors sm:self-center"
      />
    </Link>
  );
}
