/**
 * Read-only readout of the reminder emails (the day-one "your next lesson is ready", the inactive
 * learner reminder, the abandoned checkout): did the learners who were SENT one come back, or open
 * the plans page, more than the learners who were deliberately NOT sent one (the held-out share,
 * picked by a hash of the account, see processRecipients)?
 *
 * Reads the live database through the service role (nothing is written, no address is read or
 * printed). The held-out group includes accounts the email could never have reached (the sent group
 * cannot), so each held-out account is looked up once for its sign-in provider and kept only when it
 * could have been emailed — otherwise the two groups would not be comparable.
 *
 * Returns are counted on calendar days from `activity_days`; a reminder is only judged once its
 * whole window is over, so the first days of sending cannot be read yet. Small numbers: read the
 * counts, not the shares, and say "differs / does not differ", never why.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/nudge-readout.ts
 * Optional: --since <ISO> (default 14 days ago), --window 3 (days after the reminder that count),
 * --allow-password (when the server sends to password accounts too).
 */

import { nudgeShares, tallyNudges } from "../src/lib/email/nudges/readout";
import type { NudgeRow } from "../src/lib/email/nudges/readout";
import { canEmailAccount } from "../src/lib/email/nudges/select";
import { activeDaysByUser, DAY_MS, utcDay } from "../src/lib/readout/returns";
import { all, arg, readAuthUser } from "./_readout-rest";

const NOW = Date.now();
const TYPES = ["DAY_ONE_NUDGE", "INACTIVE_LEARNER", "CHECKOUT_ABANDONED"];

async function main() {
  const sinceMs = arg("--since") ? Date.parse(arg("--since")!) : NOW - 14 * DAY_MS;
  if (Number.isNaN(sinceMs)) {
    console.error("--since must be an ISO time, e.g. --since 2026-10-21T00:00:00Z");
    process.exit(1);
  }
  const windowDays = Number(arg("--window") ?? 3);
  const allowPassword = process.argv.includes("--allow-password");
  const sinceIso = new Date(sinceMs).toISOString();
  const sinceDay = utcDay(sinceMs);

  const [rows, activity, views] = await Promise.all([
    all<NudgeRow>(
      `notification_events?select=user_id,type,email_status,payload,created_at&type=in.(${TYPES.join(",")})&created_at=gte.${sinceIso}`,
    ),
    all<{ user_id: string; day: string }>(
      `activity_days?select=user_id,day&kind=eq.active&day=gte.${sinceDay}`,
    ),
    all<{ user_id: string | null; created_at: string }>(
      `analytics_events?select=user_id,created_at&event_name=eq.UPGRADE_VIEWED&created_at=gte.${sinceIso}`,
    ),
  ]);

  // Which held-out accounts the email could have reached: one lookup each, a few at a time.
  const held = Array.from(
    new Set(
      rows
        .filter((row) => (row.payload as { holdout?: unknown } | null)?.holdout === true)
        .map((row) => row.user_id),
    ),
  );
  const eligibleIds = new Set<string>();
  for (let i = 0; i < held.length; i += 6) {
    await Promise.all(
      held.slice(i, i + 6).map(async (id) => {
        const user = await readAuthUser(id).catch(() => null);
        if (canEmailAccount(user, allowPassword)) eligibleIds.add(id);
      }),
    );
  }

  const active = activeDaysByUser(activity);
  const viewTimes = new Map<string, number[]>();
  for (const view of views) {
    if (!view.user_id) continue;
    const list = viewTimes.get(view.user_id) ?? [];
    list.push(Date.parse(view.created_at));
    viewTimes.set(view.user_id, list);
  }
  const heldSet = new Set(held);
  const tallies = tallyNudges({
    rows,
    windowDays,
    today: utcDay(NOW),
    nowMs: NOW,
    activeDays: (id) => active.get(id),
    upgradeViews: (id) => viewTimes.get(id),
    eligible: (id) => !heldSet.has(id) || eligibleIds.has(id),
  });

  console.log(
    `Reminders since ${sinceIso} (UTC days), window = ${windowDays} days after the reminder. Held-out accounts: ${held.length}, of which could have been emailed: ${eligibleIds.size}.`,
  );
  if (tallies.size === 0) console.log("No reminder rows in this period.");
  for (const [type, byArm] of tallies) {
    console.log(`\n${type}`);
    console.table(
      (["sent", "held out"] as const).map((arm) => ({ arm, ...nudgeShares(byArm[arm]) })),
    );
  }
  console.log(
    '\nRead the counts: with a handful of held-out learners a few points mean nothing. "window over" is how many reminders are old enough to judge; it is 0 for the first days of sending.',
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
