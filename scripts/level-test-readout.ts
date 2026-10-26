/**
 * Read-only readout of the "Chosen level shapes the path" test (Permissions -> levelFloor, given to a
 * share of learners): of the NEW learners who finished the Intermediate or Advanced opening lesson,
 * did the ones who had the permission come back more, and did they get harder lessons?
 *
 * Reads the live database through the service role (nothing is written, no id or email is printed;
 * admin accounts are left out). Who was in which arm is not stored: it is worked out with the same
 * hash the app uses (rolloutBucket), so the read tells exactly who had the permission. The moment the
 * test began is the last time the setting was saved (the Permissions audit log) unless --since gives it.
 *
 * The one verdict it will give is the next-day return, and only on or after --read-date, a date to be
 * chosen before the test starts and not moved; everything else it prints is description. The one
 * thing it may say earlier is the stop limit: the test arm clearly worse even at a strict 99.7%.
 * While the permission is closed it prints the baseline (the same figures for the last days, with no
 * arms) and what a share test could see at the current pace.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/level-test-readout.ts --read-date 2026-11-17
 * Optional: --since <ISO time the test began>, --days 14 (days of sign-ups read for the baseline and
 * the pretend run), --pretend-percent 50 (cut the last --days of real sign-ups into two arms although
 * nobody had the permission: an A/A check of the machinery that shows how big chance alone is).
 */

import { OPENING_LESSON_ID } from "../src/lib/progress/starting-level";
import {
  EARLY_DAYS,
  LEVEL_TEST_FEATURE,
  MIN_PER_ARM,
  armOf,
  detectableDifference,
  meanDiff,
  readVerdict,
  shareDiff,
  splitZ,
  summarizeArm,
} from "../src/lib/readout/level-test";
import type { Arm, ArmSummary, TestAccount, Verdict } from "../src/lib/readout/level-test";
import { activeDaysByUser, addDays, pct, tallyReturns, utcDay } from "../src/lib/readout/returns";
import { sanitizeRolloutConfig } from "../src/lib/rollouts/config";
import { all, allOrEmpty, arg, readAdminIds, readRollouts } from "./_readout-rest";

const NOW = Date.now();
const today = utcDay(NOW);

/** The harder opening lessons are the ones that tell which tier a learner chose (see starting-level.ts). */
const HARDER_OPENERS = [OPENING_LESSON_ID.intermediate, OPENING_LESSON_ID.advanced];
const ALL_OPENERS = Object.values(OPENING_LESSON_ID);

const share = (yes: number, n: number) => (n === 0 ? "-" : `${pct(yes, n)} (${yes}/${n})`);
const points = (value: number) => `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}`;
const gapOf = (testYes: number, testN: number, controlYes: number, controlN: number) => {
  const gap = shareDiff(testYes, testN, controlYes, controlN);
  return gap
    ? { gap: `${points(gap.diff)} pts`, interval: `${points(gap.low)} .. ${points(gap.high)}` }
    : { gap: "-", interval: "-" };
};

const VERDICT_TEXT: Record<Verdict, string> = {
  "no-read-date":
    "NO VERDICT: no --read-date was given. Choose the date before the test starts, then run with --read-date <YYYY-MM-DD>; until then every figure is description.",
  "before-read-date":
    "NO VERDICT YET: today is before the read date. Do not stop or change the test on these figures.",
  "too-few": `NO VERDICT: an arm has fewer than ${MIN_PER_ARM} learners whose next day is over. The shares are noise.`,
  "no-difference":
    "VERDICT: no clear difference in coming back the next day (the interval of the gap includes zero).",
  "test-higher": "VERDICT: the test arm came back MORE the next day (the interval is above zero).",
  "test-lower": "VERDICT: the test arm came back LESS the next day (the interval is below zero).",
};

interface Setting {
  mode: string;
  percent: number;
  /** When the setting was last saved: the start of the test if it is a share. */
  savedMs: number | null;
  /** The saves of this setting, oldest first (from the Permissions audit log). */
  history: { at: string; mode: string; percent: number | null }[];
}

