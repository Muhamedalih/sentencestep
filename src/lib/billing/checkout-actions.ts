"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { track } from "@/lib/analytics/track";
import { resolvePricingCountry } from "@/lib/billing/geo-pricing";
import { createCheckout } from "@/lib/billing/payments/checkout";
import { getPaymentRuntime } from "@/lib/billing/payments/runtime";
import type { PaymentRuntime } from "@/lib/billing/payments/runtime";
import { fallbackDictionary, getDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { getSiteUrl } from "@/lib/site-url";
import { getCurrentUser } from "@/lib/supabase/auth";

export interface CheckoutActionState {
  error?: string;
}

/**
 * Starts a real checkout once a payment provider is configured (see
 * provider-registry.ts — until then this returns the honest "not connected"
 * state). The price is decided entirely on the server: the country comes from
 * the hosting platform's geolocation, never from the form, and the callback URLs come
 * from the configured site origin, never from a request header. This never
 * redirects to a fake success page or grants access on its own — only a
 * payment verified with the provider's own API ever does (see
 * src/lib/billing/payments/fulfillment.ts).
 */
export async function startCheckout(
  _prevState: CheckoutActionState | null,
): Promise<CheckoutActionState> {
  const locale = await getLocale();
  const t = locale ? getDictionary(locale) : fallbackDictionary;

  const user = await getCurrentUser();
  if (user) {
    // Tracked here (server-side, on real submission) rather than from a
    // client onClick handler — a click that never reaches the server isn't
    // a reliable product signal.
    await track({ name: "UPGRADE_CTA_CLICKED", category: "PREMIUM", properties: {} }, user.id);
  }

  let runtime: PaymentRuntime | null;
  try {
    runtime = getPaymentRuntime();
  } catch (error) {
    console.error("[payments] checkout: payment storage is not configured", error);
    return { error: t.premium.checkoutNotConnected };
  }
  if (!runtime) return { error: t.premium.checkoutNotConnected };

  if (!user) return { error: t.premium.checkoutSignIn };

  const country = resolvePricingCountry(await headers());

  let result;
  try {
    result = await createCheckout(runtime, {
      userId: user.id,
      country,
      origin: getSiteUrl(),
    });
  } catch (error) {
    console.error("[payments] checkout failed", error);
    return { error: t.premium.checkoutTryAgain };
  }

  if (!result.ok) {
    return {
      error:
        result.error === "rate_limited"
          ? t.premium.checkoutTooManyAttempts
          : t.premium.checkoutTryAgain,
    };
  }

  redirect(result.url);
}
