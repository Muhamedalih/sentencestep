import { verifyAndFulfill } from "@/lib/billing/payments/fulfillment";
import { getEgyptWalletRuntime, reportPaymentAlert } from "@/lib/billing/payments/runtime";
import { getEgyptWalletSecret } from "@/lib/billing/provider-registry";

import type { SmsDeps } from "./ingest";
import { createEgyptWalletStore } from "./store";

/**
 * What the SMS endpoint (and the payment page's "I paid from another number" box) run on, built from
 * the real database and the real payment path: a message that is linked is fulfilled by the very same
 * verifyAndFulfill every other payment goes through. Null while EGYPT_WALLET_SECRET is not set (the
 * endpoint answers 501, never pretends). Throws when the database is not configured at all.
 */
export function getEgyptWalletDeps(): SmsDeps | null {
  const secret = getEgyptWalletSecret();
  if (!secret) return null;
  const runtime = getEgyptWalletRuntime();
  if (!runtime) return null;

  return {
    secret,
    store: createEgyptWalletStore(),
    providerEnv: runtime.provider.environment,
    now: () => Date.now(),
    fulfill: (referenceId) => verifyAndFulfill(runtime, referenceId, "relay"),
    report: reportPaymentAlert,
  };
}
