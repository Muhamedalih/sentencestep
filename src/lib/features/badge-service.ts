import { newlyQualifiedBadges } from "@/lib/features/badges";
import { awardBadges, fetchBadgeMetrics, fetchEarnedBadges } from "@/lib/features/badge-queries";
import type { BadgeId, EventBadgeId } from "@/lib/features/catalog";
import type { EffectiveFeatures } from "@/lib/features/config";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { fetchLatestQuestDay } from "@/lib/features/quest-queries";
import { allQuestsCompleted } from "@/lib/features/quests";

/**
 * Server-side badge orchestration. Best-effort by contract, like quests: a
 * failure (e.g. the migration isn't applied to this environment) is logged
 * and swallowed, never allowed to fail the lesson completion or review that
 * triggered the evaluation.
 */

/**
 * Awards every stat-based badge the learner now qualifies for and returns the
 * ones that were newly earned. Retroactive by construction: the stats come
 * from history that already exists, so the first call after the feature is
 * switched on awards everything past progress qualifies for.
 */
export async function evaluateAndAwardBadges(
  userId: string,
  features: EffectiveFeatures,
): Promise<BadgeId[]> {
  if (!features.badges.enabled) return [];
  try {
    const [metrics, earned] = await Promise.all([fetchBadgeMetrics(), fetchEarnedBadges(userId)]);
    const qualified = newlyQualifiedBadges(
      metrics,
      new Set(earned.map((badge) => badge.id)),
      new Set(features.badges.disabled),
    );
    return await awardBadges(qualified);
  } catch (error) {
    console.error("[badges] evaluateAndAwardBadges failed", error);
    return [];
  }
}

/** Awards one event badge (the action just happened) unless badges are off for this learner or the admin disabled it. Returns the newly earned ids (empty if it was already held). */
export async function awardEventBadge(id: EventBadgeId): Promise<BadgeId[]> {
  try {
    const features = await getEffectiveFeatures();
    if (!features.badges.enabled || features.badges.disabled.includes(id)) return [];
    return await awardBadges([id]);
  } catch (error) {
    console.error(`[badges] awardEventBadge(${id}) failed`, error);
    return [];
  }
}

/** Awards the "all daily quests in one day" badge if the learner's latest quest day is now fully complete. */
export async function awardQuestDayBadgeIfDone(userId: string): Promise<BadgeId[]> {
  try {
    const quests = await fetchLatestQuestDay(userId);
    // A day with a single dealt quest isn't "all of them" in any meaningful sense.
    if (quests.length < 2 || !allQuestsCompleted(quests)) return [];
    return await awardEventBadge("questDay");
  } catch (error) {
    console.error("[badges] awardQuestDayBadgeIfDone failed", error);
    return [];
  }
}
