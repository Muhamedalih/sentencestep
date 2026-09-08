"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Crown,
  GraduationCap,
  Lock,
  PencilLine,
  Sprout,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/components/providers/locale-provider";
import { fadeInUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { WordGroupSummary } from "@/types/word-lists";

/**
 * A small per-tier icon badge next to the card's title — a quieter, more
 * distinctive substitute for the thick colored left-border stripe every
 * card used to carry (that read as a generic templated pattern once every
 * card had one). Sprout/Zap/Crown read as "just starting → building
 * momentum → mastery" at a glance, on top of the color, so the three tiers
 * stay visually distinct even for a learner who can't tell the accent
 * colors apart.
 */
const TIER_ICON: Record<number, typeof Sprout> = { 1: Sprout, 2: Zap, 3: Crown };
const TIER_TINT: Record<number, string> = {
  1: "bg-success/12 text-success",
  2: "bg-accent/15 text-accent",
  3: "bg-primary/12 text-primary",
};

/**
 * One vocabulary group in the Word Lists library — the group-level
 * equivalent of story-card.tsx, but for a word count + optional
 * completed-count instead of a lesson's sentence count.
 *
 * Locked state mirrors StoryCard's exact pattern (a lock badge, not a
 * disabled link — clicking still navigates, and the practice screen itself
 * explains the lock, same as PremiumLocked does for lessons).
 *
 * An unlocked card no longer navigates on click — it expands in place to
 * offer the two ways to work through the group: Learn (the flashcard/study
 * view at .../learn) or Practice (the existing fill-in-the-blank exercise).
 * Only one action needs a click to reach, same cost as the old direct link,
 * but the learner now picks which mode before committing to either screen.
 */
export function WordGroupCard({
  group,
  completedCount,
  isLoaded,
  isPremiumUser,
}: {
  group: WordGroupSummary;
  completedCount: number;
  isLoaded: boolean;
  isPremiumUser: boolean;
}) {
  const locked = !group.isFree && !isPremiumUser;
  const percent = group.wordCount === 0 ? 0 : Math.round((completedCount / group.wordCount) * 100);
  const { dir, t } = useLocale();
  const supportTitle = group.supportTitle ?? group.title;
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  const TierIcon = TIER_ICON[group.level] ?? Sprout;

  if (locked) {
    return (
      <motion.div variants={fadeInUp}>
        <Link
          href={`/learn/word-lists/${group.id}`}
          aria-label={t.premium.lockedContentAriaLabel.replace("{title}", group.title)}
          className="focus-visible:ring-ring focus-visible:ring-offset-background block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Card className="flex-row items-center gap-3 px-4 py-3.5 opacity-70 transition-[box-shadow] duration-200">
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full",
                TIER_TINT[group.level],
              )}
            >
              <TierIcon className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium" dir="ltr">
                  {group.title}
                </p>
                <Badge variant="muted" className="shrink-0">
                  <Lock aria-hidden="true" />
                  {t.wordLists.premiumGroup}
                </Badge>
              </div>
              <p className="text-muted-foreground truncate text-sm" dir={dir}>
                {supportTitle}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-muted-foreground text-xs font-medium">
                  {t.wordLists.wordCount.replace("{n}", String(group.wordCount))}
                </span>
              </div>
            </div>
            <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
          </Card>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ scale: 1.025 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
    >
      <Card
        className={cn(
          "gap-0 overflow-hidden p-0 transition-[box-shadow,border-color] duration-200",
          "hover:border-border hover:shadow-md",
        )}
      >
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="focus-visible:ring-ring focus-visible:ring-offset-background flex w-full items-center gap-3 px-4 py-3.5 text-start outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full",
              TIER_TINT[group.level],
            )}
          >
            <TierIcon className="size-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium" dir="ltr">
              {group.title}
            </p>
            <p className="text-muted-foreground truncate text-sm" dir={dir}>
              {supportTitle}
            </p>
            <div className="mt-2 flex items-center gap-2">
              {isLoaded ? (
                <>
                  <Progress value={percent} className="h-1.5" />
                  <span
                    className="text-muted-foreground shrink-0 text-xs font-medium tabular-nums"
                    dir="ltr"
                  >
                    {completedCount} / {group.wordCount}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground text-xs font-medium">
                  {t.wordLists.wordCount.replace("{n}", String(group.wordCount))}
                </span>
              )}
            </div>
          </div>
          <ChevronDown
            className={cn(
              "text-muted-foreground size-4 shrink-0 transition-transform duration-200",
              expanded && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              id={panelId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 px-4 pt-1 pb-4">
                <Button asChild variant="outline" className="flex-1 gap-1.5">
                  <Link href={`/learn/word-lists/${group.id}/learn`}>
                    <GraduationCap className="size-4" aria-hidden="true" />
                    {t.wordLists.learnAction}
                  </Link>
                </Button>
                <Button asChild className="flex-1 gap-1.5">
                  <Link href={`/learn/word-lists/${group.id}`}>
                    <PencilLine className="size-4" aria-hidden="true" />
                    {t.wordLists.practiceAction}
                  </Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
