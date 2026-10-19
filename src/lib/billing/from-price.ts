import { headers } from "next/headers";

import { cheapestPayment, cheapestPerMonth } from "@/lib/billing/plan-views";
import { resolvePricingCountry } from "@/lib/billing/geo-pricing";
import { tierForCountry } from "@/lib/billing/pricing";

/**
 * The cheapest per-month USD price for this visitor's tier ("$1.17"), shown
 * beside the upgrade button on locked content. Resolved on the server from the
 * hosting platform's geolocation, exactly as /upgrade does.
 */
export async function getFromMonthlyPrice(): Promise<string> {
  const { country } = resolvePricingCountry(await headers());
  return cheapestPerMonth(tierForCountry(country));
}

/**
 * The smallest single payment for this visitor's tier ("$2"), named on the button of the short
 * look at locked content so the button says what it is: a purchase that starts at that amount,
 * not a free way on. Resolved exactly like getFromMonthlyPrice.
 */
export async function getFromPaymentPrice(): Promise<string> {
  const { country } = resolvePricingCountry(await headers());
  return cheapestPayment(tierForCountry(country));
}
