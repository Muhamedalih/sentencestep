"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { PenLine } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import type { WeakWordItem } from "@/lib/weak-words/types";

import { HOME_CARD_COLORS, PAPER } from "./palette";
import { homeCardsStrings } from "./strings";
import { useCountUp } from "./use-count-up";

/** How the four word cards sit in the hand: their turn, and how far each is lowered. */
const HAND = [
  { rotate: "-5deg", drop: "0.6rem" },
  { rotate: "-1.5deg", drop: "-0.1rem" },
  { rotate: "2deg", drop: "0.15rem" },
  { rotate: "5.5deg", drop: "0.9rem" },
] as const;

/**
 * The words section of the Home cards, a wide card at the foot of the page: how many words are waiting
 * for review (the big number, counting up the first time it is drawn), the button that opens the
 * review, and the first four of those words as small paper cards that spread under the pointer, each
 * with its Arabic meaning when one is known (`hints`, by word id). The «writing» tag in its corner
 * tells it apart from the Stories card above (the language side of learning). The words are the ones
 * the review queue already holds; only the meanings are one small extra read (see fetchWordCardHints).
 */
export function WordsSection({
  reviewCount,
  words,
  hints,
}: {
  /** Everything waiting for review. */
  reviewCount: number;
  /** The words due now (the first four are drawn). */
  words: WeakWordItem[];
  /** The Arabic meaning of a word card, by word id (an Arabic learner only). */
  hints: Record<string, string>;
}) {
  const { t, dir, locale } = useLocale();
  const s = homeCardsStrings(locale);
  const shown = useCountUp(reviewCount, true);
  const colors = HOME_CARD_COLORS.words;
  const cards = words.slice(0, HAND.length);

  return (
    <section
      aria-label={s.yourWords}
      className="hc-card hc-rise relative isolate mt-4 flex min-h-[14.75rem] overflow-hidden rounded-2xl border px-8 py-6 text-white"
      style={
        {
          background: colors.background,
          borderColor: colors.edge,
          "--hc-i": 5,
        } as CSSProperties
      }
    >
      <span className="absolute end-4 top-4 z-10">
        <span
          className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold"
          style={{ background: colors.chip, borderColor: colors.chipEdge, color: colors.accent }}
          dir={dir}
        >
          <PenLine className="size-3.5" aria-hidden="true" />
          {s.writingCenter}
        </span>
      </span>

      <div className="relative z-10 flex min-w-0 flex-col justify-between gap-5">
        <span className="text-[13px] font-semibold" style={{ color: colors.accent }} dir={dir}>
          {s.yourWords}
        </span>
        <p className="flex items-baseline gap-3">
          <span
            dir="ltr"
            className="text-6xl leading-none font-extrabold tracking-tight tabular-nums xl:text-[4.9rem]"
          >
            {shown}
          </span>
          <span className="inline-flex items-center gap-2 text-[15px] text-white/60" dir="ltr">
            {reviewCount > 0 && (
              <span aria-hidden="true" className="size-[7px] rounded-full bg-emerald-400" />
            )}
            <span dir={dir}>{s.wordsReady}</span>
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2">
          <Link
            href={reviewCount > 0 ? "/learn/word-lists/review" : "/learn/word-lists"}
            className="inline-flex h-10 items-center rounded-[11px] bg-white px-5 text-[14.5px] font-bold text-slate-900 transition-colors outline-none hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <span dir={dir}>
              {reviewCount > 0 ? t.wordLists.needsReviewAction : t.nav.wordLists}
            </span>
          </Link>
          <span className="text-[13px] text-white/50" dir={dir}>
            {s.wordsHint}
          </span>
        </div>
      </div>

      {cards.length > 0 && (
        <div
          className="hc-fan pointer-events-none absolute end-16 top-1/2 hidden -translate-y-1/2 lg:flex"
          aria-hidden="true"
        >
          {cards.map((word, i) => {
            const hand = HAND[i]!;
            const meaning = hints[word.wordId];
            return (
              <span
                key={word.wordId}
                className="-ms-5 flex h-[7rem] w-[8.25rem] min-w-0 flex-col gap-1.5 rounded-[10px] p-3.5 first:ms-0"
                style={{
                  background: PAPER.sheet,
                  boxShadow: PAPER.wordShadow,
                  color: PAPER.ink,
                  rotate: hand.rotate,
                  translate: `0 ${hand.drop}`,
                }}
              >
                <span
                  dir="ltr"
                  className="truncate text-[1.05rem] leading-tight font-bold tracking-tight"
                >
                  {word.targetWord}
                </span>
                {meaning ? (
                  <span
                    dir="rtl"
                    className="line-clamp-2 text-left text-[0.8rem] leading-snug"
                    style={{ color: PAPER.wordMeaning }}
                  >
                    {meaning}
                  </span>
                ) : (
                  <span className="flex flex-col gap-[5px]">
                    <i
                      className="block h-1.5 w-[62%] rounded-[3px]"
                      style={{ background: PAPER.wordLine }}
                    />
                    <i
                      className="block h-1.5 w-[38%] rounded-[3px]"
                      style={{ background: PAPER.wordLineSoft }}
                    />
                  </span>
                )}
                <i
                  className="mt-auto block h-1 w-[46%] rounded-[2px]"
                  style={{ background: PAPER.wordLine }}
                />
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
}
