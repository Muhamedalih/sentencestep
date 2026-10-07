import {
  BEST_VALUE_PLAN_ID,
  PLANS,
  RECOMMENDED_PLAN_ID,
  perMonthCents,
  planPriceCents,
  savingsPercent,
} from "./plans";
import type { PlanId, PricingTier } from "./plans";
import { formatUsd, formatUsdExact, formatUsdPerDay } from "./pricing";

/**
 * What /upgrade shows for one plan: every figure already formatted, in USD
 * only, on the server. The client card receives these strings and nothing
 * else, so no price table, exchange rate or provider detail is shipped to it.
 */
export interface PlanView {
  id: PlanId;
  days: number;
  /** The whole price, e.g. "$4". */
  price: string;
  /** The price per 30 days, e.g. "$1.33". */
  perMonth: string;
  /** The price per day, e.g. "$0.04". */
  perDay: string;
  /** Whole percent cheaper per day than the one-month plan; null for the one-month plan. */
  savingsPercent: number | null;
  badge: "recommended" | "best-value" | null;
  preselected: boolean;
}

export function buildPlanViews(tier: PricingTier): PlanView[] {
  return PLANS.map((plan) => {
    const cents = planPriceCents(tier, plan.id);
    return {
      id: plan.id,
      days: plan.days,
      price: formatUsd(cents),
      perMonth: formatUsdExact(perMonthCents(tier, plan.id)),
      perDay: formatUsdPerDay(cents, plan.days),
      savingsPercent: savingsPercent(tier, plan.id),
      badge:
        plan.id === RECOMMENDED_PLAN_ID
          ? "recommended"
          : plan.id === BEST_VALUE_PLAN_ID
            ? "best-value"
            : null,
      preselected: plan.id === RECOMMENDED_PLAN_ID,
    };
  });
}

/** The lowest per-month price across the plans, e.g. "$1.17": the "from" figure shown beside locked content. */
export function cheapestPerMonth(tier: PricingTier): string {
  return formatUsdExact(Math.min(...PLANS.map((plan) => perMonthCents(tier, plan.id))));
}
