"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  BookOpen,
  ChevronDown,
  CloudSun,
  Cpu,
  GraduationCap,
  HeartHandshake,
  HeartPulse,
  Home,
  Landmark,
  Leaf,
  Lock,
  Newspaper,
  Palette,
  PawPrint,
  PencilLine,
  Plane,
  Shirt,
  ShoppingBag,
  Users,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/components/providers/locale-provider";
import { difficultyForLevel, tierSupportLabel } from "@/lib/levels";
import { fadeInUp } from "@/lib/motion";
import { TIER_BADGE_CLASS, TIER_ICON_CLASS } from "@/lib/tier-colors";
import { cn } from "@/lib/utils";
import type { WordGroupSummary } from "@/types/word-lists";

/**
 * Word group titles are a small, fixed English category set (see
 * src/data/word-lists/{beginner,intermediate,advanced}.ts) unlike Stories'
 * open-ended lesson titles, so a plain exact-match lookup is enough — none
 * of story-card.tsx's regex-then-stable-hash fallback machinery is needed
 * here. A category added later without an icon yet falls back to a generic
 * book icon rather than crashing.
 */
const TOPIC_ICON: Record<string, LucideIcon> = {
  Family: Users,
  Friendship: HeartHandshake,
  Colors: Palette,
  Animals: PawPrint,
  Food: UtensilsCrossed,
  House: Home,
  Clothes: Shirt,
  Travel: Plane,
  Health: HeartPulse,
  Shopping: ShoppingBag,
  Weather: CloudSun,
  Work: Briefcase,
  Politics: Landmark,
  Finance: Wallet,
  Technology: Cpu,
  Environment: Leaf,
  Education: GraduationCap,
  Media: Newspaper,
};

function iconForGroup(title: string): LucideIcon {
  return TOPIC_ICON[title] ?? BookOpen;
}

/**
 * One vocabulary group in the Word Lists library — the same poster-tile
 * shape as story-card.tsx's StoryCard (real card surface, icon badge, tier
 * chip, corner badge, centered title/subtitle), so the two libraries read
 * as one card family instead of two unrelated designs. The tier chip and
 * the icon badge's color both come from the same shared tier-colors.ts map
 * StoryCard uses, so "Beginner" is the same green in both places.
 *
 * Locked mirrors StoryCard's locked tile exactly (dimmed, a lock badge in
 * the tile's corner, the whole tile a single Link) — clicking still
 * navigates, and the practice screen itself explains the lock.
 *
 * An unlocked tile's face is a toggle button, not a Link — clicking it
 * expands the tile in place to offer the two ways to work through the group
 * (Learn or Practice), the same interaction this card had before this
 * redesign; only the visual shell changed. The corner badge that used to
 * show an inline trailing chevron now sits in the tile's top-end corner —
 * the same slot StoryCard uses for its completed/locked badge — and still
 * rotates open exactly as it did before.
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
  const { locale, dir, t } = useLocale();
  const supportTitle = group.supportTitle ?? group.title;
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  const difficulty = difficultyForLevel(group.level);
  const tierText = locale ? tierSupportLabel(difficulty, locale) : "";
  const Icon = iconForGroup(group.title);

  if (locked) {
    return (
      <motion.div variants={fadeInUp}>
        <Link
          href={`/learn/word-lists/${group.id}`}
          aria-label={t.premium.lockedContentAriaLabel.replace("{title}", group.title)}
          className="focus-visible:ring-ring focus-visible:ring-offset-background block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <div className="border-border/60 bg-card relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border p-4 opacity-90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <span
              className={cn(
                "absolute top-2 left-2 rounded-full border px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm",
                TIER_BADGE_CLASS[difficulty],
              )}
            >
              {tierText}
            </span>
            <span
              aria-hidden="true"
              className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white shadow-sm backdrop-blur-sm"
            >
              <Lock className="size-3" />
            </span>
            <div
              aria-hidden="true"
              className={cn(
                "flex size-10 items-center justify-center rounded-xl",
                TIER_ICON_CLASS[difficulty],
              )}
            >
              <Icon className="size-5" />
            </div>
            <div className="flex w-full flex-col items-center gap-0.5 px-1 text-center">
              <h3 className="line-clamp-2 w-full text-sm leading-snug font-semibold" dir="ltr">
                {group.title}
              </h3>
              <p className="text-muted-foreground w-full truncate text-xs" dir={dir}>
                {supportTitle}
              </p>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeInUp}>
      <div className="border-border/60 bg-card overflow-hidden rounded-2xl border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-colors duration-200 hover:border-white/15">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="focus-visible:ring-ring focus-visible:ring-offset-background relative flex w-full flex-col items-center gap-2 p-4 text-center outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <span
            className={cn(
              "absolute top-2 left-2 rounded-full border px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm",
              TIER_BADGE_CLASS[difficulty],
            )}
          >
            {tierText}
          </span>
          <span
            aria-hidden="true"
            className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white shadow-sm backdrop-blur-sm"
          >
            <ChevronDown
              className={cn("size-3.5 transition-transform duration-200", expanded && "rotate-180")}
            />
          </span>

          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-xl",
              TIER_ICON_CLASS[difficulty],
            )}
          >
            <Icon className="size-5" />
          </div>

          <div className="flex w-full flex-col items-center gap-0.5 px-1">
            <p className="w-full truncate text-sm font-semibold" dir="ltr">
              {group.title}
            </p>
            <p className="text-muted-foreground w-full truncate text-xs" dir={dir}>
              {supportTitle}
            </p>
          </div>

          <div className="mt-1 flex w-full flex-col items-center gap-1">
            {isLoaded ? (
              <>
                <Progress value={percent} className="h-1.5 w-full" />
                <span className="text-muted-foreground text-xs font-medium tabular-nums" dir="ltr">
                  {completedCount} / {group.wordCount}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground text-xs font-medium">
                {t.wordLists.wordCount.replace("{n}", String(group.wordCount))}
              </span>
            )}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            // A plain opacity fade, not an animated height (0 -> "auto"):
            // Framer Motion's "auto" height animation never actually ran
            // here (verified live — the panel stayed pinned at the
            // `initial` height:0/opacity:0 keyframe, with aria-expanded
            // already true, leaving the Learn/Practice buttons rendered
            // but visually collapsed and unreachable). A fade is simple
            // enough to never hit that failure mode.
            <motion.div
              id={panelId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
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
      </div>
    </motion.div>
  );
}
