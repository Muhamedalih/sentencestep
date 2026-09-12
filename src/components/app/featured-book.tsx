"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { difficultyForLevel, tierLabel, tierSupportLabel } from "@/lib/levels";
import { cn } from "@/lib/utils";
import type { Book } from "@/types/library";

/**
 * The Library homepage's single editorial Featured placement (Section 7 of
 * the spec) — only ever the first/most relevant featured book, deliberately
 * not a BookCard variant: a grid card's density is wrong here on purpose,
 * this is a one-off spot with room for a description and a real CTA. Same
 * "whole card is one Link" pattern as BookCard (no nested interactive
 * elements) — the CTA is styled with `buttonVariants` but isn't its own
 * `<button>`.
 */
export function FeaturedBook({ book }: { book: Book }) {
  const { locale, dir, t } = useLocale();
  const difficulty = difficultyForLevel(book.difficultyLevel);
  const tierText = locale ? tierSupportLabel(difficulty, locale) : tierLabel(difficulty).label;

  return (
    <Link
      href={`/learn/library/${book.id}`}
      aria-label={book.title}
      className="focus-visible:ring-ring focus-visible:ring-offset-background group block rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <div className="border-border/80 bg-card grid gap-6 rounded-3xl border p-6 shadow-sm transition-shadow duration-300 group-hover:shadow-lg sm:grid-cols-[220px_1fr] sm:items-center sm:p-8">
        <div className="bg-muted aspect-[3/4] w-full max-w-[220px] overflow-hidden rounded-2xl">
          {book.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin-provided external URL, see BookCard's identical choice.
            <img
              src={book.coverImageUrl}
              alt=""
              className="size-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
            />
          ) : (
            <div className="from-brand-muted to-muted flex size-full items-center justify-center bg-gradient-to-br">
              <BookOpen className="text-muted-foreground/50 size-12" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Badge variant="outline" className="w-fit">
            {tierText}
          </Badge>
          <div>
            <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl" dir="ltr">
              {book.title}
            </h3>
            <p className="text-muted-foreground mt-1" dir="ltr">
              {t.bookLibrary.byAuthor.replace("{author}", book.author)}
            </p>
          </div>
          {(book.supportDescription ?? book.description) && (
            <p
              className="text-muted-foreground line-clamp-2 max-w-xl"
              dir={book.supportDescription ? dir : "ltr"}
            >
              {book.supportDescription ?? book.description}
            </p>
          )}
          <span className={cn(buttonVariants({ size: "lg" }), "mt-1 w-fit")}>
            {t.bookLibrary.startReading}
          </span>
        </div>
      </div>
    </Link>
  );
}
