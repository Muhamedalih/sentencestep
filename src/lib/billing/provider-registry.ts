import type { BillingProvider } from "@/lib/billing/provider";
import { createPaytabsProvider } from "@/lib/billing/providers/paytabs";
import { createWaylProvider, resolveWaylEnvironment } from "@/lib/billing/providers/wayl";

/**
 * Wayl is the real, connected payment provider (a real merchant account
 * exists for it — see providers/wayl.ts for the full research/confirmed-API
 * writeup). Returns null — never a fake/mock implementation — until
 * WAYL_API_KEY, WAYL_WEBHOOK_SECRET, and a valid WAYL_ENV are all present
 * (see .env.example). Checked first: if Wayl is configured, it's used
 * regardless of whatever PayTabs env vars might also happen to be set.
 */
function getWaylProvider(): BillingProvider | null {
  const apiKey = process.env.WAYL_API_KEY;
  const webhookSecret = process.env.WAYL_WEBHOOK_SECRET;
  const environment = resolveWaylEnvironment(process.env.WAYL_ENV, process.env.NODE_ENV);

  if (!apiKey || !webhookSecret || !environment) return null;

  return createWaylProvider({
    apiKey,
    webhookSecret,
    environment,
    baseUrl: process.env.WAYL_API_BASE_URL || undefined,
  });
}

/**
 * PayTabs was selected in Phase 3D as a candidate payment provider — see
 * that report for the eligibility research (Iraq merchant availability via
 * PayTabs' partnership with Amwal, a Central Bank of Iraq-licensed
 * processor; Visa/Mastercard, recurring billing, and webhook support all
 * confirmed from official PayTabs documentation). No real PayTabs merchant
 * account was ever opened — Wayl (above) is the provider actually in use —
 * but the adapter is kept, unconfigured, in case that changes later.
 *
 * Returns null — never a fake/mock implementation — until
 * PAYTABS_PROFILE_ID, PAYTABS_SERVER_KEY, and PAYTABS_BASE_URL are all set
 * (see .env.example for where each comes from). Every caller (checkout
 * actions, the webhook route) is required to handle "no provider
 * configured" as a real, honest state — never silently pretending checkout
 * or billing works.
 */
function getPaytabsProvider(): BillingProvider | null {
  const profileId = process.env.PAYTABS_PROFILE_ID;
  const serverKey = process.env.PAYTABS_SERVER_KEY;
  const baseUrl = process.env.PAYTABS_BASE_URL;

  if (!profileId || !serverKey || !baseUrl) return null;

  return createPaytabsProvider({ profileId, serverKey, baseUrl });
}

export function getBillingProvider(): BillingProvider | null {
  return getWaylProvider() ?? getPaytabsProvider();
}
