import { randomUUID } from "node:crypto";

import type { PaymentProvider } from "@/lib/billing/payment-provider";
import type { ResolvedPricingCountry } from "@/lib/billing/geo-pricing";
import { quotePrice, tierForCountry } from "@/lib/billing/pricing";
import type { PricingTier } from "@/lib/billing/pricing";

import {
  LINK_EXPIRES_IN,
  LINK_TTL_MS,
  MAX_ORDERS_PER_HOUR,
  MIN_REUSABLE_LINK_LIFE_MS,
} from "./constants";
import type { PaymentAlert } from "./fulfillment";
import type { PaymentOrder, PaymentOrderInsert, PaymentOrderPatch } from "./types";

export interface CheckoutStore {
  findReusableOrder(query: {
    userId: string;
    provider: string;
    providerEnv: "live" | "test";
    pricingTier: PricingTier;
    expiringAfter: Date;
  }): Promise<PaymentOrder | null>;
  countRecentOrders(userId: string, since: Date): Promise<number>;
  insertOrder(order: PaymentOrderInsert): Promise<PaymentOrder>;
  updateOrder(orderId: string, patch: PaymentOrderPatch): Promise<void>;
}

export interface CheckoutDeps {
  provider: PaymentProvider;
  store: CheckoutStore;
  report: (alert: PaymentAlert) => void;
  now?: () => Date;
  newId?: () => string;
}

export interface CheckoutInput {
  userId: string;
  /** Resolved on the server from trusted request headers — never from client input. */
  country: ResolvedPricingCountry;
  /** The canonical site origin, never a request header. */
  origin: string;
}

export type CheckoutResult =
  | { ok: true; url: string; reused: boolean }
  | { ok: false; error: "rate_limited" | "provider_unavailable" };

/**
 * Starts a payment: prices it on the server, stores the complete immutable
 * order snapshot, then asks the provider for a hosted checkout link. The USD
 * price is converted to the provider's currency with the fixed rate only here,
 * immediately before the link is created. Clicking Pay again while a link is
 * still open hands back the same link instead of creating another order.
 */
export async function createCheckout(
  deps: CheckoutDeps,
  input: CheckoutInput,
): Promise<CheckoutResult> {
  const { provider, store } = deps;
  const now = (deps.now ?? (() => new Date()))();
  const newId = deps.newId ?? randomUUID;
  const origin = input.origin.replace(/\/+$/, "");

  const tier = tierForCountry(input.country.country);
  const quote = quotePrice(tier, provider.settlementCurrency);

  const reusable = await store.findReusableOrder({
    userId: input.userId,
    provider: provider.name,
    providerEnv: provider.environment,
    pricingTier: tier,
    expiringAfter: new Date(now.getTime() + MIN_REUSABLE_LINK_LIFE_MS),
  });
  if (reusable?.checkout_url && reusable.charge_amount === quote.amount) {
    return { ok: true, url: reusable.checkout_url, reused: true };
  }

  const recentOrders = await store.countRecentOrders(
    input.userId,
    new Date(now.getTime() - 60 * 60 * 1000),
  );
  if (recentOrders >= MAX_ORDERS_PER_HOUR) return { ok: false, error: "rate_limited" };

  const id = newId();
  const referenceId = `ss_${id.replace(/-/g, "")}`;

  const order = await store.insertOrder({
    id,
    user_id: input.userId,
    reference_id: referenceId,
    provider: provider.name,
    provider_env: provider.environment,
    pricing_tier: tier,
    pricing_country: input.country.country,
    pricing_country_source: input.country.source,
    price_usd_cents: quote.usdCents,
    fx_rate_per_usd: quote.fxRatePerUsd,
    charge_amount: quote.amount,
    charge_currency: quote.currency,
    premium_days: quote.premiumDays,
    status: "created",
  });

  try {
    const created = await provider.createPayment({
      referenceId: order.reference_id,
      amount: quote.amount,
      currency: quote.currency,
      webhookUrl: `${origin}/api/billing/webhook/${provider.name}`,
      redirectUrl: `${origin}/billing/return`,
      expiresIn: LINK_EXPIRES_IN,
    });

    await store.updateOrder(order.id, {
      status: "pending",
      provider_payment_id: created.providerPaymentId,
      checkout_url: created.checkoutUrl,
      link_expires_at: new Date(now.getTime() + LINK_TTL_MS).toISOString(),
    });

    return { ok: true, url: created.checkoutUrl, reused: false };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown error";
    deps.report({ code: "checkout_link_creation_failed", referenceId, detail });
    await store
      .updateOrder(order.id, { status: "failed", failure_reason: "link_creation_failed" })
      .catch(() => undefined);
    return { ok: false, error: "provider_unavailable" };
  }
}
