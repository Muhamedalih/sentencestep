import type { ProviderPayment } from "@/lib/billing/payment-provider";

import { verifyAndFulfill } from "./fulfillment";
import type { FulfillmentDeps, FulfillmentStore } from "./fulfillment";
import type { PaymentOrder } from "./types";

const DEFAULT_LIMIT = 25;
const DEFAULT_MIN_AGE_MS = 2 * 60 * 1000;
const MAX_ERRORS_REPORTED = 10;
// One lookup per order is slower than the batch call, so it stops early enough
// to finish inside a serverless function's time limit; the rest wait for the next run.
const SINGLE_LOOKUP_BUDGET_MS = 7_000;

export interface ReconcileStore extends FulfillmentStore {
  listReconcilableOrders(query: {
    provider: string;
    providerEnv: "live" | "test";
    olderThan: Date;
    limit: number;
  }): Promise<PaymentOrder[]>;
}

export interface ReconcileSummary {
  checked: number;
  fulfilled: number;
  closed: number;
  needsReview: number;
  pending: number;
  errors: string[];
}

/**
 * The safety net behind the webhook and the return page: asks the provider
 * (one batch call) about every order that is still open and settles each
 * through the same verifyAndFulfill path, so a webhook that never arrived, a
 * learner who never came back, or a link nobody paid cannot leave an order
 * stuck. If the batch call itself fails it falls back to one lookup per
 * order, so a fault in that one endpoint cannot silently disable the net.
 * One bad order never stops the rest; only a provider that cannot be reached
 * at all fails the whole run.
 */
export async function reconcileOpenOrders(
  deps: FulfillmentDeps & { store: ReconcileStore },
  options: { limit?: number; minAgeMs?: number } = {},
): Promise<ReconcileSummary> {
  const now = (deps.now ?? (() => new Date()))();
  const summary: ReconcileSummary = {
    checked: 0,
    fulfilled: 0,
    closed: 0,
    needsReview: 0,
    pending: 0,
    errors: [],
  };

  const orders = await deps.store.listReconcilableOrders({
    provider: deps.provider.name,
    providerEnv: deps.provider.environment,
    olderThan: new Date(now.getTime() - (options.minAgeMs ?? DEFAULT_MIN_AGE_MS)),
    limit: options.limit ?? DEFAULT_LIMIT,
  });
  if (orders.length === 0) return summary;

  let byReference = new Map<string, ProviderPayment>();
  let batchError: unknown = null;
  try {
    const payments = await deps.provider.getPayments(orders.map((order) => order.reference_id));
    byReference = new Map(payments.map((payment) => [payment.referenceId, payment]));
  } catch (error) {
    batchError = error;
    const detail = error instanceof Error ? error.message : "unknown error";
    await deps.report({ code: "reconcile_batch_lookup_failed", referenceId: "batch", detail });
  }

  const startedAt = Date.now();
  let failures = 0;

  for (const order of orders) {
    if (batchError !== null && Date.now() - startedAt > SINGLE_LOOKUP_BUDGET_MS) break;
    summary.checked += 1;
    try {
      const result = await verifyAndFulfill(
        deps,
        order.reference_id,
        "cron",
        batchError === null ? { payment: byReference.get(order.reference_id) ?? null } : {},
      );
      switch (result.outcome) {
        case "fulfilled":
          summary.fulfilled += 1;
          break;
        case "closed":
          summary.closed += 1;
          break;
        case "needs_review":
          summary.needsReview += 1;
          break;
        default:
          summary.pending += 1;
      }
    } catch (error) {
      failures += 1;
      if (summary.errors.length < MAX_ERRORS_REPORTED) {
        const reason = error instanceof Error ? error.message : "unknown error";
        summary.errors.push(`${order.reference_id}: ${reason}`);
      }
    }
  }

  // Neither the batch call nor a single lookup got an answer: the provider is
  // unreachable, which the scheduler must see as a failed run.
  if (batchError !== null && summary.checked > 0 && failures === summary.checked) {
    throw batchError;
  }

  return summary;
}
