"use client";

import type { ReactNode } from "react";
import { BookOpen } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { NeedsReviewWords } from "@/components/app/needs-review-words";
import { WordGroupCard } from "@/components/app/word-group-card";
import { WordsSection } from "@/components/home-cards/words-section";
import type { BankCardData } from "@/lib/word-bank/shelves";
import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { useWordProgress } from "@/hooks/use-word-progress";
import { difficultyForLevel, tierSupportLabel } from "@/lib/levels";
import { fadeIn, staggerChildren } from "@/lib/motion";
import { TIER_RING_CLASS, TIER_TEXT_CLASS } from "@/lib/tier-colors";
import { cn } from "@/lib/utils";
import type { WeakWordItem } from "@/lib/weak-words/types";
import type { LibraryMastery } from "@/lib/word-mastery/types";
import type { WordGroupSummary } from "@/types/word-lists";

const LEVELS = [1, 2, 3];

/**
 * A quiet "1/2/3" cue inside each tier badge — filled dots count up with the
 * level (Beginner = one, Advanced = three), reusing the badge's own text
 * color via currentColor rather than a second palette. Decorative only
 * (aria-hidden): the tier's own name already says what it is; this is just
 * the at-a-glance shorthand next to it.
 */
function TierDots({
  level,
  total = 3,
  className,
}: {
  level: number;
  total?: number;
  className?: string;
}) {
  return (
    <span className={cn("ms-1.5 inline-flex items-center gap-0.5", className)} aria-hidden="true">
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
 * src/lib/levels.ts), each a vertical stack of WordGroupCard poster tiles —
 * the same tile shape StoryCard uses (see WordGroupCard/StoryCard's shared
 * shape and tier-colors.ts), just arranged as Word Lists' own tall column
 * sequence rather than copying Stories' wide multi-per-row grid. All three
 * levels are visible at once, unlike the Stories library's one-tier-at-a-
 * time tabs — Word Lists groups are few enough per level that showing all
 * three side by side reads as one library, not three separate pages.
 */
export function WordListsLibrary({
  groups,
  isPremiumUser,
  weakWords,
  mastery = null,
  homeCardWords = null,
  homeCardBank = null,
  shelf = null,
  canEditCovers = false,
}: {
  /** An admin: with the picture covers open (permission wordCovers) each cover carries the buttons that change its picture. */
  canEditCovers?: boolean;
  groups: WordGroupSummary[];
  isPremiumUser: boolean;
  weakWords: WeakWordItem[];
  /** Smart word practice for a signed-in learner: each group's mastery and how many words wait for review. Null for a guest or when the schedule could not be read — the library is then exactly what it always was. */
  mastery?: LibraryMastery | null;
  /** Present while the Home cards are open for the learner (permission "homeCards"): the review card is then drawn exactly like Home's words section, and this is the Arabic meaning of its word cards by word id (empty for other languages). Null keeps the card the page always had. */
  homeCardWords?: Record<string, string> | null;
  /** Today’s words of the learner’s words bank, or null: the card then shows the review queue (and is left out when nothing waits). */
  homeCardBank?: BankCardData | null;
  /** The core-words shelf («كلمات الموقع الأساسية») of the words bank, drawn under the review card; null for everyone the bank is closed to. */
  shelf?: ReactNode;
}) {
  const { isLoaded, completedCountIn } = useWordProgress();
  const { locale, dir, t } = useLocale();
  // The picture covers (permission wordCovers): the three levels become rows of covers, one under the other.
  const covers = useFeatures().rollouts.wordCovers;
  const reducedMotion = useReducedMotion() ?? false;
  // What waits for review: the words due now, and — with Smart word practice — the schedule's own count.
  const reviewWords = weakWords.filter((word) => word.dueNow);
  const reviewCount = mastery?.reviewCount ?? reviewWords.length;

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

      {homeCardWords ? (
        // The same section Home ends with, with the same words and meanings; like the classic card it is
        // left out when nothing waits (its button would only lead back here).
        reviewCount > 0 || homeCardBank ? (
          <WordsSection
            reviewCount={reviewCount}
            words={reviewWords}
            hints={homeCardWords}
            bank={homeCardBank}
            className="mb-6 sm:mb-10"
            index={0}
          />
        ) : null
      ) : (
        <NeedsReviewWords words={reviewWords} count={mastery?.reviewCount} smart={!!mastery} />
      )}

      {shelf && <div className="mb-6 sm:mb-10">{shelf}</div>}

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
      ) : covers ? (
        <div className="flex flex-col gap-9">
          {LEVELS.map((level) => {
            const difficulty = difficultyForLevel(level);
            const tierText = locale ? tierSupportLabel(difficulty, locale) : "";
            const levelGroups = groups
              .filter((group) => group.level === level)
              .sort((a, b) => a.order - b.order);

            return (
              // Each level comes in as it scrolls into view: its heading first, then its covers one after another.
              <motion.section
                key={level}
                initial={reducedMotion ? false : "hidden"}
                whileInView="visible"
                viewport={{ once: true, margin: "0px 0px -80px 0px" }}
                variants={staggerChildren}
                className="min-w-0"
              >
                <motion.div variants={fadeIn} className="mb-[18px] flex items-center gap-2.5">
                  <span className={cn("inline-flex items-center", TIER_TEXT_CLASS[difficulty])}>
                    <TierDots level={level} className="ms-0 gap-1" />
                  </span>
                  <h2
                    className={cn("text-[14.5px] font-semibold", TIER_TEXT_CLASS[difficulty])}
                    dir={dir}
                  >
                    {tierText}
                  </h2>
                  <span className="bg-border/60 h-px flex-1" aria-hidden="true" />
                </motion.div>

                {levelGroups.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t.library.moreGroupsSoon}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-x-3.5 gap-y-[22px] sm:gap-x-5 sm:gap-y-[26px] lg:grid-cols-3 xl:grid-cols-4">
                    {levelGroups.map((group) => (
                      <WordGroupCard
                        key={group.id}
                        group={group}
                        completedCount={completedCountIn(group.wordIds)}
                        isLoaded={isLoaded}
                        isPremiumUser={isPremiumUser}
                        mastery={mastery?.byGroup[group.id] ?? null}
                        canEditCover={canEditCovers}
                      />
                    ))}
                  </div>
                )}
              </motion.section>
            );
          })}
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
                      TIER_RING_CLASS[difficultyForLevel(level)],
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
                    className="flex flex-col gap-3 lg:gap-4"
                  >
                    {levelGroups.map((group) => (
                      <WordGroupCard
                        key={group.id}
                        group={group}
                        completedCount={completedCountIn(group.wordIds)}
                        isLoaded={isLoaded}
                        isPremiumUser={isPremiumUser}
                        mastery={mastery?.byGroup[group.id] ?? null}
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
