/**
 * Read-only readout of the return loop (the returnLoop permission): did learners who signed up AFTER it
 * was opened come back more than the learners who signed up in the same number of days BEFORE it?
 *
 * The loop is opened for everyone (no held-out half), so this is a before/after comparison and it has
 * to be read with that in mind: traffic mix moves return by several points from one fortnight to the
 * next with no change at all (the same day-0 finishers' next-day return swung from 10.7% to 26.6% by
 * sign-up day on the days of one October week), and other changes land in the same weeks (the opening
 * lesson's short text and skip button). So the script prints, next to the two periods, the
 * day-by-day spread of the BEFORE period; a difference inside that spread is not a result.
 *
 * Who is counted: accounts (admins left out) that finished a lesson in their first 24 hours; "returned"
 * is activity on calendar day 1 to 3 after the sign-up day (activity_days), and next-day return alone.
 * Sign-ups whose day 3 is not over yet are left out. Then the adoption numbers: how many saw the card,
 * pressed a time, which channel, the reminders sent and how many of the learners reminded finished a
 * lesson within three hours of the message.
 *
 * Reads the live database through the service role, GET only; no id or address is printed. Run with:
 *   npx tsx --env-file=.env.local scripts/return-loop-readout.ts --opened 2026-11-12
 * Optional: --days 14 (length of each period, default 14).
 */

import { DAY_MS, activeDaysByUser, addDays, pct, utcDay } from "../src/lib/readout/returns";
import { all, arg, readAdminIds } from "./_readout-rest";

const NOW = Date.now();

interface Profile {
  id: string;
  created_at: string;
}

interface Tally {
  finishers: number;
  next: number;
  anyOfThree: number;
}

const empty = (): Tally => ({ finishers: 0, next: 0, anyOfThree: 0 });

/** Two shares' difference with an approximate 95% interval (normal approximation; small numbers: read it loosely). */
function difference(a: { n: number; k: number }, b: { n: number; k: number }): string {
  if (a.n === 0 || b.n === 0) return "n/a";
  const pa = a.k / a.n;
  const pb = b.k / b.n;
  const se = Math.sqrt((pa * (1 - pa)) / a.n + (pb * (1 - pb)) / b.n);
  const diff = (pb - pa) * 100;
  return `${diff >= 0 ? "+" : ""}${diff.toFixed(1)} points (95% interval ${(diff - 196 * se).toFixed(1)} to ${(diff + 196 * se).toFixed(1)})`;
}

