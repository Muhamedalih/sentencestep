import { verifyAndFulfill } from "./fulfillment";
import type { FulfillmentDeps, FulfillmentStore } from "./fulfillment";
import type { PaymentOrder } from "./types";

const DEFAULT_LIMIT = 25;
const DEFAULT_MIN_AGE_MS = 2 * 60 * 1000;
const MAX_ERRORS_REPORTED = 10;

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
 * stuck. One bad order never stops the rest; only an unreachable provider
 * fails the whole run.
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

  const payments = await deps.provider.getPayments(orders.map((order) => order.reference_id));
  const byReference = new Map(payments.map((payment) => [payment.referenceId, payment]));

  for (const order of orders) {
    summary.checked += 1;
    try {
      const result = await verifyAndFulfill(deps, order.reference_id, "cron", {
        payment: byReference.get(order.reference_id) ?? null,
      });
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
      if (summary.errors.length < MAX_ERRORS_REPORTED) {
        const reason = error instanceof Error ? error.message : "unknown error";
        summary.errors.push(`${order.reference_id}: ${reason}`);
      }
    }
  }

  return summary;
}
