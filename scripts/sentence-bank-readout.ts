/**
 * Read-only readout of the sentence bank ("Test yourself on today's lessons" and the weekly test):
 * is the row shown, is it finished, are first answers right, and — once the bank is open to a SHARE
 * of learners — do the two arms differ in coming back and in finishing Today's three tasks?
 *
 * Reads the live database through the service role (nothing is written). The arms come from the
 * stored settings and the same hash the site uses (rolloutBucket), so nothing about who was in
 * which arm needs to be stored. Admin accounts are left out of any comparison of learners; while
 * the bank is still Admins-only the figures are the admins' own, to prove the flow works.
 *
 * Read it like docs/sentence-bank.md says: arm against arm, not against the strategy report's
 * 24-hour figures (this counts calendar days); the bank is an extra row, not a fourth task; and
 * after the % was changed, only learners from the last change on are comparable (--since).
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/sentence-bank-readout.ts
 * Optional: --since <ISO time of the LAST change of the share> (default: when the setting was last
 * saved, or 14 days ago while the bank is still closed).
 */

import {
  activeDaysByUser,
  DAY_MS,
  pct,
  tallyReturns,
  tallyShares,
  utcDay,
} from "../src/lib/readout/returns";
import type { Signup } from "../src/lib/readout/returns";
import { sanitizeRolloutConfig } from "../src/lib/rollouts/config";
import {
  STOP_RULES,
  armOf,
  bankOpening,
  checkStats,
  exposure,
  guardVerdict,
  judgeShare,
  masteryStats,
  visitStats,
} from "../src/lib/sentence-bank/readout";
import type { CheckRow, EventRow } from "../src/lib/sentence-bank/readout";
import { threeTaskStats } from "../src/lib/today/readout";
import type { QuestRow } from "../src/lib/today/readout";
import { all, allOrEmpty, arg, readAdminIds, readRollouts } from "./_readout-rest";

const NOW = Date.now();
const today = utcDay(NOW);

