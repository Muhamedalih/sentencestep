import { linkNeverCreated } from "./funnel";
import type { FunnelOrder } from "./funnel";

/**
 * The pure parts of the payments readout (scripts/payments-funnel-readout.ts): where payment orders
 * ended up by country and by provider, and how many learners went from opening the plans page to
 * pressing Pay to paying. Nothing here reads or writes the database, and nothing keeps an account id
 * in its result: only counts leave this module.
 *
 * A country belongs to an ORDER (the pricing country of the request that opened it). The plans-page
 * view and the Pay click carry no country, so the learner funnel can be split by method and tier but
 * not by country.
 */

/** The columns of an order the readout reads. */
export type ReadoutOrder = FunnelOrder & {
  user_id: string;
  provider: string;
  price_usd_cents: number;
};

export type Outcome = "paid" | "needs_review" | "no_link" | "waiting" | "left";

/**
 * How one order ended: paid, paid but held for a person to check, no payment link was ever made,
 * still inside the link's window, or closed without a payment (expired, cancelled, rejected).
 */
export function outcomeOf(order: Pick<FunnelOrder, "status" | "provider_payment_id">): Outcome {
  if (order.status === "fulfilled") return "paid";
  if (order.status === "needs_review") return "needs_review";
  if (linkNeverCreated(order)) return "no_link";
  if (order.status === "created" || order.status === "pending") return "waiting";
  return "left";
}

export interface OrderCounts {
  orders: number;
  noLink: number;
  waiting: number;
  left: number;
  needsReview: number;
  paid: number;
  /** The list price of the paid orders, in US cents. */
  paidUsdCents: number;
}

export const emptyCounts = (): OrderCounts => ({
  orders: 0,
  noLink: 0,
  waiting: 0,
  left: 0,
  needsReview: 0,
  paid: 0,
  paidUsdCents: 0,
});

export function addOrder(counts: OrderCounts, order: ReadoutOrder): void {
  counts.orders += 1;
  switch (outcomeOf(order)) {
    case "paid":
      counts.paid += 1;
      counts.paidUsdCents += order.price_usd_cents;
      break;
    case "needs_review":
      counts.needsReview += 1;
      break;
    case "no_link":
      counts.noLink += 1;
      break;
    case "waiting":
      counts.waiting += 1;
      break;
    default:
      counts.left += 1;
  }
}

/** Orders grouped under whatever key `keyOf` gives, busiest group first (ties by key). */
export function tallyOrders(
  orders: readonly ReadoutOrder[],
  keyOf: (order: ReadoutOrder) => string,
): Array<{ key: string } & OrderCounts> {
  const byKey = new Map<string, OrderCounts>();
  for (const order of orders) {
    const key = keyOf(order);
    let counts = byKey.get(key);
    if (!counts) byKey.set(key, (counts = emptyCounts()));
    addOrder(counts, order);
  }
  return [...byKey]
    .map(([key, counts]) => ({ key, ...counts }))
    .sort((a, b) => b.orders - a.orders || a.key.localeCompare(b.key));
}

/** The totals of several groups, e.g. a subtotal row. */
export function sumCounts(groups: readonly OrderCounts[]): OrderCounts {
  const total = emptyCounts();
  for (const group of groups) {
    total.orders += group.orders;
    total.noLink += group.noLink;
    total.waiting += group.waiting;
    total.left += group.left;
    total.needsReview += group.needsReview;
    total.paid += group.paid;
    total.paidUsdCents += group.paidUsdCents;
  }
  return total;
}

function share(part: number, whole: number): string {
  return whole === 0 ? "-" : `${((100 * part) / whole).toFixed(1)}%`;
}

/** One group as the printed row: counts, and the paid share of all orders and of the orders no longer waiting. */
export function countsRow(counts: OrderCounts): Record<string, string | number> {
  const settled = counts.orders - counts.waiting;
  return {
    orders: counts.orders,
    "no link": counts.noLink,
    waiting: counts.waiting,
    left: counts.left,
    "to review": counts.needsReview,
    paid: counts.paid,
    "paid % of orders": share(counts.paid, counts.orders),
    "paid % of settled": share(counts.paid, settled),
    "paid USD": Math.round(counts.paidUsdCents / 100),
  };
}

