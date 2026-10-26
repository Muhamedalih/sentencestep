/**
 * The maths of the "Chosen level shapes the path" test (scripts/level-test-readout.ts): which arm an
 * account was in, whether the two arms came out the size the setting promised, how two shares or two
 * means differ, and what one arm of new learners who took a harder opening lesson looks like. Pure,
 * so it is tested.
 *
 * The arm is not stored anywhere: it is the same stable hash the app uses to decide the permission
 * (rolloutBucket in rollouts/config.ts) run on the account ids, so the read tells exactly who had it.
 */

import { addDays } from "@/lib/readout/returns";
import type { ReturnTally } from "@/lib/readout/returns";
import { rolloutBucket } from "@/lib/rollouts/config";

/** The permission the test is about (Admin -> Permissions -> "Chosen level shapes the path"). */
export const LEVEL_TEST_FEATURE = "levelFloor" as const;

/** Fewer next-day-judged learners than this in an arm and the shares are noise: no verdict. */
export const MIN_PER_ARM = 300;

/** Days after sign-up (the sign-up day is day 0) whose lessons and sentences are read. */
export const EARLY_DAYS = 3;

export type Arm = "test" | "control";

/** The arm of one account when the permission is given to `percent` percent of learners. */
export function armOf(userId: string, percent: number): Arm {
  return rolloutBucket(userId, LEVEL_TEST_FEATURE) < percent ? "test" : "control";
}

export interface Interval {
  low: number;
  high: number;
}

/** Wilson's score interval for x of n (95% unless `z` says otherwise), or null when n is 0. */
export function wilson(x: number, n: number, z = 1.96): Interval | null {
  if (n <= 0) return null;
  const p = x / n;
  const denominator = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denominator;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denominator;
  return { low: Math.max(0, centre - half), high: Math.min(1, centre + half) };
}

export interface ShareDiff extends Interval {
  test: number;
  control: number;
  /** Test minus control, as shares (0.04 = 4 points). */
  diff: number;
}

/** Test minus control with Newcombe's interval (95% unless `z` says otherwise; sound for small counts); null when an arm is empty. */
export function shareDiff(
  testYes: number,
  testN: number,
  controlYes: number,
  controlN: number,
  z = 1.96,
): ShareDiff | null {
  const a = wilson(testYes, testN, z);
  const b = wilson(controlYes, controlN, z);
  if (!a || !b) return null;
  const p1 = testYes / testN;
  const p2 = controlYes / controlN;
  const diff = p1 - p2;
  return {
    test: p1,
    control: p2,
    diff,
    low: diff - Math.sqrt((p1 - a.low) ** 2 + (b.high - p2) ** 2),
    high: diff + Math.sqrt((a.high - p1) ** 2 + (p2 - b.low) ** 2),
  };
}

export interface MeanStats {
  n: number;
  mean: number;
  /** Sample variance (0 for a single value). */
  variance: number;
}

export function meanStats(values: readonly number[]): MeanStats | null {
  if (values.length === 0) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.length < 2
      ? 0
      : values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
  return { n: values.length, mean, variance };
}

export interface MeanDiff extends Interval {
  test: number;
  control: number;
  diff: number;
}

/** Test minus control with a 95% interval (Welch, normal approximation); null when an arm has under 2 values. */
export function meanDiff(test: MeanStats | null, control: MeanStats | null): MeanDiff | null {
  if (!test || !control || test.n < 2 || control.n < 2) return null;
  const diff = test.mean - control.mean;
  const error = Math.sqrt(test.variance / test.n + control.variance / control.n);
  return {
    test: test.mean,
    control: control.mean,
    diff,
    low: diff - 1.96 * error,
    high: diff + 1.96 * error,
  };
}

/**
 * How far the test arm's size is from the share the setting promised, in standard errors (a binomial
 * z). Two groups cut by a hash of the account id should come out near `percent`: a |z| above 3 means
 * the read or the assignment is not what the setting says, and no result below it can be trusted.
 */
export function splitZ(testCount: number, total: number, percent: number): number | null {
  if (total <= 0 || percent <= 0 || percent >= 100) return null;
  const share = percent / 100;
  return (testCount - total * share) / Math.sqrt(total * share * (1 - share));
}

/**
 * The smallest gap between two shares that a test with `perArm` learners in each arm would see about
 * 8 times in 10 (95% confidence, two-sided), around a base share `baseRate`. For planning the read date.
 */
