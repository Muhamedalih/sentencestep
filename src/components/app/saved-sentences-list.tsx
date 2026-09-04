"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";

import { SavedSentenceCard } from "@/components/app/saved-sentence-card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { fetchMySavedSentencesAction } from "@/lib/book-progress/marks-actions";
import type { SavedSentenceItem } from "@/lib/supabase/queries/saved-sentences";

/**
 * My Saves' list body — the first page is a plain server-rendered read (see
 * the page itself), everything after that is loaded here on demand via
 * "Load more" rather than one large upfront fetch (Section 18 of the spec:
 * never preload a learner's whole saved library at once).
 */
export function SavedSentencesList({
  initialItems,
  initialHasMore,
}: {
  initialItems: SavedSentenceItem[];
  initialHasMore: boolean;
}) {
  const { t, dir } = useLocale();
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    startTransition(async () => {
      const next = await fetchMySavedSentencesAction(items.length);
      setItems((current) => [...current, ...next.items]);
      setHasMore(next.hasMore);
    });
  }

  if (items.length === 0) {
    return (
      <div className="border-border/60 flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-16 text-center">
        <h2 className="text-lg font-semibold tracking-tight" dir={dir}>
          {t.bookLibrary.mySavesEmptyHeading}
        </h2>
        <p className="text-muted-foreground max-w-sm text-sm" dir={dir}>
          {t.bookLibrary.mySavesEmptyBody}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* The one "strong feature" this list previously had none of — turns a
          static bookmark dump into something worth actually returning to
          (Section: My Saves feedback). Reuses the exact same typing engine
          every lesson runs on rather than a passive flashcard flip, via
          SavedReviewSession. */}
      <div className="flex justify-end">
        <Button asChild variant="accent" size="sm">
          <Link href="/learn/saved/review">
            <Sparkles className="size-4" aria-hidden="true" />
            {t.bookLibrary.reviewSaves}
          </Link>
        </Button>
      </div>
      {items.map((item, index) => {
        const previous = items[index - 1];
        const showBookHeader = index === 0 || previous?.bookId !== item.bookId;
        return (
          <div key={item.sentenceId} className="flex flex-col gap-2">
            {showBookHeader && (
              <p
                className="text-muted-foreground/80 mt-2 text-xs font-semibold tracking-wide uppercase first:mt-0"
                dir="ltr"
              >
                {item.bookTitle}
              </p>
            )}
            <SavedSentenceCard item={item} />
          </div>
        );
      })}
      {hasMore && (
        <Button variant="outline" onClick={loadMore} disabled={isPending} className="self-center">
          {t.bookLibrary.mySavesLoadMore}
        </Button>
      )}
    </div>
  );
}