export type Region =
  "iraq" | "gulf_jordan" | "egypt" | "maghreb" | "levant" | "sudan_yemen" | "abroad" | "unknown";

const GULF_JORDAN = new Set(["sa", "ae", "kw", "qa", "bh", "om", "jo"]);
const MAGHREB = new Set(["ma", "dz", "tn", "ly", "mr"]);
const LEVANT = new Set(["sy", "lb", "ps"]);
const SUDAN_YEMEN = new Set(["sd", "ye"]);

/** The groups the payment reports of 2026-10 used: Iraq, Gulf+Jordan, the weak group (Egypt, Maghreb, Levant, Sudan, Yemen) and everyone abroad. */
export function regionOf(country: string | null): Region {
  const code = country?.trim().toLowerCase();
  if (!code) return "unknown";
  if (code === "iq") return "iraq";
  if (GULF_JORDAN.has(code)) return "gulf_jordan";
  if (code === "eg") return "egypt";
  if (MAGHREB.has(code)) return "maghreb";
  if (LEVANT.has(code)) return "levant";
  if (SUDAN_YEMEN.has(code)) return "sudan_yemen";
  return "abroad";
}

/** The regions whose orders were the problem in the October report (4 paid of 148): the baseline for any change aimed at them. */
export const WEAK_REGIONS: readonly Region[] = ["egypt", "maghreb", "levant", "sudan_yemen"];

export const REGION_LABELS: Record<Region, string> = {
  iraq: "Iraq",
  gulf_jordan: "Gulf + Jordan",
  egypt: "Egypt",
  maghreb: "Maghreb",
  levant: "Levant (SY/LB/PS)",
  sudan_yemen: "Sudan + Yemen",
  abroad: "Abroad (other)",
  unknown: "Unknown country",
};

export function isWeakRegion(region: Region): boolean {
  return WEAK_REGIONS.includes(region);
}

/**
 * Countries with at least `minOrders` orders keep their own row; the rest are folded into one
 * "others" row so a country with two orders is not read as a rate.
 */
export function foldSmallCountries(
  rows: ReadonlyArray<{ key: string } & OrderCounts>,
  minOrders: number,
): Array<{ key: string } & OrderCounts> {
  const kept = rows.filter((row) => row.orders >= minOrders);
  const small = rows.filter((row) => row.orders < minOrders);
  if (small.length === 0) return kept;
  return [...kept, { key: `others (${small.length} countries)`, ...sumCounts(small) }];
}

/** A view or click of the plans page; `user_id` is null for a guest. */
export interface UpgradeEvent {
  user_id: string | null;
  event_properties?: unknown;
}

export type PayMethod = "card" | "binance";

function propertyOf(event: UpgradeEvent, name: string): unknown {
  const properties = event.event_properties;
  return properties && typeof properties === "object"
    ? (properties as Record<string, unknown>)[name]
    : undefined;
}

/** Old clicks (before Binance Pay) carry no method and were the card button. */
export function methodOfClick(event: UpgradeEvent): PayMethod {
  return propertyOf(event, "method") === "binance" ? "binance" : "card";
}

function tierOfClick(event: UpgradeEvent): string {
  const tier = propertyOf(event, "tier");
  return typeof tier === "string" && tier !== "" ? tier : "?";
}

/** The provider each pay button opens an order with: the card button is Wayl (anything that is not Binance Pay). */
function matchesMethod(provider: string, method: PayMethod): boolean {
  return method === "binance" ? provider === "binance_pay" : provider !== "binance_pay";
}

export interface UpgradeStep {
  /** Distinct learners at this step. */
  users: number;
  /** Of them, the learners who also did every earlier step (the chain from "opened the plans page"). */
  inChain: number;
}