async function readSetting(): Promise<Setting> {
  const rolloutRows = await readRollouts();
  const entry = sanitizeRolloutConfig(rolloutRows)[LEVEL_TEST_FEATURE];
  const row = rolloutRows.find((candidate) => candidate.feature === LEVEL_TEST_FEATURE);
  const audit = await allOrEmpty<{ created_at: string; metadata: Record<string, unknown> | null }>(
    `admin_audit_log?select=created_at,metadata&action=eq.rollout.updated&entity_id=eq.${LEVEL_TEST_FEATURE}&order=created_at`,
  );
  const history = audit.map((save) => ({
    at: save.created_at,
    mode: String(save.metadata?.mode ?? "?"),
    percent: typeof save.metadata?.percent === "number" ? save.metadata.percent : null,
  }));
  // The later of the two times: a change made outside the Permissions page leaves no audit row.
  const saves = [history.at(-1)?.at, row?.updated_at]
    .filter((value): value is string => typeof value === "string")
    .map((value) => Date.parse(value))
    .filter((ms) => !Number.isNaN(ms));
  return {
    mode: entry.mode,
    percent: entry.percent,
    savedMs: saves.length > 0 ? Math.max(...saves) : null,
    history,
  };
}

interface Cohort {
  /** Every new account in the window, whatever opening lesson it finished. */
  everyone: { id: string; day: string }[];
  /** The new accounts that finished the Intermediate or Advanced opening lesson. */
  accounts: TestAccount[];
  sentencesOf: (id: string) => ReadonlyMap<string, number> | undefined;
  activeOf: (id: string) => ReadonlySet<string> | undefined;
}

async function readCohort(sinceMs: number): Promise<Cohort> {
  const sinceIso = new Date(sinceMs).toISOString();
  const fromDay = utcDay(sinceMs);
  const admins = await readAdminIds();
  console.error("Reading sign-ups, opening lessons, lessons finished and activity (read-only)...");
  const [profiles, openers, finished, lessons, levels, activity] = await Promise.all([
    all<{ id: string; created_at: string; starting_level: number | null }>(
      `profiles?select=id,created_at,starting_level&role=eq.user&created_at=gte.${sinceIso}`,
    ),
    all<{ user_id: string; lesson_id: string; completed_at: string }>(
      `user_progress?select=user_id,lesson_id,completed_at&lesson_id=in.(${HARDER_OPENERS.join(",")})&completed_at=not.is.null`,
    ),
    all<{ user_id: string; lesson_id: string; completed_at: string }>(
      `user_progress?select=user_id,lesson_id,completed_at&mode=in.(normal,stories)&completed_at=gte.${sinceIso}`,
    ),
    all<{ id: string; level_id: string }>("lessons?select=id,level_id&mode=in.(normal,stories)"),
    all<{ id: string; index: number }>("levels?select=id,index"),
    all<{ user_id: string; day: string; sentences: number }>(
      `activity_days?select=user_id,day,sentences&kind=eq.active&day=gte.${fromDay}`,
    ),
  ]);

  const levelIndex = new Map(levels.map((level) => [level.id, level.index]));
  const levelOfLesson = new Map(
    lessons.map((lesson) => [lesson.id, levelIndex.get(lesson.level_id)]),
  );
  const created = new Map(
    profiles.filter((p) => !admins.has(p.id)).map((p) => [p.id, utcDay(p.created_at)]),
  );

  const hasHarderOpener = new Set(openers.map((row) => row.user_id));
  const levelsDone = new Map<string, number[]>();
  for (const row of finished) {
    const day = created.get(row.user_id);
    if (day === undefined || ALL_OPENERS.includes(row.lesson_id)) continue;
    const doneDay = utcDay(row.completed_at);
    if (doneDay < day || doneDay > addDays(day, EARLY_DAYS)) continue;
    const level = levelOfLesson.get(row.lesson_id);
    if (level === undefined) continue;
    const list = levelsDone.get(row.user_id) ?? [];
    list.push(level);
    levelsDone.set(row.user_id, list);
  }

  const everyone = [...created].map(([id, day]) => ({ id, day }));
  const accounts: TestAccount[] = profiles
    .filter((p) => created.has(p.id) && hasHarderOpener.has(p.id))
    .map((p) => ({
      id: p.id,
      day: created.get(p.id)!,
      startingLevel: p.starting_level,
      levelsDone: levelsDone.get(p.id) ?? [],
    }));

  const active = activeDaysByUser(activity.filter((row) => !admins.has(row.user_id)));
  const sentences = new Map<string, Map<string, number>>();
  for (const row of activity) {
    if (admins.has(row.user_id)) continue;
    const days = sentences.get(row.user_id) ?? new Map<string, number>();
    days.set(row.day, (days.get(row.day) ?? 0) + (row.sentences ?? 0));
    sentences.set(row.user_id, days);
  }
  return {
    everyone,
    accounts,
    sentencesOf: (id) => sentences.get(id),
    activeOf: (id) => active.get(id),
  };
}

