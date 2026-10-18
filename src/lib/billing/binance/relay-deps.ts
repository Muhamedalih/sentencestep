import { verifyAndFulfill } from "@/lib/billing/payments/fulfillment";
import { getBinancePayRuntime, reportPaymentAlert } from "@/lib/billing/payments/runtime";
import { getBinancePayRelaySecret } from "@/lib/billing/provider-registry";

import type { RelayDeps } from "./ingest";
import { createBinancePayStore } from "./store";

/**
 * What the relay's two endpoints run on, built from the real database and the
 * real payment path: a transfer that is linked is fulfilled by the very same
 * verifyAndFulfill every other payment goes through. Null while
 * BINANCE_RELAY_SECRET is not set (the endpoints answer 501, never pretend).
 * Throws when the database is not configured at all.
 */
export function getRelayDeps(): RelayDeps | null {
  const secret = getBinancePayRelaySecret();
  if (!secret) return null;
  const runtime = getBinancePayRuntime();
  if (!runtime) return null;

  return {
    secret,
    store: createBinancePayStore(),
    providerEnv: runtime.provider.environment,
    now: () => Date.now(),
    fulfill: (referenceId) => verifyAndFulfill(runtime, referenceId, "relay"),
    report: reportPaymentAlert,
  };
}