export interface UpgradeFunnel {
  /** Plans-page views by guests (no account, so they cannot pay). Rows, not people. */
  guestViews: number;
  viewed: UpgradeStep;
  clicked: UpgradeStep;
  ordered: UpgradeStep;
  paid: UpgradeStep;
  /** Learners who pressed the Pay button of each method, how many of them then had an order with the matching provider, and how many of those paid. */
  byMethod: Record<PayMethod, { clicked: number; ordered: number; paid: number }>;
  /** Learners who pressed Pay, by the price tier the server gave them. */
  clickedByTier: Array<{ tier: string; users: number }>;
}

/**
 * Learners from "opened the plans page" to "paid", by distinct account. Every step is counted twice:
 * all learners who did it in the period, and those who also did all the steps before it (a learner
 * who opened the page before the period began, or paid by another route, is outside the chain). The
 * order and click lists must already be limited to the period and to real learners.
 */
export function upgradeFunnel(input: {
  views: readonly UpgradeEvent[];
  clicks: readonly UpgradeEvent[];
  orders: readonly ReadoutOrder[];
}): UpgradeFunnel {
  const viewers = new Set<string>();
  let guestViews = 0;
  for (const view of input.views) {
    if (view.user_id) viewers.add(view.user_id);
    else guestViews += 1;
  }
  const clickers = new Set<string>();
  const clickersByMethod: Record<PayMethod, Set<string>> = {
    card: new Set(),
    binance: new Set(),
  };
  const clickersByTier = new Map<string, Set<string>>();
  for (const click of input.clicks) {
    if (!click.user_id) continue;
    clickers.add(click.user_id);
    clickersByMethod[methodOfClick(click)].add(click.user_id);
    const tier = tierOfClick(click);
    let users = clickersByTier.get(tier);
    if (!users) clickersByTier.set(tier, (users = new Set()));
    users.add(click.user_id);
  }
  const orderers = new Set(input.orders.map((order) => order.user_id));
  const payers = new Set(
    input.orders.filter((order) => outcomeOf(order) === "paid").map((order) => order.user_id),
  );

  const within = (users: ReadonlySet<string>, ...before: ReadonlySet<string>[]) =>
    [...users].filter((id) => before.every((set) => set.has(id))).length;
  const step = (users: ReadonlySet<string>, ...before: ReadonlySet<string>[]): UpgradeStep => ({
    users: users.size,
    inChain: within(users, ...before),
  });

  const byMethod = {} as UpgradeFunnel["byMethod"];
  for (const method of ["card", "binance"] as const) {
    const withOrder = new Set<string>();
    const withPaid = new Set<string>();
    for (const order of input.orders) {
      if (!matchesMethod(order.provider, method)) continue;
      withOrder.add(order.user_id);
      if (outcomeOf(order) === "paid") withPaid.add(order.user_id);
    }
    byMethod[method] = {
      clicked: clickersByMethod[method].size,
      ordered: within(clickersByMethod[method], withOrder),
      paid: within(clickersByMethod[method], withPaid),
    };
  }

  return {
    guestViews,
    viewed: { users: viewers.size, inChain: viewers.size },
    clicked: step(clickers, viewers),
    ordered: step(orderers, viewers, clickers),
    paid: step(payers, viewers, clickers, orderers),
    byMethod,
    clickedByTier: [...clickersByTier]
      .map(([tier, users]) => ({ tier, users: users.size }))
      .sort((a, b) => b.users - a.users || a.tier.localeCompare(b.tier)),
  };
}

/** The learner funnel as printed rows: each step, its chain count and its share of the step before. */
export function upgradeFunnelRows(funnel: UpgradeFunnel): Array<Record<string, string | number>> {
  const steps: Array<[string, UpgradeStep]> = [
    ["opened the plans page", funnel.viewed],
    ["pressed Pay", funnel.clicked],
    ["an order was opened", funnel.ordered],
    ["paid", funnel.paid],
  ];
  return steps.map(([name, step], index) => ({
    step: name,
    "learners (period)": step.users,
    "of the chain": step.inChain,
    "of the step before": index === 0 ? "-" : share(step.inChain, steps[index - 1]![1].inChain),
    "of those who opened the page": index === 0 ? "-" : share(step.inChain, funnel.viewed.users),
  }));
}
