"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { track } from "@/lib/analytics/track";
import {
  AFTER_PAYMENT_COOKIE,
  AFTER_PAYMENT_MAX_AGE_SECONDS,
  safeLessonPath,
} from "@/lib/billing/after-payment";
import { resolvePricingCountry } from "@/lib/billing/geo-pricing";
import { bonusDaysForCheckout } from "@/lib/billing/launch-offer";
import { getLaunchOffer } from "@/lib/billing/launch-offer-queries";
import { isPlanId } from "@/lib/billing/plans";
import { tierForCountry } from "@/lib/billing/pricing";
import { MAX_ORDERS_PER_PERSON_PER_DAY } from "@/lib/billing/binance/constants";
import { orderLimitReason } from "@/lib/billing/binance/limits";
import type { OrderLimitReason } from "@/lib/billing/binance/limits";
import { createBinancePayStore } from "@/lib/billing/binance/store";
import { createCheckout } from "@/lib/billing/payments/checkout";
import { getBinancePayRuntime, getPaymentRuntime } from "@/lib/billing/payments/runtime";
import type { PaymentRuntime } from "@/lib/billing/payments/runtime";
import { getEffectiveFeatures } from "@/lib/features/queries";
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
 * the hosting platform's geolocation, never from the form, and the form only
 * ever names a plan, which must be one of the known plan ids (a price or a
 * number of days sent by a client is never read). Launch-offer bonus days are
 * likewise read from the server's own settings at this moment. The callback URLs come from
 * the configured site origin, never from a request header. This never
 * redirects to a fake success page or grants access on its own — only a
 * payment verified with the provider's own API ever does (see
 * src/lib/billing/payments/fulfillment.ts).
 */
export async function startCheckout(
  _prevState: CheckoutActionState | null,
  formData: FormData,
): Promise<CheckoutActionState> {
  const locale = await getLocale();
  const t = locale ? getDictionary(locale) : fallbackDictionary;

  const plan = formData.get("plan");
  if (!isPlanId(plan)) return { error: t.premium.checkoutTryAgain };
  // Which button was pressed. Anything but "binance" is the card button, so a
  // form posted by hand can only ever choose between the two real ways to pay.
  const method = formData.get("method") === "binance" ? "binance" : "card";

  const country = resolvePricingCountry(await headers());
  // Decided here, on the server, for this moment — never from the form.
  const bonusDays = bonusDaysForCheckout(await getLaunchOffer(), new Date());

  const user = await getCurrentUser();
  if (user) {
    // Tracked here (server-side, on real submission) rather than from a
    // client onClick handler — a click that never reaches the server isn't
    // a reliable product signal.
    await track(
      {
        name: "UPGRADE_CTA_CLICKED",
        category: "PREMIUM",
        properties: { plan, tier: tierForCountry(country.country), bonusDays, method },
      },
      user.id,
    );
  }

  let runtime: PaymentRuntime | null;
  try {
    if (method === "binance") {
      // The button is only drawn for visitors the "binancePay" switch reaches; this
      // re-checks it on the server, so a hand-made post can't open a Binance order.
      if (!(await getEffectiveFeatures()).binancePay.enabled) {
        return { error: t.premium.checkoutNotConnected };
      }
      runtime = getBinancePayRuntime();
    } else {
      runtime = getPaymentRuntime();
    }
  } catch (error) {
    console.error("[payments] checkout: payment storage is not configured", error);
    return { error: t.premium.checkoutNotConnected };
  }
  if (!runtime) return { error: t.premium.checkoutNotConnected };

  if (!user) return { error: t.premium.checkoutSignIn };

  // The two limits on opening a NEW Binance Pay order (see limits.ts): a pause for everyone and a
  // number per learner. They are asked only when a new order would be opened, so a learner can
  // always go back to the order they already have. A pause is never a surprise charge.
  const limit: { reason: OrderLimitReason | null } = { reason: null };
  const environment = runtime.provider.environment;
  const allowNewOrder =
    method === "binance"
      ? async () => {
          const store = createBinancePayStore();
          const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const [settings, ordersInLastDay, ordersByThisLearnerInLastDay] = await Promise.all([
            store.getSettings(),
            store.countOrdersSince(since, environment),
            store.countUserOrdersSince(user.id, since, environment),
          ]);
          limit.reason = orderLimitReason({
            dailyOrderCap: settings.dailyOrderCap,
            ordersInLastDay,
            ordersByThisLearnerInLastDay,
          });
          return limit.reason === null;
        }
      : undefined;

  let result;
  try {
    result = await createCheckout(
      { ...runtime, allowNewOrder },
      {
        userId: user.id,
        country,
        origin: getSiteUrl(),
        plan,
        bonusDays,
      },
    );
  } catch (error) {
    console.error("[payments] checkout failed", error);
    return { error: t.premium.checkoutTryAgain };
  }

  if (!result.ok) {
    if (result.error === "not_allowed") {
      return {
        error:
          limit.reason === "personal_limit"
            ? t.binancePay.limitReached.replace("{count}", String(MAX_ORDERS_PER_PERSON_PER_DAY))
            : t.binancePay.pausedToday,
      };
    }
    return {
      error:
        result.error === "rate_limited"
          ? t.premium.checkoutTooManyAttempts
          : t.premium.checkoutTryAgain,
    };
  }

  // Only now that a checkout exists: remember the lesson the learner was stopped
  // at (if the form carried a real lesson path), or forget an older one, so the
  // confirmation page leads back to the right place. The cookie never touches the
  // payment itself — see after-payment.ts.
  const cookieStore = await cookies();
  const afterPaymentPath = safeLessonPath(formData.get("next"));
  if (afterPaymentPath) {
    cookieStore.set(AFTER_PAYMENT_COOKIE, afterPaymentPath, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: AFTER_PAYMENT_MAX_AGE_SECONDS,
    });
  } else {
    cookieStore.delete(AFTER_PAYMENT_COOKIE);
  }

  redirect(result.url);
}
