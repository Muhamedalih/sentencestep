"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { difficultyForLevel, tierLabel, tierSupportLabel } from "@/lib/levels";
import { fadeInUp } from "@/lib/motion";
import type { Book } from "@/types/library";

/**
 * A stable, book-specific hue (0-360) so every cover-less book gets its own
 * distinct gradient instead of the same flat gray placeholder repeated
 * across the whole grid — same "spread across a range" idea as
 * LessonIllustration's scene hashing, just for color instead of a figure.
 * Not cryptographic, doesn't need to be.
 */
function stableHue(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(hash) % 360;
}

/**
 * The Library's card — a poster tile, same visual language as StoryCard
 * (see that component's doc comment): the cover fills the whole tile, with
 * title/author sitting directly on it over a bottom gradient, rather than
 * the old "photo up top, text block below" layout. Kept at a 3:4 portrait
 * crop (unlike StoryCard's wider 4:3) since that's a real book cover's own
 * natural proportion, and book titles are short enough not to need the
 * extra width Stories' full-sentence titles needed.
 *
 * A book with no admin-uploaded cover gets a generated placeholder instead
 * of a plain gray box: a gradient hashed from the book's own id (so it's
 * stable across reloads, and different books never collide) behind a large
 * faint initial letter — a "designed" placeholder that reads as intentional
 * rather than empty, the same fix StoryCard's overlay/gradient treatment
 * was for Stories' own thumbnail illustrations.
 *
 * `completed` (the Library homepage's Completed Books shelf) swaps the
 * percent-complete bar for a small checkmark badge instead — a completed
 * book has nothing left to show a percentage of, and repeating "100%
 * complete" on every card in that shelf would be redundant with the shelf's
 * own heading.
 */
export function BookCard({
  book,
  progressPercent,
  completed = false,
}: {
  book: Book;
  progressPercent?: number;
  completed?: boolean;
}) {
  const { locale, dir, t } = useLocale();
  const difficulty = difficultyForLevel(book.difficultyLevel);
  const tierText = locale ? tierSupportLabel(difficulty, locale) : tierLabel(difficulty).label;
  const hasProgress = !completed && typeof progressPercent === "number" && progressPercent > 0;
  const hue = stableHue(book.id);

  return (
    <motion.div variants={fadeInUp} className="group h-full">
      <Link
        href={`/learn/library/${book.id}`}
        aria-label={book.title}
        className="focus-visible:ring-ring focus-visible:ring-offset-background block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <div className="border-border/60 relative aspect-[3/4] w-full overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-black/25 motion-safe:group-hover:-translate-y-1">
          {book.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin-provided external URL, not a static local asset.
            <img
              src={book.coverImageUrl}
              alt=""
              className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
            />
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
              style={{
                background: `linear-gradient(160deg, hsl(${hue} 40% 24%), hsl(${(hue + 40) % 360} 35% 12%))`,
              }}
            >
              <span className="text-8xl font-black text-white/15 select-none">
                {book.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Fixed dark overlays, not theme tokens — legible over any cover
              or generated gradient in either site theme, same reasoning as
              StoryCard's identical pair. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/40 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
          />

          <span className="absolute top-3 left-3 rounded-full border border-white/15 bg-black/40 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {tierText}
          </span>

          {completed && (
            <span
              className="bg-accent text-accent-foreground absolute top-3 right-3 flex size-6 items-center justify-center rounded-full shadow-sm"
              aria-hidden="true"
            >
              <Check className="size-3.5" strokeWidth={3} />
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4">
            <h3 className="truncate leading-snug font-semibold text-white" dir="ltr">
              {book.title}
            </h3>
            <p className="truncate text-sm text-white/70" dir="ltr">
              {t.bookLibrary.byAuthor.replace("{author}", book.author)}
            </p>

            {hasProgress && (
              <div className="mt-1 flex flex-col gap-1" dir={dir}>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="bg-success h-full rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-white/70">
                  {t.bookLibrary.percentComplete.replace(
                    "{percent}",
                    String(Math.round(progressPercent)),
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
