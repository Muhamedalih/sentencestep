/**
 * Read-only readout of Today's session: did learners who signed up AFTER it went live come back
 * more than those who signed up before, and how many of its three tasks get done?
 *
 * Reads the live database through the service role (nothing is written). The moment it went live
 * is read from the Permissions setting (`rollouts.todaySession`, when it was last saved) unless
 * --since gives it. Sign-ups are split into whole UTC days before and after that day; the day itself
 * is in neither.
 *
 * What it can and cannot say: this is a before / after comparison with no control group, so it
 * describes and never proves. Several other things changed around the same weeks (listed in the
 * output), traffic swings with the Facebook posts, and a newer cohort has had less time to come
 * back, which is why a share only counts sign-ups whose days have passed. Returns are counted on
 * calendar days from `activity_days`, so they will not match the strategy report's 24-hour
 * figures (9.1% next day, 18.5% in days 1-7): compare the two windows of one run with each other.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/today-readout.ts
 * Optional: --since <ISO time Today's session went live to everyone>, --days 14 (sign-up days
 * before the change to compare with, and sign-up days shown per day).
 */

import {
  activeDaysByUser,
  addDays,
  pct,
  ratio,
  tallyReturns,
  tallyShares,
  utcDay,
} from "../src/lib/readout/returns";
import type { Signup } from "../src/lib/readout/returns";
import { sanitizeRolloutConfig } from "../src/lib/rollouts/config";
import { countByDay, splitSignups, threeTaskStatsByDay } from "../src/lib/today/readout";
import type { QuestRow } from "../src/lib/today/readout";
import { all, allOrEmpty, arg, readAdminIds, readRollouts } from "./_readout-rest";

const NOW = Date.now();
const today = utcDay(NOW);

