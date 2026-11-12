"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Lock } from "lucide-react";

import { CoverFace, iconForGroup } from "@/components/app/word-group-card";
import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { WordCoverEditor } from "@/components/words/word-cover-editor";
import { useWordProgress } from "@/hooks/use-word-progress";
import { difficultyForLevel, tierLabel, tierSupportLabel } from "@/lib/levels";
import { fadeIn, fadeInUp, staggerChildren } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { wordsHubStrings } from "@/lib/words-hub/strings";
import type { WordGroupSummary } from "@/types/word-lists";

const LEVELS = [1, 2, 3] as const;
type Level = (typeof LEVELS)[number];

/**
 * The topics of the Words page: the three levels as tabs and the chosen level's topics as plain cards
 * (the topic's name in English and in the learner's language, how many of its words are done, a thin
 * bar), no pictures. A locked topic wears a lock and still opens its own lock screen. A card goes to
 * the topic's own screen when the word rounds are open for the learner, and otherwise to the Learn
 * and Practice chooser the topics always had. The learner's progress is read in the browser (a
 * guest's lives there; a signed-in learner's comes from their account), exactly like the Word Lists
 * library.
 */
export function WordsTopicGrid({
  groups,
  isPremiumUser,
  canEditCovers = false,
}: {
  groups: WordGroupSummary[];
  isPremiumUser: boolean;
  /** An admin: with the picture covers open (permission wordCovers) each cover carries the buttons that change its picture. */
  canEditCovers?: boolean;
}) {
  const { locale, dir, t } = useLocale();
  const s = wordsHubStrings(locale);
  const { rollouts } = useFeatures();
  const { isLoaded, completedCountIn } = useWordProgress();
  const [level, setLevel] = useState<Level>(1);
  // With the picture covers open (permission wordCovers) moving between the levels is animated: the
  // active tab's pill glides to the new level and the covers of that level rise in one after another.
  const animated = rollouts.wordCovers;
  const reducedMotion = useReducedMotion() ?? false;

  const shown = groups.filter((group) => group.level === level).sort((a, b) => a.order - b.order);
  const levelLabel = (value: Level) =>
    locale
      ? tierSupportLabel(difficultyForLevel(value), locale)
      : tierLabel(difficultyForLevel(value)).label;

  return (
    <div>
      <div className="bg-muted mt-5 flex rounded-[10px] p-[3px] md:mt-5 md:inline-flex">
        {LEVELS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setLevel(value)}
            aria-pressed={level === value}
            className={cn(
              "relative flex-1 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-150 md:flex-none md:px-4",
              level === value
                ? animated
                  ? "text-primary"
                  : "bg-brand-muted text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {animated && level === value && (
              <motion.span
                layoutId="words-level-pill"
                aria-hidden="true"
                className="bg-brand-muted absolute inset-0 rounded-lg"
                transition={
                  reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }
                }
              />
            )}
            <span dir="auto" className="relative">
              {levelLabel(value)}
            </span>
          </button>
        ))}
      </div>

      <GridShell
        animated={animated}
        levelKey={level}
        className={cn(
          "mt-4 grid grid-cols-2",
          // With the picture covers open (permission wordCovers) the topics are covers, as on the Word Lists
          // page: two across on a phone, three on a laptop, four on a wide screen.
          animated
            ? "mt-5 gap-x-3.5 gap-y-[22px] sm:gap-x-5 sm:gap-y-[26px] lg:grid-cols-3 xl:grid-cols-4"
            : "gap-3 md:grid-cols-4 md:gap-4",
        )}
      >
        {shown.map((group) => {
          const locked = !group.isFree && !isPremiumUser;
          const done = isLoaded && !locked ? completedCountIn(group.wordIds) : 0;
          const finished = !locked && group.wordCount > 0 && done >= group.wordCount;
          const started = done > 0 && !finished;
          // A topic still in draft (an admin's grid only) opens the admin's own preview of the list.
          const href = group.draft
            ? `/admin/word-lists/${group.id}/preview`
            : locked
              ? `/learn/word-lists/${group.id}`
              : rollouts.wordLadder
                ? `/learn/word-lists/${group.id}`
                : `/learn/word-lists/${group.id}/words`;
          const percent = group.wordCount === 0 ? 0 : Math.round((done / group.wordCount) * 100);
          if (rollouts.wordCovers) {
            return (
              <motion.div
                key={group.id}
                variants={reducedMotion ? fadeIn : fadeInUp}
                className="group relative"
              >
                <Link
                  href={href}
                  prefetch={false}
                  aria-label={group.title}
                  className="focus-visible:ring-ring focus-visible:ring-offset-background block rounded-[14px] outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <CoverFace
                    as="h3"
                    difficulty={difficultyForLevel(group.level)}
                    Icon={iconForGroup(group.title)}
                    group={group}
                    dir={dir}
                    locked={locked}
                    completed={finished}
                    count={
                      started || finished
                        ? `${done} / ${group.wordCount}`
                        : s.wordsCount(group.wordCount)
                    }
                    dueLabel={null}
                    percent={finished ? 100 : percent}
                    progressLabel={t.wordLists.progressLabel}
                  />
                </Link>
                {group.draft && (
                  <span
                    dir="ltr"
                    className="pointer-events-none absolute top-2 left-2 rounded-full border border-white/20 bg-black/60 px-2.5 py-0.5 text-[11px] leading-normal font-semibold text-white backdrop-blur-sm sm:top-2.5 sm:left-2.5"
                  >
                    Draft
                  </span>
                )}
                {canEditCovers && (
                  <WordCoverEditor groupId={group.id} hasPicture={Boolean(group.coverUrl)} />
                )}
              </motion.div>
            );
          }
          return (
            <Link
              key={group.id}
              href={href}
              prefetch={false}
              className={cn(
                "bg-card border-border hover:border-primary/40 focus-visible:ring-ring flex min-h-[92px] flex-col rounded-2xl border px-4 py-3.5 transition-colors duration-150 outline-none focus-visible:ring-2 md:min-h-[108px] md:px-[18px] md:py-4",
                locked && "opacity-80",
              )}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span
                  className="text-foreground text-[17px] leading-tight font-semibold tracking-[-0.01em] md:text-lg"
                  dir="ltr"
                >
                  {group.title}
                </span>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 text-[12.5px] tabular-nums",
                    finished ? "text-success" : "text-muted-foreground",
                  )}
                  dir="auto"
                >
                  {locked ? (
                    <Lock className="size-3.5" aria-hidden="true" />
                  ) : finished ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : started ? (
                    `${done}/${group.wordCount}`
                  ) : (
                    s.wordsCount(group.wordCount)
                  )}
                </span>
              </span>
              <span className="text-muted-foreground mt-0.5 text-[13.5px]" dir={dir}>
                {group.supportTitle ?? group.titleAr}
              </span>
              {(started || finished) && (
                <span className="bg-muted mt-auto block h-1 overflow-hidden rounded-full pt-0">
                  <span
                    className={cn(
                      "block h-full rounded-full",
                      finished ? "bg-success" : "bg-primary",
                    )}
                    style={{ width: `${finished ? 100 : percent}%` }}
                  />
                </span>
              )}
            </Link>
          );
        })}
      </GridShell>
    </div>
  );
}

/**
 * The grid of one level. Plain when the picture covers are closed; with them open it is keyed by the
 * level, so choosing another level mounts it afresh and its covers rise in one after another (the
 * covers carry their own entrance, see the cards above).
 */
function GridShell({
  animated,
  levelKey,
  className,
  children,
}: {
  animated: boolean;
  levelKey: number;
  className: string;
  children: ReactNode;
}) {
  if (!animated) return <div className={className}>{children}</div>;
  return (
    <motion.div
      key={levelKey}
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
      className={className}
    >
      {children}
    </motion.div>
  );
}
