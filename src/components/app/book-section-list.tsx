"use client";

import Link from "next/link";
import { Check, Lock } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";
import type { ChapterStateInfo } from "@/lib/book-progress/chapter-state";

/**
 * The Book Overview's full section list (sequential chapter unlocking,
 * Library spec Section 2) — every section of the book is always shown, so a
 * reader always sees the book's complete shape, but only completed/available
 * sections are real links; a locked section renders as inert chrome with no
 * href, so it's never focusable/clickable at the DOM level, not just
 * disabled-looking (server-side access is still the real gate — see
 * BookReadingPage's use of isSectionUnlocked; this is belt-and-suspenders).
 */
export function BookSectionList({
  bookId,
  states,
}: {
  bookId: string;
  states: ChapterStateInfo[];
}) {
  const { t, dir } = useLocale();

  return (
    <ol className="flex flex-col gap-2" dir={dir}>
      {states.map(({ section, state }, index) => {
        const number = index + 1;
        const title = section.supportTitle ?? section.title;
        const isLocked = state === "locked";

        const inner = (
          <>
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                state === "completed" && "bg-primary text-primary-foreground",
                state === "available" && "bg-brand-muted text-primary",
                state === "locked" && "bg-muted text-muted-foreground/60",
              )}
              aria-hidden="true"
            >
              {state === "completed" ? <Check className="size-4" /> : number}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span
                className={cn("truncate font-medium", isLocked && "text-muted-foreground")}
                dir="ltr"
              >
                {title}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1 text-sm",
                  state === "completed" && "text-primary",
                  state === "available" && "text-muted-foreground",
                  state === "locked" && "text-muted-foreground/70",
                )}
              >
                {state === "locked" && <Lock className="size-3.5" aria-hidden="true" />}
                {state === "completed"
                  ? t.bookLibrary.sectionCompletedLabel
                  : state === "available"
                    ? t.bookLibrary.continueReading
                    : t.bookLibrary.sectionLocked}
              </span>
            </span>
          </>
        );

        if (isLocked) {
          return (
            <li key={section.id}>
              <div
                aria-disabled="true"
                aria-label={`${title} — ${t.bookLibrary.sectionLocked}`}
                className="border-border/60 flex items-center gap-3 rounded-xl border px-4 py-3 opacity-60"
              >
                {inner}
              </div>
            </li>
          );
        }

        return (
          <li key={section.id}>
            <Link
              href={`/learn/library/${bookId}/read?section=${section.id}`}
              className={cn(
                "focus-visible:ring-ring focus-visible:ring-offset-background flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                state === "available"
                  ? "border-primary/40 bg-brand-muted/40 hover:bg-brand-muted/60"
                  : "border-border/60 hover:bg-secondary",
              )}
            >
              {inner}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
