"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

/**
 * Premium page-turn navigation for Book Reading (Book Reading Experience
 * Enhancements, addition 2) — a pure reading/browse layer over the
 * currently-loaded section's sentences, deliberately independent of
 * book_progress: moving between pages here never touches
 * completedSentenceCount, XP, or the progress pointer (see
 * BookReadingSession's viewIndex/sentenceIndex split, which owns the actual
 * navigation state this component only renders controls for). Bounded to
 * the current section only — the book's own natural, deterministic
 * chunking ("a page should represent a meaningful chunk of the book," never
 * an invented pagination scheme), so it can never jump to unrelated later
 * content the way a fabricated global pager could.
 *
 * Arrows keep a fixed left=previous/right=next meaning regardless of the
 * interface's RTL/LTR direction — book content order is a property of the
 * English text itself (always read left-to-right), not of the surrounding
 * UI chrome, so flipping the arrows under Arabic would make them
 * contradict the actual page order rather than match it. The `dir="ltr"`
 * wrapper below is what guarantees that: DOM order [previous, page, next]
 * renders in that visual order unconditionally.
 */
export function BookPageNav({
  pageNumber,
  totalPages,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
}: {
  pageNumber: number;
  /** Real page count for the current section (Real Page Model, Phase 4) — always the length of that section's derived pages, never a sentence count. */
  totalPages: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const { t } = useLocale();

  return (
    <div className="mt-8 flex items-center justify-center gap-5" dir="ltr">
      <PageArrow
        onClick={onPrevious}
        disabled={!canGoPrevious}
        label={t.library.previousPage}
        Icon={ChevronLeft}
      />
      <span className="text-muted-foreground min-w-[7rem] text-center text-sm font-medium tabular-nums">
        {t.bookLibrary.pageOfTotal
          .replace("{n}", String(pageNumber))
          .replace("{total}", String(totalPages))}
      </span>
      <PageArrow
        onClick={onNext}
        disabled={!canGoNext}
        label={t.library.nextPage}
        Icon={ChevronRight}
      />
    </div>
  );
}

function PageArrow({
  onClick,
  disabled,
  label,
  Icon,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  Icon: typeof ChevronLeft;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      whileHover={disabled ? undefined : { scale: 1.08 }}
      whileTap={disabled ? undefined : { scale: 0.92 }}
      className={cn(
        "border-border/60 bg-card text-foreground flex size-9 shrink-0 items-center justify-center rounded-full border shadow-sm transition-[opacity,color,border-color] duration-150",
        disabled
          ? "cursor-not-allowed opacity-30"
          : "hover:border-primary/40 hover:text-primary cursor-pointer",
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
    </motion.button>
  );
}
