import type { PaymentProvider, ProviderPayment } from "@/lib/billing/payment-provider";

import { LINK_EXPIRY_GRACE_MS, LINK_TTL_MS, UNATTACHED_ORDER_GRACE_MS } from "./constants";
import type { FulfillPaymentResult, PaymentOrder, PaymentOrderPatch } from "./types";

export type FulfillmentSource = "webhook" | "return_page" | "cron";

export type ClosedStatus = "failed" | "cancelled" | "expired";

const CLOSED_STATUSES: readonly string[] = ["failed", "cancelled", "expired"];

export type FulfillmentDecision =
  | { action: "already_fulfilled" }
  | { action: "blocked" }
  | { action: "fulfill"; payment: ProviderPayment & { paidAt: string } }
  | { action: "close"; status: ClosedStatus; reason: string; providerStatus: string | null }
  | { action: "needs_review"; reason: string; providerStatus: string | null }
  | { action: "wait"; providerStatus: string | null; anomaly: string | null };

function findPaidMismatch(order: PaymentOrder, payment: ProviderPayment): string | null {
  if (payment.referenceId !== order.reference_id) return "reference_mismatch";
  if (order.provider_payment_id && payment.providerPaymentId !== order.provider_payment_id) {
    return "provider_payment_id_mismatch";
  }
  if (payment.currency !== order.charge_currency) return "currency_mismatch";
  if (payment.amount !== order.charge_amount) return "amount_mismatch";
  return null;
}

/**
 * The pure decision for one order, given what the provider itself reports
 * right now. Premium is only ever granted by a `fulfill` decision, which needs
 * a paid status plus the right reference, provider id, currency and amount
 * for this exact order; every doubtful case waits or goes to review instead.
 */
export function decideFulfillment(
  order: PaymentOrder,
  payment: ProviderPayment | null,
  now: Date,
): FulfillmentDecision {
  if (order.status === "fulfilled") return { action: "already_fulfilled" };
  if (order.status === "needs_review") return { action: "blocked" };

  const createdAt = Date.parse(order.created_at);
  const expiresAt = order.link_expires_at
    ? Date.parse(order.link_expires_at)
    : createdAt + LINK_TTL_MS;
  const pastExpiry = now.getTime() > expiresAt + LINK_EXPIRY_GRACE_MS;

  if (payment === null) {
    if (!order.provider_payment_id && now.getTime() - createdAt > UNATTACHED_ORDER_GRACE_MS) {
      return {
        action: "close",
        status: "failed",
        reason: "link_not_created",
        providerStatus: null,
      };
    }
    if (pastExpiry) {
      return { action: "close", status: "expired", reason: "link_expired", providerStatus: null };
    }
    return { action: "wait", providerStatus: null, anomaly: null };
  }

  const providerStatus = payment.rawStatus;

  switch (payment.status) {
    case "paid": {
      const mismatch = findPaidMismatch(order, payment);
      if (mismatch) return { action: "needs_review", reason: mismatch, providerStatus };
      if (!payment.paidAt) {
        return { action: "wait", providerStatus, anomaly: "paid_without_completion_time" };
      }
      return { action: "fulfill", payment: { ...payment, paidAt: payment.paidAt } };
    }
    case "cancelled":
      return { action: "close", status: "cancelled", reason: "provider_cancelled", providerStatus };
    case "failed":
      return { action: "close", status: "failed", reason: "provider_rejected", providerStatus };
    case "refunded":
      return { action: "close", status: "failed", reason: "provider_returned", providerStatus };
    case "processing":
      return { action: "wait", providerStatus, anomaly: null };
    case "unknown":
      return { action: "wait", providerStatus, anomaly: "unknown_provider_status" };
    case "created":
    case "pending":
      return pastExpiry
        ? { action: "close", status: "expired", reason: "link_expired", providerStatus }
        : { action: "wait", providerStatus, anomaly: null };
  }
}

export interface FulfillOrderArgs {
  referenceId: string;
  providerPaymentId: string;
  chargeAmount: number;
  chargeCurrency: string;
  paidAt: string;
  providerStatus: string;
}

export interface FulfillmentStore {
  getOrderByReference(referenceId: string): Promise<PaymentOrder | null>;
  /** Must never modify a fulfilled order, nor move a needs_review order anywhere but needs_review. */
  updateOrder(orderId: string, patch: PaymentOrderPatch): Promise<void>;
  /** Atomic, exactly-once premium grant (the fulfill_payment_order database function). */
  fulfillOrder(args: FulfillOrderArgs): Promise<FulfillPaymentResult>;
}

export interface PaymentAlert {
  code: string;
  referenceId: string;
  detail?: string;
}

