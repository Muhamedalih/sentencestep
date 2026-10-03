"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Search, X } from "lucide-react";

import { CountUp } from "@/components/words/count-up";
import { MasteryRing } from "@/components/words/mastery-ring";
import { WordTopicCard } from "@/components/words/word-topic-card";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { useWordProgress } from "@/hooks/use-word-progress";
import { difficultyForLevel, tierSupportLabel } from "@/lib/levels";
import { staggerChildren } from "@/lib/motion";
import { TIER_RING_CLASS } from "@/lib/tier-colors";
import { cn } from "@/lib/utils";
import type { WeakWordItem } from "@/lib/weak-words/types";
import {
  bandsFromCompleted,
  bandsFromGroupMastery,
  masteredPercent,
  sumBands,
} from "@/lib/word-mastery/dashboard";
import type { Bands } from "@/lib/word-mastery/dashboard";
import type { LibraryMastery } from "@/lib/word-mastery/types";
import type { WordGroupSummary } from "@/types/word-lists";

const LEVELS = [1, 2, 3] as const;
type Level = (typeof LEVELS)[number];

/** Case-insensitive match of a topic against what was typed, on every name the topic has. */
function matchesQuery(group: WordGroupSummary, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return true;
  return [group.title, group.supportTitle, group.titleAr].some((name) =>
    name?.toLowerCase().includes(needle),
  );
}

/**
 * The redesigned Word Lists library, as a dashboard: an overview of the whole
 * vocabulary (a mastery ring and counted figures for mastered / learning / new /
 * due today), a sticky bar with the topic search and the level tabs, and the
 * topics of the chosen level as ring cards. Levels are tabs on a phone and three
 * side-by-side columns on a wide screen (where every level is visible at once,
 * as before); searching shows the matching topics of every level together.
 *
 * With a schedule (Smart word practice, signed in) the rings count mastered /
 * learning / new from the learner's strengths; without one they show local
 * progress, where finished words are "learning" and nothing is claimed as
 * mastered — see bandsFromCompleted.
 */