function summarize(cohort: Cohort, accounts: readonly TestAccount[]): ArmSummary {
  const tally = tallyReturns(
    accounts.map((a) => ({ id: a.id, day: a.day })),
    cohort.activeOf,
    today,
  );
  return summarizeArm(accounts, tally, cohort.sentencesOf, today);
}

/** The rows of the comparison: one line per measure, the two arms side by side. */
function compareRows(test: ArmSummary, control: ArmSummary) {
  const lines: Record<string, string | number>[] = [];
  const line = (measure: string, a: { yes: number; n: number }, b: { yes: number; n: number }) => {
    lines.push({
      measure,
      "test arm": share(a.yes, a.n),
      "control arm": share(b.yes, b.n),
      ...gapOf(a.yes, a.n, b.yes, b.n),
    });
  };
  line(
    "has a stored level (the permission's effect, should be far apart)",
    { yes: test.storedLevel, n: test.accounts },
    { yes: control.storedLevel, n: control.accounts },
  );
  line(
    "back the next day (the verdict)",
    { yes: test.tally.nextDay, n: test.tally.nextDayKnown },
    { yes: control.tally.nextDay, n: control.tally.nextDayKnown },
  );
  line(
    "back in days 1-7",
    { yes: test.tally.week, n: test.tally.weekKnown },
    { yes: control.tally.week, n: control.tally.weekKnown },
  );
  line(
    "active 2+ of the first 14 days",
    { yes: test.tally.active2, n: test.tally.fortnightKnown },
    { yes: control.tally.active2, n: control.tally.fortnightKnown },
  );
  line(
    `finished a Level 2+ lesson or story in days 0-${EARLY_DAYS}`,
    { yes: test.harder.yes, n: test.harder.known },
    { yes: control.harder.yes, n: control.harder.known },
  );
  const sentences = meanDiff(test.sentences, control.sentences);
  lines.push({
    measure: `sentences typed in days 0-${EARLY_DAYS} (mean)`,
    "test arm": test.sentences ? `${test.sentences.mean.toFixed(1)} (n ${test.sentences.n})` : "-",
    "control arm": control.sentences
      ? `${control.sentences.mean.toFixed(1)} (n ${control.sentences.n})`
      : "-",
    gap: sentences ? `${sentences.diff >= 0 ? "+" : ""}${sentences.diff.toFixed(1)}` : "-",
    interval: sentences ? `${sentences.low.toFixed(1)} .. ${sentences.high.toFixed(1)}` : "-",
  });
  return lines;
}

function printCaveats() {
  console.log(
    [
      "",
      "READ IT WITH THESE IN MIND:",
      " - Arms are cut by a hash of the account id (the app's own rule), so nobody chose who got what. Both arms are read together, in this run.",
      " - Only new learners who finished the Intermediate or Advanced opening lesson are read (the ones the fix reaches); a Beginner opener never stores a level.",
      " - A test-arm learner counts as test even if the level was not stored (that is how a real launch behaves): the 'has a stored level' row is the check that the permission works. Expected: close to all of the test arm, a few percent of the control arm (who set it on the level card).",
      " - Returns are on calendar days (activity_days), so they will not match the 24-hour figures of the strategy report; compare the two arms of one run only.",
      " - Level 2+ counts lessons and stories (normal and stories modes) finished in the first days after sign-up; passages and word lists have no level here.",
      " - Another test running on the same learners adds noise to both arms alike (the hashes of two features are independent), but run one at a time.",
      " - Do not stop, change the share or move the read date because of these figures. Only the stop limit (99.7% worse) may be acted on early, and the closing is then the owner's call.",
    ].join("\n"),
  );
}

