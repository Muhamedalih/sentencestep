"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

import { StoryCard } from "@/components/app/story-card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { useProgress } from "@/hooks/use-progress";
import { difficultyForLevel, tierSupportLabel, type Difficulty } from "@/lib/levels";
import { staggerChildren } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/types/content";

const TIERS: Difficulty[] = ["beginner", "intermediate", "advanced"];
const PAGE_SIZE = 12;

/** CEFR code shown beside each tier's support-language name in the level
 * selectors — a display-only label for this page's own selector row, not
 * from src/lib/levels.ts (tierLabel's English label is still used elsewhere,
 * e.g. story-card.tsx's corner badge, which this change deliberately leaves
 * untouched). CEFR codes are the same standardized abbreviations regardless
 * of support locale, so this stays a single constant, not translated. */
const CEFR_BY_TIER: Record<Difficulty, string> = {
  beginner: "A1",
  intermediate: "A2–B1",
  advanced: "B2+",
};

/**
 * One accent per tier, always visible (not just on the active tab — see
 * below) so all three read as a real green→amber→red progression at a
 * glance. Advanced uses `danger` rather than the app's own `primary`
 * brand purple: primary is a fairly desaturated blue-violet that reads as
 * near-white/gray at small text size against a dark background — visually
 * indistinguishable from "no color" — where danger's higher chroma red
 * actually shows up, and green/amber/red is the more universally legible
 * difficulty progression anyway.
 */
const TIER_TEXT_ACCENT: Record<Difficulty, string> = {
  beginner: "text-success",
  intermediate: "text-accent",
  advanced: "text-danger",
};
const TIER_BG_ACCENT: Record<Difficulty, string> = {
  beginner: "bg-success",
  intermediate: "bg-accent",
  advanced: "bg-danger",
};

/**
 * The Stories Library — the landing page for the sidebar's stories link
 * (see learn-sidebar.tsx), one level below the generic per-mode list used by
 * Normal/Conversation. Kept as its own component (rather than a variant
 * bolted onto LessonListView) because its shape is genuinely different: a
 * single flat, filterable, paginated grid instead of level-grouped sections.
 */
export function StoriesLibrary({
  lessons,
  isPremiumUser,
}: {
  lessons: Lesson[];
  isPremiumUser: boolean;
}) {
  const { isCompleted, isLoaded } = useProgress();
  const { locale, dir, t } = useLocale();
  const [activeTier, setActiveTier] = useState<Difficulty>("beginner");
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => [...lessons].sort((a, b) => a.order - b.order), [lessons]);

  const filtered = useMemo(
    () => sorted.filter((lesson) => difficultyForLevel(lesson.level) === activeTier),
    [sorted, activeTier],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function selectTier(tier: Difficulty) {
    setActiveTier(tier);
    setPage(1);
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <div
          aria-hidden="true"
          className="from-primary/15 text-primary flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br to-transparent sm:size-14"
        >
          <BookOpen className="size-6 sm:size-7" />
        </div>
        <div>
          {/* leading-[1.4] + py-1 (not the default tight heading
              line-height): background-clip: text paints strictly within the
              line box, and Arabic glyphs' actual vertical extent (tall
              ascenders/descenders, especially with diacritics) is taller
              than this line-height would normally need for Latin text —
              tight enough that the bottom of "القصص" was visibly clipped. */}
          <h1
            className="from-foreground to-foreground/70 bg-gradient-to-r bg-clip-text py-1 text-3xl leading-[1.4] font-semibold tracking-tight text-transparent sm:text-4xl"
            dir={dir}
          >
            {t.library.storiesHeading}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg" dir={dir}>
            {t.library.storiesSubtitle}
          </p>
        </div>
      </div>

      {/* Editorial underline tabs, deliberately not the filled/ringed pill
          style Word Lists' tier badges use (see WordGroupCard/
          word-lists-library.tsx) — this library reads as a bookshelf, not a
          practice-utility list, so its own section nav gets its own,
          quieter language: a sliding underline rather than a colored fill. */}
      <div
        role="tablist"
        aria-label={t.library.levelTabsAriaLabel}
        className="border-border flex items-center gap-1 border-b"
      >
        {TIERS.map((tier) => {
          const label = locale ? tierSupportLabel(tier, locale) : tier;
          const isActive = tier === activeTier;
          return (
            <button
              key={tier}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => selectTier(tier)}
              className={cn(
                "focus-visible:ring-ring focus-visible:ring-offset-background relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span dir={dir} className="font-semibold">
                {label}
              </span>
              <span
                dir="ltr"
                className={cn(
                  "text-xs",
                  TIER_TEXT_ACCENT[tier],
                  isActive ? "font-semibold" : "opacity-80",
                )}
              >
                {CEFR_BY_TIER[tier]}
              </span>
              {isActive && (
                <motion.span
                  layoutId="stories-tier-underline"
                  className={cn(
                    "absolute inset-x-3 -bottom-px h-0.5 rounded-full",
                    TIER_BG_ACCENT[tier],
                  )}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="bg-brand-muted text-primary flex size-14 items-center justify-center rounded-full">
            <BookOpen className="size-7" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium">{t.library.storiesEmptyHeading}</p>
            <p className="text-muted-foreground mt-1 text-sm">{t.library.checkBackSoon}</p>
          </div>
        </div>
      ) : (
        <>
          <motion.div
            key={activeTier + page}
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
            className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4"
          >
            {pageItems.map((lesson) => (
              <StoryCard
                key={lesson.id}
                lesson={lesson}
                completed={isLoaded && isCompleted("stories", lesson.id)}
                isPremiumUser={isPremiumUser}
              />
            ))}
          </motion.div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label={t.library.previousPage}
              >
                <ChevronLeft aria-hidden="true" className={cn(dir === "rtl" && "rotate-180")} />
              </Button>
              <span className="text-muted-foreground text-sm font-medium tabular-nums" dir="ltr">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label={t.library.nextPage}
              >
                <ChevronRight aria-hidden="true" className={cn(dir === "rtl" && "rotate-180")} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
