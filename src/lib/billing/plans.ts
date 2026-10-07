/**
 * The purchasable plans. A plan is a whole number of days (never calendar
 * months), so stacking onto days a learner already has is exact. Prices are
 * defined in USD only, per pricing tier; nothing here knows about a payment
 * provider or its currency (see pricing.ts for the fixed-rate conversion).
 *
 * Kept free of any provider or exchange-rate detail so a client component can
 * import its types without shipping them.
 */

export type PricingTier = "A" | "B";

export const PLAN_IDS = ["1m", "3m", "6m"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export interface Plan {
  id: PlanId;
  days: number;
  priceUsdCents: Readonly<Record<PricingTier, number>>;
}

export const PLANS: readonly Plan[] = [
  { id: "1m", days: 30, priceUsdCents: { A: 200, B: 300 } },
  { id: "3m", days: 90, priceUsdCents: { A: 400, B: 600 } },
  { id: "6m", days: 180, priceUsdCents: { A: 700, B: 1000 } },
];

/** The plan every saving is measured against. */
export const BASE_PLAN_ID: PlanId = "1m";
/** Pre-selected and badged "Recommended" on /upgrade. */
export const RECOMMENDED_PLAN_ID: PlanId = "3m";
/** Badged "Best value" on /upgrade. */
export const BEST_VALUE_PLAN_ID: PlanId = "6m";

/** True only for one of the known plan ids; the form value is the only thing a client ever sends. */
export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && (PLAN_IDS as readonly string[]).includes(value);
}

export function getPlan(id: PlanId): Plan {
  const plan = PLANS.find((candidate) => candidate.id === id);
  if (!plan) throw new Error(`Unknown plan ${id}.`);
  return plan;
}

export function planPriceCents(tier: PricingTier, id: PlanId): number {
  return getPlan(id).priceUsdCents[tier];
}

/** The plan's price spread over a 30-day month, to the nearest cent. */
export function perMonthCents(tier: PricingTier, id: PlanId): number {
  const plan = getPlan(id);
  return Math.round((plan.priceUsdCents[tier] * 30) / plan.days);
}

/** How much cheaper per day the plan is than the base plan, in whole percent; null for the base plan itself. */
export function savingsPercent(tier: PricingTier, id: PlanId): number | null {
  const base = getPlan(BASE_PLAN_ID);
  const plan = getPlan(id);
  if (plan.id === base.id) return null;
  const basePerDay = base.priceUsdCents[tier] / base.days;
  const planPerDay = plan.priceUsdCents[tier] / plan.days;
  const percent = Math.round((1 - planPerDay / basePerDay) * 100);
  return percent > 0 ? percent : null;
}
