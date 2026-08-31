import type { BillingProvider } from "@/lib/billing/provider";
import { createPaytabsProvider } from "@/lib/billing/providers/paytabs";

/**
 * PayTabs was selected in Phase 3D as the payment provider — see that
 * report for the eligibility research (Iraq merchant availability via
 * PayTabs' partnership with Amwal, a Central Bank of Iraq-licensed
 * processor; Visa/Mastercard, recurring billing, and webhook support all
 * confirmed from official PayTabs documentation).
 *
 * Returns null — never a fake/mock implementation — until
 * PAYTABS_PROFILE_ID, PAYTABS_SERVER_KEY, and PAYTABS_BASE_URL are all set
 * (see .env.example for where each comes from). Every caller (checkout
 * actions, the webhook route) is required to handle "no provider
 * configured" as a real, honest state — never silently pretending checkout
 * or billing works. This environment has no real PayTabs merchant account,
 * so these are unset here and this continues returning null.
 */
export function getBillingProvider(): BillingProvider | null {
  const profileId = process.env.PAYTABS_PROFILE_ID;
  const serverKey = process.env.PAYTABS_SERVER_KEY;
  const baseUrl = process.env.PAYTABS_BASE_URL;

  if (!profileId || !serverKey || !baseUrl) return null;

  return createPaytabsProvider({ profileId, serverKey, baseUrl });
}