export function WordListsDashboard({
  groups,
  isPremiumUser,
  weakWords,
  mastery = null,
}: {
  groups: WordGroupSummary[];
  isPremiumUser: boolean;
  weakWords: WeakWordItem[];
  /** The learner's schedule summary per topic, or null for a guest / when Smart word practice is off. */
  mastery?: LibraryMastery | null;
}) {
  const { locale, dir, t } = useLocale();
  const copy = t.wordLists.redesign;
  const { isLoaded, completedCountIn } = useWordProgress();
  const [activeLevel, setActiveLevel] = useState<Level>(1);
  const [query, setQuery] = useState("");
  const searching = query.trim().length > 0;

  const scheduled = mastery !== null;
  const rows = useMemo(
    () =>
      groups.map((group) => {
        const locked = !group.isFree && !isPremiumUser;
        let bands: Bands;
        if (locked) bands = bandsFromCompleted(group.wordCount, 0);
        else if (mastery?.byGroup[group.id])
          bands = bandsFromGroupMastery(mastery.byGroup[group.id]!);
        else
          bands = bandsFromCompleted(
            group.wordCount,
            isLoaded ? completedCountIn(group.wordIds) : 0,
          );
        return { group, locked, bands, dueCount: mastery?.byGroup[group.id]?.dueCount ?? 0 };
      }),
    [groups, isPremiumUser, mastery, isLoaded, completedCountIn],
  );

  const unlocked = rows.filter((row) => !row.locked);
  const totals = sumBands(unlocked.map((row) => row.bands));
  const reviewCount = mastery?.reviewCount ?? weakWords.filter((word) => word.dueNow).length;
  const percent = masteredPercent(totals);

  const visibleRows = rows.filter((row) => matchesQuery(row.group, query));

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

      {groups.length > 0 && (
        <section
          aria-label={copy.overviewTitle}
          className="border-border/60 bg-card mb-8 flex flex-col gap-6 rounded-2xl border p-5 sm:flex-row sm:items-center sm:gap-8 sm:p-6"
        >
          <div className="flex items-center gap-5">
            <MasteryRing
              bands={totals}
              size={104}
              stroke={10}
              label={
                scheduled
                  ? copy.ringAria
                      .replace("{mastered}", String(totals.mastered))
                      .replace("{total}", String(totals.total))
                  : copy.ringAriaNoSchedule
                      .replace("{done}", String(totals.total - totals.new))
                      .replace("{total}", String(totals.total))
              }
            >
              <span className="text-2xl font-bold tabular-nums" dir="ltr">
                <CountUp value={percent} />
                <span className="text-muted-foreground text-sm font-semibold">%</span>
              </span>
            </MasteryRing>
            <h2 className="text-lg font-semibold sm:hidden" dir={dir}>
              {copy.overviewTitle}
            </h2>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="mb-3 hidden text-lg font-semibold sm:block" dir={dir}>
              {copy.overviewTitle}
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4" dir={dir}>
              <Figure value={totals.mastered} label={copy.bandMastered} dotClass="bg-success" />
              <Figure value={totals.learning} label={copy.bandLearning} dotClass="bg-primary" />
              <Figure value={totals.new} label={copy.bandNew} dotClass="bg-muted-foreground/30" />
              {scheduled && (
                <Figure value={reviewCount} label={copy.overviewDue} dotClass="bg-accent" />
              )}
            </dl>
          </div>

          {reviewCount > 0 && (
            <div className="flex shrink-0 flex-col gap-1.5 sm:items-end" dir={dir}>
              <Button asChild>
                <Link href="/learn/word-lists/review">
                  {copy.reviewNow.replace("{n}", String(reviewCount))}
                </Link>
              </Button>
              <p className="text-muted-foreground text-xs">{copy.reviewNowHint}</p>
            </div>
          )}
        </section>
      )}

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
        <>
          {/* Sticky under the app header (h-16): on a phone the level tabs stay in reach while a long
              level scrolls; on a wide screen all three levels are visible and only the search remains. */}
          <div className="bg-background/90 border-border/60 sticky top-16 z-30 -mx-6 mb-6 border-b px-6 py-3 backdrop-blur-md lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div
                role="tablist"
                aria-label={t.library.levelTabsAriaLabel}
                className={cn(
                  "bg-muted/60 ring-border/50 grid grid-cols-3 gap-0.5 rounded-full p-1 ring-1 lg:hidden",
                  searching && "hidden",
                )}
              >
                {LEVELS.map((level) => {
                  const levelRows = rows.filter((row) => row.group.level === level && !row.locked);
                  const levelBands = sumBands(levelRows.map((row) => row.bands));
                  const active = level === activeLevel;
                  return (
                    <button
                      key={level}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveLevel(level)}
                      className={cn(
                        "focus-visible:ring-ring focus-visible:ring-offset-background flex items-center justify-center gap-2 rounded-full px-2 py-1.5 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 pointer-coarse:min-h-11",
                        active
                          ? "bg-background text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <MasteryRing bands={levelBands} size={20} stroke={3} />
                      <span dir={dir} className="truncate">
                        {locale ? tierSupportLabel(difficultyForLevel(level), locale) : level}
                      </span>
                    </button>
                  );
                })}
              </div>

              <label className="relative block lg:w-72">
                <span className="sr-only">{copy.searchAria}</span>
                <Search
                  className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                  dir={dir}
                  autoComplete="off"
                  className="border-input bg-background focus-visible:ring-ring h-10 w-full rounded-xl border ps-9 pe-9 text-sm outline-none focus-visible:ring-2 pointer-coarse:h-11 [&::-webkit-search-cancel-button]:hidden"
                />
                {searching && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label={copy.searchClear}
                    className="text-muted-foreground hover:text-foreground absolute end-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full pointer-coarse:end-0 pointer-coarse:size-11"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                )}
              </label>
            </div>
          </div>

          {searching && visibleRows.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-16 text-center" dir={dir}>
              <p className="font-medium">{copy.noResultsHeading}</p>
              <p className="text-muted-foreground text-sm">{copy.noResultsBody}</p>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-3">
              {LEVELS.map((level) => {
                const levelRows = visibleRows
                  .filter((row) => row.group.level === level)
                  .sort((a, b) => a.group.order - b.group.order);
                // Searching: only levels with a match. Otherwise one level on a phone, all on a wide screen.
                const hidden = searching ? levelRows.length === 0 : false;
                const shownOnPhone = searching || level === activeLevel;
                const tierText = locale ? tierSupportLabel(difficultyForLevel(level), locale) : "";
                const levelBands = sumBands(
                  rows
                    .filter((row) => row.group.level === level && !row.locked)
                    .map((row) => row.bands),
                );

                return (
                  <section
                    key={level}
                    className={cn(
                      "min-w-0 flex-col gap-4",
                      hidden ? "hidden" : shownOnPhone ? "flex" : "hidden lg:flex",
                    )}
                  >
                    <div
                      className={cn(
                        "border-border/60 items-center gap-2 border-b pb-3",
                        searching ? "flex" : "hidden lg:flex",
                      )}
                    >
                      <span
                        dir={dir}
                        className={cn(
                          "inline-flex items-center rounded-full px-3.5 py-1 text-sm font-semibold ring-1 ring-inset",
                          TIER_RING_CLASS[difficultyForLevel(level)],
                        )}
                      >
                        {tierText}
                      </span>
                      <span
                        className="text-muted-foreground text-xs font-medium tabular-nums"
                        dir="ltr"
                      >
                        {levelBands.mastered} / {levelBands.total}
                      </span>
                    </div>

                    {levelRows.length === 0 ? (
                      <p className="text-muted-foreground text-sm">{t.library.moreGroupsSoon}</p>
                    ) : (
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerChildren}
                        className="flex flex-col gap-3"
                      >
                        {levelRows.map((row) => (
                          <WordTopicCard
                            key={row.group.id}
                            group={row.group}
                            bands={row.bands}
                            dueCount={row.dueCount}
                            locked={row.locked}
                            scheduled={scheduled}
                          />
                        ))}
                      </motion.div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** One counted figure of the overview: a colored dot (the band's color in the ring), the number and its label. */
function Figure({ value, label, dotClass }: { value: number; label: string; dotClass: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        <span className={cn("size-2 rounded-full", dotClass)} aria-hidden="true" />
        {label}
      </dt>
      <dd className="text-2xl font-bold tabular-nums">
        <CountUp value={value} />
      </dd>
    </div>
  );
}
