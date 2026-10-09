import type { PaymentOrder } from "./types";

/** The few columns the funnel reads, so a test order needs nothing else. */
export type FunnelOrder = Pick<
  PaymentOrder,
  "reference_id" | "pricing_tier" | "pricing_country" | "status" | "provider_payment_id"
>;

export type OrderStage =
  "paid" | "needs_review" | "link_failed" | "waiting" | "left_at_payment" | "left_before_form";

/**
 * What Wayl's webhooks have said about one order. Wayl sends its first one when
 * the buyer submits their details on the payment page, so having any webhook at
 * all means the buyer got that far.
 */
export interface WaylSignal {
  method: string | null;
  paymentStatus: string | null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

/**
 * One signal per order reference, from stored webhook payloads given newest
 * first: the newest event decides the status, and any event can supply the
 * method. Personal data is already stripped from these payloads (see
 * withoutPersonalData in providers/wayl.ts), so only these fields are read.
 */
export function signalsByReference(
  events: ReadonlyArray<{ payload: unknown }>,
): Map<string, WaylSignal> {
  const signals = new Map<string, WaylSignal>();
  for (const { payload } of events) {
    if (payload === null || typeof payload !== "object") continue;
    const fields = payload as Record<string, unknown>;
    const reference = text(fields.referenceId);
    if (!reference) continue;
    const known = signals.get(reference);
    signals.set(reference, {
      method: known?.method ?? text(fields.paymentMethod),
      paymentStatus: known?.paymentStatus ?? text(fields.paymentStatus),
    });
  }
  return signals;
}

/** A paid order must have reached the form even when its webhook is older than the events that were read. */
export function reachedForm(
  order: Pick<FunnelOrder, "reference_id" | "status">,
  signals: ReadonlyMap<string, WaylSignal>,
): boolean {
  return signals.has(order.reference_id) || order.status === "fulfilled";
}

/** The provider never produced a link for this order, so nobody was ever sent to pay. */
export function linkNeverCreated(order: Pick<FunnelOrder, "status" | "provider_payment_id">) {
  return order.status === "failed" && !order.provider_payment_id;
}

export function orderStage(order: FunnelOrder, reached: boolean): OrderStage {
  if (order.status === "fulfilled") return "paid";
  if (order.status === "needs_review") return "needs_review";
  if (linkNeverCreated(order)) return "link_failed";
  if (order.status === "created" || order.status === "pending") return "waiting";
  return reached ? "left_at_payment" : "left_before_form";
}

export interface FunnelCounts {
  /** Orders whose link was created: the people who pressed Pay and were sent to the payment page. */
  links: number;
  reachedForm: number;
  paid: number;
  /** Still inside the link's window, so not a failure yet. */
  waiting: number;
  /** Closed without a payment (expired, cancelled, rejected). */
  left: number;
  needsReview: number;
  /** Orders whose link could not be created: not counted in `links`. */
  linkFailed: number;
}

export interface FunnelRow extends FunnelCounts {
  tier: string;
  country: string | null;
}

export interface Funnel {
  rows: FunnelRow[];
  totals: FunnelCounts;
}

const emptyCounts = (): FunnelCounts => ({
  links: 0,
  reachedForm: 0,
  paid: 0,
  waiting: 0,
  left: 0,
  needsReview: 0,
  linkFailed: 0,
});

function count(counts: FunnelCounts, stage: OrderStage, reached: boolean): void {
  if (stage === "link_failed") {
    counts.linkFailed += 1;
    return;
  }
  counts.links += 1;
  if (reached) counts.reachedForm += 1;
  if (stage === "paid") counts.paid += 1;
  else if (stage === "waiting") counts.waiting += 1;
  else if (stage === "needs_review") counts.needsReview += 1;
  else counts.left += 1;
}

/** Orders grouped by pricing tier and country, busiest first, plus the totals. */
export function summarizeFunnel(
  orders: ReadonlyArray<FunnelOrder>,
  signals: ReadonlyMap<string, WaylSignal>,
): Funnel {
  const byGroup = new Map<string, FunnelRow>();
  const totals = emptyCounts();

  for (const order of orders) {
    const reached = reachedForm(order, signals);
    const stage = orderStage(order, reached);
    const key = `${order.pricing_tier}|${order.pricing_country ?? ""}`;
    let row = byGroup.get(key);
    if (!row) {
      row = { tier: order.pricing_tier, country: order.pricing_country, ...emptyCounts() };
      byGroup.set(key, row);
    }
    count(row, stage, reached);
    count(totals, stage, reached);
  }

  const rows = [...byGroup.values()].sort(
    (a, b) =>
      b.links - a.links ||
      a.tier.localeCompare(b.tier) ||
      (a.country ?? "").localeCompare(b.country ?? ""),
  );
  return { rows, totals };
}
