import type { PaymentOrderStatus } from "@/lib/billing/payments/types";

import { TRANSFER_BEFORE_ORDER_TOLERANCE_MS } from "./constants";

/** The few facts about an order that matching needs. */
export interface MatchableOrder {
  orderId: string;
  referenceId: string;
  userId: string;
  status: PaymentOrderStatus;
  /** Whole pounds the order costs. */
  chargeAmount: number;
  createdAt: string;
  /** The number the learner said they would send from, or null before they wrote it. */
  payerPhone: string | null;
}

/** What matching needs to know about a stored message. */
export interface MatchableMessage {
  transactionId: string;
  amountPiasters: number;
  payerPhone: string | null;
  walletNumber: string | null;
  /** The message's own time, as an instant. */
  receivedAt: string;
}

export type SkipReason =
  /** The message does not say who sent the money. */
  | "no_phone"
  /** The message is for another wallet than the shop's. */
  | "wrong_wallet"
  /** Nobody who is paying said they would send from this number. */
  | "no_order_for_phone"
  | "order_closed"
  | "order_already_paid"
  | "before_order"
  | "too_late"
  /** The sender has an order, but for another price. */
  | "wrong_amount"
  /** Orders of different learners both fit (two people share a number). */
  | "ambiguous";

export type LinkDecision =
  | { action: "link"; order: MatchableOrder; method: "phone" }
  | { action: "skip"; reason: SkipReason; order?: MatchableOrder };

/** What an admin is told when a message was not linked by itself. */
export const SKIP_REASON_TEXT: Record<SkipReason, string> = {
  no_phone: "The message does not show the sender's number.",
  wrong_wallet: "The message is about a different wallet than the shop's.",
  no_order_for_phone: "No order is waiting for a transfer from this number.",
  order_closed: "The order for this number was closed.",
  order_already_paid: "The order for this number is already paid.",
  before_order: "The transfer is older than the order for this number.",
  too_late: "The transfer came after the order's allowed time.",
  wrong_amount: "This number has an order, but for a different amount.",
  ambiguous: "More than one learner's order fits this number and amount.",
};

/** Statuses an order can still be paid from. 'expired' is allowed: a late transfer from the right number still counts. */
const PAYABLE: readonly PaymentOrderStatus[] = ["created", "pending", "expired"];

/**
 * The pounds a transfer counts for: the amount rounded to the nearest whole pound (249.50 counts as
 * 250), because orders are always whole pounds and nobody should lose a payment over a few piasters.
 */
export function wholePounds(amountPiasters: number): number {
  return Math.round(amountPiasters / 100);
}

function timeProblem(
  message: MatchableMessage,
  order: MatchableOrder,
  lateWindowMs: number,
): "before_order" | "too_late" | null {
  const orderTime = Date.parse(order.createdAt);
  const messageTime = Date.parse(message.receivedAt);
  if (messageTime < orderTime - TRANSFER_BEFORE_ORDER_TOLERANCE_MS) return "before_order";
  if (messageTime - orderTime > lateWindowMs) return "too_late";
  return null;
}

/**
 * The one rule that may activate Premium with nobody looking: a transfer whose sender number is the
 * number an open order's learner wrote on the payment page, for that order's price, made after the
 * order existed and inside its allowed time. Everything else is left for the learner's transaction
 * number or for an admin.
 *
 * `ordersForPhone` holds the orders whose learner wrote this sender number (the caller looks them up).
 */
export function decideLink(
  message: MatchableMessage,
  ordersForPhone: readonly MatchableOrder[],
  options: { lateWindowMs: number; shopWallet: string },
): LinkDecision {
  if (message.walletNumber && options.shopWallet && message.walletNumber !== options.shopWallet) {
    return { action: "skip", reason: "wrong_wallet" };
  }
  if (!message.payerPhone) return { action: "skip", reason: "no_phone" };
  if (ordersForPhone.length === 0) return { action: "skip", reason: "no_order_for_phone" };

  const open = ordersForPhone.filter((order) => PAYABLE.includes(order.status));
  if (open.length === 0) {
    const paid = ordersForPhone.find((order) => order.status === "fulfilled");
    return paid
      ? { action: "skip", reason: "order_already_paid", order: paid }
      : { action: "skip", reason: "order_closed", order: ordersForPhone[0] };
  }

  const inTime = open.filter((order) => timeProblem(message, order, options.lateWindowMs) === null);
  if (inTime.length === 0) {
    const first = open[0]!;
    return {
      action: "skip",
      reason: timeProblem(message, first, options.lateWindowMs) ?? "too_late",
      order: first,
    };
  }

  const pounds = wholePounds(message.amountPiasters);
  const exact = inTime.filter((order) => order.chargeAmount === pounds);
  if (exact.length === 0) return { action: "skip", reason: "wrong_amount", order: inTime[0] };

  if (new Set(exact.map((order) => order.userId)).size > 1) {
    return { action: "skip", reason: "ambiguous", order: exact[0] };
  }
  // The same learner with two open orders of the same price: the oldest one is the one they paid first.
  const oldest = [...exact].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0]!;
  return { action: "link", order: oldest, method: "phone" };
}

export type ReferenceDecision =
  | { action: "link"; order: MatchableOrder }
  | {
      action: "refuse";
      reason:
        | "not_found"
        | "already_used"
        | "order_closed"
        | "wrong_amount"
        | "before_order"
        | "too_late";
    };

/**
 * A learner who paid from another number types the operation number from Vodafone's receipt. The
 * message must exist, be unused, have been sent after the order was created and inside its allowed
 * time, and cover the price (a few piasters short still counts; paying more is welcome).
 */
export function decideReferenceLink(
  message: (MatchableMessage & { status: string }) | null,
  order: MatchableOrder,
  options: { lateWindowMs: number },
): ReferenceDecision {
  if (!message) return { action: "refuse", reason: "not_found" };
  if (message.status !== "new") return { action: "refuse", reason: "already_used" };
  if (!PAYABLE.includes(order.status)) return { action: "refuse", reason: "order_closed" };
  const problem = timeProblem(message, order, options.lateWindowMs);
  if (problem) return { action: "refuse", reason: problem };
  if (wholePounds(message.amountPiasters) < order.chargeAmount) {
    return { action: "refuse", reason: "wrong_amount" };
  }
  return { action: "link", order };
}
