"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Briefcase,
  Cat,
  Check,
  Coffee,
  DoorOpen,
  Gift,
  Guitar,
  Key,
  Lock,
  MessageSquareWarning,
  Package,
  PhoneCall,
  Radio,
  StickyNote,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { difficultyForLevel, tierLabel, tierSupportLabel } from "@/lib/levels";
import { fadeInUp } from "@/lib/motion";
import { TIER_BADGE_CLASS, TIER_ICON_CLASS } from "@/lib/tier-colors";
import { cn, stableIndex } from "@/lib/utils";
import type { Lesson } from "@/types/content";

/**
 * A handful of story titles map obviously to a topic icon ("The Guitar
 * Lesson" -> Guitar); everything else — most of the catalog, which leans on
 * abstract/emotional titles like "The Decision I Kept Avoiding" that no
 * keyword list could cover — falls back to a stable per-lesson pick from
 * ICON_POOL. Same id-then-keyword-then-pool shape as LessonIllustration's
 * scene picker, and for the same reason: without a fallback pool nearly the
 * whole library collapses onto one generic icon.
 */
const ICON_BY_KEYWORD: [pattern: RegExp, icon: LucideIcon][] = [
  [/neighbor|door|apartment/i, DoorOpen],
  [/shoe|shirt|package|delivery/i, Package],
  [/coffee|cafe|restaurant|recipe|slice|bill|table/i, UtensilsCrossed],
  [/wallet|change|raise|auction|negotiation/i, Wallet],
  [/interview|work|coworker|colleague|job|office|understudy|substitute/i, Briefcase],
  [/guitar|piano|radio|music/i, Guitar],
  [/cat|rooster|dog/i, Cat],
  [/phone|call|voicemail|number/i, PhoneCall],
  [/message|chat|reply|email/i, MessageSquareWarning],
  [/note|letter/i, StickyNote],
  [/key/i, Key],
  [/gift|photo|photograph/i, Gift],
];

const ICON_POOL: LucideIcon[] = [
  DoorOpen,
  Coffee,
  Package,
  Wallet,
  Briefcase,
  Guitar,
  Cat,
  PhoneCall,
  MessageSquareWarning,
  StickyNote,
  Key,
  Gift,
  Radio,
  UtensilsCrossed,
];

function iconForLesson(lessonId: string, title: string): LucideIcon {
  const keywordMatch = ICON_BY_KEYWORD.find(([pattern]) => pattern.test(title));
  if (keywordMatch) return keywordMatch[1];
  // ?? DoorOpen is unreachable in practice (stableIndex's modulo always
  // lands inside ICON_POOL's real length) — same never-actually-undefined
  // caveat as LessonIllustration's own fallback branch.
  return ICON_POOL[stableIndex(lessonId, ICON_POOL.length)] ?? DoorOpen;
}

/**
 * The Stories Library's card — a poster tile, not an info card: the app's
 * real card surface (bg-card — the same dark near-black token every other
 * card in the signed-in shell uses, see .dark .app-shell in globals.css)
 * carries a colored icon badge and the title/subtitle. The icon badge's
 * color comes from TIER_ICON_CLASS below — the lesson's actual difficulty —
 * rather than a random per-lesson hash, so the same tile family reads as
 * one system with Word Lists' cards (see WordGroupCard), which share this
 * exact tile shape and the same tier-color mapping. The two status chips
 * (tier, locked/completed) are styled as overlays — a fixed
 * dark/translucent treatment, not the page's own light/dark theme tokens —
 * since they have to stay legible on top of the tile in either site theme.
 */
export function StoryCard({
  lesson,
  completed,
  isPremiumUser,
}: {
  lesson: Lesson;
  completed: boolean;
  isPremiumUser: boolean;
}) {
  const locked = !lesson.isFree && !isPremiumUser;
  const { locale, dir, t } = useLocale();
  const difficulty = difficultyForLevel(lesson.level);
  const tierText = locale ? tierSupportLabel(difficulty, locale) : tierLabel(difficulty).label;
  const supportTitle = lesson.supportTitle ?? lesson.title;
  const Icon = iconForLesson(lesson.id, lesson.title);

  return (
    <motion.div variants={fadeInUp} className="group h-full">
      <Link
        href={`/learn/stories/${lesson.id}`}
        aria-label={
          locked ? t.premium.lockedContentAriaLabel.replace("{title}", lesson.title) : lesson.title
        }
        className="focus-visible:ring-ring focus-visible:ring-offset-background block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <div
          className={cn(
            "border-border/60 bg-card relative flex h-full w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-all duration-300",
            locked ? "opacity-90" : "hover:border-white/15 motion-safe:group-hover:-translate-y-1",
          )}
        >
          <div
            aria-hidden="true"
            className={cn(
              "relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl ring-1 ring-white/10 transition-transform duration-500 ease-out motion-safe:group-hover:scale-110",
              !lesson.illustrationUrl && TIER_ICON_CLASS[difficulty],
            )}
          >
            {lesson.illustrationUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-provided external URL, not a static local asset (same as BookCard's cover). */}
                <img
                  src={lesson.illustrationUrl}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                />
                {/* A faint dark wash, not a flat tint — keeps a bright admin
                    photo from clashing against the tile's near-black card
                    surface while still reading as a photo, not a duotone. */}
                <div aria-hidden="true" className="absolute inset-0 bg-black/15" />
              </>
            ) : (
              <Icon className="size-6" />
            )}
          </div>

          <span
            className={cn(
              "absolute top-2 left-2 rounded-full border px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm",
              TIER_BADGE_CLASS[difficulty],
            )}
          >
            {tierText}
          </span>

          {(completed || locked) && (
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-2 right-2 flex size-6 items-center justify-center rounded-full shadow-sm",
                completed
                  ? "bg-success text-success-foreground"
                  : "border border-white/15 bg-black/30 text-white backdrop-blur-sm",
              )}
            >
              {completed ? <Check className="size-3.5" /> : <Lock className="size-3" />}
            </span>
          )}

          {/* line-clamp-2 (not truncate) on the title so the full text is
              readable up to two lines — CSS Grid's default row stretch
              (this div is h-full inside the grid cell) keeps every card in
              a row the same height regardless of whether its own title
              actually wraps to one line or two. The Arabic subtitle stays
              single-line/truncated: showing it in full isn't what was
              asked for here, and clamping both lines would make the tile
              noticeably taller than this fix calls for. */}
          <div className="flex w-full flex-col items-center gap-0.5 px-1 text-center">
            <h3 className="line-clamp-2 w-full text-sm leading-snug font-semibold" dir="ltr">
              {lesson.title}
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
