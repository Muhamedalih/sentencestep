"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, ArrowRight, BookOpen, Home, Loader2, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import type { Dictionary } from "@/lib/i18n/dictionary/types";
import type { RewardEvent } from "@/lib/progress/types";
import type { LearningMode, LessonUnit, VocabularyItem } from "@/types/content";

/** Fixed, non-themed contrast color for text/icons sitting directly on the solid accent fill (PrimaryActionButton) — a contrast requirement, not a stylistic choice, so it isn't an admin field. theme.colorAccent defaults to a mid-brightness purple; white text on it reads poorly (~2:1 contrast), so this stays a near-black regardless of theme. */
const ON_ACCENT_TEXT = "#12141c";

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
  }
}

/**
 * Full-screen completion experience — a deliberately flat, near-monochrome
 * "Result → Progress → Vocabulary → Next Action" composition (see this
 * file's git history for the earlier ring/glow/multi-color HUD version this
 * replaced), matching the same "always black" treatment the stories-mode
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
  vocabulary,
  streak,
  xp,
  xpEarned,
  learnerLevel,
  rewards,
  mistakeCount = 0,
  onFixMistakes,
  saveStatus = "saved",
  onRetrySave,
}: {
  mode: LearningMode;
  /** 0–1 ratio of correct to total keystrokes across the lesson. */
  accuracy: number;
  /** Average words-per-minute across the lesson's sentences; 0 if unavailable. */
  wpm: number;
  nextLesson?: LessonUnit;
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
  /** Enters the Fix Your Mistakes flow (see FixYourMistakesSession) — never a Link, since it swaps this same screen's content in place rather than navigating. */
  onFixMistakes?: () => void;
  /**
   * Status of the signed-in save this completion triggered (see useProgress).
   * Defaults to "saved" so every other caller (and any test/story that
   * doesn't pass it) renders exactly as before — only LessonSession, which
   * actually knows the real status, passes something else.
   */
  saveStatus?: CompletionSaveStatus;
  /** Re-attempts the save that produced saveStatus "error" — required together with it. */
  onRetrySave?: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const { t, locale, dir } = useLocale();
  const theme = useLessonCompletionTheme();
  const styles = deriveLessonCompletionStyles(theme);
  const accuracyPercent = Math.round(accuracy * 100);
  const hasMistakes = mistakeCount > 0 && Boolean(onFixMistakes);
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

  // The single primary action, in the same priority order the previous
  // design already used ("Fix Your Mistakes" first when outstanding, then
  // Next Lesson, Home only ever as the fallback). Every other available
  // action becomes a secondary, quieter action beside it. Exactly one of
  // these three ever exists per render; Home always does. Unlike the
  // earlier design, the primary button never varies its color by which
  // action it is — one accent, always — so "which action is primary" is
  // communicated by size/weight alone, never by a warning-colored border.
  type CompletionAction = {
    id: "fix" | "next" | "home";
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
            icon: ArrowRight,
            label: t.lesson.nextLesson,
            href: `/learn/${mode}/${nextLesson.id}`,
          },
        ]
      : []),
    { id: "home" as const, icon: Home, label: t.mistakes.learningHome, href: "/learn" },
  ];
  const [primaryAction, ...secondaryActions] = actions;

  // Secondary stat cells beneath the hero number — accuracy itself is the
  // hero, so it's never repeated here. Built as a filtered list (not fixed
  // JSX) purely so the divider between cells only ever appears between two
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
        style={{ maxWidth: `${theme.contentWidth}px`, gap: `${theme.sectionSpacing}px` }}
        className="relative z-10 mx-auto flex w-full flex-1 flex-col px-6 py-10 sm:px-10 sm:py-14 lg:justify-center lg:px-6"
      >
        {/* ---------------------------------------------------------------
            HERO — the accuracy number in the same off-white "sticker" chip
            used for the Word Lists "Review All Words" count (see
            NeedsReviewWords) — a resting tilt that settles in with a
            springy wiggle on mount instead of NeedsReviewWords' hover-
            triggered straighten, since this card isn't interactive. No
            ring, no badge.
            --------------------------------------------------------------- */}
        <motion.div
          variants={fadeInUp}
          style={{ gap: Math.max(theme.headerSpacing, 12) }}
          className="flex flex-col items-center text-center"
        >
          {/* Stories mode's only decoration on this otherwise-identical,
              admin-themed completion screen (see this file's own doc
              comment on why everything else here stays uniform across
              modes) — a small closing-book flourish above the accuracy
              sticker, reusing that sticker's own rotate-in spring rather
              than introducing a new motion style. Purely an icon; no text,
              no layout change, so it never affects the admin theme's sizing
              math below it. */}
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
          <motion.div
            dir="ltr"
            initial={reducedMotion ? undefined : { rotate: -9 }}
            animate={{ rotate: -2 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 140, damping: 9, delay: 0.15 }
            }
            style={{
              backgroundColor: "oklch(0.96 0.015 85)",
              color: "oklch(0.32 0.03 60)",
              boxShadow: "0 3px 0 0 oklch(0.85 0.03 80), 0 10px 20px -8px rgba(0,0,0,0.45)",
              padding: `${Math.round(theme.cardPadding * 0.9)}px ${theme.cardPadding * 1.6}px`,
            }}
            className="flex flex-col items-center gap-0.5 rounded-2xl"
          >
            <div className="flex items-end justify-center gap-0.5">
              <span
                style={{ fontSize: theme.heroNumberSize }}
                className="leading-none font-extrabold tabular-nums"
              >
                {accuracyPercent}
              </span>
              <span
                style={{ fontSize: Math.round(theme.heroNumberSize * 0.35) }}
                className="pb-0.5 font-bold opacity-70"
              >
                %
              </span>
            </div>
            <span className="text-xs font-semibold tracking-wide uppercase opacity-70">
              {t.lesson.accuracyLabel}
            </span>
          </motion.div>

          <div className="mt-2">
            <h2
              style={{
                fontSize: theme.headingSize,
                fontWeight: theme.headingWeight,
                color: styles.textPrimary,
              }}
              className="tracking-tight"
            >
              {theme.headingText || t.lesson.completeHeading}
            </h2>
            <p style={{ fontSize: theme.bodySize, color: styles.textSecondary }} className="mt-1.5">
              {(accuracyPercent >= 95 ? t.lesson.accuracyExcellent : t.lesson.accuracyGood).replace(
                "{n}",
                String(accuracyPercent),
              )}
            </p>
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
            RESULT — supporting statistics, plain numbers, no icons.
            --------------------------------------------------------------- */}
        {statCells.length > 0 && (
          <motion.div
            variants={fadeInUp}
            className="mx-auto flex w-full max-w-sm items-stretch justify-center"
          >
            {statCells.map((cell, index) => (
              <StatCell
                key={cell.key}
                label={cell.label}
                value={cell.value}
                valueColor={cell.accent ? theme.colorAccent : undefined}
                theme={theme}
                styles={styles}
                dividerColor={index > 0 ? styles.border : undefined}
              />
            ))}
          </motion.div>
        )}

        {/* ---------------------------------------------------------------
            PROGRESS — XP toward the next level. No card, no gradient.
            --------------------------------------------------------------- */}
        <motion.div variants={fadeInUp}>
          <XpProgressCard
            label={learnerLevelSupportLabel(learnerLevel.level.name, t)}
            fromPercent={xpBarFromPercent}
            toPercent={levelPercent}
            currentXp={xpIntoLevel}
            neededXp={xpNeededForLevel}
            reducedMotion={Boolean(reducedMotion)}
            theme={theme}
            styles={styles}
          />
        </motion.div>

        {rewards.length > 0 && (
          <motion.p
            variants={fadeInUp}
            style={{ color: theme.colorAccent, fontSize: theme.bodySize }}
            className="text-center font-medium"
          >
            {rewards.map((reward) => formatReward(reward, t)).join(" · ")}
          </motion.p>
        )}

        {vocabulary && vocabulary.length > 0 && (
          <motion.div variants={fadeInUp}>
            <p
              style={{
                color: styles.textSecondary,
                fontSize: Math.max(9, Math.round(theme.bodySize * 0.8)),
              }}
              className="mb-2 font-semibold tracking-widest uppercase"
            >
              {theme.vocabTitle || t.lesson.vocabularyHeading}
            </p>
            <div style={{ gap: theme.chipSpacing }} className="flex flex-wrap">
              {vocabulary.slice(0, 3).map((item) => (
                <span
                  key={item.id}
                  style={{
                    borderRadius: theme.chipRadius,
                    borderColor: styles.border,
                    padding: `${Math.round(theme.cardPadding * 0.4)}px ${Math.round(theme.cardPadding * 0.9)}px`,
                    fontSize: theme.bodySize,
                  }}
                  className="inline-flex items-center gap-1.5 border"
                >
                  <span
                    style={{ color: styles.textPrimary, fontWeight: theme.bodyWeight }}
                    dir="ltr"
                  >
                    {item.en}
                  </span>
                  <span style={{ color: styles.textSecondary }} dir={dir}>
                    {resolveVocabularySupportText(item, locale)}
                  </span>
                </span>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          variants={fadeInUp}
          style={{ backgroundColor: styles.border }}
          className="h-px w-full"
        />

        {/* ---------------------------------------------------------------
            NEXT ACTION — one clear primary CTA, everything else quieter.
            --------------------------------------------------------------- */}
        <motion.div
          variants={fadeInUp}
          style={{ gap: theme.cardSpacing }}
          className="flex flex-col items-center"
        >
          {primaryAction && (
            <PrimaryActionButton
              icon={primaryAction.icon}
              label={primaryAction.label}
              href={primaryAction.href}
              onClick={primaryAction.onClick}
              theme={theme}
            />
          )}
          {secondaryActions.length > 0 && (
            <div
              className="flex flex-wrap items-center justify-center"
              style={{ gap: theme.cardSpacing }}
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
          fontSize: theme.statSize,
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
 */
function PrimaryActionButton({
  icon: Icon,
  label,
  href,
  onClick,
  theme,
}: {
  icon: typeof Wand2;
  label: string;
  href?: string;
  onClick?: () => void;
  theme: LessonCompletionTheme;
}) {
  const cardStyle: CSSProperties = {
    backgroundColor: theme.colorAccent,
    color: ON_ACCENT_TEXT,
    height: Math.max(40, Math.round(theme.actionCardHeight * 0.46)),
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

  const className =
    "flex w-full max-w-sm items-center justify-center gap-2 text-center hover:opacity-90 active:scale-[0.98] sm:w-auto";

  if (href) {
    return (
      <Button asChild variant="ghost" style={cardStyle} className={className}>
        <Link href={href}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button type="button" variant="ghost" onClick={onClick} style={cardStyle} className={className}>
      {content}
    </Button>
  );
}

/** A quiet, compact next-to-the-primary action — plain outlined text, no fill, no glow; exists to stay reachable without competing with PrimaryActionButton. */
function SecondaryActionButton({
  icon: Icon,
  label,
  href,
  onClick,
  theme,
  styles,
}: {
  icon: typeof Wand2;
  label: string;
  href?: string;
  onClick?: () => void;
  theme: LessonCompletionTheme;
  styles: LessonCompletionStyles;
}) {
  const cardStyle: CSSProperties = {
    borderColor: styles.border,
    color: styles.textSecondary,
    height: Math.max(32, Math.round(theme.actionCardHeight * 0.38)),
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

  const className = "flex items-center gap-2 border text-center hover:bg-white/5";

  if (href) {
    return (
      <Button asChild variant="ghost" style={cardStyle} className={className}>
        <Link href={href}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button type="button" variant="ghost" onClick={onClick} style={cardStyle} className={className}>
      {content}
    </Button>
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
}: {
  label: string;
  fromPercent: number;
  toPercent: number;
  currentXp: number;
  neededXp: number | null;
  reducedMotion: boolean;
  theme: LessonCompletionTheme;
  styles: LessonCompletionStyles;
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
            backgroundColor: theme.colorXp,
            borderRadius: theme.progressBarRadius,
          }}
          className="h-full"
        />
      </div>
    </div>
  );
}
