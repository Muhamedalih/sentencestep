"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Brain,
  Home,
  Loader2,
  Lock,
  RotateCcw,
  Wand2,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/providers/locale-provider";
import { useLessonCompletionTheme } from "@/components/providers/lesson-completion-theme-provider";
import { fadeInUp, staggerChildren, easeOut } from "@/lib/motion";
import { deriveLessonCompletionStyles } from "@/lib/admin/lesson-completion-theme";
import type {
  LessonCompletionStyles,
  LessonCompletionTheme,
} from "@/lib/admin/lesson-completion-theme";
import {
  getLearnerLevel,
  learnerLevelSupportLabel,
  type LearnerLevelProgress,
} from "@/lib/progress/learner-level";
import { resolveVocabularySupportText } from "@/lib/content-helpers";
import type { CompletionSaveStatus } from "@/hooks/use-progress";
import { BadgeMedal } from "@/components/app/badge-medal";
import { BADGE_DEFS } from "@/lib/features/catalog";
import { questTitle } from "@/lib/features/quest-labels";
import type { Dictionary } from "@/lib/i18n/dictionary/types";
import type { RewardEvent } from "@/lib/progress/types";
import type { LearningMode, NextLessonRef, VocabularyItem } from "@/types/content";

/** Fixed, non-themed contrast color for text/icons sitting directly on the solid accent fill (PrimaryActionButton) — a contrast requirement, not a stylistic choice, so it isn't an admin field. theme.colorAccent defaults to a mid-brightness purple; white text on it reads poorly (~2:1 contrast), so this stays a near-black regardless of theme. */
const ON_ACCENT_TEXT = "#12141c";

/** next/link's Link forwards its ref to the underlying <a>, same as any DOM element framer-motion wraps — created once at module scope (never per-render) for PrimaryActionButton/SecondaryActionButton's href branch below. */
const MotionLink = motion.create(Link);

/** Shared spring for every action button's hover/tap feel on this screen — one consistent, snappy physics curve rather than each button picking its own. */
const BUTTON_SPRING = { type: "spring", stiffness: 420, damping: 25, mass: 0.7 } as const;

/**
 * Fixed feedback colors for this completion's accuracy tier — a stand-out
 * result (excellent or, on the low end, worth another look) shifts the
 * accuracy badge, the XP bar fill, and the earned-XP stat toward one of
 * these (see accuracyTierColor's own declaration below); an ordinary
 * 80-94% result is left uncolored, keeping each of those three elements'
 * normal color. Unlike colorAccent/colorXp these are semantic feedback
 * (excellent vs. needs-more-practice), not brand decoration, so — same
 * reasoning as ON_ACCENT_TEXT above — they're deliberately fixed rather
 * than another admin-configurable theme field.
 */
const TIER_EXCELLENT = "#34d399";
const TIER_NEEDS_WORK = "#f2ae4c";

/** Layout only (left offset + stagger delay) for showCelebration's confetti dots — colors come from the component's own confettiColors, since those depend on theme.colorAccent. */
const CONFETTI_DOTS: { left: string; delay: string }[] = [
  { left: "16%", delay: "0s" },
  { left: "32%", delay: "0.3s" },
  { left: "50%", delay: "0.6s" },
  { left: "68%", delay: "0.15s" },
  { left: "84%", delay: "0.45s" },
];

/**
 * The viewport height (in dvh units) at which every fluid() value below
 * reaches its full admin-configured size — see fluid()'s own doc comment.
 * A first pass at this constant used 1200: safe against a scrollbar down to
 * a genuinely short 720p-class laptop, but that meant a perfectly ordinary
 * ~900-1000px-tall browser window (most laptops, undocked) rendered
 * noticeably smaller than this screen's real configured size — reported
 * back as "everything shrank." 880 instead: full configured size from
 * ~880px up (an ordinary laptop window, not just a large external
 * monitor), tapering to roughly 90% of that by 768px and further below —
 * still meaningfully more breathing room than the original static sizing
 * ever had there, just no longer chasing a guarantee against the shortest,
 * least common viewports at the cost of how this looks everywhere else.
 */
const FLUID_SATURATION_DVH = 880;

/**
 * A spacing/size value that equals `px` once the viewport is
 * FLUID_SATURATION_DVH tall, and shrinks smoothly (never below `floor`) as
 * the viewport gets shorter — see this file's own doc comment on the
 * "Header → Vocabulary → Progress → Next Action" composition for why every
 * one of this screen's admin-configured defaults was originally tuned
 * against a full-height desktop monitor with no thought given to a
 * shorter laptop viewport: at those defaults, this screen's real height
 * left as little as 0-60px of margin against a 900px-tall browser
 * viewport and actively overflowed by 70-250px anywhere from 600-768px
 * tall (measured with the static reproduction above), meaning any
 * 13"-15" laptop (or simply a non-maximized browser window) tipped it
 * into an internal scrollbar that hid the primary action below the fold.
 * Used for every spacing/size value on this screen that stacks vertically
 * (gaps, padding, heading/stat font sizes, button heights) — never for a
 * purely horizontal value (card gaps,
 * button padding-inline), which don't contribute to this problem. `floor`
 * is clamped to never exceed `px` itself, so an admin who's already
 * configured a value at or below this screen's floor (e.g. the minimum end
 * of a theme range slider) simply gets that fixed value back with no
 * further shrinking — never a clamp() with its low bound above its high
 * bound. dvh (not vh) so a mobile browser's address bar showing/hiding
 * doesn't jitter this on every scroll; harmless below the lg breakpoint
 * regardless, since only lg caps this screen's height/adds the internal
 * scrollbar this exists to avoid — a mobile portrait viewport is tall
 * enough that this almost always resolves at or near `px` anyway, and
 * mobile was never height-constrained to begin with (see the outer
 * motion.div's own min-h-[100svh] vs. lg:h-full split below).
 */
