import type { GatePay } from "@/lib/billing/gate-pay";
import { formatCount } from "@/lib/i18n/format-count";
import type { SupportLocale } from "@/lib/i18n/locales";
import type { RolloutId } from "@/lib/rollouts/catalog";
import type { RatingsProof } from "@/lib/stats/ratings-proof";
import type { SocialProof } from "@/lib/stats/social-proof";

/**
 * What the lean lock card needs beyond the lesson (see PremiumGate's `lean` prop), prepared on the
 * server so the card receives only plain values. Absent (null) for everyone the "leanGate"
 * permission has not reached: they get the card exactly as it was.
 */
export interface GateLean {
  /** The sealed-section card is shown only while the section really opens for subscribers (the "libraryGift" permission), so the card never promises something that is not there. */
  gift: boolean;
  /** Learners who practise, rounded down and formatted ("9,200"), or null when too few to quote. */
  learners: string | null;
  /** The average rating to one decimal ("4.8"), or null while it is switched off or too few ratings. */
  rating: string | null;
}

export function buildGateLean(input: {
  access: Pick<Record<RolloutId, boolean>, "leanGate" | "libraryGift">;
  proof: SocialProof;
  ratings: RatingsProof | null;
  locale: SupportLocale | null;
}): GateLean | null {
  if (!input.access.leanGate) return null;
  return {
    gift: input.access.libraryGift,
    learners:
      input.proof.learners === null ? null : formatCount(input.proof.learners, input.locale),
    rating: input.ratings ? input.ratings.average.toFixed(1) : null,
  };
}

/**
 * The one small mark about the running offer on the lean card: the days every plan gets, or, when the
 * plans differ, "up to" the largest. Null when no offer runs or it adds nothing, so the mark simply
 * is not drawn.
 */
export function giftPill(pay: GatePay): { days: number; upTo: boolean } | null {
  const offer = pay.offer;
  if (!offer) return null;
  const upTo = offer.shared === null;
  const days = upTo ? Math.max(...Object.values(offer.byPlan)) : offer.shared;
  return days !== null && days > 0 ? { days, upTo } : null;
}
