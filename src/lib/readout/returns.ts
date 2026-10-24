/**
 * The shared maths of the read-only readout scripts (scripts/sentence-bank-readout.ts,
 * scripts/today-readout.ts): who "came back", counted on calendar days. Pure, so it is tested.
 *
 * Days are UTC calendar days ("YYYY-MM-DD"). A learner's `activity_days` rows are their own local
 * days, so a sign-up late in the evening can be a day off; both arms of any comparison suffer the
 * same way, so read arms against each other in one run, not against the 24-hour figures of the
 * strategy report (9.1% next day, 18.5% any return in 1-7 days), which were counted on timestamps.
 */

export const DAY_MS = 86_400_000;

export function utcDay(value: string | number): string {
  return new Date(typeof value === "number" ? value : Date.parse(value)).toISOString().slice(0, 10);
}

export function addDays(day: string, days: number): string {
  return utcDay(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS);
}

export function pct(part: number, whole: number): string {
  return whole === 0 ? "-" : `${((100 * part) / whole).toFixed(1)}%`;
}

export function ratio(part: number, whole: number, digits = 2): string {
  return whole === 0 ? "-" : (part / whole).toFixed(digits);
}

export interface Signup {
  id: string;
  /** UTC day of the sign-up. */
  day: string;
}

export interface ReturnTally {
  signups: number;
  /** Sign-ups whose next day is over (the others cannot be judged yet and are left out of the share). */
  nextDayKnown: number;
  /** Active on the day after sign-up. */
  nextDay: number;
  weekKnown: number;
  /** Active on at least one of the 7 days after sign-up. */
  week: number;
  fortnightKnown: number;
  /** Active on 2 or more / 5 or more of the 14 days that start on the sign-up day. */
  active2: number;
  active5: number;
}

export function emptyTally(): ReturnTally {
  return {
    signups: 0,
    nextDayKnown: 0,
    nextDay: 0,
    weekKnown: 0,
    week: 0,
    fortnightKnown: 0,
    active2: 0,
    active5: 0,
  };
}

/**
 * `activeDays(id)` is the set of days the learner was active (any kind of practice). `today` is the
 * current UTC day, which is still running and so never counts as a day that has passed.
 */
export function tallyReturns(
  signups: readonly Signup[],
  activeDays: (id: string) => ReadonlySet<string> | undefined,
  today: string,
): ReturnTally {
  const tally = emptyTally();
  for (const { id, day } of signups) {
    const active = activeDays(id);
    tally.signups += 1;
    if (addDays(day, 1) < today) {
      tally.nextDayKnown += 1;
      if (active?.has(addDays(day, 1))) tally.nextDay += 1;
    }
    if (addDays(day, 7) < today) {
      tally.weekKnown += 1;
      for (let offset = 1; offset <= 7; offset++) {
        if (active?.has(addDays(day, offset))) {
          tally.week += 1;
          break;
        }
      }
    }
    if (addDays(day, 13) < today) {
      tally.fortnightKnown += 1;
      let count = 0;
      for (let offset = 0; offset <= 13; offset++) if (active?.has(addDays(day, offset))) count++;
      if (count >= 2) tally.active2 += 1;
      if (count >= 5) tally.active5 += 1;
    }
  }
  return tally;
}

/** The tally as the printed shares. */
export function tallyShares(tally: ReturnTally): Record<string, string> {
  return {
    signups: String(tally.signups),
    "back next day": `${pct(tally.nextDay, tally.nextDayKnown)} (of ${tally.nextDayKnown})`,
    "back in days 1-7": `${pct(tally.week, tally.weekKnown)} (of ${tally.weekKnown})`,
    "active 2+ of 14 days": `${pct(tally.active2, tally.fortnightKnown)} (of ${tally.fortnightKnown})`,
    "active 5+ of 14 days": `${pct(tally.active5, tally.fortnightKnown)} (of ${tally.fortnightKnown})`,
  };
}

/** Index rows of (user, day) into a set of days per user. */
export function activeDaysByUser(
  rows: readonly { user_id: string; day: string }[],
): Map<string, Set<string>> {
  const byUser = new Map<string, Set<string>>();
  for (const row of rows) {
    let days = byUser.get(row.user_id);
    if (!days) byUser.set(row.user_id, (days = new Set()));
    days.add(row.day);
  }
  return byUser;
}
