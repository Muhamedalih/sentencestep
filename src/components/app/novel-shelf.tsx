"use client";

import { motion } from "framer-motion";

import { NovelSpineCard } from "@/components/app/novel-spine-card";
import { ScrollFadeEdges } from "@/components/ui/scroll-fade-edges";
import { useScrollEdgeFade } from "@/hooks/use-scroll-edge-fade";
import { staggerChildren } from "@/lib/motion";
import type { Book } from "@/types/library";

/**
 * The Novels homepage's main catalog — a horizontal shelf of NovelSpineCard
 * tiles instead of BookGrid's flat poster grid, so browsing Novels reads as
 * a small personal bookshelf rather than another app grid. Horizontally
 * scrollable with the same fade-edge affordance LearnSidebar/
 * LibraryCategoryNav already use for an overflowing row, not a wrapping
 * grid — a shelf of book spines wrapping to a second line would break the
 * "standing side by side" illusion the tile itself is going for.
 */
export function NovelShelf({ books }: { books: Book[] }) {
  const { ref: scrollRef, showStartFade, showEndFade } = useScrollEdgeFade<HTMLDivElement>();

  return (
    <div className="relative">
      <motion.div
        ref={scrollRef}
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="flex items-end gap-3 overflow-x-auto pb-2"
      >
        {books.map((book) => (
          <NovelSpineCard key={book.id} book={book} />
        ))}
      </motion.div>
      <ScrollFadeEdges
        showStartFade={showStartFade}
        showEndFade={showEndFade}
        className="md:hidden"
      />
    </div>
  );
}
