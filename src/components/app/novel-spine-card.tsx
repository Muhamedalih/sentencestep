"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { fadeInUp } from "@/lib/motion";
import type { Book } from "@/types/library";

/** Same deterministic per-id hue as BookCard's stableHue — kept as its own copy since it's a 4-line pure hash, not worth importing across components for. */
function stableHue(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(hash) % 360;
}

/** Same hash, mapped to a narrow width range (56-84px) so spines standing side by side read as varied book thicknesses rather than a uniform row — purely decorative, not tied to any real page count. */
function stableWidth(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 17 + id.charCodeAt(i)) | 0;
  return 56 + (Math.abs(hash) % 29);
}

/**
 * A book-spine tile for NovelShelf — upright, narrow, vertical title text —
 * standing in for the flat poster-cover BookCard uses everywhere else in
 * the Library. Deliberately its own component rather than a BookCard prop:
 * a spine has no room for a progress bar, tier badge, or completed
 * checkmark, so it would mostly be BookCard with half its props unused.
 */
export function NovelSpineCard({ book }: { book: Book }) {
  const hue = stableHue(book.id);
  const width = stableWidth(book.id);

  return (
    <motion.div variants={fadeInUp} className="shrink-0" style={{ width }}>
      <Link
        href={`/learn/library/${book.id}`}
        aria-label={book.title}
        className="focus-visible:ring-ring focus-visible:ring-offset-background group block h-56 overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:h-64"
      >
        <div
          className="relative flex h-full w-full items-center justify-center overflow-hidden border-y border-r border-l-4 border-white/10 shadow-sm transition-shadow duration-300 group-hover:shadow-lg"
          style={{
            background: book.coverImageUrl
              ? undefined
              : `linear-gradient(175deg, hsl(${hue} 38% 26%), hsl(${(hue + 35) % 360} 32% 14%))`,
            borderLeftColor: `hsl(${hue} 30% 45%)`,
          }}
        >
          {book.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- admin-provided external URL, same as BookCard.
            <img
              src={book.coverImageUrl}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          )}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40"
          />
          <div
            dir="ltr"
            style={{ writingMode: "vertical-rl" }}
            className="relative flex max-h-full rotate-180 items-center gap-2 px-1.5 py-3"
          >
            <span className="truncate text-sm font-semibold text-white [text-shadow:0_1px_3px_rgb(0_0_0_/_0.7)]">
              {book.title}
            </span>
            <span className="truncate text-xs text-white/65 [text-shadow:0_1px_3px_rgb(0_0_0_/_0.7)]">
              {book.author}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