async function main() {
  const rolloutRows = await readRollouts();
  const config = sanitizeRolloutConfig(rolloutRows);
  const entry = config.todaySession;
  const savedAt = rolloutRows.find((row) => row.feature === "todaySession")?.updated_at;

  const sinceArg = arg("--since");
  const changeMs = sinceArg ? Date.parse(sinceArg) : savedAt ? Date.parse(savedAt) : NaN;
  if (Number.isNaN(changeMs)) {
    console.error(
      "Today's session has no saved setting to read the date from. Pass --since <ISO time>, e.g. --since 2026-10-22T12:00:00Z",
    );
    process.exit(1);
  }
  const windowDays = Number(arg("--days") ?? 14);

  console.log(`Now: ${new Date(NOW).toISOString()}   (all days are UTC)`);
  console.log(
    `Today's session: mode "${entry.mode}"${entry.mode === "everyone" ? `, ${entry.percent}%` : ""}, setting last saved ${savedAt ?? "(no row)"}. Change taken as ${new Date(changeMs).toISOString()}${sinceArg ? " (from --since)" : ""}.`,
  );
  if (!sinceArg) {
    console.log(
      "WARNING: the saved time is the LAST save. If it was opened to a share first or changed after going live, pass --since with the time it reached everyone.",
    );
  }

  const fromDay = addDays(utcDay(changeMs), -windowDays);
  const admins = await readAdminIds();
  const [profiles, activity, quests, sessions] = await Promise.all([
    all<{ id: string; created_at: string }>(
      `profiles?select=id,created_at&role=eq.user&created_at=gte.${fromDay}T00:00:00Z`,
    ),
    all<{ user_id: string; day: string }>(
      `activity_days?select=user_id,day&kind=eq.active&day=gte.${fromDay}`,
    ),
    allOrEmpty<QuestRow>(
      `daily_quests?select=user_id,quest_date,slot,quest_type,completed_at&slot=gte.10&slot=lte.12&quest_date=gte.${utcDay(changeMs)}`,
    ),
    allOrEmpty<{ user_id: string; session_date: string }>(
      `daily_sessions?select=user_id,session_date&session_date=gte.${utcDay(changeMs)}`,
    ),
  ]);

  const signups: Signup[] = profiles.map((p) => ({ id: p.id, day: utcDay(p.created_at) }));
  const active = activeDaysByUser(activity);
  const activeOf = (id: string) => active.get(id);
  const split = splitSignups(signups, changeMs, windowDays);

  // 1. Day by day.
  console.log("\nSIGN-UPS DAY BY DAY (a measure shows '-' until its days have passed)");
  const byDay = new Map<string, Signup[]>();
  for (const signup of signups) {
    let list = byDay.get(signup.day);
    if (!list) byDay.set(signup.day, (list = []));
    list.push(signup);
  }
  const rows: Record<string, string | number>[] = [];
  for (let day = fromDay; day <= today; day = addDays(day, 1)) {
    const tally = tallyReturns(byDay.get(day) ?? [], activeOf, today);
    rows.push({
      day: day === split.liveDay ? `${day} <- change` : day,
      signups: tally.signups,
      "back next day": tally.nextDayKnown ? pct(tally.nextDay, tally.nextDayKnown) : "-",
      "back in days 1-7": tally.weekKnown ? pct(tally.week, tally.weekKnown) : "-",
      "active 2+ of 14": tally.fortnightKnown ? pct(tally.active2, tally.fortnightKnown) : "-",
    });
  }
  console.table(rows);

  // 2. The two windows.
  const before = tallyShares(tallyReturns(split.before, activeOf, today));
  const after = tallyShares(tallyReturns(split.after, activeOf, today));
  console.log(
    `BEFORE: sign-ups of the ${windowDays} days before ${split.liveDay}   AFTER: sign-ups of the days after ${split.liveDay}`,
  );
  console.table(
    Object.keys(before).map((measure) => ({
      measure,
      before: before[measure],
      after: after[measure],
    })),
  );

  // 3. Today's three tasks, per quest date, and sessions finished.
  const learnerQuests = quests.filter((row) => !admins.has(row.user_id));
  const taskDays = threeTaskStatsByDay(learnerQuests);
  const sessionsByDay = countByDay(
    sessions.filter((s) => !admins.has(s.user_id)).map((s) => s.session_date),
  );
  const activeByDay = new Map<string, number>();
  for (const row of activity) {
    if (!admins.has(row.user_id)) activeByDay.set(row.day, (activeByDay.get(row.day) ?? 0) + 1);
  }
  console.log("\nTODAY'S THREE TASKS (learners; rows are those dealt, per quest date)");
  console.table(
    Array.from(taskDays.keys())
      .sort()
      .map((date) => {
        const stats = taskDays.get(date)!;
        const activeLearners = activeByDay.get(date) ?? 0;
        const slot = (n: number) =>
          pct(stats.bySlot[n]?.completed ?? 0, stats.bySlot[n]?.dealt ?? 0);
        return {
          date,
          "learners dealt all 3": stats.learners,
          "listen done": slot(10),
          "story done": slot(11),
          "words done": slot(12),
          "all 3 done": `${pct(stats.allDone, stats.userDays)} (${stats.allDone}/${stats.userDays})`,
          "finish screens (daily_sessions)": sessionsByDay.get(date) ?? 0,
          "per 100 active learners": ratio(100 * (sessionsByDay.get(date) ?? 0), activeLearners, 1),
        };
      }),
  );

  console.log(
    [
      "",
      "READ IT WITH THESE IN MIND (the strategy report's list, plus what this script cannot see):",
      " - No control group: 'after' is a different cohort in a different fortnight. Do not write 'it worked'.",
      " - Around the same time: the 7/10/15 offer (2026-10-19), the old free path (10-19), Binance for all (10-18), the first emails (10-21 15:00 UTC), the Facebook drop of 14-17 Oct (about -45%, cause unknown).",
      " - A newer cohort has had less time to come back: compare 'back next day' first, 'days 1-7' only for sign-ups a week old.",
      " - A true test needs a share: Permissions -> Today's session -> 'A share of learners' (e.g. 50%) for two weeks, then read the two arms.",
    ].join("\n"),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
