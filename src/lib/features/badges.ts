import { BADGE_DEFS } from "@/lib/features/catalog";
import type { BadgeDef, BadgeId, BadgeMetric } from "@/lib/features/catalog";

/**
 * Pure badge rules: given a learner's stats, which badges do they qualify
 * for, and how far along is each. No I/O — the stats come from the
 * badge_metrics() function (see 20250318000000_badges.sql) and earned rows
 * from user_badges, both read in badge-service.ts.
 */

/** Every stat a metric badge can be measured against (event badges have no stat). */
export interface BadgeMetrics {
  longestStreak: number;
  totalSentences: number;
  lessonCount: number;
  perfectLessons: number;
  maxWpm: number;
  xp: number;
  fixedWords: number;
}

export const EMPTY_BADGE_METRICS: BadgeMetrics = {
  longestStreak: 0,
  totalSentences: 0,
  lessonCount: 0,
  perfectLessons: 0,
  maxWpm: 0,
  xp: 0,
  fixedWords: 0,
};

function metricValue(metric: Exclude<BadgeMetric, "event">, metrics: BadgeMetrics): number {
  switch (metric) {
    case "longestStreak":
      return metrics.longestStreak;
    case "totalSentences":
      return metrics.totalSentences;
    case "lessonCount":
      return metrics.lessonCount;
    case "perfectLessons":
      return metrics.perfectLessons;
    case "maxWpm":
      return metrics.maxWpm;
    case "xp":
      return metrics.xp;
    case "fixedWords":
      return metrics.fixedWords;
  }
}

/**
 * The badges a learner qualifies for by their stats and doesn't hold yet —
 * skipping anything the admin switched off (a disabled badge is never
 * awarded, though a row already earned is left alone) and every event badge
 * (those are awarded when the action happens, not derived from a stat).
 */
export function newlyQualifiedBadges(
  metrics: BadgeMetrics,
  alreadyEarned: ReadonlySet<string>,
  disabled: ReadonlySet<string>,
): BadgeId[] {
  return BADGE_DEFS.filter(
    (badge) =>
      badge.metric !== "event" &&
      !alreadyEarned.has(badge.id) &&
      !disabled.has(badge.id) &&
      metricValue(badge.metric, metrics) >= badge.threshold,
  ).map((badge) => badge.id);
}

export interface BadgeProgress {
  current: number;
  target: number;
  /** 0–1, capped. Event badges report 0 until earned (they have no partial state). */
  fraction: number;
}

export function badgeProgress(
  badge: BadgeDef,
  metrics: BadgeMetrics,
  earned: boolean,
): BadgeProgress {
  if (badge.metric === "event") {
    return { current: earned ? 1 : 0, target: 1, fraction: earned ? 1 : 0 };
  }
  const current = Math.min(metricValue(badge.metric, metrics), badge.threshold);
  return {
    current,
    target: badge.threshold,
    fraction: badge.threshold > 0 ? Math.min(1, current / badge.threshold) : 1,
  };
}

/**
 * How many just-earned badges get individual celebration cards before the UI
 * collapses them into one summary line — a learner opening the feature with a
 * long history is told once, in one sentence, not buried under a dozen popups.
 */
export const MAX_INDIVIDUAL_BADGE_CELEBRATIONS = 3;

export function summarizeNewBadges(ids: readonly BadgeId[]): {
  individual: BadgeId[];
  bulkCount: number;
} {
  if (ids.length <= MAX_INDIVIDUAL_BADGE_CELEBRATIONS)
    return { individual: [...ids], bulkCount: 0 };
  return { individual: [], bulkCount: ids.length };
}
