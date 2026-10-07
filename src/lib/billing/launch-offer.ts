/**
 * The launch offer: a number of bonus days added to every purchase until a
 * calendar date, set by an admin and off unless both parts are present and
 * valid. It is decided only on the server, when an order is created, and the
 * result is stored in the order's own `premium_days` snapshot, so fulfilment
 * needs no knowledge of it and an order's days never change afterwards.
 */

export const MAX_BONUS_DAYS = 90;

/** How far ahead an admin may set the end date. */
const MAX_DAYS_AHEAD = 366;

/** Someone who saw the offer a moment before it ended still gets it when their order is created within this long after. */
export const CHECKOUT_GRACE_MS = 10 * 60 * 1000;

const DAY_MS = 86_400_000;

export interface LaunchOffer {
  bonusDays: number;
  /** The last day the offer runs, as YYYY-MM-DD; it runs through the end of that day, UTC. */
  endsOn: string;
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** Reads the two stored columns; anything missing or out of range means there is no offer. */
export function parseLaunchOffer(
  row: { launch_offer_bonus_days?: unknown; launch_offer_ends_on?: unknown } | null | undefined,
): LaunchOffer | null {
  if (!row) return null;
  const days = row.launch_offer_bonus_days;
  const endsOn = row.launch_offer_ends_on;
  if (typeof days !== "number" || !Number.isInteger(days) || days < 1 || days > MAX_BONUS_DAYS) {
    return null;
  }
  if (!isIsoDate(endsOn)) return null;
  return { bonusDays: days, endsOn };
}

/** The first instant after the offer: it covers the whole of its last day. */
export function offerEndsAt(offer: LaunchOffer): Date {
  return new Date(Date.parse(`${offer.endsOn}T00:00:00.000Z`) + DAY_MS);
}

/** Whether the offer should be shown right now. */
export function isOfferActive(offer: LaunchOffer | null, now: Date): offer is LaunchOffer {
  return offer !== null && now.getTime() < offerEndsAt(offer).getTime();
}

/** The bonus days a new order gets: the offer's, while it runs and for a short grace after, otherwise none. */
export function bonusDaysForCheckout(offer: LaunchOffer | null, now: Date): number {
  if (!offer) return 0;
  return now.getTime() < offerEndsAt(offer).getTime() + CHECKOUT_GRACE_MS ? offer.bonusDays : 0;
}

export type LaunchOfferInput = { bonusDays: number; endsOn: string };

export type LaunchOfferValidation =
  | { ok: true; clear: true }
  | { ok: true; clear: false; offer: LaunchOffer }
  | { ok: false; error: string };

/** What an admin may save: zero bonus days clears the offer; otherwise a whole number of days and a date from today to a year ahead. */
export function validateLaunchOfferInput(
  input: LaunchOfferInput,
  now: Date,
): LaunchOfferValidation {
  const { bonusDays, endsOn } = input;
  if (!Number.isInteger(bonusDays) || bonusDays < 0 || bonusDays > MAX_BONUS_DAYS) {
    return { ok: false, error: `Bonus days must be a whole number from 0 to ${MAX_BONUS_DAYS}.` };
  }
  if (bonusDays === 0) return { ok: true, clear: true };

  if (!isIsoDate(endsOn)) return { ok: false, error: "Choose the last day of the offer." };
  const today = now.toISOString().slice(0, 10);
  if (endsOn < today) return { ok: false, error: "The last day can't be in the past." };
  const latest = new Date(Date.parse(`${today}T00:00:00.000Z`) + MAX_DAYS_AHEAD * DAY_MS)
    .toISOString()
    .slice(0, 10);
  if (endsOn > latest) return { ok: false, error: "The last day can be at most a year from now." };

  return { ok: true, clear: false, offer: { bonusDays, endsOn } };
}
