"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getBillingProvider } from "@/lib/billing/provider-registry";
import { track } from "@/lib/analytics/track";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getSiteUrl } from "@/lib/site-url";

export interface CheckoutActionState {
  error?: string;
}

const NOT_CONFIGURED_MESSAGE = "Billing isn't connected yet — check back soon.";

/**
 * Starts a real checkout session once a provider is configured (see
 * provider-registry.ts — this environment has no real PayTabs merchant
 * account, so getBillingProvider() still returns null here and this still
 * returns the honest "not connected" state). This never redirects to a fake
 * success page or grants access on its own — only the signed webhook,
 * processed against the database, is ever allowed to do that (see
 * src/app/api/billing/webhook/route.ts).
 */
export async function startCheckout(
   
  _prevState: CheckoutActionState | null,
): Promise<CheckoutActionState> {
  const user = await getCurrentUser();
  if (user) {
    // Tracked here (server-side, on real submission) rather than from a
    // client onClick handler — a click that never reaches the server isn't
    // a reliable product signal, and this way there's no client-callable
    // analytics endpoint for the event catalog to guard against.
    await track({ name: "UPGRADE_CTA_CLICKED", category: "PREMIUM", properties: {} }, user.id);
  }

  const provider = getBillingProvider();
  if (!provider) return { error: NOT_CONFIGURED_MESSAGE };

  if (!user) return { error: "Sign in first." };

  // Falls back to the configured production origin, not a header that can
  // be absent — a missing Origin header must never produce a "null/upgrade"
  // success/callback URL sent to a real payment provider. Mirrors
  // notification-triggers.ts's and auth-actions.ts's origin fallback. See
  // getSiteUrl's doc comment for how that origin gets set.
  const origin = (await headers()).get("origin") ?? getSiteUrl();
  const { url } = await provider.createCheckoutSession({
    userId: user.id,
    userEmail: user.email,
    successUrl: `${origin}/upgrade?checkout=success`,
    cancelUrl: `${origin}/upgrade?checkout=cancelled`,
  });

  redirect(url);
}

/**
 * Starts a hosted billing-portal session where the provider offers one. A
 * real implementation additionally needs the user's stored
 * provider_customer_id (from their subscriptions row) to pass through —
 * left out here since there's no real customer id to look up yet.
 */
export async function startCustomerPortal(
   
  _prevState: CheckoutActionState | null,
): Promise<CheckoutActionState> {
  const provider = getBillingProvider();
  if (!provider?.createCustomerPortalSession) return { error: NOT_CONFIGURED_MESSAGE };

  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };

  return { error: NOT_CONFIGURED_MESSAGE };
}
