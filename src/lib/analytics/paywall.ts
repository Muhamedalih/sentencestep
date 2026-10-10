import { track } from "@/lib/analytics/track";
import { getCurrentUser } from "@/lib/supabase/auth";
import type { LearningMode } from "@/types/content";

/**
 * Records that the visitor was shown a lock page instead of the content, so the
 * funnel can be read as lock seen -> upgrade page (UPGRADE_VIEWED) -> plan chosen
 * (UPGRADE_CTA_CLICKED) -> paid. Called by the four server pages that render
 * PremiumLocked / WordGroupLocked, alongside the price and figures they already
 * fetch, so it adds no wait. getCurrentUser is cache()'d per request (the access
 * check has already called it), and track never throws.
 */
export async function trackPaywallViewed(
  target:
    | { kind: "lesson"; mode: LearningMode; lessonId: string }
    | { kind: "word_group"; groupId: string },
): Promise<void> {
  const user = await getCurrentUser();
  await track(
    { name: "PAYWALL_VIEWED", category: "PREMIUM", properties: target },
    user?.id ?? null,
  );
}
