"use client";

import { useState } from "react";
import Link from "next/link";
import { Maximize2 } from "lucide-react";

import { SavedSentenceFocusOverlay } from "@/components/app/saved-sentence-focus-overlay";
import { ShareSentenceButton } from "@/components/app/share-sentence-button";
import { useLocale } from "@/components/providers/locale-provider";
import { stableIndex } from "@/lib/utils";
import type { SavedSentenceItem } from "@/lib/supabase/queries/saved-sentences";

/**
 * A book-identity color, stably per book id (same idea as BookCard's own
 * stableHue). Used only for the top hairline and the note pill's background
 * tint — never as interactive text color, since a single fixed lightness
 * can't stay legible against both a white and a near-black --card (light
 * vs. dark theme). Practice's own text instead uses the real --accent
 * token below — the one color the dashboard's app-shell neutralization
 * (see globals.css's .app-shell) deliberately leaves untouched, and the
 * same token this page's header bookmark icon and "Review my saves" CTA
 * already use.
 */
const BOOK_TONES = ["oklch(0.55 0.14 273)", "oklch(0.62 0.13 75)", "oklch(0.55 0.1 165)"];
const DEFAULT_TONE = BOOK_TONES[0]!;

/**
 * One "My Saves" entry (Lightweight Save + Notes system) — the "minimal
 * typographic" treatment (the option picked over the badge/avatar variants
 * it was reviewed against): no icon or avatar at all, just a thin
 * book-colored rule along the card's top edge and the sentence itself set
 * in --font-quote (Lora), carrying the card on typography and spacing alone.
 * The sentence and the two footer actions all share the same "grows
 * slightly on hover" micro-interaction — one consistent tactile language
 * across everything touchable on the card, rather than a hover effect
 * unique to any one of them. The corner expand control opens
 * SavedSentenceFocusOverlay, blowing the sentence up over a blurred, dimmed
 * copy of the page behind it.
 */
export function SavedSentenceCard({ item }: { item: SavedSentenceItem }) {
  const { t, dir } = useLocale();
  const [focused, setFocused] = useState(false);
  const tone = BOOK_TONES[stableIndex(item.bookId, BOOK_TONES.length)] ?? DEFAULT_TONE;

  return (
    <>
      <div className="border-border/60 bg-card overflow-hidden rounded-2xl border shadow-sm">
        <div aria-hidden="true" className="h-[3px]" style={{ backgroundColor: tone }} />

        <div className="relative px-6 pt-5 pb-1">
          <button
            type="button"
            onClick={() => setFocused(true)}
            aria-label={t.bookLibrary.focusSentence}
            title={t.bookLibrary.focusSentence}
            className="text-muted-foreground hover:text-foreground hover:bg-muted absolute end-4 top-4 flex size-7 items-center justify-center rounded-lg transition-colors"
          >
            <Maximize2 className="size-3.5" aria-hidden="true" />
          </button>

          <p
            className="text-muted-foreground pe-8 text-[11px] font-semibold tracking-wide uppercase"
            dir="ltr"
          >
            {item.bookTitle} · {item.sectionTitle}
          </p>

          {/* transform-origin pinned to the physical start edge, not the
              default center — the English sentence is always LTR-rendered
              even inside this RTL card (same reasoning as TypingText's own
              word-highlight sweep), so growing from its own left edge reads
              as the text expanding forward rather than bulging in place. */}
          <p
            className="font-quote mt-3 cursor-default text-lg leading-snug font-medium transition-transform duration-300 ease-out hover:scale-[1.04]"
            style={{ transformOrigin: "left center" }}
            dir="ltr"
          >
            {item.en}
          </p>
          {item.supportText && (
            <p className="text-muted-foreground mt-2 text-sm" dir={dir}>
              {item.supportText}
            </p>
          )}
          {item.note && (
            <span
              className="text-foreground mt-3 mb-4 inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: `color-mix(in oklch, ${tone} 18%, transparent)` }}
              dir={dir}
            >
              <span className="truncate">{item.note}</span>
            </span>
          )}
          {!item.note && <div className="pb-3" />}
        </div>

        <div className="border-border/60 flex border-t">
          <ShareSentenceButton item={item} />
          <div className="bg-border/60 w-px" aria-hidden="true" />
          <Link
            href={`/learn/library/${item.bookId}/read?section=${item.sectionId}`}
            className="text-accent flex flex-1 items-center justify-center py-3 text-sm font-semibold transition-transform duration-200 ease-out hover:scale-[1.05] active:scale-[0.97]"
          >
            {t.bookLibrary.practice}
          </Link>
        </div>
      </div>

      {focused && (
        <SavedSentenceFocusOverlay
          en={item.en}
          supportText={item.supportText}
          onClose={() => setFocused(false)}
        />
      )}
    </>
  );
}
