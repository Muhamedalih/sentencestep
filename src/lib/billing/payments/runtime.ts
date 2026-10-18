import * as Sentry from "@sentry/nextjs";

import type { PaymentProvider } from "@/lib/billing/payment-provider";
import { getBinancePayProvider, getPaymentProvider } from "@/lib/billing/provider-registry";
import { markWebhookEventProcessed, recordWebhookEvent } from "@/lib/billing/webhook-events";

import { notifyAdminsOfPaymentAlert } from "./admin-alerts";
import type { FulfilledEvent, PaymentAlert } from "./fulfillment";
import { sendPurchaseConfirmation } from "./purchase-confirmation";
import { createPaymentStore } from "./store";
import type { PaymentStore } from "./store";
import type { WebhookDeps } from "./webhook-handler";

export interface PaymentRuntime {
  provider: PaymentProvider;
  store: PaymentStore;
  report: (alert: PaymentAlert) => void | Promise<void>;
  /** Runs once when a payment is confirmed and Premium granted: the receipt email. */
  onFulfilled?: (event: FulfilledEvent) => void | Promise<void>;
}

/**
 * Something a human has to look at: a payment that was taken but not granted,
 * or a provider anomaly. It is written to the log and to Sentry, and the admins
 * are emailed (and pushed) straight away, so it does not depend on anyone
 * watching a dashboard. Callers await it; it never throws and never waits long.
 */
export async function reportPaymentAlert(alert: PaymentAlert): Promise<void> {
  console.error("[payments] needs attention", alert);
  Sentry.captureMessage(`Payment alert: ${alert.code}`, { level: "error", extra: { ...alert } });
  await notifyAdminsOfPaymentAlert(alert);
}

/** Null when no payment provider is configured — callers must treat that as a real, honest state. */
export function getPaymentRuntime(): PaymentRuntime | null {
  const provider = getPaymentProvider();
  if (!provider) return null;
  return {
    provider,
    store: createPaymentStore(),
    report: reportPaymentAlert,
    onFulfilled: sendPurchaseConfirmation,
  };
}

/**
 * Binance Pay's own runtime: the same store, alerts and receipt email as Wayl's,
 * with the Binance Pay provider. Null while BINANCE_RELAY_SECRET is not set.
 */
export function getBinancePayRuntime(): PaymentRuntime | null {
  const provider = getBinancePayProvider();
  if (!provider) return null;
  return {
    provider,
    store: createPaymentStore(),
    report: reportPaymentAlert,
    onFulfilled: sendPurchaseConfirmation,
  };
}

/** The runtime that owns an order, found by the provider name stored on it. */
export function getRuntimeForProvider(providerName: string): PaymentRuntime | null {
  const candidates = [getPaymentRuntime, getBinancePayRuntime];
  for (const candidate of candidates) {
    const runtime = candidate();
    if (runtime?.provider.name === providerName) return runtime;
  }
  return null;
}

export function toWebhookDeps(runtime: PaymentRuntime): WebhookDeps {
  return {
    ...runtime,
    async recordEvent(event) {
      const result = await recordWebhookEvent(event.id, event.provider, event.type, event.payload);
      return result.status;
    },
    markEventProcessed: markWebhookEventProcessed,
  };
}
