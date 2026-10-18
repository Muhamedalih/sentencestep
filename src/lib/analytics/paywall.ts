import { track } from "@/lib/analytics/track";
import type { PaywallShape } from "@/lib/analytics/events";
import { getCurrentUser } from "@/lib/supabase/auth";
import type { LearningMode } from "@/types/content";

/**
 * Records that the visitor was shown a lock page instead of the content, so the
 * funnel can be read as lock seen -> upgrade page (UPGRADE_VIEWED) -> plan chosen
 * (UPGRADE_CTA_CLICKED) -> paid. Called by the server pages that render
 * PremiumLocked / WordGroupLocked / PassageLocked (or their short-look and
 * free-path-complete counterparts), alongside the price and figures they already
 * fetch, so it adds no wait. `shape` records which of those the visitor met, so
 * the three can be compared. getCurrentUser is cache()'d per request (the access
 * check has already called it), and track never throws.
 */
export async function trackPaywallViewed(
  target:
    | { kind: "lesson"; mode: LearningMode; lessonId: string; shape?: PaywallShape }
    | { kind: "word_group"; groupId: string; shape?: PaywallShape }
    | { kind: "passage"; passageId: string; shape?: PaywallShape },
): Promise<void> {
  const user = await getCurrentUser();
  await track(
    { name: "PAYWALL_VIEWED", category: "PREMIUM", properties: target },
    user?.id ?? null,
  );
}

/** Records that a learner was taken to their next free lesson instead of a Premium one (see lockedLessonOutcome). */
export async function trackFreePathRedirected(target: {
  mode: LearningMode;
  fromLessonId: string;
  toLessonId: string;
}): Promise<void> {
  const user = await getCurrentUser();
  await track(
    { name: "FREE_PATH_REDIRECTED", category: "PREMIUM", properties: target },
    user?.id ?? null,
  );
}
