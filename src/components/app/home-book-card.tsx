"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { difficultyForLevel, tierLabel, tierSupportLabel } from "@/lib/levels";
import { cn } from "@/lib/utils";
import type { Book } from "@/types/library";

/**
 * The Home dashboard's Book recommendation card (redesign, Section 2B) —
 * always a REAL published book (see (dashboard)/[mode]/page.tsx's
 * fetchFeaturedBooks()-first, first-published-book-fallback resolution),
 * never fabricated data. Deliberately its own small component rather than a
 * reduced BookCard/FeaturedBook variant: both of those are built for a
 * grid/editorial-spot context, while this one has to sit stacked with the
 * Stories card next to the large main lesson card.
 *
 * The cover is a side-by-side portrait rectangle (`aspect-[3/4]`, the same
 * real book-cover ratio BookCard/FeaturedBook already use elsewhere), sized
 * by its own fixed width rather than stretched to fill the row's height —
 * an earlier version instead gave the cover a short, wide `h-28`/`h-32`
 * band across the full card width and cropped it with `object-cover`, which
 * for a portrait cover meant showing only a thin horizontal sliver of the
 * actual artwork. Sizing the image box by its own aspect ratio instead of
 * the surrounding card's height is what actually fixes that: the cover box
 * is always a true portrait rectangle no matter how tall this card ends up
 * being.
 *
 * That fix alone still left the cover looking like a small thumbnail,
 * though: this card was `flex-1` in its `flex-col` parent (see HomeHero's
 * right column), which FORCE-STRETCHES it to match the Stories card's own
 * height (measured live: a 480×308px card around a mere 96×128px image —
 * most of the card was dead centering space, not cover). The card is
 * `flex-none` now — sized by its own real content (a much bigger image)
 * instead of being stretched to an unrelated sibling's height — and the
 * image itself is doubled from `w-20 sm:w-24` to `w-36 sm:w-44`. The
 * Stories card (untouched, still `flex-1` in that same parent) simply
 * absorbs whatever height this card no longer claims.
 *
 * The info column (title/author/description/counts/progress) was, on its
 * own, much shorter than the now-tall cover — `items-center` on the row
 * centered it vertically, leaving a large dead band of empty space to the
 * cover's right with only three short lines in it. Fixed two ways: filling
 * that column with the same real data Book Overview already shows
 * (description, section/sentence counts, real reading progress — see
 * (dashboard)/[mode]/page.tsx's bookSectionCount/bookSentenceCount/
 * bookProgressPercent, sourced from fetchBookContentCounts/
 * fetchBookProgressAction, never fabricated), and dropping the row's
 * `items-center` so it falls back to the flex default (`stretch`) — the
 * column now stretches to the cover's full height and `mt-auto` on the
 * progress/CTA block anchors it to the bottom, so title/description/counts
 * sit at the top and the action sits level with the cover's bottom edge
 * instead of the whole block floating centered. The cover itself is
 * unaffected by that stretch: its `aspect-[3/4]` plus a fixed width gives it
 * a definite cross-size, which a flex item with an intrinsic aspect ratio
 * sizes itself by rather than being force-stretched further (same escape
 * hatch that already made the width-driven sizing above work).
 */
export function HomeBookCard({
  book,
  sectionCount,
  sentenceCount,
  progressPercent,
  className,
}: {
  book: Book;
  /** Real counts from fetchBookContentCounts — 0 renders as "—", same convention BookOverview's own counts row already uses, rather than a misleading "0". */
  sectionCount: number;
  sentenceCount: number;
  /** Real percent from fetchBookProgressAction, or undefined for "not started yet" — same optional shape as BookCard's own `progressPercent` prop, so both cards treat "no progress" identically (CTA reads "Start Reading", no bar shown). */
  progressPercent?: number;
  className?: string;
}) {
  const { locale, dir, t } = useLocale();
  const difficulty = difficultyForLevel(book.difficultyLevel);
  const tierText = locale ? tierSupportLabel(difficulty, locale) : tierLabel(difficulty).label;
  const hasProgress = typeof progressPercent === "number" && progressPercent > 0;

  return (
    <Link
      href={`/learn/library/${book.id}`}
      aria-label={book.title}
      className={cn(
        "group border-border/80 bg-card focus-visible:ring-ring focus-visible:ring-offset-background flex flex-none gap-4 overflow-hidden rounded-2xl border p-3 transition-[transform,box-shadow] duration-300 ease-out outline-none hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 motion-safe:hover:-translate-y-1 sm:p-4",
        className,
      )}
    >
      <div className="bg-muted relative aspect-[3/4] w-36 shrink-0 overflow-hidden rounded-lg sm:w-44">
        {book.coverImageUrl ? (
          // object-contain, not object-cover: the box above is already sized
          // to the standard 3:4 cover ratio, but a real cover's exact ratio
          // can still differ slightly — contain guarantees the full cover is
          // always visible with zero cropping, at the cost of a possible
          // sliver of letterboxing on two edges, which is the explicit
          // trade-off asked for here.
          // eslint-disable-next-line @next/next/no-img-element -- admin-provided external URL, same choice as BookCard/FeaturedBook.
          <img
            src={book.coverImageUrl}
            alt=""
            className="size-full object-contain transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
          />
        ) : (
          <div className="from-brand-muted to-muted flex size-full items-center justify-center bg-gradient-to-br">
            <BookOpen className="text-muted-foreground/50 size-6" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 py-0.5">
        <div>
          <h3 className="truncate text-base font-semibold" dir="ltr">
            {book.title}
          </h3>
          <p className="text-muted-foreground truncate text-xs" dir="ltr">
            {t.bookLibrary.byAuthor.replace("{author}", book.author)}
          </p>
        </div>

        {book.description && (
          <p className="text-muted-foreground line-clamp-2 text-xs" dir="ltr">
            {book.description}
          </p>
        )}

        <p className="text-muted-foreground text-xs" dir={dir}>
          {tierText}
          {" · "}
          {sectionCount > 0 ? sectionCount : "—"} {t.bookLibrary.sections}
          {" · "}
          {sentenceCount > 0 ? sentenceCount : "—"} {t.bookLibrary.sentences}
        </p>

        <div className="mt-auto flex flex-col gap-1.5 pt-1">
          {hasProgress && (
            <div className="bg-muted h-1.5 w-full max-w-40 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>
          )}
          <span className="text-primary text-xs font-semibold">
            {hasProgress ? t.bookLibrary.continueReading : t.bookLibrary.startReading}
          </span>
        </div>
      </div>
    </Link>
  );
}