async function main() {
  const opened = arg("--opened");
  if (!opened || !/^\d{4}-\d{2}-\d{2}$/.test(opened)) {
    console.error("Give the day the loop was opened: --opened YYYY-MM-DD");
    process.exit(1);
  }
  const days = Number(arg("--days") ?? 14);
  const beforeFrom = addDays(opened, -days);
  const afterTo = addDays(opened, days);
  const lastCountableDay = utcDay(NOW - 4 * DAY_MS); // day 3 must be over
  const admins = await readAdminIds();

  const profiles = (
    await all<Profile>(
      `profiles?select=id,created_at&role=eq.user&created_at=gte.${beforeFrom}T00:00:00Z&created_at=lt.${afterTo}T00:00:00Z`,
    )
  ).filter((p) => !admins.has(p.id));
  const ids = new Set(profiles.map((p) => p.id));

  const [progress, activity] = await Promise.all([
    all<{ user_id: string; completed_at: string | null }>(
      `user_progress?select=user_id,completed_at&completed_at=gte.${beforeFrom}T00:00:00Z`,
    ),
    all<{ user_id: string; day: string }>(
      `activity_days?select=user_id,day&kind=eq.active&day=gte.${beforeFrom}`,
    ),
  ]);
  const completions = new Map<string, number[]>();
  for (const row of progress) {
    if (!ids.has(row.user_id) || !row.completed_at) continue;
    const list = completions.get(row.user_id) ?? [];
    list.push(Date.parse(row.completed_at));
    completions.set(row.user_id, list);
  }
  const active = activeDaysByUser(activity);

  const before = empty();
  const after = empty();
  const byDay = new Map<string, Tally>();
  for (const p of profiles) {
    const created = Date.parse(p.created_at);
    const day = utcDay(created);
    if (day > lastCountableDay) continue;
    const finished = (completions.get(p.id) ?? []).some(
      (time) => time >= created - 60_000 && time < created + DAY_MS,
    );
    if (!finished) continue;
    const next = active.get(p.id)?.has(addDays(day, 1)) ?? false;
    const any = [1, 2, 3].some((offset) => active.get(p.id)?.has(addDays(day, offset)));
    const bucket = day < opened ? before : after;
    bucket.finishers += 1;
    if (next) bucket.next += 1;
    if (any) bucket.anyOfThree += 1;
    if (day < opened) {
      const t = byDay.get(day) ?? empty();
      t.finishers += 1;
      if (next) t.next += 1;
      if (any) t.anyOfThree += 1;
      byDay.set(day, t);
    }
  }

  console.log(
    `Return loop, opened ${opened}: sign-ups ${beforeFrom}..${addDays(opened, -1)} (before) against ${opened}..${lastCountableDay} (after; day 3 must be over). Admins left out.`,
  );
  console.table(
    (
      [
        ["before", before],
        ["after", after],
      ] as const
    ).map(([period, t]) => ({
      period,
      "finished a lesson on day 0": t.finishers,
      "back the next day": pct(t.next, t.finishers),
      "back on day 1-3": pct(t.anyOfThree, t.finishers),
    })),
  );
  console.log(
    "after - before, back on day 1-3:",
    difference(
      { n: before.finishers, k: before.anyOfThree },
      { n: after.finishers, k: after.anyOfThree },
    ),
  );
  console.log(
    "after - before, back the next day:",
    difference({ n: before.finishers, k: before.next }, { n: after.finishers, k: after.next }),
  );

  const dayShares = [...byDay.entries()]
    .filter(([, t]) => t.finishers >= 10)
    .map(([day, t]) => ({ day, share: t.anyOfThree / t.finishers, n: t.finishers }))
    .sort((a, b) => a.day.localeCompare(b.day));
  if (dayShares.length >= 3) {
    const shares = dayShares.map((d) => d.share * 100);
    console.log(
      `Spread of the BEFORE period by sign-up day (days with 10+ finishers, day 1-3 return): lowest ${Math.min(...shares).toFixed(1)}%, highest ${Math.max(...shares).toFixed(1)}%. A change smaller than this spread is not a result.`,
    );
  }

  // Adoption.
  const sinceIso = `${opened}T00:00:00Z`;
  const [steps, sent] = await Promise.all([
    all<{ user_id: string | null; event_properties: { door?: string; step?: string } | null }>(
      `analytics_events?select=user_id,event_properties&event_name=eq.RETURN_LOOP_STEP&created_at=gte.${sinceIso}`,
    ),
    all<{ user_id: string; type: string; email_status: string; created_at: string }>(
      `notification_events?select=user_id,type,email_status,created_at&type=in.(SESSION_REMINDER,SESSION_REMINDER_PUSH)&created_at=gte.${sinceIso}`,
    ),
  ]);
  const stepCounts = new Map<string, number>();
  for (const row of steps) {
    if (row.user_id && admins.has(row.user_id)) continue;
    const key = `${row.event_properties?.door ?? "?"} / ${row.event_properties?.step ?? "?"}`;
    stepCounts.set(key, (stepCounts.get(key) ?? 0) + 1);
  }
  console.log("\nThe card (RETURN_LOOP_STEP events since opening, admins left out):");
  console.table(
    [...stepCounts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([door_step, count]) => ({ "door / step": door_step, count })),
  );

  const reminders = sent.filter((row) => !admins.has(row.user_id) && row.email_status === "sent");
  const reminded = new Set(reminders.map((row) => row.user_id));
  const doneAfter = await all<{ user_id: string; completed_at: string | null }>(
    `user_progress?select=user_id,completed_at&completed_at=gte.${sinceIso}`,
  );
  const byUser = new Map<string, number[]>();
  for (const row of doneAfter) {
    if (!row.completed_at || !reminded.has(row.user_id)) continue;
    const list = byUser.get(row.user_id) ?? [];
    list.push(Date.parse(row.completed_at));
    byUser.set(row.user_id, list);
  }
  let known = 0;
  let within3h = 0;
  for (const row of reminders) {
    const at = Date.parse(row.created_at);
    if (at + 3 * 3_600_000 > NOW) continue; // the window is not over
    known += 1;
    if ((byUser.get(row.user_id) ?? []).some((t) => t >= at && t <= at + 3 * 3_600_000))
      within3h += 1;
  }
  console.log("\nReminders sent (admins left out):");
  console.table(
    (["SESSION_REMINDER_PUSH", "SESSION_REMINDER"] as const).map((type) => ({
      channel: type === "SESSION_REMINDER_PUSH" ? "notification" : "email",
      sent: reminders.filter((row) => row.type === type).length,
    })),
  );
  console.log(
    `Finished a lesson within 3 hours of the message: ${pct(within3h, known)} of ${known} reminders whose window is over. Descriptive only: a learner who pressed a time was already likely to come back.`,
  );
  console.log(
    "\nRead it as a before/after, not a test: say so, give the spread above, and do not call a gain real unless it is clearly outside it.",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
