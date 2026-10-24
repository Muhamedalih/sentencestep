import { DAY_MS, addDays, pct, utcDay } from "@/lib/readout/returns";

/**
 * Pure part of the reminder readout (scripts/nudge-readout.ts): did the learners who were SENT a
 * reminder email come back, or open the plans, more than the learners who were deliberately NOT sent
 * one (the held-out share, see processRecipients in run.ts)? The held-out learners are picked by a
 * hash of their account, so the two groups differ only by chance — as long as both are limited to
 * accounts the email could actually have reached (the sent group is by definition; the held-out one
 * is not, so the script filters it with `eligible`).
 */

export interface NudgeRow {
  user_id: string;
  type: string;
  email_status: string;
  payload: unknown;
  created_at: string;
}

export type NudgeArm = "sent" | "held out";

/** Which arm a stored reminder belongs to; null for one that was queued and never sent. */
export function nudgeArm(row: NudgeRow): NudgeArm | null {
  const held =
    typeof row.payload === "object" &&
    row.payload !== null &&
    (row.payload as { holdout?: unknown }).holdout === true;
  if (held) return "held out";
  return row.email_status === "sent" ? "sent" : null;
}

export interface NudgeTally {
  n: number;
  /** Reminders whose whole window is over (the others cannot be judged yet). */
  known: number;
  /** Active on at least one day of the window. */
  returned: number;
  /** Opened the plans page within the window. */
  upgraded: number;
}

export interface NudgeInputs {
  rows: readonly NudgeRow[];
  /** Days after the reminder that count (the reminder's own day does not). */
  windowDays: number;
  /** The current UTC day and moment. */
  today: string;
  nowMs: number;
  /** The learner's active days (any practice). */
  activeDays: (userId: string) => ReadonlySet<string> | undefined;
  /** Times the learner opened the plans page. */
  upgradeViews: (userId: string) => readonly number[] | undefined;
  /** Whether the learner's account could have been emailed (limits the held-out arm to comparable learners). */
  eligible: (userId: string) => boolean;
}

/** The tally per reminder type and arm. */
export function tallyNudges(input: NudgeInputs): Map<string, Record<NudgeArm, NudgeTally>> {
  const result = new Map<string, Record<NudgeArm, NudgeTally>>();
  for (const row of input.rows) {
    const arm = nudgeArm(row);
    if (!arm || !input.eligible(row.user_id)) continue;
    let byArm = result.get(row.type);
    if (!byArm) {
      byArm = {
        sent: { n: 0, known: 0, returned: 0, upgraded: 0 },
        "held out": { n: 0, known: 0, returned: 0, upgraded: 0 },
      };
      result.set(row.type, byArm);
    }
    const tally = byArm[arm];
    tally.n += 1;
    const at = Date.parse(row.created_at);
    const day = utcDay(at);
    if (addDays(day, input.windowDays) >= input.today) continue;
    tally.known += 1;
    const active = input.activeDays(row.user_id);
    for (let offset = 1; offset <= input.windowDays; offset++) {
      if (active?.has(addDays(day, offset))) {
        tally.returned += 1;
        break;
      }
    }
    const until = at + input.windowDays * DAY_MS;
    if (input.upgradeViews(row.user_id)?.some((time) => time > at && time <= until)) {
      tally.upgraded += 1;
    }
  }
  return result;
}

/** The tally as printed shares. */
export function nudgeShares(tally: NudgeTally): Record<string, string> {
  return {
    reminders: String(tally.n),
    "window over": String(tally.known),
    "came back": `${pct(tally.returned, tally.known)} (${tally.returned})`,
    "opened plans": `${pct(tally.upgraded, tally.known)} (${tally.upgraded})`,
  };
}