async function main() {
  const readDate = arg("--read-date") ?? null;
  if (readDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(readDate)) {
    console.error("--read-date must look like 2026-11-17");
    process.exit(1);
  }
  const days = Number(arg("--days") ?? 14);
  const setting = await readSetting();
  const baseSince = Date.parse(`${addDays(today, -days)}T00:00:00Z`);
  const sinceArg = arg("--since");
  // A pretend run cuts the real sign-ups into two arms although nobody had the permission (an A/A
  // check: both arms lived the same, so every gap is chance).
  const pretendArg = arg("--pretend-percent");
  const pretend = pretendArg !== undefined;
  const percent = pretend ? Number(pretendArg) : setting.percent;
  if (pretend && !(percent >= 1 && percent <= 99)) {
    console.error("--pretend-percent must be a number from 1 to 99");
    process.exit(1);
  }
  const sinceMs = sinceArg ? Date.parse(sinceArg) : pretend ? baseSince : setting.savedMs;

  console.log(`Now: ${new Date(NOW).toISOString()}   (all days are UTC)`);
  console.log(
    `Permission "Chosen level shapes the path" (${LEVEL_TEST_FEATURE}): mode "${setting.mode}"${setting.mode === "everyone" ? `, ${setting.percent}%` : ""}; last saved ${setting.savedMs ? new Date(setting.savedMs).toISOString() : "(no row)"}.`,
  );
  if (setting.history.length > 0) {
    console.log("Saves so far:");
    console.table(
      setting.history.map((save) => ({
        saved: save.at,
        mode: save.mode,
        percent: save.percent ?? "-",
      })),
    );
  }

  const isShare = pretend || (setting.mode === "everyone" && setting.percent < 100);
  if (!pretend && setting.mode === "everyone" && setting.percent >= 100) {
    console.log(
      "\nEVERYONE has the permission (100%): there is no control group, so nothing can be compared. Set a share below 100 to run a test.",
    );
  }

  // ---- A test is running: read the two arms. ----
  if (isShare) {
    if (sinceMs === null || Number.isNaN(sinceMs)) {
      console.error("No saved time to start from. Pass --since <ISO time>.");
      process.exit(1);
    }
    console.log(
      pretend
        ? `\nPRETEND RUN: the permission is closed, so NEITHER arm had it. The sign-ups since ${new Date(sinceMs).toISOString()} are cut at ${percent}% with the app's own hash, to show what chance alone looks like (every gap below is noise) and to check the machinery. Nothing is changed.`
        : `\nTEST RUNNING since ${new Date(sinceMs).toISOString()}${sinceArg ? " (from --since)" : " (the last save)"}: ${percent}% of learners have it. Read date: ${readDate ?? "(none given)"}.`,
    );
    const cohort = await readCohort(sinceMs);

    // Is the split the size the setting promised? (all new accounts, whatever they finished)
    const everyoneTest = cohort.everyone.filter((a) => armOf(a.id, percent) === "test").length;
    const everyoneZ = splitZ(everyoneTest, cohort.everyone.length, percent);
    const armOfAccount = (a: TestAccount): Arm => armOf(a.id, percent);
    const testAccounts = cohort.accounts.filter((a) => armOfAccount(a) === "test");
    const controlAccounts = cohort.accounts.filter((a) => armOfAccount(a) === "control");
    const cohortZ = splitZ(testAccounts.length, cohort.accounts.length, percent);
    console.log(
      "\nTHE SPLIT (should be near the share; |z| above 3 means do not trust anything below)",
    );
    console.table([
      {
        group: "all new accounts",
        total: cohort.everyone.length,
        "test arm": everyoneTest,
        "share in test": pct(everyoneTest, cohort.everyone.length),
        z: everyoneZ === null ? "-" : everyoneZ.toFixed(2),
      },
      {
        group: "finished a harder opening lesson",
        total: cohort.accounts.length,
        "test arm": testAccounts.length,
        "share in test": pct(testAccounts.length, cohort.accounts.length),
        z: cohortZ === null ? "-" : cohortZ.toFixed(2),
      },
    ]);
    if (
      (everyoneZ !== null && Math.abs(everyoneZ) > 3) ||
      (cohortZ !== null && Math.abs(cohortZ) > 3)
    ) {
      console.log(
        "WARNING: the split is not the size the setting promises. Find out why before reading anything.",
      );
    }

    const test = summarize(cohort, testAccounts);
    const control = summarize(cohort, controlAccounts);
    console.log(
      `\nTHE TWO ARMS: new learners who finished the Intermediate or Advanced opening lesson (test ${test.accounts}, control ${control.accounts}). Gap = test minus control, in percentage points, with a 95% interval.`,
    );
    console.table(compareRows(test, control));

    if (pretend) {
      console.log(
        "\nPRETEND RUN: no verdict. Read the gaps as the size of chance at this number of learners; both 'has a stored level' figures should be alike here (about 7%).",
      );
      printCaveats();
      return;
    }
    if (test.accounts > 0 && test.storedLevel / test.accounts < 0.8) {
      console.log(
        `WARNING: only ${pct(test.storedLevel, test.accounts)} of the test arm has a stored level (expected close to all). The permission is not reaching them as it should; check that before reading the rest.`,
      );
    }
    const result = readVerdict({
      readDate,
      today,
      test: { yes: test.tally.nextDay, n: test.tally.nextDayKnown },
      control: { yes: control.tally.nextDay, n: control.tally.nextDayKnown },
    });
    console.log(`\n${VERDICT_TEXT[result.verdict]}`);
    if (result.harm) {
      console.log(
        "STOP LIMIT: the test arm came back clearly LESS the next day (even a strict 99.7% interval lies below zero). Closing the permission is the owner's call; this is the one thing it is safe to act on before the read date.",
      );
    }
    printCaveats();
    return;
  }

  // ---- Closed: the baseline, and what a share test could see. ----
  console.log(
    `\nNO TEST IS RUNNING (the permission is not given to a share of learners). Baseline: new accounts of the last ${days} days that finished the Intermediate or Advanced opening lesson, none of whom had the permission.`,
  );
  const cohort = await readCohort(baseSince);
  const summary = summarize(cohort, cohort.accounts);

  const byDay = new Map<string, TestAccount[]>();
  for (const account of cohort.accounts) {
    const list = byDay.get(account.day) ?? [];
    list.push(account);
    byDay.set(account.day, list);
  }
  const signupsOfDay = new Map<string, number>();
  for (const a of cohort.everyone) signupsOfDay.set(a.day, (signupsOfDay.get(a.day) ?? 0) + 1);
  console.log("\nBY SIGN-UP DAY (a measure shows '-' until its days have passed)");
  const rows: Record<string, string | number>[] = [];
  for (let day = addDays(today, -days); day <= today; day = addDays(day, 1)) {
    const list = byDay.get(day) ?? [];
    const tally = tallyReturns(
      list.map((a) => ({ id: a.id, day: a.day })),
      cohort.activeOf,
      today,
    );
    rows.push({
      day,
      "new accounts": signupsOfDay.get(day) ?? 0,
      "harder opener": list.length,
      "stored level": list.length
        ? pct(list.filter((a) => (a.startingLevel ?? 0) >= 1).length, list.length)
        : "-",
      "back next day": tally.nextDayKnown ? pct(tally.nextDay, tally.nextDayKnown) : "-",
    });
  }
  console.table(rows);

  console.log("BASELINE, ALL OF THEM TOGETHER");
  console.table([
    { measure: "new accounts that finished a harder opening lesson", value: summary.accounts },
    { measure: "has a stored level", value: share(summary.storedLevel, summary.accounts) },
    {
      measure: "back the next day",
      value: share(summary.tally.nextDay, summary.tally.nextDayKnown),
    },
    { measure: "back in days 1-7", value: share(summary.tally.week, summary.tally.weekKnown) },
    {
      measure: "active 2+ of the first 14 days",
      value: share(summary.tally.active2, summary.tally.fortnightKnown),
    },
    {
      measure: `finished a Level 2+ lesson or story in days 0-${EARLY_DAYS}`,
      value: share(summary.harder.yes, summary.harder.known),
    },
    {
      measure: `sentences typed in days 0-${EARLY_DAYS} (mean)`,
      value: summary.sentences ? summary.sentences.mean.toFixed(1) : "-",
    },
  ]);

  // Planning: complete days only (today is still running).
  const completeDays = Math.max(1, days);
  const perDay = cohort.accounts.filter((a) => a.day < today).length / completeDays;
  const baseRate =
    summary.tally.nextDayKnown > 0 ? summary.tally.nextDay / summary.tally.nextDayKnown : null;
  console.log(
    `PLANNING, if the permission were given to 50% of learners: about ${perDay.toFixed(0)} new learners a day finish a harder opening lesson (last ${completeDays} complete days)${baseRate === null ? "" : `; next-day return is ${(baseRate * 100).toFixed(1)}% now`}.`,
  );
  console.table(
    [14, 21, 28].map((weeks) => {
      const perArm = Math.floor((perDay * weeks) / 2);
      const gap = baseRate === null ? null : detectableDifference(perArm, baseRate);
      return {
        "days of test": weeks,
        "learners per arm": perArm,
        "smallest next-day gap seen ~8 times in 10":
          gap === null ? "-" : `${(gap * 100).toFixed(1)} pts`,
      };
    }),
  );
  console.log(
    "Choose the read date from this table BEFORE giving the permission to a share, and keep it. The first days after the switch only judge the learners whose next day is over.",
  );
  printCaveats();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
