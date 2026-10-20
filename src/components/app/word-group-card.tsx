"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  BookOpen,
  Check,
  CloudSun,
  Cpu,
  GraduationCap,
  HeartHandshake,
  HeartPulse,
  Home,
  Landmark,
  Layers,
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
import { useLocale } from "@/components/providers/locale-provider";
import { difficultyForLevel, type Difficulty } from "@/lib/levels";
import { fadeInUp } from "@/lib/motion";
import { TIER_DOT_CLASS, TIER_WATERMARK_CLASS } from "@/lib/tier-colors";
import { cn } from "@/lib/utils";
import type { GroupMastery } from "@/lib/word-mastery/schedule";
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

export function iconForGroup(title: string): LucideIcon {
  return TOPIC_ICON[title] ?? BookOpen;
}

const CARD_CLASS =
  "border-border/60 bg-card overflow-hidden rounded-2xl border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";
const FACE_CLASS =
  "relative flex min-h-44 w-full flex-col justify-end p-4 text-start lg:min-h-56 lg:p-5";

function GroupFace({
  as: Title = "span",
  difficulty,
  Icon,
  title,
  supportTitle,
  dir,
  status,
  percent,
  progressLabel,
  left,
  right,
}: {
  as?: "h3" | "span";
  difficulty: Difficulty;
  Icon: LucideIcon;
  title: string;
  supportTitle: string;
  dir: "ltr" | "rtl";
  status: "locked" | "completed" | null;
  percent: number;
  progressLabel: string;
  left: ReactNode;
  right: ReactNode;
}) {
  const dimmed = status === "locked";
  return (
    <>
      {/* The hollow outline is two strokes of the same icon: a wide one in the level's colour, then a
          narrower one in the card's own colour on top, so only the two edges of the wide stroke show. */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -top-1 right-1 size-[100px] lg:size-[124px]",
          dimmed && "opacity-60",
        )}
      >
        <Icon
          strokeWidth={2}
          className={cn("absolute inset-0 size-full", TIER_WATERMARK_CLASS[difficulty])}
        />
        <Icon strokeWidth={1.5} className="text-card absolute inset-0 size-full" />
      </span>
      {status && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-3.5 left-3.5 flex size-[26px] items-center justify-center rounded-full border lg:size-[30px]",
            status === "completed"
              ? cn("border-transparent text-white", TIER_DOT_CLASS[difficulty])
              : "border-border bg-foreground/5 text-muted-foreground",
          )}
        >
          {status === "locked" ? <Lock className="size-3.5" /> : <Check className="size-3.5" />}
        </span>
      )}
      <span className={cn("relative flex min-w-0 flex-col", dimmed && "opacity-60")}>
        <Title
          className="line-clamp-2 block text-[17px] leading-tight font-semibold lg:text-xl"
          dir="ltr"
        >
          {title}
        </Title>
        <span
          className="text-muted-foreground mt-0.5 block truncate text-[13.5px] lg:text-[15px]"
          dir={dir}
        >
          {supportTitle}
        </span>
        <span
          role="progressbar"
          aria-label={progressLabel}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="bg-border mt-3.5 block h-1 overflow-hidden rounded-full lg:mt-4 lg:h-[5px]"
        >
          <span
            className={cn(
              "block h-full rounded-full transition-[width] duration-500 ease-out",
              TIER_DOT_CLASS[difficulty],
            )}
            style={{ width: `${percent}%` }}
          />
        </span>
        <span className="text-muted-foreground mt-2 flex items-center justify-between gap-3 text-[13px] tabular-nums lg:text-[15px]">
          <span className="shrink-0" dir="auto">
            {left}
          </span>
          <span className="min-w-0 truncate text-end" dir={dir}>
            {right}
          </span>
        </span>
      </span>
    </>
  );
}

/**
 * One vocabulary group in the Word Lists library, drawn like the Stories cards' family but with no
 * ribbon: the topic's icon is a large hollow outline in the level's colour (the level shows there,
 * there is no separate marker or tier chip, the column header already names the level), then the
 * title, the translated title, a thin progress bar in the level's colour and one line of counts.
 * A small round badge appears top-left only when it has something to say: a lock (Premium group,
 * the card is dimmed) or a check (every word finished). Text and the card itself step up at `lg`,
 * the laptop size, where the old tiles read small; below that the tile keeps its compact size.
 *
 * Locked: the whole tile is a single Link, clicking still navigates, and the practice screen itself
 * explains the lock. An unlocked tile's face is a toggle button, not a Link — clicking it expands
 * the tile in place to offer the two ways to work through the group (Learn or Practice).
 */
