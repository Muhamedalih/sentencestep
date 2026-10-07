import * as Sentry from "@sentry/nextjs";

import type { PaymentProvider } from "@/lib/billing/payment-provider";
import { getPaymentProvider } from "@/lib/billing/provider-registry";
import { markWebhookEventProcessed, recordWebhookEvent } from "@/lib/billing/webhook-events";

import { notifyAdminsOfPaymentAlert } from "./admin-alerts";
import type { PaymentAlert } from "./fulfillment";
import { createPaymentStore } from "./store";
import type { PaymentStore } from "./store";
import type { WebhookDeps } from "./webhook-handler";

export interface PaymentRuntime {
  provider: PaymentProvider;
  store: PaymentStore;
  report: (alert: PaymentAlert) => void | Promise<void>;
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
