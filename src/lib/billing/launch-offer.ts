/**
 * The launch offer: a number of bonus days added to a purchase until a
 * calendar date, set by an admin and off unless both parts are present and
 * valid. The days can differ by plan: one number for the one-month plan (and
 * for any plan that has no number of its own) and, optionally, one each for the
 * three- and six-month plans. It is decided only on the server, when an order is
 * created, and the result is stored in the order's own `premium_days` snapshot,
 * so fulfilment needs no knowledge of it and an order's days never change afterwards.
 */

import type { PlanId } from "./plans";

export const MAX_BONUS_DAYS = 90;

/** How far ahead an admin may set the end date. */
const MAX_DAYS_AHEAD = 366;

/** Someone who saw the offer a moment before it ended still gets it when their order is created within this long after. */
export const CHECKOUT_GRACE_MS = 10 * 60 * 1000;

const DAY_MS = 86_400_000;

/** The plans that can carry a number of their own; the one-month plan uses `bonusDays`. */
type LongerPlanId = Exclude<PlanId, "1m">;

export interface LaunchOffer {
  /** Bonus days on the one-month plan, and on any longer plan that has no number of its own. */
  bonusDays: number;
  /** Bonus days for a longer plan whose number differs (0 means none). Absent when every plan gets `bonusDays`. */
  planBonusDays?: Partial<Record<LongerPlanId, number>>;
  /** The last day the offer runs, as YYYY-MM-DD; it runs through the end of that day, UTC. */
  endsOn: string;
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** A longer plan's own number as stored: absent is fine, a whole number from 0 to the maximum is kept, anything else spoils the offer. */
function readOwnDays(value: unknown): { ok: true; days?: number } | { ok: false } {
  if (value === null || value === undefined) return { ok: true };
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_BONUS_DAYS
  ) {
    return { ok: true, days: value };
  }
  return { ok: false };
}

/** Reads the stored columns; anything missing or out of range means there is no offer. */
export function parseLaunchOffer(
  row:
    | {
        launch_offer_bonus_days?: unknown;
        launch_offer_ends_on?: unknown;
        launch_offer_bonus_days_3m?: unknown;
        launch_offer_bonus_days_6m?: unknown;
      }
    | null
    | undefined,
): LaunchOffer | null {
  if (!row) return null;
  const days = row.launch_offer_bonus_days;
  const endsOn = row.launch_offer_ends_on;
  if (typeof days !== "number" || !Number.isInteger(days) || days < 1 || days > MAX_BONUS_DAYS) {
    return null;
  }
  if (!isIsoDate(endsOn)) return null;

  const threeMonths = readOwnDays(row.launch_offer_bonus_days_3m);
  const sixMonths = readOwnDays(row.launch_offer_bonus_days_6m);
  if (!threeMonths.ok || !sixMonths.ok) return null;
  const planBonusDays: Partial<Record<LongerPlanId, number>> = {};
  if (threeMonths.days !== undefined) planBonusDays["3m"] = threeMonths.days;
  if (sixMonths.days !== undefined) planBonusDays["6m"] = sixMonths.days;

  return Object.keys(planBonusDays).length > 0
    ? { bonusDays: days, planBonusDays, endsOn }
    : { bonusDays: days, endsOn };
}

/** The bonus days the offer gives on one plan. */
export function offerBonusDaysForPlan(offer: LaunchOffer, plan: PlanId): number {
  if (plan === "1m") return offer.bonusDays;
  return offer.planBonusDays?.[plan] ?? offer.bonusDays;
}

/** The bonus days the offer gives on every plan. */
export function offerBonusDaysByPlan(offer: LaunchOffer): Record<PlanId, number> {
  return {
    "1m": offerBonusDaysForPlan(offer, "1m"),
    "3m": offerBonusDaysForPlan(offer, "3m"),
    "6m": offerBonusDaysForPlan(offer, "6m"),
  };
}

/** The one number every plan gets, or null when the plans differ (so a single "N days free" line would be untrue). */
export function sharedBonusDays(offer: LaunchOffer): number | null {
  const byPlan = offerBonusDaysByPlan(offer);
  return byPlan["3m"] === byPlan["1m"] && byPlan["6m"] === byPlan["1m"] ? byPlan["1m"] : null;
}

/** The first instant after the offer: it covers the whole of its last day. */
export function offerEndsAt(offer: LaunchOffer): Date {
  return new Date(Date.parse(`${offer.endsOn}T00:00:00.000Z`) + DAY_MS);
}

/** Whether the offer should be shown right now. */
export function isOfferActive(offer: LaunchOffer | null, now: Date): offer is LaunchOffer {
  return offer !== null && now.getTime() < offerEndsAt(offer).getTime();
}

/** The bonus days a new order for this plan gets: the offer's, while it runs and for a short grace after, otherwise none. */
export function bonusDaysForCheckout(offer: LaunchOffer | null, now: Date, plan: PlanId): number {
  if (!offer) return 0;
  return now.getTime() < offerEndsAt(offer).getTime() + CHECKOUT_GRACE_MS
    ? offerBonusDaysForPlan(offer, plan)
    : 0;
}

export type LaunchOfferInput = {
  bonusDays: number;
  /** Blank (null or absent) means the same as the one-month plan; 0 means no bonus on that plan. */
  bonusDays3m?: number | null;
  bonusDays6m?: number | null;
  endsOn: string;
};

export type LaunchOfferValidation =
  | { ok: true; clear: true }
  | { ok: true; clear: false; offer: LaunchOffer }
  | { ok: false; error: string };

/** What an admin may save: zero bonus days on the one-month plan clears the offer; otherwise whole numbers of days and a date from today to a year ahead. */
export function validateLaunchOfferInput(
  input: LaunchOfferInput,
  now: Date,
): LaunchOfferValidation {
  const { bonusDays, endsOn } = input;
  if (!Number.isInteger(bonusDays) || bonusDays < 0 || bonusDays > MAX_BONUS_DAYS) {
    return { ok: false, error: `Bonus days must be a whole number from 0 to ${MAX_BONUS_DAYS}.` };
  }
  if (bonusDays === 0) return { ok: true, clear: true };

  const planBonusDays: Partial<Record<LongerPlanId, number>> = {};
  for (const [plan, label, value] of [
    ["3m", "three-month", input.bonusDays3m],
    ["6m", "six-month", input.bonusDays6m],
  ] as const) {
    if (value === null || value === undefined) continue;
    if (!Number.isInteger(value) || value < 0 || value > MAX_BONUS_DAYS) {
      return {
        ok: false,
        error: `Bonus days for the ${label} plan must be a whole number from 0 to ${MAX_BONUS_DAYS}, or left empty.`,
      };
    }
    planBonusDays[plan] = value;
  }

  if (!isIsoDate(endsOn)) return { ok: false, error: "Choose the last day of the offer." };
  const today = now.toISOString().slice(0, 10);
  if (endsOn < today) return { ok: false, error: "The last day can't be in the past." };
  const latest = new Date(Date.parse(`${today}T00:00:00.000Z`) + MAX_DAYS_AHEAD * DAY_MS)
    .toISOString()
    .slice(0, 10);
  if (endsOn > latest) return { ok: false, error: "The last day can be at most a year from now." };

  return {
    ok: true,
    clear: false,
    offer:
      Object.keys(planBonusDays).length > 0
        ? { bonusDays, planBonusDays, endsOn }
        : { bonusDays, endsOn },
  };
}