function fluid(px: number, floor: number): string {
  const safeFloor = Math.min(floor, px);
  return `clamp(${safeFloor}px, ${((px / FLUID_SATURATION_DVH) * 100).toFixed(3)}dvh, ${px}px)`;
}

/**
 * Localizes a single RewardEvent (see src/lib/progress/types.ts) for display
 * on this screen — the one place that ever turns a reward into learner-
 * facing text, so store.ts (guest) and actions.ts (signed-in), which compute
 * these events, never need locale/dictionary access themselves. `levelName`
 * goes through the same learnerLevelSupportLabel this screen already uses
 * for the current level elsewhere, never the raw English LearnerLevel.name.
 */
function formatReward(reward: RewardEvent, t: Dictionary): string {
  switch (reward.type) {
    case "levelUp":
      return t.lesson.rewardLevelUp.replace(
        "{level}",
        learnerLevelSupportLabel(reward.levelName, t),
      );
    case "streakMilestone":
      return (
        reward.days === 1 ? t.lesson.rewardStreakSingular : t.lesson.rewardStreakPlural
      ).replace("{n}", String(reward.days));
    case "lessonCountMilestone":
      return (
        reward.count === 1
          ? t.lesson.rewardLessonCompleteSingular
          : t.lesson.rewardLessonCompletePlural
      ).replace("{n}", String(reward.count));
    case "dailyGoalReached":
      return t.lesson.rewardDailyGoalReached;
    case "streakGraceDay":
      return t.lesson.streakGraceNote;
    case "streakFreezeUsed":
      return t.streakCalendar.freezeUsedNote.replace("{n}", String(reward.count));
    case "questCompleted":
      return t.quests.rewardCompleted
        .replace("{quest}", questTitle(t, reward.questType))
        .replace("{xp}", String(reward.xp));
    case "badgeEarned":
      return t.badges.rewardEarned.replace("{badge}", t.badges.items[reward.badgeId].name);
    case "badgesBulk":
      return t.badges.rewardBulk.replace("{n}", String(reward.count));
  }
}

/**
 * Full-screen completion experience — a deliberately flat, near-monochrome
 * "Header → Vocabulary → Progress → Next Action" composition (see this
 * file's git history for the earlier ring/glow/multi-color HUD version this
 * replaced, and for the even earlier "Result → Progress → Vocabulary → Next
 * Action" order, which led with a 72px accuracy number as the screen's
 * focal point — vocabulary is promoted above the stats/XP panel now, and
 * accuracy demoted to a quiet badge in the header, since the words a
 * learner just produced matter more here than the accuracy score), matching
 * the same "always black" treatment the stories-mode
 * lesson player already uses unconditionally (see .lesson-shell-stories in
 * globals.css) rather than the toggle-dependent near-black .dark
 * .lesson-shell gets everywhere else — a completion screen shouldn't flip to
 * a light card for a learner who happens to be in light mode. Renders inside
 * the flex-1 region lesson-session.tsx now gives it (see that file's
 * isComplete branch) with no width cap or centering imposed from outside, so
 * this component owns its own full-bleed layout.
 *
 * Every color, size, spacing, and opacity value below is read from
 * useLessonCompletionTheme() (see
 * src/components/providers/lesson-completion-theme-provider.tsx) rather than
 * hardcoded — an admin-configured theme (src/lib/admin/lesson-completion-theme.ts),
 * resolved server-side in src/app/learn/layout.tsx and defaulting to exactly
 * this component's original hardcoded look when nothing has been
 * customized. The admin preview (src/components/admin/lesson-completion-customizer.tsx)
 * nests a second, closer LessonCompletionThemeProvider around this same
 * component to preview unsaved edits live — this file never knows whether
 * it's rendering a real completion or a preview. None of that theme layer
 * touches the XP math, mistake handling, or navigation below; it only
 * changes how they're painted. Only one theme color (colorAccent/colorXp,
 * the same value by default) is used decoratively anywhere on this screen —
 * the XP bar fill and the primary action button — every other element reads
 * colorTextPrimary/colorTextSecondary/colorBorder.
 */
