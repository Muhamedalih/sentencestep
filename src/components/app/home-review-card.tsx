"use client";

import Link from "next/link";

import { useLocale } from "@/components/providers/locale-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WeakWordItem } from "@/lib/weak-words/types";

/**
 * Home's "Review All Words" card — the same card as the Word Lists page's NeedsReviewWords
 * (same count, same destination), drawn like the Stories card beside it so the two read as a
 * pair: a cover on top (here the number of words waiting, in large type on the brand tint, with
 * no sticker or tilt), then the heading, one line and a small button. It takes half of the
 * column's height (see HomeHero) and, like the other Home cards, lifts on hover. Omitted
 * entirely when nothing is waiting, exactly like NeedsReviewWords.
 */
export function HomeReviewCard({
  words,
  count,
  smart = false,
}: {
  words: WeakWordItem[];
  /** Everything waiting for review (see NeedsReviewWords) — shown instead of the weak-word count alone. */
  count?: number;
  /** Smart word practice is on: the line says the review time has come. */
  smart?: boolean;
}) {
  const { t, dir } = useLocale();
  const total = count ?? words.length;
  if (total === 0) return null;

  return (
    <Link
      href="/learn/word-lists/review"
      className="group border-border bg-card focus-visible:ring-ring focus-visible:ring-offset-background flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border transition-[scale,translate,box-shadow] duration-[380ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] outline-none hover:shadow-[0_22px_40px_-12px_rgba(0,0,0,0.5)] focus-visible:ring-2 focus-visible:ring-offset-2 motion-safe:hover:-translate-y-2 motion-safe:hover:scale-[1.05]"
    >
      <div className="bg-brand-muted relative min-h-28 flex-1 overflow-hidden sm:min-h-32">
        <span
          aria-hidden="true"
          className="bg-primary/10 absolute -end-[14%] -top-[30%] h-[120%] w-[62%] rounded-full"
        />
        <div className="absolute start-4 bottom-3.5">
          <p
            className="text-foreground text-6xl leading-none font-semibold tracking-tight tabular-nums"
            dir="ltr"
          >
            {total}
          </p>
          <p className="text-primary mt-1.5 text-sm font-medium" dir={dir}>
            {total === 1 ? t.lesson.wordReadyToReview : t.lesson.wordsReadyToReview}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-0.5 p-4">
        <h3 className="truncate text-sm font-semibold" dir={dir}>
          {t.wordLists.needsReviewHeading}
        </h3>
        <p className="text-muted-foreground line-clamp-2 text-xs" dir={dir}>
          {smart ? t.wordLists.smart.reviewDueSubtitle : t.wordLists.needsReviewSubtitle}
        </p>
        <span className={cn(buttonVariants({ size: "sm" }), "mt-2 w-fit")}>
          {t.wordLists.needsReviewAction}
        </span>
      </div>
    </Link>
  );
}