export function WordGroupCard({
  group,
  completedCount,
  isLoaded,
  isPremiumUser,
  mastery = null,
}: {
  group: WordGroupSummary;
  completedCount: number;
  isLoaded: boolean;
  isPremiumUser: boolean;
  /** Smart word practice for a signed-in learner: this group's mastery. The bar and the percent show how many of the group's words the learner has finished (10 of 20 reads 50%), the counts say what is due and new, and the primary action becomes Continue. */
  mastery?: GroupMastery | null;
}) {
  const locked = !group.isFree && !isPremiumUser;
  const percent = group.wordCount === 0 ? 0 : Math.round((completedCount / group.wordCount) * 100);
  const { dir, t } = useLocale();
  const supportTitle = group.supportTitle ?? group.title;
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  // Part-way through a group (without the spaced schedule's own Continue): the
  // primary action picks up where the learner left off, and a second one starts
  // the whole list again from its first word.
  const partlyDone = !mastery && isLoaded && completedCount > 0 && completedCount < group.wordCount;

  const difficulty = difficultyForLevel(group.level);
  const Icon = iconForGroup(group.title);
  const doneCount = mastery ? mastery.doneCount : completedCount;
  const completedAll =
    !locked && (!!mastery || isLoaded) && group.wordCount > 0 && doneCount >= group.wordCount;
  const barPercent = mastery ? mastery.percent : percent;
  const progressLabel = t.wordLists.progressLabel;

  if (locked) {
    return (
      <motion.div variants={fadeInUp}>
        <Link
          href={`/learn/word-lists/${group.id}`}
          aria-label={t.premium.lockedContentAriaLabel.replace("{title}", group.title)}
          className="focus-visible:ring-ring focus-visible:ring-offset-background block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <div className={cn(CARD_CLASS, FACE_CLASS)}>
            <GroupFace
              as="h3"
              difficulty={difficulty}
              Icon={Icon}
              title={group.title}
              supportTitle={supportTitle}
              dir={dir}
              status="locked"
              percent={0}
              progressLabel={progressLabel}
              left={t.wordLists.wordCount.replace("{n}", String(group.wordCount))}
              right={t.wordLists.premiumGroup}
            />
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeInUp}>
      <div className={cn(CARD_CLASS, "transition-colors duration-200 hover:border-white/15")}>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls={panelId}
          className={cn(
            FACE_CLASS,
            "focus-visible:ring-ring focus-visible:ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          )}
        >
          <GroupFace
            difficulty={difficulty}
            Icon={Icon}
            title={group.title}
            supportTitle={supportTitle}
            dir={dir}
            status={completedAll ? "completed" : null}
            percent={barPercent}
            progressLabel={progressLabel}
            left={
              mastery
                ? `${mastery.doneCount} / ${mastery.total}`
                : isLoaded
                  ? `${completedCount} / ${group.wordCount}`
                  : t.wordLists.wordCount.replace("{n}", String(group.wordCount))
            }
            right={
              mastery && mastery.dueCount > 0 ? (
                <span className="text-primary font-medium">
                  {t.wordLists.smart.dueBadge.replace("{n}", String(mastery.dueCount))}
                </span>
              ) : completedAll ? (
                t.wordLists.complete
              ) : null
            }
          />
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
              <div
                className={cn(
                  "flex items-center gap-2 px-4 pt-1 lg:px-5",
                  mastery ? "pb-3" : "pb-4",
                )}
              >
                <Button asChild variant="outline" className="flex-1 gap-1.5">
                  <Link href={`/learn/word-lists/${group.id}/learn`}>
                    <GraduationCap className="size-4" aria-hidden="true" />
                    {t.wordLists.learnAction}
                  </Link>
                </Button>
                <Button asChild className="flex-1 gap-1.5">
                  <Link href={`/learn/word-lists/${group.id}${partlyDone ? "?scope=resume" : ""}`}>
                    <PencilLine className="size-4" aria-hidden="true" />
                    {mastery || partlyDone
                      ? t.wordLists.smart.continueAction
                      : t.wordLists.practiceAction}
                  </Link>
                </Button>
              </div>
              {partlyDone && (
                <div className="px-4 pb-4 lg:px-5">
                  <Link
                    href={`/learn/word-lists/${group.id}?scope=all`}
                    className="border-primary/25 from-primary/15 to-primary/5 text-primary hover:border-primary/50 hover:from-primary/25 hover:to-primary/10 focus-visible:ring-ring focus-visible:ring-offset-background flex w-full items-center justify-center gap-2 rounded-xl border bg-gradient-to-b px-4 py-2.5 text-sm font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-all duration-200 outline-none hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-offset-2"
                  >
                    <Layers className="size-4" aria-hidden="true" />
                    {t.wordLists.restartAction}
                  </Link>
                </div>
              )}
              {mastery && (
                // The whole list again, whatever is due: a quiet but real button (tinted
                // surface, icon, hover lift) rather than a grey text link, so it reads as
                // a deliberate second path next to Learn and Continue.
                <div className="px-4 pb-4 lg:px-5">
                  <Link
                    href={`/learn/word-lists/${group.id}?scope=all`}
                    className="border-primary/25 from-primary/15 to-primary/5 text-primary hover:border-primary/50 hover:from-primary/25 hover:to-primary/10 focus-visible:ring-ring focus-visible:ring-offset-background flex w-full items-center justify-center gap-2 rounded-xl border bg-gradient-to-b px-4 py-2.5 text-sm font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-all duration-200 outline-none hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-offset-2"
                  >
                    <Layers className="size-4" aria-hidden="true" />
                    {t.wordLists.smart.practiceAllAction}
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
