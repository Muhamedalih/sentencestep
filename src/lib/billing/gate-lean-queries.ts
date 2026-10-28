import { buildGateLean } from "@/lib/billing/gate-lean";
import type { GateLean } from "@/lib/billing/gate-lean";
import type { SupportLocale } from "@/lib/i18n/locales";
import { getRolloutAccess } from "@/lib/rollouts/queries";
import { getRatingsProof } from "@/lib/stats/public-ratings";
import { getSocialProof } from "@/lib/stats/public-stats";

/**
 * The lean lock card's extras, or null when the "leanGate" permission is closed for this visitor
 * (then nothing else is read). The two figures are the ones /upgrade quotes, each cached for an hour;
 * never throws: if anything fails the card is the one it always was.
 */
export async function getGateLean(locale: SupportLocale | null): Promise<GateLean | null> {
  try {
    const access = await getRolloutAccess();
    if (!access.leanGate) return null;
    const [proof, ratings] = await Promise.all([getSocialProof(), getRatingsProof()]);
    return buildGateLean({ access, proof, ratings, locale });
  } catch (error) {
    console.error("[gate-lean] could not prepare the lean lock card", error);
    return null;
  }
}
