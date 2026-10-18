import type { PaymentAlert } from "@/lib/billing/payments/fulfillment";

import { RELAY_OFFLINE_AFTER_MS } from "./constants";
import type { BinancePayStore } from "./store";

export type RelayHealth = "ok" | "idle" | "offline" | "error";

/** How long a relay may stay silent while a learner is waiting before an admin is told. */
export const OFFLINE_ALERT_AFTER_MS = 3 * RELAY_OFFLINE_AFTER_MS;

/**
 * Called by the reconcile job every few minutes. When nobody is waiting for a
 * transfer the relay being quiet is fine ("idle"). When someone is waiting and
 * the relay has not asked for a while, or its last look at Binance failed, a
 * learner may be paying into a void, so an admin hears about it (the alert
 * itself is throttled, see admin-alerts.ts).
 */
export async function checkRelayHealth(deps: {
  store: BinancePayStore;
  providerEnv: "live" | "test";
  now: Date;
  report: (alert: PaymentAlert) => void | Promise<void>;
}): Promise<RelayHealth> {
  const [state, active] = await Promise.all([
    deps.store.getRelayState(),
    deps.store.countActiveOrders(deps.providerEnv, deps.now),
  ]);
  if (active === 0) return "idle";

  const lastPoll = state.lastPollAt ? Date.parse(state.lastPollAt) : null;
  if (lastPoll === null || deps.now.getTime() - lastPoll > OFFLINE_ALERT_AFTER_MS) {
    await deps.report({
      code: "binance_relay_offline",
      referenceId: "batch",
      detail:
        lastPoll === null ? "The relay has never reported in." : `Last heard ${state.lastPollAt}.`,
    });
    return "offline";
  }

  const lastError = state.lastErrorAt ? Date.parse(state.lastErrorAt) : null;
  if (lastError !== null && deps.now.getTime() - lastError < OFFLINE_ALERT_AFTER_MS) {
    await deps.report({
      code: "binance_relay_error",
      referenceId: "batch",
      detail: state.lastError ?? "Binance could not be read.",
    });
    return "error";
  }

  // The relay keeps asking, yet none of its looks at Binance has been accepted for a while: while someone
  // waits it looks every few seconds, so a long gap means its transfers are not getting in (the site is
  // refusing or failing to store them). A relay with no accepted look yet is brand new and is not judged.
  const lastSuccess = state.lastSuccessAt ? Date.parse(state.lastSuccessAt) : null;
  if (lastSuccess !== null && deps.now.getTime() - lastSuccess > OFFLINE_ALERT_AFTER_MS) {
    await deps.report({
      code: "binance_relay_error",
      referenceId: "batch",
      detail: `The relay is asking but its last accepted look at Binance was at ${state.lastSuccessAt}.`,
    });
    return "error";
  }
  return "ok";
}
