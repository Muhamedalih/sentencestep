"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/components/providers/locale-provider";
import { fadeInUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { WordGroupSummary } from "@/types/word-lists";

/** Same per-tier accent as word-lists-library.tsx's tier badges (kept as its own small map here rather than a shared import — three lines, one call site each, not worth the indirection): a colored left edge plus a barely-there tint on hover, never a filled/loud background. */
const TIER_CARD_ACCENT: Record<number, string> = {
  1: "border-l-success/70 hover:bg-success/[0.04]",
  2: "border-l-accent/70 hover:bg-accent/[0.06]",
  3: "border-l-primary/70 hover:bg-primary/[0.04]",
};

/**
 * One vocabulary group in the Word Lists library — the group-level
 * equivalent of story-card.tsx, but for a word count + optional
 * completed-count instead of a lesson's sentence count. Locked state
 * mirrors StoryCard's exact pattern (a lock badge, not a disabled link —
 * clicking still navigates, and the practice screen itself explains the
 * lock, same as PremiumLocked does for lessons).
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

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={locked ? undefined : { scale: 1.025 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
    >
      <Link
        href={`/learn/word-lists/${group.id}`}
        aria-label={
          locked ? t.premium.lockedContentAriaLabel.replace("{title}", group.title) : group.title
        }
        className="focus-visible:ring-ring focus-visible:ring-offset-background block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <Card
          className={cn(
            "flex-row items-center justify-between gap-3 border-l-[3px] px-4 py-3.5 transition-[box-shadow,background-color] duration-200",
            locked ? "opacity-80" : ["hover:shadow-md", TIER_CARD_ACCENT[group.level]],
          )}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium" dir="ltr">
                {group.title}
              </p>
              {locked && (
                <Badge variant="muted" className="shrink-0">
                  <Lock aria-hidden="true" />
                  {t.wordLists.premiumGroup}
                </Badge>
              )}
            </div>
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
          <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
        </Card>
      </Link>
    </motion.div>
  );
}
