"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { NOVEL_META, novelMetaText } from "@/lib/novel-meta";
import { cn } from "@/lib/utils";
import type { Book } from "@/types/library";

/**
 * The Novels homepage's editorial Featured placement — FeaturedBook's
 * counterpart, but swapping the difficulty tier badge for a genre tag
 * (Beginner/Intermediate reads oddly on a classic novel) and the plain
 * `description` for a short teaser line pulled from the novel's own
 * retelling, styled in the app's serif voice font for a quieter, more
 * literary feel than the sans-serif UI around it. See lib/novel-meta.ts for
 * where genre/teaser/estimatedMinutes come from — static, curated text for
 * exactly the 6 known novel ids, not fetched.
 */
export function FeaturedNovel({ book }: { book: Book }) {
  const { locale, dir, t } = useLocale();
  const meta = NOVEL_META[book.id];

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
          {meta && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-fit">
                {novelMetaText(meta.genre, locale)}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {t.bookLibrary.estimatedMinutes.replace("{minutes}", String(meta.estimatedMinutes))}
              </span>
            </div>
          )}
          <div>
            <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl" dir="ltr">
              {book.title}
            </h3>
            <p className="text-muted-foreground mt-1" dir="ltr">
              {t.bookLibrary.byAuthor.replace("{author}", book.author)}
            </p>
          </div>
          {meta && (
            <p
              className="text-muted-foreground line-clamp-3 max-w-xl text-lg italic"
              style={{ fontFamily: "var(--font-quote)" }}
              dir={dir}
            >
              {novelMetaText(meta.teaser, locale)}
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
