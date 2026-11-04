"use client";

import type { CSSProperties } from "react";
import Link from "next/link";

import { useHeaderTotals } from "@/components/app/home-header-bar";
import type { LessonStatsMap } from "@/components/app/home-hero";
import { useLocale } from "@/components/providers/locale-provider";
import { useSharedProgress } from "@/components/providers/progress-provider";
import type { WeakWordItem } from "@/lib/weak-words/types";

import { HOME_CARD_COLORS } from "./palette";
import { fillCount, homeCardsStrings } from "./strings";
import { useCountUp } from "./use-count-up";

/**
 * The words panel of the Home cards: the three totals the old header showed (words typed large, then
 * sentences and sessions), the number of words waiting for review with the button that opens the
 * review, and the first three of those words as small cards that spread under the pointer. The words
 * are the ones the review queue already holds (no extra read). The big number counts up the first
 * time it is drawn.
 */
export function WordsPanel({
  lessonStats,
  sessionCount,
  reviewCount,
  words,
}: {
  lessonStats: LessonStatsMap;
  sessionCount: number | null;
  /** Everything waiting for review. */
  reviewCount: number;
  /** The words due now (the first three are drawn). */
  words: WeakWordItem[];
}) {
  const { t, dir, locale } = useLocale();
  const s = homeCardsStrings(locale);
  const { isLoaded } = useSharedProgress();
  const totals = useHeaderTotals(lessonStats, sessionCount);
  const shown = useCountUp(totals.words, isLoaded);
  const colors = HOME_CARD_COLORS.words;
  const cards = words.slice(0, 3);

  return (
    <section
      aria-label={s.yourWords}
      className="hc-card hc-rise relative isolate flex min-h-[19.75rem] flex-col justify-between gap-4 overflow-hidden rounded-2xl border p-5 text-white"
      style={
        {
          backgroundImage: colors.background,
          borderColor: colors.edge,
          "--hc-i": 2,
        } as CSSProperties
      }
    >
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <span className="font-medium" style={{ color: colors.soft }} dir={dir}>
          {s.yourWords}
        </span>
        {reviewCount > 0 && (
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-300">
            <span aria-hidden="true" className="size-[7px] rounded-full bg-emerald-400" />
            <span dir={dir}>{fillCount(s.readyToReview, reviewCount)}</span>
          </span>
        )}
      </div>

      <p className="flex items-baseline gap-2.5">
        <span
          dir="ltr"
          className="text-6xl leading-none font-extrabold tracking-tight tabular-nums xl:text-[4.25rem]"
        >
          {shown}
        </span>
        <span className="text-sm" style={{ color: colors.soft }} dir={dir}>
          {s.wordsTyped}
        </span>
      </p>

      {cards.length > 0 && (
        <div className="hc-fan flex" aria-hidden="true">
          {cards.map((word) => (
            <span
              key={word.wordId}
              className="-ms-2 flex h-[5.25rem] w-[6.4rem] min-w-0 flex-col justify-between rounded-xl border border-white/25 bg-white/10 p-3 first:ms-0"
            >
              <span dir="ltr" className="truncate text-base font-bold tracking-tight">
                {word.targetWord}
              </span>
              <span className="block h-1.5 w-2/3 rounded-full bg-white/25" />
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-4 text-[12.5px]" style={{ color: colors.soft }}>
          <span className="inline-flex items-baseline gap-1">
            <b className="text-[15px] font-bold text-white tabular-nums" dir="ltr">
              {totals.sentences}
            </b>
            <span dir={dir}>{t.stats.linesLabel}</span>
          </span>
          <span className="inline-flex items-baseline gap-1">
            <b className="text-[15px] font-bold text-white tabular-nums" dir="ltr">
              {totals.sessions}
            </b>
            <span dir={dir}>{t.stats.sessionsLabel}</span>
          </span>
        </div>
        <Link
          href={reviewCount > 0 ? "/learn/word-lists/review" : "/learn/word-lists"}
          className="inline-flex h-9 items-center rounded-[10px] bg-white px-4 text-sm font-bold text-slate-900 transition-colors outline-none hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <span dir={dir}>{reviewCount > 0 ? t.wordLists.needsReviewAction : t.nav.wordLists}</span>
        </Link>
      </div>
    </section>
  );
}