export function LessonCompletion({
  mode,
  accuracy,
  wpm,
  nextLesson,
  nextLessonLocked = false,
  vocabulary,
  streak,
  xp,
  xpEarned,
  learnerLevel,
  rewards,
  mistakeCount = 0,
  onFixMistakes,
  onViewWords,
  onPracticeFromMemory,
  saveStatus = "saved",
  onRetrySave,
  onRetryLesson,
}: {
  mode: LearningMode;
  /** 0–1 ratio of correct to total keystrokes across the lesson. */
  accuracy: number;
  /** Average words-per-minute across the lesson's sentences; 0 if unavailable. */
  wpm: number;
  nextLesson?: NextLessonRef;
  /** The next lesson is Premium and this learner can't open it: the button keeps its place but wears a lock and says "(Premium)", so tapping it is never a surprise. It still opens that lesson's page, which explains Premium calmly. */
  nextLessonLocked?: boolean;
  vocabulary?: VocabularyItem[];
  streak: number;
  /** Running XP total (post this completion) — used only to show numeric progress toward the next level; the per-completion reward is xpEarned below. */
  xp: number;
  /** XP earned by this specific completion (not the running total). */
  xpEarned: number;
  learnerLevel: LearnerLevelProgress;
  /** Milestones newly crossed by this completion — shown once, inline. */
  rewards: RewardEvent[];
  /**
   * Outstanding "Fix Your Mistakes" words for the signed-in learner (see
   * useMistakes) — 0 (the default) renders this screen exactly as it always
   * has. Both this and onFixMistakes must be present for the Fix Your
   * Mistakes CTA to appear; LessonSession only ever supplies one without the
   * other in previewMode, where the whole feature is skipped.
   */
  mistakeCount?: number;
  /** Enters the Fix Your Mistakes flow (see FixYourMistakesSession) — never a Link, since it swaps this same screen's content in place rather than navigating. Ignored for Stories mode regardless of mistakeCount (see `hasMistakes` below) — Stories intentionally never surfaces this CTA, so a learner's outstanding mistakes from other modes are never framed as something to fix right after a story. */
  onFixMistakes?: () => void;
  /** Opens StoryWordsPanel in place of this screen (see LessonSession's isViewingWords branch) — Stories mode only; every other mode keeps the plain inline vocabulary chips below since they have no per-word practice flow yet. */
  onViewWords?: () => void;
  /** Opens the optional From-memory round (see FromMemorySession) in place of this screen. Undefined when the admin feature is off for this section, or the lesson has no translated sentences to ask — the button is then simply not rendered. */
  onPracticeFromMemory?: () => void;
  /**
   * Status of the signed-in save this completion triggered (see useProgress).
   * Defaults to "saved" so every other caller (and any test/story that
   * doesn't pass it) renders exactly as before — only LessonSession, which
   * actually knows the real status, passes something else.
   */
  saveStatus?: CompletionSaveStatus;
  /** Re-attempts the save that produced saveStatus "error" — required together with it. */
  onRetrySave?: () => void;
  /** Restarts this same lesson from its first sentence (see LessonSession's handleRetryLesson) — undefined for any caller that hasn't wired up a real reset (e.g. the admin theme preview), which simply omits the button rather than rendering one that does nothing. Ranked just above Home in the actions list below, so it's a secondary action alongside Home whenever Fix Mistakes or Next Lesson exists, and only becomes the primary CTA when neither does (see that list's own doc comment). */
  onRetryLesson?: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const { t, locale, dir } = useLocale();
  const theme = useLessonCompletionTheme();
  const styles = deriveLessonCompletionStyles(theme);
  // Read early: a new badge is one of the things that turns the celebration on.
  const badgeRewards = rewards.filter((reward) => reward.type === "badgeEarned");
  const accuracyPercent = Math.round(accuracy * 100);
  // Non-null only for a stand-out result — the same >=95% cutoff the
  // accuracyExcellent/accuracyGood subtitle copy above already switches on,
  // plus a below-80% band on the other end. Null for the ordinary 80-94%
  // band, where the badge/XP-fill/earned-XP stat below all keep their
  // normal (non-tiered) color — an unremarkable result shouldn't compete
  // for attention the way a genuinely good or poor one should.
  const accuracyTierColor =
    accuracyPercent >= 95 ? TIER_EXCELLENT : accuracyPercent < 80 ? TIER_NEEDS_WORK : null;
  // Stories never shows this CTA — see onFixMistakes's own doc comment.
  const hasMistakes = mode !== "stories" && mistakeCount > 0 && Boolean(onFixMistakes);
  const levelPercent = Math.round(learnerLevel.progress * 100);

  // The bar animates from where XP stood *before* this completion to where
  // it stands now — never hardcoded, always derived from the real xp/
  // xpEarned this render was given. getLearnerLevel is the same pure
  // tier lookup useProgress already uses; calling it again here with
  // (xp - xpEarned) is presentation-only (just "what was the bar's
  // starting position"), it never re-derives or overrides the real XP
  // total or level shown. If this completion crossed a level boundary,
  // showing the *previous* level's near-full bar draining before jumping
  // to the new level's near-empty one would read as a bug, not a reward —
  // so a level-up simply animates in from 0 on the new level's bar instead.
  const previousLearnerLevel = getLearnerLevel(Math.max(0, xp - xpEarned));
  const leveledUp = previousLearnerLevel.level.name !== learnerLevel.level.name;
  const xpBarFromPercent = leveledUp ? 0 : Math.round(previousLearnerLevel.progress * 100);
  const xpIntoLevel = xp - learnerLevel.level.minXp;
  const xpNeededForLevel = learnerLevel.next
    ? learnerLevel.next.minXp - learnerLevel.level.minXp
    : null;

  // A soft glow pulse behind the accuracy badge plus a few falling confetti
  // dots above the header (rendered further down) — reserved for something
  // actually worth celebrating (a stand-out accuracy or a level crossed by
  // this completion), never every ordinary completion, and never at all
  // for a viewer who prefers reduced motion.
  const showCelebration =
    !reducedMotion && (accuracyPercent >= 95 || leveledUp || badgeRewards.length > 0);
  const celebrationGlowColor = accuracyTierColor ?? theme.colorAccent;
  // Real confetti isn't monochrome — alternates between the screen's brand
  // color and TIER_EXCELLENT (the same green a >=95% result already colors
  // the badge/XP bar/stat with) rather than tying every dot to one color.
  // TIER_NEEDS_WORK never appears here — this only ever renders for
  // something worth celebrating, so its one "needs more practice" color
  // has no place in it.
  const confettiColors = [theme.colorAccent, TIER_EXCELLENT];

  // The single primary action, in the same priority order the previous
  // design already used ("Fix Your Mistakes" first when outstanding, then
  // Next Lesson, Home only ever as the fallback) — Retry Lesson is
  // deliberately slotted in right before Home, never ahead of Fix
  // Mistakes/Next Lesson, so it only ever becomes the primary action in the
  // one case neither of those exists (the last lesson in a sequence, no
  // outstanding mistakes) — a reasonable primary in exactly that case: with
  // nothing else queued up, "do this again" is a better default than
  // "leave." Every other available action becomes a secondary, quieter
  // action beside it. Home always exists. Unlike the earlier design, the
  // primary button never varies its color by which action it is — one
  // accent, always — so "which action is primary" is communicated by
  // size/weight alone, never by a warning-colored border.
  type CompletionAction = {
    id: "fix" | "next" | "memory" | "retry" | "home";
    icon: typeof Wand2;
    label: string;
    href?: string;
    onClick?: () => void;
  };
  const actions: CompletionAction[] = [
    ...(hasMistakes
      ? [{ id: "fix" as const, icon: Wand2, label: t.lesson.fixMistakes, onClick: onFixMistakes }]
      : []),
    ...(nextLesson
      ? [
          {
            id: "next" as const,
            icon: nextLessonLocked ? Lock : ArrowRight,
            label: nextLessonLocked ? t.lesson.nextLessonPremium : t.lesson.nextLesson,
            href: `/learn/${mode}/${nextLesson.id}`,
          },
        ]
      : []),
    ...(onPracticeFromMemory
      ? [
          {
            id: "memory" as const,
            icon: Brain,
            label: t.fromMemory.button,
            onClick: onPracticeFromMemory,
          },
        ]
      : []),
    ...(onRetryLesson
      ? [
          {
            id: "retry" as const,
            icon: RotateCcw,
            label: t.lesson.retryLesson,
            onClick: onRetryLesson,
          },
        ]
      : []),
    { id: "home" as const, icon: Home, label: t.mistakes.learningHome, href: "/learn" },
  ];
  const [primaryAction, ...secondaryActions] = actions;

  // The grace-day note is intentionally split out of `rewards` before it
  // ever reaches formatReward's accent-colored join below — it isn't a
  // reward to celebrate, just a quiet, plain-text fact about the streak
  // number just above it (see streakGraceNote's doc comment in the
  // dictionary types).
  const graceReward = rewards.find((reward) => reward.type === "streakGraceDay");
  const freezeReward = rewards.find((reward) => reward.type === "streakFreezeUsed");
  // Badges get their own medal cards below (or, for a flood of them, the one
  // bulk summary line) rather than a place in the joined reward sentence.
  const bulkBadgeReward = rewards.find((reward) => reward.type === "badgesBulk");
  const celebratedRewards = rewards.filter(
    (reward) =>
      reward.type !== "streakGraceDay" &&
      reward.type !== "streakFreezeUsed" &&
      reward.type !== "badgeEarned",
  );

  // Stat cells shown inside the stats/XP panel — accuracy has its own quiet
  // badge in the header, so it's never repeated here. Built as a filtered
  // list (not fixed JSX) purely so the divider between cells only ever
  // appears between two
  // cells that both actually rendered — wpm is conditional, so a fixed
  // "second cell always gets a divider" rule would leave an orphaned
  // divider with nothing to its left whenever wpm is 0.
  const statCells: { key: string; label: string; value: ReactNode; accent?: boolean }[] = [];
  if (wpm > 0) statCells.push({ key: "wpm", label: t.lesson.wpmLabel, value: wpm });
  statCells.push({ key: "streak", label: t.lesson.streakLabel, value: streak });
  if (xpEarned > 0) {
    statCells.push({
      key: "xp",
      label: t.lesson.xpEarnedLabel,
      accent: true,
      value: (
        <motion.span
          initial={reducedMotion ? undefined : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.25 }}
          className="inline-block"
        >
          +{xpEarned}
        </motion.span>
      ),
    });
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      style={{ backgroundColor: styles.bg, color: styles.textPrimary }}
      className="relative flex min-h-[100svh] w-full flex-col lg:h-full lg:min-h-0 lg:overflow-y-auto"
    >
      <div
        style={{
          maxWidth: `${theme.contentWidth}px`,
          gap: fluid(theme.sectionSpacing, 8),
          paddingTop: fluid(56, 14),
          paddingBottom: fluid(56, 14),
        }}
        className="relative z-10 mx-auto flex w-full flex-1 flex-col px-6 sm:px-10 lg:justify-center lg:px-6"
      >
        {/* ---------------------------------------------------------------
            HEADER — heading + subtitle, with the accuracy number demoted
            to a quiet badge underneath rather than the screen's focal
            point (see this file's own doc comment on the "Header →
            Vocabulary → Progress" order this screen now uses). This drops
            the old cream "sticker" chip's family resemblance to
            NeedsReviewWords' count badge — a deliberate trade against that
            cross-screen consistency in favor of not competing with the
            vocabulary hero below.
            --------------------------------------------------------------- */}
        <motion.div
          variants={fadeInUp}
          style={{ gap: fluid(Math.max(theme.headerSpacing, 12), 6) }}
          className="relative flex flex-col items-center text-center"
        >
          {/* A handful of falling confetti dots above the header — see
              showCelebration's own doc comment for when this renders at
              all. Absolutely positioned over the header so it adds no
              layout height of its own; pointer-events-none since it's
              purely decorative. */}
          {showCelebration && (
            <div className="pointer-events-none absolute inset-x-0 top-0 h-14" aria-hidden="true">
              {CONFETTI_DOTS.map((dot, index) => (
                <span
                  key={index}
                  className="animate-lc-confetti absolute top-0 block size-1.5 rounded-[2px]"
                  style={{
                    left: dot.left,
                    backgroundColor: confettiColors[index % confettiColors.length],
                    animationDelay: dot.delay,
                  }}
                />
              ))}
            </div>
          )}
          {/* Stories mode's only decoration on this otherwise-identical,
              admin-themed completion screen (see this file's own doc
              comment on why everything else here stays uniform across
              modes) — a small closing-book flourish above the heading.
              Purely an icon; no text, no layout change. */}
          {mode === "stories" && (
            <motion.div
              aria-hidden="true"
              initial={reducedMotion ? undefined : { opacity: 0, scale: 0.6, rotate: 8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={
                reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 16 }
              }
              style={{ color: styles.textSecondary }}
            >
              <BookOpen className="size-7" aria-hidden="true" />
            </motion.div>
          )}
          <div>
            <h2
              style={{
                fontSize: fluid(theme.headingSize, 19),
                fontWeight: theme.headingWeight,
                color: styles.textPrimary,
              }}
              className="tracking-tight"
            >
              {theme.headingText || t.lesson.completeHeading}
            </h2>
            <p
              dir="auto"
              style={{ fontSize: theme.bodySize, color: styles.textSecondary }}
              className="mt-1.5"
            >
              {(accuracyPercent >= 95 ? t.lesson.accuracyExcellent : t.lesson.accuracyGood).replace(
                "{n}",
                String(accuracyPercent),
              )}
            </p>
          </div>

          {/* Demoted accuracy badge — same number the old 72px hero sticker
              showed, now sized and weighted like a quiet fact rather than
              this screen's headline. theme.heroNumberSize's range was
              recalibrated for this smaller role (see
              lesson-completion-theme.ts). borderColor/background pick up
              accuracyTierColor's tinted wash only for a stand-out result;
              the ordinary case renders exactly as before (plain neutral
              border, transparent background). */}
          <div
            dir="ltr"
            style={{
              borderColor: accuracyTierColor
                ? `color-mix(in srgb, ${accuracyTierColor} 35%, transparent)`
                : styles.border,
              backgroundColor: accuracyTierColor
                ? `color-mix(in srgb, ${accuracyTierColor} 10%, transparent)`
                : undefined,
            }}
            className="relative inline-flex items-center gap-1.5 rounded-full border px-3 py-1"
          >
            {/* The celebration's glow pulse — see showCelebration's own doc
                comment. -z-10 so it always sits behind the number/label
                text regardless of DOM/paint order (a positioned sibling
                with z-index:auto still paints above in-flow text by
                default). */}
            {showCelebration && (
              <span
                aria-hidden="true"
                className="animate-lc-pulse absolute -z-10 rounded-full"
                style={{
                  inset: "-10px",
                  background: `radial-gradient(circle, color-mix(in srgb, ${celebrationGlowColor} 45%, transparent), transparent 70%)`,
                }}
              />
            )}
            <span
              style={{
                fontSize: theme.heroNumberSize,
                color: accuracyTierColor ?? styles.textPrimary,
              }}
              className="font-semibold tabular-nums"
            >
              {accuracyPercent}%
            </span>
            <span
              style={{
                color: styles.textSecondary,
                fontSize: Math.max(9, Math.round(theme.heroNumberSize * 0.8)),
              }}
              className="font-medium tracking-wide uppercase"
            >
              {t.lesson.accuracyLabel}
            </span>
          </div>
        </motion.div>

        {saveStatus === "saving" && (
          <motion.div
            variants={fadeInUp}
            className="flex items-center justify-center gap-1.5 text-xs font-medium text-white/50"
          >
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            {t.lesson.savingProgress}
          </motion.div>
        )}
        {saveStatus === "error" && (
          <motion.div
            variants={fadeInUp}
            className="border-danger/40 bg-danger/10 text-danger mx-auto flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium"
          >
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            {t.lesson.saveFailed}
            {onRetrySave && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetrySave}
                className="h-7 border-white/20 bg-transparent px-2.5 text-white hover:bg-white/10"
              >
                {t.lesson.retry}
              </Button>
            )}
          </motion.div>
        )}

        {/* ---------------------------------------------------------------
            VOCABULARY — promoted above the stats/XP panel: the words a
            learner just produced are this screen's hero now, shown as
            bigger tagged cards rather than the small inline chips this
            section used to be lower down the page.
            --------------------------------------------------------------- */}
        {vocabulary && vocabulary.length > 0 && (
          <motion.div
            variants={fadeInUp}
            style={{ gap: fluid(16, 8) }}
            className="mx-auto flex w-full max-w-sm flex-col items-center"
          >
            <div className="w-full">
              <p
                style={{
                  color: styles.textSecondary,
                  fontSize: Math.max(9, Math.round(theme.bodySize * 0.8)),
                }}
                className="mb-2 text-center font-semibold tracking-widest uppercase"
              >
                {theme.vocabTitle || t.lesson.vocabularyHeading}
              </p>
              <div style={{ gap: theme.chipSpacing }} className="flex">
                {vocabulary.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      borderRadius: Math.min(theme.chipRadius, 20),
                      borderColor: styles.vocabCardBorder,
                      backgroundColor: styles.vocabCardBg,
                      padding: `${fluid(theme.cardPadding, 8)} ${Math.round(theme.cardPadding * 0.6)}px`,
                    }}
                    className="flex flex-1 flex-col items-center gap-1.5 border text-center"
                  >
                    <span
                      style={{
                        backgroundColor: theme.colorAccent,
                        color: ON_ACCENT_TEXT,
                        fontSize: Math.max(8, Math.round(theme.bodySize * 0.7)),
                      }}
                      className="rounded-full px-2 py-0.5 font-bold"
                    >
                      {t.lesson.newWordTag}
                    </span>
                    <span
                      dir="ltr"
                      style={{ color: styles.textPrimary, fontSize: fluid(theme.statSize, 16) }}
                      className="font-extrabold"
                    >
                      {item.en}
                    </span>
                    <span
                      style={{ color: styles.textSecondary, fontSize: theme.bodySize }}
                      dir={dir}
                    >
                      {resolveVocabularySupportText(item, locale)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* Same PrimaryActionButton the Next Lesson/Fix Mistakes CTA below
                uses — deliberately equal visual weight, not a quiet text
                link, so practicing these words reads as a real next step,
                not an afterthought (see this screen's UI feedback). */}
            {onViewWords && (
              <PrimaryActionButton
                icon={BookOpen}
                label={t.lesson.practiceWord}
                onClick={onViewWords}
                theme={theme}
                reducedMotion={Boolean(reducedMotion)}
              />
            )}
          </motion.div>
        )}

        {/* ---------------------------------------------------------------
            PROGRESS — stats, streak/XP rewards, and level progress grouped
            into one quiet panel now that vocabulary (above) is the
            screen's visual hero rather than these numbers. statCells
            always has at least the streak cell (see its declaration
            above), so this panel never needs an empty-state guard.
            --------------------------------------------------------------- */}
        <motion.div
          variants={fadeInUp}
          style={{
            borderColor: styles.border,
            borderRadius: Math.min(theme.actionCardRadius, 16),
            padding: fluid(theme.cardPadding, 10),
          }}
          className="mx-auto flex w-full max-w-sm flex-col border"
        >
          <div className="flex items-stretch justify-center">
            {statCells.map((cell, index) => (
              <StatCell
                key={cell.key}
                label={cell.label}
                value={cell.value}
                valueColor={cell.accent ? (accuracyTierColor ?? theme.colorAccent) : undefined}
                theme={theme}
                styles={styles}
                dividerColor={index > 0 ? styles.border : undefined}
              />
            ))}
          </div>

          {graceReward && (
            <p
              dir="auto"
              style={{ color: styles.textSecondary, fontSize: Math.round(theme.bodySize * 0.85) }}
              className="mt-3 text-center"
            >
              {formatReward(graceReward, t)}
            </p>
          )}
          {freezeReward && (
            <p
              dir="auto"
              style={{ color: styles.textSecondary, fontSize: Math.round(theme.bodySize * 0.85) }}
              className="mt-3 text-center"
            >
              {formatReward(freezeReward, t)}
            </p>
          )}

          <div style={{ marginTop: fluid(theme.cardPadding, 8) }}>
            <XpProgressCard
              label={learnerLevelSupportLabel(learnerLevel.level.name, t)}
              fromPercent={xpBarFromPercent}
              toPercent={levelPercent}
              currentXp={xpIntoLevel}
              neededXp={xpNeededForLevel}
              reducedMotion={Boolean(reducedMotion)}
              theme={theme}
              styles={styles}
              tierColor={accuracyTierColor}
            />
          </div>

          {celebratedRewards.length > 0 && (
            <p
              dir="auto"
              style={{ color: theme.colorAccent, fontSize: theme.bodySize }}
              className="mt-3 text-center font-medium"
            >
              {celebratedRewards.map((reward) => formatReward(reward, t)).join(" · ")}
            </p>
          )}
          {badgeRewards.length > 0 && (
            <ul className="mt-4 flex flex-wrap justify-center gap-3">
              {badgeRewards.map((reward) => {
                const group = BADGE_DEFS.find((badge) => badge.id === reward.badgeId)?.group;
                return (
                  <li
                    key={reward.badgeId}
                    style={{ borderColor: theme.colorBorder, color: styles.textPrimary }}
                    className="flex items-center gap-3 rounded-2xl border px-4 py-2.5"
                  >
                    {group && <BadgeMedal group={group} earned className="size-11" />}
                    <span className="text-start" dir={dir}>
                      <span
                        style={{ color: theme.colorAccent }}
                        className="block text-xs font-semibold tracking-wide uppercase"
                      >
                        {t.badges.newTag}
                      </span>
                      <span className="block text-sm font-semibold">
                        {t.badges.items[reward.badgeId].name}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {bulkBadgeReward && (
            <p
              dir="auto"
              style={{ color: theme.colorAccent, fontSize: theme.bodySize }}
              className="mt-3 text-center font-medium"
            >
              {formatReward(bulkBadgeReward, t)}
            </p>
          )}
        </motion.div>

        <motion.div
          variants={fadeInUp}
          style={{ backgroundColor: styles.border }}
          className="h-px w-full"
        />

        {/* ---------------------------------------------------------------
            NEXT ACTION — one clear primary CTA, everything else quieter.
            --------------------------------------------------------------- */}
        {/* Below lg the page scrolls, so on a short phone the CTA used to sit
            under the fold after the stats/vocabulary panels — pinned to the
            bottom edge instead (solid theme background so the content
            scrolling beneath never shows through). */}
        <motion.div
          variants={fadeInUp}
          style={{ gap: fluid(theme.cardSpacing, 8), backgroundColor: styles.bg }}
          className="flex flex-col items-center max-lg:sticky max-lg:bottom-0 max-lg:z-20 max-lg:pt-2 max-lg:pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        >
          {primaryAction && (
            <PrimaryActionButton
              icon={primaryAction.icon}
              label={primaryAction.label}
              href={primaryAction.href}
              onClick={primaryAction.onClick}
              theme={theme}
              reducedMotion={Boolean(reducedMotion)}
            />
          )}
          {secondaryActions.length > 0 && (
            <div
              className="flex flex-wrap items-center justify-center"
              style={{ gap: fluid(theme.cardSpacing, 8) }}
            >
              {secondaryActions.map((action) => (
                <SecondaryActionButton
                  key={action.id}
                  icon={action.icon}
                  label={action.label}
                  href={action.href}
                  onClick={action.onClick}
                  theme={theme}
                  styles={styles}
                  reducedMotion={Boolean(reducedMotion)}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

function StatCell({
  label,
  value,
  valueColor,
  theme,
  styles,
  dividerColor,
}: {
  label: string;
  value: ReactNode;
  /** Only the earned-XP cell sets this (theme.colorAccent) — every other stat stays plain text-primary. */
  valueColor?: string;
  theme: LessonCompletionTheme;
  styles: LessonCompletionStyles;
  /** Themed replacement for a `divide-x` line between stat cells, following colorBorder like every other border on this screen. */
  dividerColor?: string;
}) {
  return (
    <div
      style={{
        borderInlineStart: dividerColor ? `1px solid ${dividerColor}` : undefined,
        padding: `0 ${theme.cardPadding}px`,
      }}
      className="flex flex-1 flex-col items-center gap-1.5 text-center"
    >
      <span
        style={{
          fontSize: fluid(theme.statSize, 16),
          color: valueColor ?? styles.textPrimary,
          fontWeight: theme.headingWeight,
        }}
        className="tabular-nums"
      >
        {value}
      </span>
      <span
        style={{
          color: styles.textSecondary,
          fontSize: Math.max(9, Math.round(theme.statSize * 0.5)),
        }}
        className="tracking-widest uppercase"
      >
        {label}
      </span>
    </div>
  );
}

/**
 * The single most important next step — the completion screen's one large,
 * unmistakable call to action. Always the same solid accent fill regardless
 * of which action is primary (Fix Mistakes vs. Next Lesson vs. Home) — the
 * earlier design varied this button's color by action, which meant a plain
 * "continue" action could visually read as a warning; this version relies
 * on size/weight/position alone to say "primary", never color-as-severity.
 * Exported so FixYourMistakesSession's own completion state can reuse the
 * exact same admin-themed button rather than a second, drifting copy of it.
 *
 * Bypasses the shared <Button> (still used elsewhere in this file) for its
 * own motion.create(Link)/motion.button instead — <Button> doesn't forward
 * a ref, which framer-motion's gesture recognition needs on the actual DOM
 * node, so wrapping it directly wasn't an option. buttonVariants({variant:
 * "ghost"}) reproduces the exact classes <Button variant="ghost"> would
 * have rendered, so this is a visual no-op beyond the hover/tap motion
 * itself. The lift+glow reads as premium precisely because it's the ONLY
 * motion moment on this button — everything else on this screen either
 * animates once on entry (staggerChildren/fadeInUp) or not at all.
 */
export function PrimaryActionButton({
  icon: Icon,
  label,
  href,
  onClick,
  theme,
  reducedMotion = false,
}: {
  icon: typeof Wand2;
  label: string;
  href?: string;
  onClick?: () => void;
  theme: LessonCompletionTheme;
  /** Drops the hover lift/tap spring, keeping only the (non-transform) glow — same "skip the transform, keep the color/shadow" split this screen's other reduced-motion checks use. Defaults to false so FixYourMistakesSession's own two call sites, which don't track this themselves, get the full animation. */
  reducedMotion?: boolean;
}) {
  const cardStyle: CSSProperties = {
    backgroundColor: theme.colorAccent,
    color: ON_ACCENT_TEXT,
    height: fluid(Math.max(40, Math.round(theme.actionCardHeight * 0.46)), 36),
    borderRadius: Math.min(theme.actionCardRadius, 14),
    paddingInline: theme.cardPadding * 1.6,
  };

  const content = (
    <>
      <Icon style={{ width: 18, height: 18 }} aria-hidden="true" />
      <span style={{ fontSize: theme.actionCardTextSize + 1 }} className="font-semibold">
        {label}
      </span>
    </>
  );

  const className = cn(
    buttonVariants({ variant: "ghost" }),
    "flex w-full max-w-sm items-center justify-center gap-2 text-center pointer-coarse:min-h-12 sm:w-auto",
  );
  const hoverAnimation = {
    boxShadow: `0 16px 32px -12px color-mix(in srgb, ${theme.colorAccent} 60%, transparent)`,
    ...(reducedMotion ? {} : { y: -3 }),
  };
  const tapAnimation = reducedMotion ? undefined : { scale: 0.96, y: 0 };

  if (href) {
    return (
      <MotionLink
        href={href}
        data-slot="button"
        style={cardStyle}
        className={className}
        whileHover={hoverAnimation}
        whileTap={tapAnimation}
        transition={BUTTON_SPRING}
      >
        {content}
      </MotionLink>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      data-slot="button"
      style={cardStyle}
      className={className}
      whileHover={hoverAnimation}
      whileTap={tapAnimation}
      transition={BUTTON_SPRING}
    >
      {content}
    </motion.button>
  );
}

/**
 * A quiet, compact next-to-the-primary action — plain outlined text, no
 * fill, no glow at rest; exists to stay reachable without competing with
 * PrimaryActionButton. Same motion.create(Link)/motion.button swap as
 * PrimaryActionButton above, for the same reason (<Button> forwards no
 * ref) — see that component's own doc comment.
 */
export function SecondaryActionButton({
  icon: Icon,
  label,
  href,
  onClick,
  theme,
  styles,
  reducedMotion = false,
}: {
  icon: typeof Wand2;
  label: string;
  href?: string;
  onClick?: () => void;
  theme: LessonCompletionTheme;
  styles: LessonCompletionStyles;
  /** See PrimaryActionButton's own doc comment on this prop. */
  reducedMotion?: boolean;
}) {
  const cardStyle: CSSProperties = {
    borderColor: styles.border,
    color: styles.textSecondary,
    height: fluid(Math.max(32, Math.round(theme.actionCardHeight * 0.38)), 30),
    borderRadius: Math.min(theme.actionCardRadius, 12),
    paddingInline: theme.cardPadding * 1.1,
  };

  const content = (
    <>
      <Icon style={{ width: 15, height: 15 }} aria-hidden="true" />
      <span style={{ fontSize: theme.actionCardTextSize }} className="font-medium">
        {label}
      </span>
    </>
  );

  const className = cn(
    buttonVariants({ variant: "ghost" }),
    "flex items-center gap-2 border text-center pointer-coarse:min-h-11",
  );
  const hoverAnimation = {
    borderColor: theme.colorAccent,
    backgroundColor: `color-mix(in srgb, ${theme.colorAccent} 12%, transparent)`,
    color: theme.colorAccent,
    ...(reducedMotion ? {} : { y: -2 }),
  };
  const tapAnimation = reducedMotion ? undefined : { scale: 0.96, y: 0 };

  if (href) {
    return (
      <MotionLink
        href={href}
        data-slot="button"
        style={cardStyle}
        className={className}
        whileHover={hoverAnimation}
        whileTap={tapAnimation}
        transition={BUTTON_SPRING}
      >
        {content}
      </MotionLink>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      data-slot="button"
      style={cardStyle}
      className={className}
      whileHover={hoverAnimation}
      whileTap={tapAnimation}
      transition={BUTTON_SPRING}
    >
      {content}
    </motion.button>
  );
}

/**
 * Compact, single-row XP progress — no surrounding card, no gradient, no
 * glow: a label/number row and a slim flat-filled bar, directly on the
 * page background like every other section on this screen.
 * `fromPercent`/`toPercent` are always derived from real xp/xpEarned (see
 * the leveledUp comment at this component's call site), never hardcoded —
 * the bar genuinely animates whatever the actual XP delta was, including "no
 * visible movement" when xpEarned is 0 (e.g. replaying an already-completed
 * lesson).
 */
function XpProgressCard({
  label,
  fromPercent,
  toPercent,
  currentXp,
  neededXp,
  reducedMotion,
  theme,
  styles,
  tierColor,
}: {
  label: string;
  fromPercent: number;
  toPercent: number;
  currentXp: number;
  neededXp: number | null;
  reducedMotion: boolean;
  theme: LessonCompletionTheme;
  styles: LessonCompletionStyles;
  /** Overrides the fill's usual theme.colorXp when this completion's accuracy earned a tier color (see accuracyTierColor at the call site) — null for the ordinary case, where the fill stays theme.colorXp exactly as before. */
  tierColor: string | null;
}) {
  const clampedFrom = Math.min(100, Math.max(0, fromPercent));
  const clampedTo = Math.min(100, Math.max(0, toPercent));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between" style={{ fontSize: theme.bodySize }}>
        <span style={{ color: styles.textSecondary }} className="font-medium">
          {label}
        </span>
        {neededXp !== null && (
          <span
            style={{ color: styles.textPrimary }}
            className="font-medium tabular-nums"
            dir="ltr"
          >
            {currentXp} / {neededXp} XP
          </span>
        )}
      </div>
      <div
        role="progressbar"
        aria-valuenow={clampedTo}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          height: theme.progressBarHeight,
          borderRadius: theme.progressBarRadius,
          backgroundColor: styles.xpTrackBg,
        }}
        className="w-full overflow-hidden"
      >
        <motion.div
          initial={reducedMotion ? { width: `${clampedTo}%` } : { width: `${clampedFrom}%` }}
          animate={{ width: `${clampedTo}%` }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: theme.xpAnimationDuration / 1000, ease: easeOut }
          }
          style={{
            backgroundColor: tierColor ?? theme.colorXp,
            borderRadius: theme.progressBarRadius,
          }}
          className="h-full"
        />
      </div>
    </div>
  );
}