async function main() {
  const rolloutRows = await readRollouts();
  const config = sanitizeRolloutConfig(rolloutRows);
  const opening = bankOpening(config);
  const savedAt = rolloutRows.find((row) => row.feature === "sentenceBank")?.updated_at;

  const sinceArg = arg("--since");
  const sinceMs = sinceArg
    ? Date.parse(sinceArg)
    : savedAt && opening.kind !== "closed"
      ? Date.parse(savedAt)
      : NOW - 14 * DAY_MS;
  if (Number.isNaN(sinceMs)) {
    console.error("--since must be an ISO time, e.g. --since 2026-11-01T09:00:00Z");
    process.exit(1);
  }
  const sinceIso = new Date(sinceMs).toISOString();
  const sinceDay = utcDay(sinceMs);

  const admins = await readAdminIds();
  const isShare = opening.kind === "share";
  // Closed: only the bank's own row (slot 13) is read - the accounts that have it are a handful.
  // Open: all of Today's rows, for the three-task guard.
  const questSlots = opening.kind === "closed" ? "slot=eq.13" : "slot=gte.10";
  const [quests, events, checks, mastery, profiles, activity] = await Promise.all([
    all<QuestRow>(
      `daily_quests?select=user_id,quest_date,slot,quest_type,completed_at&${questSlots}&quest_date=gte.${sinceDay}`,
    ),
    all<EventRow>(
      `analytics_events?select=user_id,event_name,event_properties&event_name=in.(SENTENCE_REVIEW_STARTED,SENTENCE_REVIEW_FINISHED,SENTENCE_CHECK_STARTED,SENTENCE_CHECK_FINISHED)&created_at=gte.${sinceIso}`,
    ),
    allOrEmpty<CheckRow>(
      `sentence_checks?select=user_id,asked,remembered,written&created_at=gte.${sinceIso}`,
    ),
    allOrEmpty<{ user_id: string }>("sentence_mastery?select=user_id&strength=gte.2"),
    isShare
      ? all<{ id: string; created_at: string }>(
          `profiles?select=id,created_at&role=eq.user&created_at=gte.${sinceIso}`,
        )
      : Promise.resolve([]),
    isShare
      ? all<{ user_id: string; day: string }>(
          `activity_days?select=user_id,day&kind=eq.active&day=gte.${sinceDay}`,
        )
      : Promise.resolve([]),
  ]);

  // Which group a learner's rows belong to. While the bank is closed every row is from an account
  // that is allowed to have it (an admin); once it is open, admins are left out.
  function groupOf(userId: string | null): string | null {
    if (!userId) return null;
    if (opening.kind === "closed") return "admin / listed accounts";
    if (admins.has(userId)) return null;
    return armOf(userId, config);
  }
  const groups =
    opening.kind === "closed"
      ? ["admin / listed accounts"]
      : opening.kind === "everyone"
        ? ["bank"]
        : ["bank", "control"];
  const inGroup = <T>(rows: readonly T[], who: (row: T) => string | null, group: string) =>
    rows.filter((row) => groupOf(who(row)) === group);

  console.log(`Now: ${new Date(NOW).toISOString()}   Reading from: ${sinceIso} (UTC days below)`);
  console.log(
    opening.kind === "closed"
      ? `Sentence bank: ADMINS ONLY (mode "${opening.mode}") - the figures are those of the accounts that can open it; no arms yet.`
      : opening.kind === "everyone"
        ? "Sentence bank: open to EVERY learner in Today's session - there is no control arm, so only usage can be read."
        : `Sentence bank: a SHARE of ${opening.percent}% of Today's learners (setting saved ${savedAt ?? "?"}). Arm = rolloutBucket(userId, "sentenceBank") < ${opening.percent}.`,
  );
  if (savedAt && opening.kind !== "closed" && sinceMs < Date.parse(savedAt)) {
    console.log(
      `WARNING: --since is before the setting was last saved (${savedAt}); the share changed in between, so the arms below are mixed.`,
    );
  }
  const todayEntry = config.todaySession;
  if (todayEntry.mode === "everyone" && todayEntry.percent < 100) {
    console.log(
      `Note: Today's session is itself a share (${todayEntry.percent}%); the arms below are inside it, learners outside it are left out.`,
    );
  }

  // 1. The row, the visits, the weekly test, the schedule.
  const usage = groups.map((group) => {
    const rows = inGroup(quests, (r) => r.user_id, group);
    const shown = exposure(rows);
    const visits = visitStats(inGroup(events, (r) => r.user_id, group));
    const weekly = checkStats(inGroup(checks, (r) => r.user_id, group));
    const strong = masteryStats(
      inGroup(mastery, (r) => r.user_id, group).map((row) => row.user_id),
    );
    const finish = judgeShare(shown.completed, shown.dealt, STOP_RULES.finishShare);
    const right = visits.clean + visits.assisted;
    const accuracy = judgeShare(right, visits.asked, STOP_RULES.accuracy);
    return {
      group,
      "learners shown the row": shown.learners,
      "rows dealt / finished": `${shown.dealt} / ${shown.completed}`,
      [`finished (rule: ${STOP_RULES.finishShare * 100}%+)`]: `${pct(shown.completed, shown.dealt)} ${finish}`,
      "visits started / finished": `${visits.started} / ${visits.finished}`,
      [`first-go right (rule: ${STOP_RULES.accuracy * 100}%+)`]: `${pct(right, visits.asked)} of ${visits.asked} ${accuracy}`,
      "clean / assisted / missed": `${visits.clean} / ${visits.assisted} / ${visits.missed}`,
      "weekly tests (learners / done / numbered)": `${weekly.learners} / ${weekly.checks} / ${weekly.counted}`,
      "remembered in numbered tests": `${pct(weekly.remembered, weekly.asked)} of ${weekly.asked}`,
      "learners with 1+ sentence at strength 2+": strong.learners,
      "such sentences (median per learner)": `${strong.total} (${strong.median})`,
    };
  });
  console.log("\nTHE ROW AND THE TESTS");
  console.table(usage);
  console.log(
    "Finished = rows of the optional row completed over rows dealt. First-go right = (clean + assisted) / asked, from FINISHED visits only. Since the daily test asks only about today's passage and story, accuracy here is same-day recall, not retention.",
  );

  if (opening.kind === "closed") {
    console.log(
      "\nNo arms to compare: the bank is Admins-only. Open it to a share first (the owner does that on /admin/permissions).",
    );
    return;
  }

  // 2. Today's three tasks, and (for a share) who came back.
  const tasks = groups.map((group) => ({
    group,
    stats: threeTaskStats(inGroup(quests, (r) => r.user_id, group)),
  }));
  console.log("\nTODAY'S THREE TASKS (the bank row is not one of them)");
  console.table(
    tasks.map(({ group, stats }) => ({
      group,
      learners: stats.learners,
      "learner-days with all 3 dealt": stats.userDays,
      "all 3 done": `${pct(stats.allDone, stats.userDays)} (${stats.allDone})`,
      "listen done": pct(stats.bySlot[10]?.completed ?? 0, stats.bySlot[10]?.dealt ?? 0),
      "story done": pct(stats.bySlot[11]?.completed ?? 0, stats.bySlot[11]?.dealt ?? 0),
      "words done": pct(stats.bySlot[12]?.completed ?? 0, stats.bySlot[12]?.dealt ?? 0),
    })),
  );

  if (!isShare) {
    console.log(
      "\nNo arms to compare: the bank is open to everyone, so there is no control to compare returns with.",
    );
    return;
  }

  const bank = tasks.find((task) => task.group === "bank")?.stats;
  const control = tasks.find((task) => task.group === "control")?.stats;
  if (bank && control) {
    const guard = guardVerdict(bank, control);
    console.log(
      `GUARD (bank arm may not finish the three tasks ${STOP_RULES.guardPoints}+ points less often than control, judged from ${STOP_RULES.guardMinLearners} learners per arm): ${guard.status.toUpperCase()}${guard.gapPoints === null ? "" : `, gap ${guard.gapPoints.toFixed(1)} points`}`,
    );
  }

  const signups: Signup[] = profiles.map((p) => ({ id: p.id, day: utcDay(p.created_at) }));
  const active = activeDaysByUser(activity);
  console.log(
    `\nCAME BACK (sign-ups since ${sinceDay}; a day counts once it is over; calendar days)`,
  );
  console.table(
    groups.map((group) => ({
      group,
      ...tallyShares(
        tallyReturns(
          signups.filter((signup) => armOf(signup.id, config) === group),
          (id) => active.get(id),
          today,
        ),
      ),
    })),
  );
  console.log(
    'Main measures: back in days 1-7 (report baseline 18.5%, a 24-hour count) and back next day (9.1%). About 3,500 sign-ups per arm are needed to see +1.5 points of next-day return. Say "differs / does not differ", never why.',
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
