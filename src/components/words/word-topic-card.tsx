"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";

import { iconForGroup } from "@/components/app/word-group-card";
import { MasteryRankBadge } from "@/components/words/mastery-rank-badge";
import { MasteryRing } from "@/components/words/mastery-ring";
import { useLocale } from "@/components/providers/locale-provider";
import { difficultyForLevel } from "@/lib/levels";
import { fadeInUp } from "@/lib/motion";
import { TIER_TEXT_CLASS } from "@/lib/tier-colors";
import { cn } from "@/lib/utils";
import { rankFor } from "@/lib/word-mastery/dashboard";
import type { Bands } from "@/lib/word-mastery/dashboard";
import type { WordGroupSummary } from "@/types/word-lists";

/**
 * One topic on the redesigned Word Lists dashboard: a mastery ring around the
 * topic's icon (new / learning / mastered), the title and its translation, how
 * many words have been met, what is due, and the mastery rank once one is earned.
 * The whole card is one link to the topic's word wall; a locked topic links to
 * the practice route instead, which is what explains the lock.
 */
export function WordTopicCard({
  group,
  bands,
  dueCount,
  locked,
  scheduled,
}: {
  group: WordGroupSummary;
  bands: Bands;
  /** Words due for review today in this topic (0 when there is no schedule). */
  dueCount: number;
  locked: boolean;
  /** The bands come from the learner's schedule (so "mastered" means something); false when they are only local progress. */
  scheduled: boolean;
}) {
  const { dir, t } = useLocale();
  const copy = t.wordLists.redesign;
  const supportTitle = group.supportTitle ?? group.title;
  const difficulty = difficultyForLevel(group.level);
  const Icon = iconForGroup(group.title);
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;
  const met = bands.total - bands.new;
  const rank = scheduled && !locked ? rankFor(bands) : "none";

  const href = locked ? `/learn/word-lists/${group.id}` : `/learn/word-lists/${group.id}/words`;
  const ringLabel = scheduled
    ? copy.ringAria
        .replace("{mastered}", String(bands.mastered))
        .replace("{total}", String(bands.total))
    : copy.ringAriaNoSchedule
        .replace("{done}", String(met))
        .replace("{total}", String(bands.total));

  return (
    <motion.div variants={fadeInUp}>
      <Link
        href={href}
        className={cn(
          "border-border/60 bg-card hover:border-primary/40 focus-visible:ring-ring focus-visible:ring-offset-background group flex items-center gap-4 rounded-2xl border p-4 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          locked && "opacity-80",
        )}
      >
        <MasteryRing bands={bands} size={64} stroke={6} label={locked ? undefined : ringLabel}>
          {locked ? (
            <Lock className="text-muted-foreground size-5" aria-hidden="true" />
          ) : (
            <Icon className={cn("size-6", TIER_TEXT_CLASS[difficulty])} aria-hidden="true" />
          )}
        </MasteryRing>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold" dir="ltr">
              {group.title}
            </h3>
            <MasteryRankBadge rank={rank} />
          </div>
          <p className="text-muted-foreground truncate text-sm" dir={dir}>
            {supportTitle}
          </p>
          <p
            className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-medium"
            dir={dir}
          >
            {locked ? (
              <span>{copy.lockedTopic}</span>
            ) : (
              <>
                <span className="tabular-nums">
                  {copy.topicMet
                    .replace("{done}", String(met))
                    .replace("{total}", String(bands.total))}
                </span>
                {dueCount > 0 && (
                  <span className="text-accent font-semibold tabular-nums">
                    {copy.topicDue.replace("{n}", String(dueCount))}
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        <Chevron
          aria-hidden="true"
          className="text-muted-foreground group-hover:text-foreground size-5 shrink-0 transition-colors"
        />
      </Link>
    </motion.div>
  );
}
