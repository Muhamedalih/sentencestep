"use client";

import type { ReactNode } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { ScrollFadeEdges } from "@/components/ui/scroll-fade-edges";
import { useScrollEdgeFade } from "@/hooks/use-scroll-edge-fade";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/library";

/**
 * The Library homepage's category filter row (Section 5 of the spec) —
 * "All" plus every active, database-backed category in display order, never
 * a hardcoded list. A new category an admin adds shows up here automatically
 * on next load since `categories` is exactly the same admin-managed list
 * LibraryHome already fetches for its category sections — this component
 * doesn't do its own fetch. Horizontally scrollable rather than wrapping so
 * it stays a single tidy row at any viewport width, same overflow-x-auto
 * pattern LearnSidebar already uses for its own small-screen tab strip.
 */
export function LibraryCategoryNav({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { t, dir } = useLocale();
  // Same "hidden past the edge with no hint" gap as LearnSidebar's tab strip
  // (see ScrollFadeEdges) — with enough categories this row overflows on
  // narrow screens and the fade is the only cue more are a swipe away.
  const { ref: scrollRef, showStartFade, showEndFade } = useScrollEdgeFade<HTMLElement>();

  return (
    <div className="relative md:contents">
      <nav
        ref={scrollRef}
        aria-label={t.bookLibrary.categoryNavAriaLabel}
        dir={dir}
        className="flex items-center gap-2 overflow-x-auto pb-1"
      >
        <CategoryPill active={selectedId === null} onClick={() => onSelect(null)}>
          {t.bookLibrary.allCategories}
        </CategoryPill>
        {categories.map((category) => (
          <CategoryPill
            key={category.id}
            active={selectedId === category.id}
            onClick={() => onSelect(category.id)}
          >
            {category.name}
          </CategoryPill>
        ))}
      </nav>
      <ScrollFadeEdges
        showStartFade={showStartFade}
        showEndFade={showEndFade}
        className="md:hidden"
      />
    </div>
  );
}

function CategoryPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "focus-visible:ring-ring focus-visible:ring-offset-background shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        active
          ? "bg-brand-muted text-primary border-transparent"
          : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
