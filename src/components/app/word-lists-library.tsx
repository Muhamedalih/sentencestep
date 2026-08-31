"use client";

import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";

import { NeedsReviewWords } from "@/components/app/needs-review-words";
import { WordGroupCard } from "@/components/app/word-group-card";
import { useLocale } from "@/components/providers/locale-provider";
import { useWordProgress } from "@/hooks/use-word-progress";
import { difficultyForLevel, tierSupportLabel } from "@/lib/levels";
import { staggerChildren } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { WeakWordItem } from "@/lib/weak-words/types";
import type { WordGroupSummary } from "@/types/word-lists";

const LEVELS = [1, 2, 3];

/** One accent per tier, reusing the app's existing semantic color tokens (no new colors) so Beginner/Intermediate/Advanced read as a quick, distinct progression at a glance. */
const TIER_ACCENT: Record<number, string> = {
  1: "bg-success/15 text-success ring-success/30",
  2: "bg-accent/20 text-accent ring-accent/40",
  3: "bg-primary/15 text-primary ring-primary/30",
};

/**
 * A quiet "1/2/3" cue inside each tier badge — filled dots count up with the
 * level (Beginner = one, Advanced = three), reusing the badge's own text
 * color via currentColor rather than a second palette. Decorative only
 * (aria-hidden): the tier's own name already says what it is; this is just
 * the at-a-glance shorthand next to it.
 */
function TierDots({ level, total = 3 }: { level: number; total?: number }) {
  return (
    <span className="ms-1.5 inline-flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn("size-1.5 rounded-full", index < level ? "bg-current" : "bg-current/25")}
        />
      ))}
    </span>
  );
}

/**
 * The Word Lists library: three level columns (Beginner/Intermediate/
 * Advanced, same tier labels as everywhere else in the app — see
 * src/lib/levels.ts), each listing that level's vocabulary groups. All
 * three levels are visible at once, unlike the Stories library's
 * one-tier-at-a-time tabs — Word Lists groups are few enough per level
 * (3 today) that showing all three side by side reads as one library, not
 * three separate pages.
 */
export function WordListsLibrary({
  groups,
  isPremiumUser,
  weakWords,
}: {
  groups: WordGroupSummary[];
  isPremiumUser: boolean;
  weakWords: WeakWordItem[];
}) {
  const { isLoaded, completedCountIn } = useWordProgress();
  const { locale, dir, t } = useLocale();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl" dir={dir}>
          {t.library.wordListsHeading}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl" dir={dir}>
          {t.library.wordListsDescription}
        </p>
      </div>

      <NeedsReviewWords words={weakWords} />

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="bg-brand-muted text-primary flex size-14 items-center justify-center rounded-full">
            <BookOpen className="size-7" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium">{t.library.wordListsEmptyHeading}</p>
            <p className="text-muted-foreground mt-1 text-sm">{t.library.checkBackSoon}</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {LEVELS.map((level) => {
            const tierText = locale ? tierSupportLabel(difficultyForLevel(level), locale) : "";
            const levelGroups = groups
              .filter((group) => group.level === level)
              .sort((a, b) => a.order - b.order);

            return (
              <section key={level} className="flex min-w-0 flex-col gap-4">
                <div className="border-border/60 flex items-center gap-2 border-b pb-3">
                  <span
                    dir={dir}
                    className={cn(
                      "inline-flex items-center rounded-full px-3.5 py-1 text-sm font-semibold ring-1 ring-inset",
                      TIER_ACCENT[level],
                    )}
                  >
                    {tierText}
                    <TierDots level={level} />
                  </span>
                  <span
                    className="text-muted-foreground text-xs font-medium tabular-nums"
                    dir="ltr"
                  >
                    {level} / 3
                  </span>
                </div>

                {levelGroups.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t.library.moreGroupsSoon}</p>
                ) : (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={staggerChildren}
                    className="flex flex-col gap-3"
                  >
                    {levelGroups.map((group) => (
                      <WordGroupCard
                        key={group.id}
                        group={group}
                        completedCount={completedCountIn(group.wordIds)}
                        isLoaded={isLoaded}
                        isPremiumUser={isPremiumUser}
                      />
                    ))}
                  </motion.div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