export interface FulfillmentDeps {
  provider: PaymentProvider;
  store: FulfillmentStore;
  report: (alert: PaymentAlert) => void;
  now?: () => Date;
}

export type FulfillmentOutcome =
  | { outcome: "fulfilled"; premiumUntil: string | null }
  | { outcome: "already_fulfilled"; premiumUntil: string | null }
  | { outcome: "pending" }
  | { outcome: "closed"; status: ClosedStatus }
  | { outcome: "needs_review"; reason: string }
  | { outcome: "unknown_reference" }
  | { outcome: "wrong_environment" };

/**
 * The single path that can grant premium, shared by the webhook, the return
 * page and the reconcile job. It never trusts how it was triggered: the
 * provider's own API is asked for the payment's real state every time (unless
 * the caller already did exactly that, e.g. a batch lookup), and the grant is
 * an atomic, exactly-once database operation, so running it any number of
 * times, concurrently, from any source is safe. Throws when the provider or
 * the database is unreachable so callers can retry.
 */
export async function verifyAndFulfill(
  deps: FulfillmentDeps,
  referenceId: string,
  source: FulfillmentSource,
  options: { payment?: ProviderPayment | null } = {},
): Promise<FulfillmentOutcome> {
  const { provider, store, report } = deps;
  const now = (deps.now ?? (() => new Date()))();

  const order = await store.getOrderByReference(referenceId);
  if (!order) return { outcome: "unknown_reference" };

  if (order.provider !== provider.name || order.provider_env !== provider.environment) {
    return { outcome: "wrong_environment" };
  }

  if (order.status === "fulfilled") {
    return { outcome: "already_fulfilled", premiumUntil: order.premium_period_end };
  }
  if (order.status === "needs_review") {
    return { outcome: "needs_review", reason: order.failure_reason ?? "needs_review" };
  }

  const payment =
    options.payment !== undefined ? options.payment : await provider.getPayment(order.reference_id);
  const decision = decideFulfillment(order, payment, now);
  const verifiedAt = now.toISOString();

  switch (decision.action) {
    case "already_fulfilled":
      return { outcome: "already_fulfilled", premiumUntil: order.premium_period_end };

    case "blocked":
      return { outcome: "needs_review", reason: order.failure_reason ?? "needs_review" };

    case "fulfill": {
      const result = await store.fulfillOrder({
        referenceId: order.reference_id,
        providerPaymentId: decision.payment.providerPaymentId,
        chargeAmount: decision.payment.amount,
        chargeCurrency: decision.payment.currency,
        paidAt: decision.payment.paidAt,
        providerStatus: decision.payment.rawStatus,
      });

      switch (result.result) {
        case "fulfilled":
          return { outcome: "fulfilled", premiumUntil: result.premium_period_end ?? null };
        case "already_fulfilled":
          return { outcome: "already_fulfilled", premiumUntil: result.premium_period_end ?? null };
        case "not_found":
          return { outcome: "unknown_reference" };
        case "missing_paid_at":
          report({ code: "paid_without_completion_time", referenceId, detail: source });
          return { outcome: "pending" };
        case "mismatch":
        case "user_not_found":
        case "needs_review": {
          const reason = result.result === "needs_review" ? "needs_review" : result.result;
          report({
            code: reason,
            referenceId,
            detail: `${source}: paid at the provider but not granted`,
          });
          return { outcome: "needs_review", reason };
        }
      }
      break;
    }

    case "close":
      await store.updateOrder(order.id, {
        status: decision.status,
        failure_reason: decision.reason,
        last_verified_at: verifiedAt,
        ...(decision.providerStatus !== null && { provider_status: decision.providerStatus }),
      });
      return { outcome: "closed", status: decision.status };

    case "needs_review":
      await store.updateOrder(order.id, {
        status: "needs_review",
        failure_reason: decision.reason,
        last_verified_at: verifiedAt,
        ...(decision.providerStatus !== null && { provider_status: decision.providerStatus }),
      });
      report({
        code: decision.reason,
        referenceId,
        detail: `${source}: provider reports a payment that does not match the order`,
      });
      return { outcome: "needs_review", reason: decision.reason };

    case "wait":
      await store.updateOrder(order.id, {
        last_verified_at: verifiedAt,
        ...(decision.providerStatus !== null && { provider_status: decision.providerStatus }),
      });
      if (decision.anomaly) report({ code: decision.anomaly, referenceId, detail: source });
      return CLOSED_STATUSES.includes(order.status)
        ? { outcome: "closed", status: order.status as ClosedStatus }
        : { outcome: "pending" };
  }

  return { outcome: "pending" };
}
