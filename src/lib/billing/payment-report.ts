/**
 * "Problem with your payment?" reports. A report is stored as an ordinary
 * problem_reports row, so Admin > Reports, its status control and its reply
 * form all work unchanged. Two things make it a payment report: the
 * "payment:" prefix on page_path (which a regular report, whose path always
 * starts with "/", can never have), and the account and order details the
 * SERVER writes into the message, so the learner never has to find, copy or
 * type a reference and the person fixing it can start from the facts.
 */

import type { PaymentOrder } from "./payments/types";

export const PAYMENT_REPORT_CATEGORIES = [
  "paid_not_active",
  "payment_failed",
  "wrong_price",
  "other",
] as const;

export type PaymentReportCategory = (typeof PAYMENT_REPORT_CATEGORIES)[number];

export function isPaymentReportCategory(value: unknown): value is PaymentReportCategory {
  return (
    typeof value === "string" && (PAYMENT_REPORT_CATEGORIES as readonly string[]).includes(value)
  );
}

/** What the admin reads. Deliberately English and fixed: it is staff-facing, whatever language the learner used. */
export const PAYMENT_REPORT_CATEGORY_LABELS: Record<PaymentReportCategory, string> = {
  paid_not_active: "I paid but Premium isn't active",
  payment_failed: "The payment failed or was declined",
  wrong_price: "The price looks wrong",
  other: "Something else",
};

/** Room for the learner's own words once the account and order lines are added (problem_reports.message is capped at 1000). */
export const MAX_PAYMENT_REPORT_NOTE_LENGTH = 400;

const MAX_MESSAGE_LENGTH = 1000;
const MAX_PAGE_PATH_LENGTH = 500;
const MAX_REPORTED_ORDERS = 3;

const PATH_PREFIX = "payment:";

/** The page_path stored for a payment report: the page it was filed from, behind the marker prefix. */
export function paymentReportPagePath(pathname: string): string {
  return `${PATH_PREFIX}${pathname}`.slice(0, MAX_PAGE_PATH_LENGTH);
}

export function isPaymentReportPath(pagePath: string): boolean {
  return pagePath.startsWith(PATH_PREFIX);
}

/** The page the report was filed from, without the marker. */
export function paymentReportOriginalPath(pagePath: string): string {
  return isPaymentReportPath(pagePath) ? pagePath.slice(PATH_PREFIX.length) : pagePath;
}

export interface PaymentReportOrder {
  referenceId: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  premiumDays: number;
  usdCents: number;
  chargeAmount: number;
  chargeCurrency: string;
  tier: string;
  provider: string;
  providerEnv: string;
  failureReason: string | null;
}

/** The columns of an order a report quotes, under the names the report uses. */
export function toPaymentReportOrder(order: PaymentOrder): PaymentReportOrder {
  return {
    referenceId: order.reference_id,
    status: order.status,
    createdAt: order.created_at,
    paidAt: order.paid_at,
    premiumDays: order.premium_days,
    usdCents: order.price_usd_cents,
    chargeAmount: order.charge_amount,
    chargeCurrency: order.charge_currency,
    tier: order.pricing_tier,
    provider: order.provider,
    providerEnv: order.provider_env,
    failureReason: order.failure_reason,
  };
}

export interface PaymentReportAccess {
  isPremium: boolean;
  plan: string;
  status: string;
  expiresAt: string | null;
}

function utcMinute(iso: string): string {
  const time = Date.parse(iso);
  return Number.isNaN(time)
    ? iso
    : `${new Date(time).toISOString().slice(0, 16).replace("T", " ")}Z`;
}

function dollars(usdCents: number): string {
  const value = usdCents / 100;
  return Number.isInteger(value) ? `$${value}` : `$${value.toFixed(2)}`;
}

function orderLine(order: PaymentReportOrder, index: number): string {
  const parts = [
    order.referenceId,
    order.status,
    `${order.premiumDays}d ${dollars(order.usdCents)} = ${order.chargeAmount} ${order.chargeCurrency}`,
    `tier ${order.tier}`,
    `${order.provider}/${order.providerEnv}`,
    `created ${utcMinute(order.createdAt)}`,
  ];
  if (order.paidAt) parts.push(`paid ${utcMinute(order.paidAt)}`);
  if (order.failureReason) parts.push(`reason ${order.failureReason}`);
  return `${index + 1}. ${parts.join(" | ")}`;
}

function accountLine(access: PaymentReportAccess): string {
  const until = access.expiresAt ? `, until ${utcMinute(access.expiresAt).slice(0, 10)}` : "";
  return `Account: ${access.isPremium ? "Premium" : "Free"} (plan ${access.plan}, status ${access.status}${until})`;
}

/**
 * The full text stored as the report: the category, the learner's note, the
 * account state and their newest orders. Always fits problem_reports' limit:
 * older orders are dropped first, then the note is cut, so the facts about the
 * newest payment are the last thing to go.
 */
export function buildPaymentReportMessage(input: {
  category: PaymentReportCategory;
  note: string;
  access: PaymentReportAccess;
  orders: PaymentReportOrder[];
}): string {
  const heading = `Payment problem: ${PAYMENT_REPORT_CATEGORY_LABELS[input.category]}`;
  const note = input.note.trim();
  const account = accountLine(input.access);
  let orders = input.orders.slice(0, MAX_REPORTED_ORDERS);

  const compose = (noteText: string, shownOrders: PaymentReportOrder[]): string => {
    const orderBlock =
      shownOrders.length > 0
        ? `Latest orders:\n${shownOrders.map(orderLine).join("\n")}`
        : "Latest orders: none found for this account";
    return [heading, noteText, `${account}\n${orderBlock}`].filter(Boolean).join("\n\n");
  };

  let message = compose(note, orders);
  while (message.length > MAX_MESSAGE_LENGTH && orders.length > 1) {
    orders = orders.slice(0, -1);
    message = compose(note, orders);
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    const overflow = message.length - MAX_MESSAGE_LENGTH;
    const keep = Math.max(note.length - overflow - 1, 0);
    message = compose(keep > 0 ? `${note.slice(0, keep).trimEnd()}…` : "", orders);
  }
  return message.slice(0, MAX_MESSAGE_LENGTH);
}