export function detectableDifference(perArm: number, baseRate: number): number | null {
  if (perArm <= 0 || baseRate <= 0 || baseRate >= 1) return null;
  return (1.96 + 0.84) * Math.sqrt(baseRate * (1 - baseRate) * (2 / perArm));
}

/** An account of the cohort: a new learner who finished the Intermediate or Advanced opening lesson. */
export interface TestAccount {
  id: string;
  /** UTC day of the sign-up. */
  day: string;
  /** profiles.starting_level: null when nothing is stored. */
  startingLevel: number | null;
  /** Level (1-3) of each lesson or story finished in days 0-3 after sign-up, the opening lessons left out. */
  levelsDone: readonly number[];
}

export interface ArmSummary {
  accounts: number;
  /** Accounts with a stored level of 1 or more. */
  storedLevel: number;
  tally: ReturnTally;
  /** Accounts whose day 3 is over, and of those how many finished a lesson or story of level 2 or above. */
  harder: { known: number; yes: number };
  /** Sentences typed on days 0-3, of the accounts whose day 3 is over. */
  sentences: MeanStats | null;
}

export type SentencesOf = (id: string) => ReadonlyMap<string, number> | undefined;

/** One arm of the cohort. `tallyReturns` is given in, so the return rules stay the shared ones. */
export function summarizeArm(
  accounts: readonly TestAccount[],
  tally: ReturnTally,
  sentencesOf: SentencesOf,
  today: string,
): ArmSummary {
  const harder = { known: 0, yes: 0 };
  const sentences: number[] = [];
  let storedLevel = 0;
  for (const account of accounts) {
    if (account.startingLevel !== null && account.startingLevel >= 1) storedLevel += 1;
    if (addDays(account.day, EARLY_DAYS) >= today) continue;
    harder.known += 1;
    if (account.levelsDone.some((level) => level >= 2)) harder.yes += 1;
    const days = sentencesOf(account.id);
    let typed = 0;
    for (let offset = 0; offset <= EARLY_DAYS; offset++)
      typed += days?.get(addDays(account.day, offset)) ?? 0;
    sentences.push(typed);
  }
  return { accounts: accounts.length, storedLevel, tally, harder, sentences: meanStats(sentences) };
}

export type Verdict =
  "no-read-date" | "before-read-date" | "too-few" | "no-difference" | "test-higher" | "test-lower";

export interface VerdictInput {
  /** The date (YYYY-MM-DD) chosen BEFORE the test started; null if none was given. */
  readDate: string | null;
  today: string;
  /** The next-day return of each arm, among the accounts whose next day is over. */
  test: { yes: number; n: number };
  control: { yes: number; n: number };
}

/** The z of the stop limit (99.7%): a gap that clear is not noise on any day. */
const STOP_Z = 3;

export interface VerdictResult {
  verdict: Verdict;
  diff: ShareDiff | null;
  /**
   * The stop limit, the one reading allowed before the date: the test arm came back LESS and even a
   * strict (99.7%) interval of the gap lies below zero, with enough learners in each arm. Closing the
   * permission is then the owner's call.
   */
  harm: boolean;
}

/**
 * The one reading the test is allowed to make: did the arms differ in coming back the next day? It
 * says nothing before the date chosen at the start (reading early is how a test gets stopped on
 * noise), nothing while an arm is small, and otherwise only whether the 95% interval of the gap
 * leaves zero. Every other figure the readout prints is description. Only `harm` may be read early.
 */
export function readVerdict(input: VerdictInput): VerdictResult {
  const { test, control } = input;
  const diff = shareDiff(test.yes, test.n, control.yes, control.n);
  const enough = test.n >= MIN_PER_ARM && control.n >= MIN_PER_ARM;
  const strict = shareDiff(test.yes, test.n, control.yes, control.n, STOP_Z);
  const harm = enough && strict !== null && strict.high < 0;
  if (!input.readDate) return { verdict: "no-read-date", diff, harm };
  if (input.today < input.readDate) return { verdict: "before-read-date", diff, harm };
  if (!diff || !enough) return { verdict: "too-few", diff, harm };
  if (diff.low > 0) return { verdict: "test-higher", diff, harm };
  if (diff.high < 0) return { verdict: "test-lower", diff, harm };
  return { verdict: "no-difference", diff, harm };
}
