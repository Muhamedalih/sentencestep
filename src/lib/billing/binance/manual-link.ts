import type { FulfillmentOutcome } from "@/lib/billing/payments/fulfillment";
import type { PaymentOrderStatus } from "@/lib/billing/payments/types";

import { coversPrice, isPaymentTransfer } from "./matching";
import type { BinancePayStore, LinkResultName } from "./store";

export type ManualLinkResult =
  { ok: true; outcome: FulfillmentOutcome } | { ok: false; error: string };

/** Orders an admin may still attach a transfer to. A 'needs_review' order is blocked by the payment system itself (use Give Premium for it). */
const LINKABLE: readonly PaymentOrderStatus[] = ["created", "pending", "expired", "cancelled"];

const LINK_ERRORS: Partial<Record<LinkResultName, string>> = {
  transfer_not_found: "That transfer no longer exists.",
  transfer_already_linked: "That transfer is already linked to another order.",
  order_not_found: "That order no longer exists.",
  order_already_paid: "That order is already paid.",
  order_already_has_transfer: "That order already has a transfer linked to it.",
};

/**
 * An admin attaches an unlinked transfer to an order by hand (a learner who
 * forgot the code, or typed it wrong). The rules that protect the money are the
 * same as for the automatic link, minus the note: the transfer must be a
 * payment in USDT and at least the order's price, and it can only ever be
 * attached to one order. Premium is then granted by the same fulfillment as
 * every payment, so the order's own snapshot is re-checked once more.
 */
export async function linkTransferByAdmin(
  deps: {
    store: BinancePayStore;
    fulfill: (referenceId: string) => Promise<FulfillmentOutcome>;
  },
  input: { transferId: string; orderId: string },
): Promise<ManualLinkResult> {
  const stored = await deps.store.getTransferById(input.transferId);
  if (!stored) return { ok: false, error: LINK_ERRORS.transfer_not_found! };
  if (stored.status !== "new") {
    return { ok: false, error: "That transfer was already linked or ignored." };
  }

  const order = await deps.store.getOrderById(input.orderId);
  if (!order) return { ok: false, error: LINK_ERRORS.order_not_found! };
  if (order.status === "fulfilled") return { ok: false, error: LINK_ERRORS.order_already_paid! };
  if (!LINKABLE.includes(order.status)) {
    return {
      ok: false,
      error:
        "That order is waiting for review and can't be paid this way. Use Give Premium instead.",
    };
  }

  if (!isPaymentTransfer(stored.transfer)) {
    return { ok: false, error: "Only a USDT transfer of a payment type can pay an order." };
  }
  if (!coversPrice(stored.transfer, order)) {
    return {
      ok: false,
      error: `The transfer (${stored.transfer.amount} USDT) is lower than the order's price (${order.chargeAmount} USDT).`,
    };
  }

  const result = await deps.store.linkTransfer({
    transferId: input.transferId,
    orderId: input.orderId,
    method: "manual",
    reason: "Linked by an admin.",
  });
  if (result !== "linked" && result !== "already_linked_here") {
    return { ok: false, error: LINK_ERRORS[result] ?? "That transfer couldn't be linked." };
  }

  return { ok: true, outcome: await deps.fulfill(order.referenceId) };
}
