import { MIN_REUSABLE_LINK_LIFE_MS } from "./payments/constants";
import { getPaymentRuntime } from "./payments/runtime";

export interface OpenCheckout {
  reference: string;
  url: string;
}

/**
 * The learner's payment link that is still open, if any: what the "finish your
 * payment" note on Home points back to. A link about to expire is not offered.
 * Never throws: a payment setup that is missing or a database hiccup just means
 * no note, and Home must never fail because of it.
 */
export async function getOpenCheckout(
  userId: string,
  now: Date = new Date(),
): Promise<OpenCheckout | null> {
  try {
    const runtime = getPaymentRuntime();
    if (!runtime) return null;
    const order = await runtime.store.findOpenCheckout({
      userId,
      provider: runtime.provider.name,
      providerEnv: runtime.provider.environment,
      expiringAfter: new Date(now.getTime() + MIN_REUSABLE_LINK_LIFE_MS),
    });
    return order?.checkout_url ? { reference: order.reference_id, url: order.checkout_url } : null;
  } catch (error) {
    console.error("[payments] open checkout lookup failed", error);
    return null;
  }
}
