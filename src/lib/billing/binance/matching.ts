import type { PaymentOrderStatus } from "@/lib/billing/payments/types";

import { parseAmountUnits, wholeToUnits } from "./amount";
import { extractOrderCodes } from "./codes";
import {
  BINANCE_PAY_CURRENCY,
  PAYMENT_ORDER_TYPES,
  TRANSFER_BEFORE_ORDER_TOLERANCE_MS,
} from "./constants";
import type { IncomingTransfer } from "./records";

/** The few facts about an order that matching needs. */
export interface MatchableOrder {
  orderId: string;
  referenceId: string;
  orderCode: string;
  status: PaymentOrderStatus;
  /** Whole USDT the order costs. */
  chargeAmount: number;
  createdAt: string;
}

export type SkipReason =
  /** Wrong type, wrong coin, or no positive amount. */
  | "not_a_payment"
  | "no_code"
  /** A code in the right shape, but no order has it. */
  | "unknown_code"
  | "several_codes"
  | "order_closed"
  | "order_already_paid"
  | "before_order"
  | "too_late"
  | "underpaid";

export type LinkDecision =
  | { action: "link"; order: MatchableOrder; method: "note_code" }
  | { action: "skip"; reason: SkipReason; order?: MatchableOrder; code?: string };

/** What an admin is told when a transfer was not linked by itself. */
export const SKIP_REASON_TEXT: Record<SkipReason, string> = {
  not_a_payment: "Not a payment to the shop (wrong type or coin).",
  no_code: "No order code in the note.",
  unknown_code: "The note has a code that no order uses.",
  several_codes: "The note names more than one order.",
  order_closed: "The order it names was closed.",
  order_already_paid: "The order it names is already paid.",
  before_order: "The transfer is older than the order it names.",
  too_late: "The transfer came after the order's allowed time.",
  underpaid: "The amount is lower than the order's price.",
};

/** Statuses an order can still be paid from. 'expired' is allowed: a late transfer with the right code still counts. */
const PAYABLE: readonly PaymentOrderStatus[] = ["created", "pending", "expired"];

/** An incoming payment in USDT of a kind that can be a customer's. */
export function isPaymentTransfer(transfer: IncomingTransfer): boolean {
  if (transfer.currency !== BINANCE_PAY_CURRENCY) return false;
  if (!PAYMENT_ORDER_TYPES.includes(transfer.orderType)) return false;
  const units = parseAmountUnits(transfer.amount);
  return units !== null && units > 0n;
}

/** True when the transfer is at least the order's price, compared as exact units. */
export function coversPrice(transfer: IncomingTransfer, order: MatchableOrder): boolean {
  const units = parseAmountUnits(transfer.amount);
  return units !== null && units >= wholeToUnits(order.chargeAmount);
}

/**
 * The one rule that may activate Premium with nobody looking: a transfer in
 * USDT whose note holds the exact code of one open order, for at least that
 * order's price, made after the order existed and inside its allowed time.
 * Everything else is left for an admin. The code is shown only to the learner
 * who owns the order, so a transfer that carries it is that learner's.
 *
 * `ordersByCode` holds the orders whose codes appear in the note (the caller
 * looks them up); a code that is not in it is unknown.
 */
export function decideLink(
  transfer: IncomingTransfer,
  ordersByCode: ReadonlyMap<string, MatchableOrder>,
  options: { lateWindowMs: number },
): LinkDecision {
  if (!isPaymentTransfer(transfer)) return { action: "skip", reason: "not_a_payment" };

  const codes = extractOrderCodes(transfer.note);
  if (codes.length === 0) return { action: "skip", reason: "no_code" };

  const known = codes.filter((code) => ordersByCode.has(code));
  if (known.length === 0) return { action: "skip", reason: "unknown_code", code: codes[0] };
  if (known.length > 1) return { action: "skip", reason: "several_codes", code: known[0] };

  const code = known[0]!;
  const order = ordersByCode.get(code)!;
  if (order.status === "fulfilled") {
    return { action: "skip", reason: "order_already_paid", order, code };
  }
  if (!PAYABLE.includes(order.status))
    return { action: "skip", reason: "order_closed", order, code };

  const orderTime = Date.parse(order.createdAt);
  const transferTime = Date.parse(transfer.transactedAt);
  if (transferTime < orderTime - TRANSFER_BEFORE_ORDER_TOLERANCE_MS) {
    return { action: "skip", reason: "before_order", order, code };
  }
  if (transferTime - orderTime > options.lateWindowMs) {
    return { action: "skip", reason: "too_late", order, code };
  }
  if (!coversPrice(transfer, order)) return { action: "skip", reason: "underpaid", order, code };

  return { action: "link", order, method: "note_code" };
}

export interface Suggestion {
  order: MatchableOrder;
  /** "code": the note names this order; "amount_time": no code, but the amount and the timing fit. */
  basis: "code" | "amount_time";
  /** Set when basis is "code" but the transfer still was not linked by itself. */
  blockedBy?: SkipReason;
}

/**
 * What an admin sees next to an unlinked transfer: the order its note names (and
 * why that was not enough), or, with no usable code, the open orders whose price
 * the amount covers and that were created shortly before the transfer. Only a
 * hint; linking by hand is still a click.
 */
export function suggestOrders(
  transfer: IncomingTransfer,
  orders: readonly MatchableOrder[],
  options: { lateWindowMs: number },
): Suggestion[] {
  const byCode = new Map(orders.map((order) => [order.orderCode, order]));
  const decision = decideLink(transfer, byCode, options);
  if (decision.action === "link") return [{ order: decision.order, basis: "code" }];
  if (decision.order) {
    return [{ order: decision.order, basis: "code", blockedBy: decision.reason }];
  }
  if (!isPaymentTransfer(transfer)) return [];

  const transferTime = Date.parse(transfer.transactedAt);
  return orders
    .filter((order) => PAYABLE.includes(order.status))
    .filter((order) => coversPrice(transfer, order))
    .filter((order) => {
      const orderTime = Date.parse(order.createdAt);
      return (
        transferTime >= orderTime - TRANSFER_BEFORE_ORDER_TOLERANCE_MS &&
        transferTime - orderTime <= options.lateWindowMs
      );
    })
    .sort(
      (a, b) =>
        Math.abs(transferTime - Date.parse(a.createdAt)) -
        Math.abs(transferTime - Date.parse(b.createdAt)),
    )
    .slice(0, 3)
    .map((order) => ({ order, basis: "amount_time" as const }));
}
