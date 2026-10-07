import * as Sentry from "@sentry/nextjs";

import type { PaymentProvider } from "@/lib/billing/payment-provider";
import { getPaymentProvider } from "@/lib/billing/provider-registry";
import { markWebhookEventProcessed, recordWebhookEvent } from "@/lib/billing/webhook-events";

import type { PaymentAlert } from "./fulfillment";
import { createPaymentStore } from "./store";
import type { PaymentStore } from "./store";
import type { WebhookDeps } from "./webhook-handler";

export interface PaymentRuntime {
  provider: PaymentProvider;
  store: PaymentStore;
  report: (alert: PaymentAlert) => void;
}

/** Something a human has to look at: a payment that was taken but not granted, or a provider anomaly. */
export function reportPaymentAlert(alert: PaymentAlert): void {
  console.error("[payments] needs attention", alert);
  Sentry.captureMessage(`Payment alert: ${alert.code}`, { level: "error", extra: { ...alert } });
}

/** Null when no payment provider is configured — callers must treat that as a real, honest state. */
export function getPaymentRuntime(): PaymentRuntime | null {
  const provider = getPaymentProvider();
  if (!provider) return null;
  return { provider, store: createPaymentStore(), report: reportPaymentAlert };
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
