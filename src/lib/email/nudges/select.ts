import { createHash } from "node:crypto";

/**
 * Who gets a nudge email, as small pure rules so each can be tested on its own. The runners
 * (run.ts) read the data and apply them; nothing here touches the database or the network.
 */
export const HOUR_MS = 3_600_000;
export const DAY_MS = 86_400_000;

/** A new learner is nudged once they have been quiet for about a day, and only within three days of signing up. */
export const DAY_ONE_MIN_AGE_MS = 18 * HOUR_MS;
export const DAY_ONE_MAX_AGE_MS = 72 * HOUR_MS;

/** A weekly reminder goes to learners away for 3 to 60 days: sooner is a nag, longer is mostly addresses nobody reads, which cost the sending reputation. */
export const REMINDER_MIN_DAYS = 3;
export const REMINDER_MAX_DAYS = 60;

/** The first and last day (YYYY-MM-DD) a learner's last activity may be on to get the reminder today. */
export function reminderWindow(now: Date): { from: string; to: string } {
  const day = (offset: number) =>
    new Date(now.getTime() - offset * DAY_MS).toISOString().slice(0, 10);
  return { from: day(REMINDER_MAX_DAYS), to: day(REMINDER_MIN_DAYS) };
}

/** An order is "abandoned" once it is two hours old (long enough to have finished) and until it is thirty hours old. */
export const ABANDONED_MIN_AGE_MS = 2 * HOUR_MS;
export const ABANDONED_MAX_AGE_MS = 30 * HOUR_MS;

/**
 * Order statuses that mean a checkout was opened and the learner did not pay: they left, cancelled
 * or let it time out. `fulfilled` and `needs_review` (it may have been paid) are not among them,
 * and neither is `failed`: a learner whose payment was declined is written to personally, never
 * sent an automatic email.
 */
export const ABANDONED_STATUSES = ["created", "pending", "cancelled", "expired"] as const;

/** A declined payment. A learner with one in the window gets no checkout reminder. */
export const FAILED_STATUS = "failed";

/** The share of learners deliberately not emailed, so the effect of the emails can be measured against them. */
const DEFAULT_HOLDOUT_PERCENT = 20;

/** NUDGE_EMAIL_HOLDOUT_PERCENT: a whole number from 0 to 50; unset or invalid is 20. */
export function holdoutPercent(raw: string | undefined): number {
  const parsed = Number.parseInt(raw?.trim() ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_HOLDOUT_PERCENT;
  return Math.min(parsed, 50);
}

/**
 * NUDGE_EMAIL_MAX_PER_RUN: how many nudge emails one run may send. Off (0) unless set to a
 * positive number, so nothing is ever sent by accident; capped at 500 (a run is one a day).
 */
export function maxSendsPerRun(raw: string | undefined): number {
  const parsed = Number.parseInt(raw?.trim() ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.min(parsed, 500);
}

/** Whether this learner is in the group that is deliberately not emailed. Stable: the same learner gets the same answer on every run. */
export function isHoldout(userId: string, percent: number): boolean {
  if (percent <= 0) return false;
  const bucket = createHash("sha256").update(`nudge:${userId}`).digest().readUInt32BE(0) % 100;
  return bucket < percent;
}

/** A learner who signed up 18 to 72 hours ago, has been active before, and has not been active yet today. */
export function isDayOneCandidate(input: {
  createdAt: string;
  lastActiveDate: string | null;
  now: Date;
}): boolean {
  const age = input.now.getTime() - Date.parse(input.createdAt);
  if (!(age >= DAY_ONE_MIN_AGE_MS && age <= DAY_ONE_MAX_AGE_MS)) return false;
  if (!input.lastActiveDate) return false;
  return input.lastActiveDate < input.now.toISOString().slice(0, 10);
}

/** The two-week period an abandoned-checkout email belongs to: one per learner per period. */
export function abandonedBucket(now: Date): number {
  return Math.floor(now.getTime() / (14 * DAY_MS));
}

/**
 * Only addresses Google has verified get a nudge: with email confirmation off, an address typed
 * at signup is unverified, and mail to a made-up address that bounces would cost the sending
 * reputation of everyone else's. NUDGE_EMAIL_ALLOW_PASSWORD_ACCOUNTS=true lifts this.
 */
export function canEmailAccount(
  user: { app_metadata?: { provider?: string; providers?: string[] } } | null | undefined,
  allowPasswordAccounts: boolean,
): boolean {
  if (!user) return false;
  if (allowPasswordAccounts) return true;
  const meta = user.app_metadata;
  return meta?.provider === "google" || (meta?.providers ?? []).includes("google");
}
