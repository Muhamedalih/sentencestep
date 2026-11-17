import { getEgyptWalletDeps } from "./deps";
import { alertUnansweredClaim, CLAIM_ALERT_AFTER_MS } from "./ingest";

/**
 * Used by the payment page while it waits (server code only, never a server action: it takes a
 * reference and a user id the caller has already established). The alert for "I sent the money, and
 * nothing arrived" goes out as soon as the claim is old enough, even if the learner keeps the page
 * open; the right to send it is won by one atomic update, so it is sent once.
 */
export async function alertIfClaimIsOld(reference: string, userId: string): Promise<void> {
  try {
    const deps = getEgyptWalletDeps();
    if (!deps) return;
    const order = await deps.store.getOrderForUser(reference, userId);
    if (!order || order.status === "fulfilled") return;
    const record = await deps.store.getIntent(order.orderId);
    if (!record?.claimedPaidAt || record.claimAlertedAt) return;
    if (deps.now() - Date.parse(record.claimedPaidAt) < CLAIM_ALERT_AFTER_MS) return;
    await alertUnansweredClaim(deps, order, record.claimedPaidAt);
  } catch (error) {
    console.error("[egypt-wallet] the claim check failed", error);
  }
}
