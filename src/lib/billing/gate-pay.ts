import { headers } from "next/headers";

import { resolvePricingCountry } from "@/lib/billing/geo-pricing";
import { isOfferActive, offerBonusDaysByPlan, sharedBonusDays } from "@/lib/billing/launch-offer";
import type { LaunchOffer } from "@/lib/billing/launch-offer";
import { getLaunchOffer } from "@/lib/billing/launch-offer-queries";
import { acceptedMethodNames } from "@/lib/billing/pay-methods";
import type { PlanId } from "@/lib/billing/plans";
import { isBinancePayConfigured } from "@/lib/billing/provider-registry";
import { getEffectiveFeatures } from "@/lib/features/queries";

/**
 * What the lock card says about paying, prepared on the server so the card itself (a client
 * component) receives only plain values: the running offer's bonus days, and the ways this
 * visitor can pay. Both are exactly what /upgrade shows, so the two can never disagree.
 */
export interface GatePay {
  /** The running offer, or null when there is none. `shared` is the one number every plan gets, or null when they differ. */
  offer: { byPlan: Record<PlanId, number>; shared: number | null } | null;
  methods: string[];
}

export function buildGatePay(input: {
  offer: LaunchOffer | null;
  now: Date;
  iraq: boolean;
  binancePay: boolean;
}): GatePay {
  const running = isOfferActive(input.offer, input.now) ? input.offer : null;
  return {
    offer: running
      ? { byPlan: offerBonusDaysByPlan(running), shared: sharedBonusDays(running) }
      : null,
    methods: acceptedMethodNames({ iraqiWallets: input.iraq, binancePay: input.binancePay }),
  };
}

export async function getGatePay(): Promise<GatePay> {
  const [offer, features, requestHeaders] = await Promise.all([
    getLaunchOffer(),
    getEffectiveFeatures(),
    headers(),
  ]);
  return buildGatePay({
    offer,
    now: new Date(),
    iraq: resolvePricingCountry(requestHeaders).country === "iq",
    binancePay: features.binancePay.enabled && isBinancePayConfigured(),
  });
}
