"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { PenLine } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import type { BankCardData } from "@/lib/word-bank/shelves";
import { bankStrings } from "@/lib/word-bank/strings";
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

/** One paper card of the fan. */
interface FanCard {
  key: string;
  word: string;
  meaning: string | null;
  /** The lesson the word came from (the words bank only): printed at the foot of the card. */
  source: string | null;
}

/**
 * The words section of the Home cards, a wide card at the foot of the page: how many words are waiting
 * for review (the big number, counting up the first time it is drawn), the button that opens the
 * review, and the first four of those words as small paper cards that spread under the pointer, each
 * with its Arabic meaning when one is known (`hints`, by word id). The «writing» tag in its corner
 * tells it apart from the Stories card above (the language side of learning). The words are the ones
 * the review queue already holds; only the meanings are one small extra read (see fetchWordCardHints).
 *
 * With `bank` (a learner the words bank, «كلماتي», is open to, on a day it has words for them) the same
 * card shows the bank instead: today's words (five at most), which lessons they came from, how many
 * words the bank holds and how many are stable, each paper card with its lesson's name, and the button
 * opens the bank's round. Without it the card is exactly what it was.
 */
export function WordsSection({
  reviewCount,
  words,
  hints,
  bank = null,
  className = "mt-4",
  index = 5,
}: {
  /** Everything waiting for review. */
  reviewCount: number;
  /** The words due now (the first four are drawn). */
  words: WeakWordItem[];
  /** The Arabic meaning of a word card, by word id (an Arabic learner only). */
  hints: Record<string, string>;
  /** Today's words of the learner's words bank, or null (the card then shows the review queue). */
  bank?: BankCardData | null;
  /** Where the section sits on its page (its outer spacing): Home puts it under the other cards, the Word Lists page above its lists. */
  className?: string;
  /** Its place in the page's entrance order (the delay before it rises, 70 ms a step). */
  index?: number;
}) {
  const { t, dir, locale } = useLocale();
  const s = homeCardsStrings(locale);
  const b = bankStrings(locale);
  const count = bank ? bank.count : reviewCount;
  const shown = useCountUp(count, true);
  const colors = HOME_CARD_COLORS.words;
  const cards: FanCard[] = bank
    ? bank.words.slice(0, HAND.length).map((word) => ({
        key: word.word,
        word: word.word,
        meaning: word.ar || null,
        source: word.title,
      }))
    : words.slice(0, HAND.length).map((word) => ({
        key: word.wordId,
        word: word.targetWord,
        meaning: hints[word.wordId] ?? null,
        source: null,
      }));
  const href = bank
    ? "/learn/words/review"
    : reviewCount > 0
      ? "/learn/word-lists/review"
      : "/learn/word-lists";

  return (
    <section
      aria-label={s.yourWords}
      className={`hc-card hc-rise relative isolate flex min-h-[14.75rem] overflow-hidden rounded-2xl border px-8 py-6 text-white ${className}`}
      style={
        {
          background: colors.background,
          borderColor: colors.edge,
          "--hc-i": index,
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
        <div>
          <p className="flex items-baseline gap-3">
            <span
              dir="ltr"
              className="text-6xl leading-none font-extrabold tracking-tight tabular-nums xl:text-[4.9rem]"
            >
              {shown}
            </span>
            <span className="inline-flex items-center gap-2 text-[15px] text-white/60" dir="ltr">
              {count > 0 && (
                <span aria-hidden="true" className="size-[7px] rounded-full bg-emerald-400" />
              )}
              <span dir={dir}>{bank ? b.cardReady(bank.count) : s.wordsReady}</span>
            </span>
          </p>
          {bank && bank.sources.length > 0 && (
            <p className="mt-3 text-left text-[13px]" style={{ color: colors.soft }} dir="auto">
              {bank.sources.slice(0, 2).map((source, i) => {
                const text = source.lessonTitle
                  ? b.fromTitle.replace("{n}", String(source.count))
                  : b.fromSource[source.source].replace("{n}", String(source.count));
                const [before = "", after = ""] = text.split("{title}");
                return (
                  <span key={`${source.source}:${source.lessonTitle ?? ""}`}>
                    {i > 0 && " · "}
                    {before}
                    {source.lessonTitle && (
                      <span dir="ltr" className="text-white/80 [unicode-bidi:isolate]">
                        {source.lessonTitle}
                      </span>
                    )}
                    {after}
                  </span>
                );
              })}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2">
          <Link
            href={href}
            prefetch={bank ? false : undefined}
            className="inline-flex h-10 items-center rounded-[11px] bg-white px-5 text-[14.5px] font-bold text-slate-900 transition-colors outline-none hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <span dir={dir}>
              {bank || reviewCount > 0 ? t.wordLists.needsReviewAction : t.nav.wordLists}
            </span>
          </Link>
          <span className="text-[13px] text-white/50" dir={dir}>
            {bank
              ? (bank.stable > 0 ? b.cardHint : b.cardHintNoStable)
                  .replace("{minutes}", b.minutes(bank.count))
                  .replace("{total}", String(bank.total))
                  .replace("{stable}", String(bank.stable))
              : s.wordsHint}
          </span>
        </div>
      </div>

      {cards.length > 0 && (
        <div
          className="hc-fan pointer-events-none absolute end-16 top-1/2 hidden -translate-y-1/2 lg:flex"
          aria-hidden="true"
        >
          {cards.map((card, i) => {
            const hand = HAND[i]!;
            return (
              <span
                key={card.key}
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
                  {card.word}
                </span>
                {card.meaning ? (
                  <span
                    dir="rtl"
                    className="line-clamp-2 text-left text-[0.8rem] leading-snug"
                    style={{ color: PAPER.wordMeaning }}
                  >
                    {card.meaning}
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
                {card.source ? (
                  // The next card of the fan covers this one's last 20px, so the name stops short of it.
                  <span
                    dir="ltr"
                    className="mt-auto block max-w-[84px] truncate text-[11px] leading-none"
                    style={{ color: PAPER.wordSource }}
                  >
                    {card.source}
                  </span>
                ) : (
                  <i
                    className="mt-auto block h-1 w-[46%] rounded-[2px]"
                    style={{ background: PAPER.wordLine }}
                  />
                )}
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
}
