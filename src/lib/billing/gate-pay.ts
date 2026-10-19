import { isOfferActive, offerBonusDaysByPlan, sharedBonusDays } from "@/lib/billing/launch-offer";
import type { LaunchOffer } from "@/lib/billing/launch-offer";
import { getLaunchOffer } from "@/lib/billing/launch-offer-queries";
import type { PlanId } from "@/lib/billing/plans";

/**
 * What the lock card says about the offer, prepared on the server so the card itself (a client
 * component) receives only plain values: the running offer's bonus days, exactly the numbers
 * /upgrade shows, so the two can never disagree.
 */
export interface GatePay {
  /** The running offer, or null when there is none. `shared` is the one number every plan gets, or null when they differ. */
  offer: { byPlan: Record<PlanId, number>; shared: number | null } | null;
}

export function buildGatePay(input: { offer: LaunchOffer | null; now: Date }): GatePay {
  const running = isOfferActive(input.offer, input.now) ? input.offer : null;
  return {
    offer: running
      ? { byPlan: offerBonusDaysByPlan(running), shared: sharedBonusDays(running) }
      : null,
  };
}

export async function getGatePay(): Promise<GatePay> {
  return buildGatePay({ offer: await getLaunchOffer(), now: new Date() });
}
