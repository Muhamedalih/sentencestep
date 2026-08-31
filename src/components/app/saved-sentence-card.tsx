"use client";

import Link from "next/link";
import { NotebookPen } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import type { SavedSentenceItem } from "@/lib/supabase/queries/saved-sentences";

/**
 * One "My Saves" entry (Lightweight Save + Notes system) — the sentence
 * stays the primary visual focus, with the optional note and book/chapter
 * context secondary, and Practice as the only action (Section 10 of the
 * spec: don't overwhelm the card with metadata). Practice reuses the
 * existing Book Reading route rather than a new "jump to this exact
 * sentence" flow — sequential chapter unlocking means a section is the
 * smallest unit the reading route can navigate straight to (see
 * BookReadingPage's own `?section=` handling); an already-unlocked section
 * resumes there, a locked one falls back to the reader's real position,
 * exactly like every other section link in the app.
 */
export function SavedSentenceCard({ item }: { item: SavedSentenceItem }) {
  const { t, dir } = useLocale();

  return (
    <div className="border-border/60 bg-card flex flex-col gap-3 rounded-xl border p-4 sm:p-5">
      <p className="text-base leading-snug font-medium" dir="ltr">
        {item.en}
      </p>
      {item.supportText && (
        <p className="text-muted-foreground -mt-2 text-sm" dir={dir}>
          {item.supportText}
        </p>
      )}
      {item.note && (
        <p
          className="text-foreground/90 border-border/60 bg-muted/40 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm"
          dir={dir}
        >
          <NotebookPen
            className="text-muted-foreground mt-0.5 size-3.5 shrink-0"
            aria-hidden="true"
          />
          <span>{item.note}</span>
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-muted-foreground text-xs" dir="ltr">
          {item.bookTitle} · {item.sectionTitle}
        </p>
        <Link
          href={`/learn/library/${item.bookId}/read?section=${item.sectionId}`}
          className="text-primary text-xs font-semibold hover:underline"
        >
          {t.bookLibrary.practice}
        </Link>
      </div>
    </div>
  );
}
