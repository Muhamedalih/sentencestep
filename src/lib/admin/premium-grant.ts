import { deriveAccessState } from "@/lib/billing/domain";
import type { SubscriptionRow } from "@/lib/billing/domain";

export const MIN_GRANT_DAYS = 1;
export const MAX_GRANT_DAYS = 730;

const DAY_MS = 24 * 60 * 60 * 1000;

export type GrantDaysResult = { ok: true; days: number } | { ok: false; error: string };

/** A grant is a whole number of days within a sane range, so a typo can't hand out a decade of Premium. */
export function parseGrantDays(value: unknown): GrantDaysResult {
  const days = typeof value === "number" ? value : Number.NaN;
  if (!Number.isInteger(days) || days < MIN_GRANT_DAYS || days > MAX_GRANT_DAYS) {
    return {
      ok: false,
      error: `Enter a whole number of days between ${MIN_GRANT_DAYS} and ${MAX_GRANT_DAYS}.`,
    };
  }
  return { ok: true, days };
}

export type PremiumGrantPlan =
  /** Premium with no end date: there is nothing to extend, and overwriting it would shorten it. */
  | { kind: "unlimited" }
  | {
      kind: "grant";
      start: string;
      end: string;
      /** True when the days were added on top of Premium the account still had. */
      extendedExisting: boolean;
    };

/**
 * The new Premium period for an admin grant. Mirrors fulfill_payment_order:
 * days stack on top of Premium the account still has, otherwise they start now
 * (so an expired, cancelled or never-subscribed account all behave the same).
 * The "still has Premium" question is deriveAccessState's, the same one every
 * lesson lock asks.
 */
export function planPremiumGrant(
  existing: SubscriptionRow | null,
  days: number,
  now: Date,
): PremiumGrantPlan {
  const access = deriveAccessState(existing, now);

  if (existing && access.isPremium) {
    if (!existing.currentPeriodEnd) return { kind: "unlimited" };
    return {
      kind: "grant",
      start: existing.currentPeriodStart ?? now.toISOString(),
      end: new Date(Date.parse(existing.currentPeriodEnd) + days * DAY_MS).toISOString(),
      extendedExisting: true,
    };
  }

  return {
    kind: "grant",
    start: now.toISOString(),
    end: new Date(now.getTime() + days * DAY_MS).toISOString(),
    extendedExisting: false,
  };
}
