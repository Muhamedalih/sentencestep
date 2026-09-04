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
import { difficultyForLevel, tierLabel, tierSupportLabel, type Difficulty } from "@/lib/levels";
import { fadeInUp } from "@/lib/motion";
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
 * One fixed dark tile color for every card — deliberately not themed (like
 * the status chips below), so the grid reads as one calm, premium set
 * rather than the site's actual brand/accent tokens, which the signed-in
 * dashboard neutralizes to grayscale anyway (see .app-shell in globals.css).
 * A first pass gave every card its own hue (see git history), which read as
 * a loud, inconsistent rainbow across a full grid — color now lives only in
 * each card's icon badge below, which is what an actually premium-feeling
 * tile grid (Linear, Notion) does: one quiet surface, color used sparingly
 * as an accent rather than as the whole tile's identity.
 */
const CARD_SURFACE = "oklch(0.24 0.02 265)";

/**
 * A restrained three-tone accent set for the icon badge only — not the
 * whole tile (see CARD_SURFACE above). Each tone is a [badge background,
 * icon color] pair from the same hue, picked stably per lesson so neighbors
 * vary a little without the grid turning into a rainbow.
 */
const ICON_ACCENTS: [badge: string, icon: string][] = [
  ["oklch(0.32 0.09 273)", "oklch(0.78 0.12 273)"],
  ["oklch(0.34 0.08 75)", "oklch(0.8 0.14 75)"],
  ["oklch(0.32 0.07 165)", "oklch(0.75 0.11 165)"],
];
// Non-null: a literal array declared right above with 3 entries always has
// an index 0 — this exists only to give the ?? fallback below a value
// noUncheckedIndexedAccess accepts without widening it back to `| undefined`.
const DEFAULT_ICON_ACCENT = ICON_ACCENTS[0]!;

/**
 * The same green/amber/red tier language as the tab bar's own underline
 * (see TIER_BG_ACCENT/TIER_TEXT_ACCENT in stories-library.tsx), applied to
 * each card's own tier chip instead of a flat white-on-black pill — a
 * card's level now reads from its badge color alone, tying into a color
 * language the page already teaches via its tabs, rather than inventing a
 * new one. Unlike CARD_SURFACE/ICON_ACCENTS above, these lean on the site's
 * real success/accent/danger tokens on purpose: the tier tabs elsewhere on
 * this same page already do the same, and staying consistent with them
 * matters more here than the tile-level theme-independence those two care
 * about.
 */
const TIER_BADGE_ACCENT: Record<Difficulty, string> = {
  beginner: "border-success/30 bg-success/15 text-success",
  intermediate: "border-accent/30 bg-accent/15 text-accent",
  advanced: "border-danger/30 bg-danger/15 text-danger",
};

/**
 * The Stories Library's card — a poster tile, not an info card: a single
 * calm dark tile (see CARD_SURFACE) carries a colored icon badge and the
 * title/subtitle, deliberately unlike Word Lists' cards (see WordGroupCard),
 * which are text-and-badge tiles with no artwork at all. The two status
 * chips (tier, locked/completed) are styled as overlays — a fixed
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
  // ?? DEFAULT_ICON_ACCENT is unreachable in practice (stableIndex's modulo
  // always lands inside the array's real length) — same never-actually-
  // undefined caveat as iconForLesson's own fallback branch above.
  const [iconBadge, iconColor] =
    ICON_ACCENTS[stableIndex(`accent:${lesson.id}`, ICON_ACCENTS.length)] ?? DEFAULT_ICON_ACCENT;

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
            "border-border/60 relative flex h-full w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-all duration-300",
            locked ? "opacity-90" : "hover:border-white/15 motion-safe:group-hover:-translate-y-1",
          )}
          style={{ backgroundColor: CARD_SURFACE }}
        >
          <div
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-xl transition-transform duration-500 ease-out motion-safe:group-hover:scale-110"
            style={{ backgroundColor: iconBadge }}
          >
            <Icon className="size-5" style={{ color: iconColor }} />
          </div>

          <span
            className={cn(
              "absolute top-2 left-2 rounded-full border px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm",
              TIER_BADGE_ACCENT[difficulty],
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
            <h3
              className="line-clamp-2 w-full text-sm leading-snug font-semibold text-white"
              dir="ltr"
            >
              {lesson.title}
            </h3>
            <p className="w-full truncate text-xs text-white/70" dir={dir}>
              {supportTitle}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
