import { isOfferActive, offerBonusDaysForPlan, sharedBonusDays } from "@/lib/billing/launch-offer";
import type { LaunchOffer } from "@/lib/billing/launch-offer";
import { getLaunchOffer } from "@/lib/billing/launch-offer-queries";
import { PLAN_IDS, planPriceCents } from "@/lib/billing/plans";
import type { PlanId } from "@/lib/billing/plans";
import { dedupeKeyFor } from "@/lib/email/events";
import type { NotificationEvent } from "@/lib/email/events";
import {
  discardQueuedNotificationEvent,
  markNotificationEventSent,
  recordNotificationEvent,
} from "@/lib/email/notification-events";
import {
  abandonedCheckoutEmail,
  dayOneNudgeEmail,
  nudgeLanguage,
  reminderEmail,
  sessionReminderEmail,
} from "@/lib/email/nudges/copy";
import type { NudgeLanguage } from "@/lib/email/nudges/copy";
import {
  ABANDONED_MAX_AGE_MS,
  ABANDONED_MIN_AGE_MS,
  ABANDONED_STATUSES,
  DAY_ONE_MAX_AGE_MS,
  DAY_ONE_MIN_AGE_MS,
  FAILED_STATUS,
  abandonedBucket,
  canEmailAccount,
  holdoutPercent,
  isDayOneCandidate,
  isHoldout,
  maxSendsPerRun,
  reminderWindow,
} from "@/lib/email/nudges/select";
import { NoEmailRouteError } from "@/lib/email/providers/routed";
import { warmupDay, warmupLimit } from "@/lib/email/providers/warmup";
import { getEmailProvider, isSesRouteEnabled } from "@/lib/email/provider-registry";
import { sendTemplateEmail } from "@/lib/email/send";
import type { EmailContent } from "@/lib/email/templates/layout";
import { unsubscribeLinks } from "@/lib/email/unsubscribe-token";
import type { UnsubscribeLinks } from "@/lib/email/nudges/copy";
import { createSupabaseUsageStore, utcDay } from "@/lib/email/usage";
import {
  REMINDER_RETURNED_WINDOW_MS,
  hasReturnedBeforeReminder,
  reminderSendsPerRun,
  reminderWindowBounds,
} from "@/lib/session-end/reminder";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * The nudge emails (see copy.ts) planned and sent. Nothing here sends unless
 * NUDGE_EMAIL_MAX_PER_RUN is a positive number (a dry run, which only counts, always works),
 * a learner who is opted out, already Premium or already handled is never emailed, a share of
 * learners (NUDGE_EMAIL_HOLDOUT_PERCENT, 20 by default) is recorded as not emailed so the effect
 * can be measured against them, and only Google-verified addresses are used unless
 * NUDGE_EMAIL_ALLOW_PASSWORD_ACCOUNTS=true. Every decision is written to notification_events
 * before the send, so a repeated run can never email the same learner twice.
 */
export interface NudgeRunSummary {
  /** True when NUDGE_EMAIL_MAX_PER_RUN is unset or 0 and this was not a dry run: nothing was read or sent. */
  disabled: boolean;
  dryRun: boolean;
  /** Learners who fit the rule and were not excluded. */
  candidates: number;
  /** Of those, how many are in the group deliberately not emailed. */
  holdout: number;
  /** Emails sent (in a dry run: emails that would be sent). */
  sent: number;
  failed: number;
  skipped: {
    optedOut: number;
    premium: number;
    alreadyHandled: number;
    notVerified: number;
    noEmail: number;
    overLimit: number;
    /** A declined payment in the window: those learners are written to personally, never emailed. */
    failedPayment: number;
    /** The session reminder only: the learner had already studied that day, so the reminder was not needed. */
    returned: number;
  };
  /** While the sending domain is warming up (EMAIL_PROVIDER=hybrid): which day of sending it is, today's room for bulk email and how much of it is used. */
  warmup?: { day: number; dailyLimit: number; sentToday: number } | null;
  error?: string;
}

function emptySummary(dryRun: boolean): NudgeRunSummary {
  return {
    disabled: false,
    dryRun,
    candidates: 0,
    holdout: 0,
    sent: 0,
    failed: 0,
    skipped: {
      optedOut: 0,
      premium: 0,
      alreadyHandled: 0,
      notVerified: 0,
      noEmail: 0,
      overLimit: 0,
      failedPayment: 0,
      returned: 0,
    },
  };
}

interface Recipient {
  userId: string;
  displayName: string | null;
  language: NudgeLanguage;
  /** Days since the learner's last activity (the reminder only). */
  daysInactive?: number;
  /** The learner turned offers off: the reminder is sent without the offer line. */
  noOffers?: boolean;
  /** The plan and price (USD cents) of the checkout they left (the checkout reminder only). */
  plan?: PlanId | null;
  priceCents?: number | null;
  /** The date (YYYY-MM-DD) a session reminder was due (the session reminder only). */
  reminderDay?: string;
}

const CHUNK = 100;
/** A dry run reads one auth record per learner it counts; this keeps a manual check small. */
const DRY_RUN_LOOKUPS = 400;

type Db = ReturnType<typeof createServiceRoleClient>;

async function chunked<T>(
  ids: string[],
  query: (chunk: string[]) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let i = 0; i < ids.length; i += CHUNK) {
    const { data, error } = await query(ids.slice(i, i + CHUNK));
    if (error) throw error;
    rows.push(...(data ?? []));
  }
  return rows;
}

/** Learners who must not be emailed whatever the rule says: opted out, currently Premium, or already handled for this kind. */
async function loadExclusions(db: Db, ids: string[], type: string, now: Date) {
  const [subscriptions, optOuts, ledger] = await Promise.all([
    chunked(ids, (c) =>
      db
        .from("subscriptions")
        .select("user_id, current_period_end")
        .eq("plan", "premium")
        .in("user_id", c),
    ),
    chunked(ids, (c) =>
      db
        .from("email_preferences")
        .select("user_id")
        .eq("learning_reminders", false)
        .in("user_id", c),
    ),
    chunked(ids, (c) =>
      db
        .from("notification_events")
        .select("user_id, dedupe_key")
        .eq("type", type)
        .in("user_id", c),
    ),
  ]);
  return {
    premium: new Set(
      subscriptions
        .filter(
          (s) => s.current_period_end === null || Date.parse(s.current_period_end) > now.getTime(),
        )
        .map((s) => s.user_id),
    ),
    optedOut: new Set(optOuts.map((o) => o.user_id)),
    ledger,
  };
}

async function processRecipients(args: {
  db: Db;
  origin: string;
  recipients: Recipient[];
  makeEvent: (recipient: Recipient, holdout: boolean) => NotificationEvent;
  buildEmail: (recipient: Recipient, unsubscribe: UnsubscribeLinks | null) => EmailContent;
  /** "bulk" goes through the cheap SES route first (and is paced by the warm-up), "important" through Resend first. */
  priority: "important" | "bulk";
  summary: NudgeRunSummary;
  limit: number;
  /** True for an email the learner asked for themselves: nobody is held out of it. */
  skipHoldout?: boolean;
}): Promise<void> {
  const { db, origin, recipients, makeEvent, buildEmail, priority, summary, limit } = args;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const percent = args.skipHoldout ? 0 : holdoutPercent(process.env.NUDGE_EMAIL_HOLDOUT_PERCENT);
  const allowPassword = process.env.NUDGE_EMAIL_ALLOW_PASSWORD_ACCOUNTS === "true";
  let lookups = 0;

  for (const recipient of recipients) {
    if (isHoldout(recipient.userId, percent)) {
      summary.holdout += 1;
      if (!summary.dryRun)
        await recordNotificationEvent(recipient.userId, makeEvent(recipient, true), "skipped");
      continue;
    }
    if (summary.dryRun ? lookups >= DRY_RUN_LOOKUPS : summary.sent + summary.failed >= limit) {
      summary.skipped.overLimit += 1;
      continue;
    }

    lookups += 1;
    const { data } = await db.auth.admin.getUserById(recipient.userId);
    const user = data.user;
    if (!user?.email) {
      summary.skipped.noEmail += 1;
      continue;
    }
    if (!canEmailAccount(user, allowPassword)) {
      summary.skipped.notVerified += 1;
      continue;
    }
    if (summary.dryRun) {
      summary.sent += 1;
      continue;
    }

    // Recorded before the send: if two runs overlap, only one of them gets past this line.
    const record = await recordNotificationEvent(
      recipient.userId,
      makeEvent(recipient, false),
      "queued",
    );
    if (record.status === "duplicate") {
      summary.skipped.alreadyHandled += 1;
      continue;
    }
    try {
      const content = buildEmail(recipient, unsubscribeLinks(origin, recipient.userId, secret));
      const result = await sendTemplateEmail(user.email, content, { priority });
      if (result.status === "sent") {
        await markNotificationEventSent(record.id);
        summary.sent += 1;
      } else {
        summary.failed += 1;
      }
    } catch (error) {
      if (error instanceof NoEmailRouteError) {
        // Nothing was sent and nothing will be today: give this learner back for a later run and stop.
        await discardQueuedNotificationEvent(record.id).catch(() => undefined);
        summary.skipped.overLimit += 1;
        break;
      }
      summary.failed += 1;
      console.error("[nudge] send failed", { userId: recipient.userId, error });
    }
  }
}

/** Today's bulk room through SES, when the hybrid route is in use (null otherwise: nothing paces the sends). */
async function warmupStatus(now: Date) {
  if (process.env.EMAIL_PROVIDER?.trim().toLowerCase() !== "hybrid" || !isSesRouteEnabled()) {
    return null;
  }
  try {
    const store = createSupabaseUsageStore();
    const today = utcDay(now);
    const [first, sentToday] = await Promise.all([
      store.firstPeriod("ses"),
      store.sentSince("ses", today),
    ]);
    const day = warmupDay(first, today);
    return { day, dailyLimit: warmupLimit(day), sentToday };
  } catch {
    return null;
  }
}

/** The first checks every run makes: whether it may run at all, and whether an email provider is configured to send. */
function gate(summary: NudgeRunSummary): number | null {
  const limit = maxSendsPerRun(process.env.NUDGE_EMAIL_MAX_PER_RUN);
  if (!summary.dryRun) {
    if (limit === 0) {
      summary.disabled = true;
      return null;
    }
    if (!getEmailProvider()) {
      summary.error = "No email provider is configured.";
      return null;
    }
  }
  return limit;
}

/** "Your next lesson is ready": new learners who did a lesson and have been quiet for about a day. */
export async function runDayOneNudge(options: {
  origin: string;
  now: Date;
  dryRun: boolean;
}): Promise<NudgeRunSummary> {
  const { origin, now, dryRun } = options;
  const summary = emptySummary(dryRun);
  const limit = gate(summary);
  if (limit === null) return summary;
  summary.warmup = await warmupStatus(now);

  const db = createServiceRoleClient();
  const { data: profiles, error } = await db
    .from("profiles")
    .select("id, display_name, preferred_language, created_at")
    .eq("role", "user")
    .gte("created_at", new Date(now.getTime() - DAY_ONE_MAX_AGE_MS).toISOString())
    .lte("created_at", new Date(now.getTime() - DAY_ONE_MIN_AGE_MS).toISOString())
    .limit(5000);
  if (error) throw error;
  const people = profiles ?? [];

  const streaks = await chunked(
    people.map((p) => p.id),
    (c) => db.from("streaks").select("user_id, last_active_date").in("user_id", c),
  );
  const lastActive = new Map(streaks.map((s) => [s.user_id, s.last_active_date]));
  const eligible = people.filter((p) =>
    isDayOneCandidate({
      createdAt: p.created_at,
      lastActiveDate: lastActive.get(p.id) ?? null,
      now,
    }),
  );

  const exclusions = await loadExclusions(
    db,
    eligible.map((p) => p.id),
    "DAY_ONE_NUDGE",
    now,
  );
  const handled = new Set(exclusions.ledger.map((row) => row.user_id));
  const recipients: Recipient[] = [];
  for (const p of eligible) {
    if (exclusions.optedOut.has(p.id)) summary.skipped.optedOut += 1;
    else if (exclusions.premium.has(p.id)) summary.skipped.premium += 1;
    else if (handled.has(p.id)) summary.skipped.alreadyHandled += 1;
    else {
      recipients.push({
        userId: p.id,
        displayName: p.display_name,
        language: nudgeLanguage(p.preferred_language),
      });
    }
  }
  summary.candidates = recipients.length;

  await processRecipients({
    db,
    recipients,
    summary,
    limit,
    origin,
    priority: "bulk",
    makeEvent: (_r, holdout) => ({ type: "DAY_ONE_NUDGE", ...(holdout ? { holdout } : {}) }),
    buildEmail: (r, unsubscribe) =>
      dayOneNudgeEmail({ origin, displayName: r.displayName, language: r.language, unsubscribe }),
  });
  return summary;
}

/**
 * "Your lesson is waiting": learners away for 3 to 60 days, at most one email a week each, the
 * ones who left most recently first (they are the likeliest to come back). The offer line is added
 * only while an offer runs and only for learners who have not turned offers off.
 */
export async function runReminderNudge(options: {
  origin: string;
  now: Date;
  dryRun: boolean;
}): Promise<NudgeRunSummary> {
  const { origin, now, dryRun } = options;
  const summary = emptySummary(dryRun);
  const limit = gate(summary);
  if (limit === null) return summary;
  summary.warmup = await warmupStatus(now);

  const db = createServiceRoleClient();
  const window = reminderWindow(now);
  const { data: streaks, error } = await db
    .from("streaks")
    .select("user_id, last_active_date")
    .gte("last_active_date", window.from)
    .lte("last_active_date", window.to)
    .order("last_active_date", { ascending: false })
    .limit(4000);
  if (error) throw error;
  const away = (streaks ?? []).filter((row) => row.last_active_date);
  const ids = away.map((row) => row.user_id);

  const weekKey = dedupeKeyFor({ type: "INACTIVE_LEARNER", daysInactive: 0 }, now);
  const [exclusions, profiles, noOffers] = await Promise.all([
    loadExclusions(db, ids, "INACTIVE_LEARNER", now),
    chunked(ids, (c) =>
      db
        .from("profiles")
        .select("id, display_name, preferred_language")
        .eq("role", "user")
        .in("id", c),
    ),
    chunked(ids, (c) =>
      db.from("email_preferences").select("user_id").eq("offer_emails", false).in("user_id", c),
    ),
  ]);
  const handled = new Set(
    exclusions.ledger.filter((row) => row.dedupe_key === weekKey).map((row) => row.user_id),
  );
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const offerOptOut = new Set(noOffers.map((row) => row.user_id));

  const recipients: Recipient[] = [];
  for (const row of away) {
    const profile = profileById.get(row.user_id);
    if (!profile) continue; // an admin or a deleted profile
    if (exclusions.optedOut.has(row.user_id)) summary.skipped.optedOut += 1;
    else if (exclusions.premium.has(row.user_id)) summary.skipped.premium += 1;
    else if (handled.has(row.user_id)) summary.skipped.alreadyHandled += 1;
    else {
      recipients.push({
        userId: row.user_id,
        displayName: profile.display_name,
        language: nudgeLanguage(profile.preferred_language),
        daysInactive: Math.floor(
          (now.getTime() - Date.parse(row.last_active_date as string)) / 86_400_000,
        ),
        noOffers: offerOptOut.has(row.user_id),
      });
    }
  }
  summary.candidates = recipients.length;

  const offerRunning = isOfferActive(await getLaunchOffer(), now);
  await processRecipients({
    db,
    origin,
    recipients,
    summary,
    limit,
    priority: "bulk",
    makeEvent: (r, holdout) => ({
      type: "INACTIVE_LEARNER",
      daysInactive: r.daysInactive ?? 0,
      ...(holdout ? { holdout } : {}),
    }),
    buildEmail: (r, unsubscribe) =>
      reminderEmail({
        origin,
        displayName: r.displayName,
        language: r.language,
        unsubscribe,
        showOffer: offerRunning && !r.noOffers,
      }),
  });
  return summary;
}

/** The plan an order was for: the one whose price in that order's pricing tier matches what the order charged. */
/**
 * "Remind me tomorrow": the one email each learner chose on the lesson-ending screen, sent in the
 * hour they picked (the scheduler runs this every hour). Sends nothing until
 * SESSION_REMINDER_MAX_PER_RUN is a positive number (a dry run, which only counts, always works).
 * A learner who turned reminders off is skipped, and so is one who already studied that day; an
 * address Google has not verified is skipped like for every nudge. Nobody is held out of it (they
 * asked for it), a premium learner is emailed like anyone else, and a reminder more than six hours
 * late is dropped rather than sent at night. Each one is written to notification_events before it
 * is sent, so a repeated run can never email the same reminder twice.
 */
export async function runSessionReminders(options: {
  origin: string;
  now: Date;
  dryRun: boolean;
}): Promise<NudgeRunSummary> {
  const { origin, now, dryRun } = options;
  const summary = emptySummary(dryRun);
  const limit = reminderSendsPerRun(process.env.SESSION_REMINDER_MAX_PER_RUN);
  if (!dryRun) {
    if (limit === 0) {
      summary.disabled = true;
      return summary;
    }
    if (!getEmailProvider()) {
      summary.error = "No email provider is configured.";
      return summary;
    }
  }
  summary.warmup = await warmupStatus(now);

  const db = createServiceRoleClient();
  const { from, to } = reminderWindowBounds(now);
  // Reminders more than a day old are never going to be sent: tidy them away.
  if (!dryRun) {
    await db
      .from("session_reminders")
      .delete()
      .lt("remind_at", new Date(now.getTime() - 24 * 3_600_000).toISOString());
  }
  const { data: due, error } = await db
    .from("session_reminders")
    .select("user_id, remind_at")
    .gte("remind_at", from.toISOString())
    .lte("remind_at", to.toISOString())
    .order("remind_at")
    .limit(1000);
  if (error) throw error;
  const rows = due ?? [];
  if (rows.length === 0) return summary;

  const ids = rows.map((row) => row.user_id);
  const [profiles, progress, exclusions] = await Promise.all([
    chunked(ids, (c) =>
      db.from("profiles").select("id, display_name, preferred_language").in("id", c),
    ),
    chunked(ids, (c) =>
      db
        .from("user_progress")
        .select("user_id, completed_at")
        .in("user_id", c)
        .gte("completed_at", new Date(from.getTime() - REMINDER_RETURNED_WINDOW_MS).toISOString()),
    ),
    loadExclusions(db, ids, "SESSION_REMINDER", now),
  ]);
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const finishedByUser = new Map<string, string[]>();
  for (const entry of progress) {
    if (!entry.completed_at) continue;
    const list = finishedByUser.get(entry.user_id) ?? [];
    list.push(entry.completed_at);
    finishedByUser.set(entry.user_id, list);
  }
  const handled = new Set(exclusions.ledger.map((entry) => `${entry.user_id}|${entry.dedupe_key}`));

  const recipients: Recipient[] = [];
  for (const row of rows) {
    const day = row.remind_at.slice(0, 10);
    const profile = profileById.get(row.user_id);
    if (exclusions.optedOut.has(row.user_id)) summary.skipped.optedOut += 1;
    else if (hasReturnedBeforeReminder(row.remind_at, finishedByUser.get(row.user_id) ?? [])) {
      summary.skipped.returned += 1;
    } else if (handled.has(`${row.user_id}|SESSION_REMINDER:${day}`)) {
      summary.skipped.alreadyHandled += 1;
    } else {
      recipients.push({
        userId: row.user_id,
        displayName: profile?.display_name ?? null,
        language: nudgeLanguage(profile?.preferred_language),
        reminderDay: day,
      });
    }
  }
  summary.candidates = recipients.length;

  await processRecipients({
    db,
    recipients,
    summary,
    limit,
    origin,
    // The learner asked for this one, so it goes the way an important email does.
    priority: "important",
    skipHoldout: true,
    makeEvent: (r) => ({ type: "SESSION_REMINDER", day: r.reminderDay ?? "" }),
    buildEmail: (r, unsubscribe) =>
      sessionReminderEmail({
        origin,
        displayName: r.displayName,
        language: r.language,
        unsubscribe,
      }),
  });
  return summary;
}

function planOfOrder(tier: string, priceCents: number): PlanId | null {
  if (tier !== "A" && tier !== "B") return null;
  return PLAN_IDS.find((id) => planPriceCents(tier, id) === priceCents) ?? null;
}

/** What the checkout reminder may truthfully say about the offer right now, for this plan. */
function checkoutOffer(
  offer: LaunchOffer | null,
  now: Date,
  plan: PlanId | null,
): { days: number | null } | null {
  if (!isOfferActive(offer, now)) return null;
  const days = plan ? offerBonusDaysForPlan(offer, plan) : sharedBonusDays(offer);
  if (plan && days === 0) return null;
  return { days: days && days > 0 ? days : null };
}

/**
 * "Your plan is one step away": learners who opened checkout 2 to 30 hours ago and did not pay (left,
 * cancelled or timed out). A learner with a DECLINED payment in that window is skipped: those are
 * written to personally. The email names their own plan and price and the gift days of the offer
 * that runs on that plan.
 */
export async function runAbandonedCheckoutNudge(options: {
  origin: string;
  now: Date;
  dryRun: boolean;
}): Promise<NudgeRunSummary> {
  const { origin, now, dryRun } = options;
  const summary = emptySummary(dryRun);
  const limit = gate(summary);
  if (limit === null) return summary;
  summary.warmup = await warmupStatus(now);

  const db = createServiceRoleClient();
  const { data: orders, error } = await db
    .from("payment_orders")
    .select("user_id, status, created_at, pricing_tier, price_usd_cents")
    .eq("provider_env", "live")
    .in("status", [...ABANDONED_STATUSES, FAILED_STATUS])
    .gte("created_at", new Date(now.getTime() - ABANDONED_MAX_AGE_MS).toISOString())
    .lte("created_at", new Date(now.getTime() - ABANDONED_MIN_AGE_MS).toISOString())
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw error;

  // Newest order first, so the first row seen for a learner is the checkout they left last.
  const lastOrder = new Map<string, { tier: string; cents: number }>();
  const hadFailure = new Set<string>();
  for (const o of orders ?? []) {
    if (o.status === FAILED_STATUS) hadFailure.add(o.user_id);
    else if (!lastOrder.has(o.user_id)) {
      lastOrder.set(o.user_id, { tier: o.pricing_tier, cents: o.price_usd_cents });
    }
  }
  const ids = Array.from(new Set((orders ?? []).map((o) => o.user_id)));

  const bucket = abandonedBucket(now);
  const [paid, exclusions, profiles] = await Promise.all([
    chunked(ids, (c) =>
      db.from("payment_orders").select("user_id").eq("status", "fulfilled").in("user_id", c),
    ),
    loadExclusions(db, ids, "CHECKOUT_ABANDONED", now),
    chunked(ids, (c) =>
      db.from("profiles").select("id, display_name, preferred_language").in("id", c),
    ),
  ]);
  const everPaid = new Set(paid.map((row) => row.user_id));
  const handled = new Set(
    exclusions.ledger
      .filter((row) => row.dedupe_key === `CHECKOUT_ABANDONED:${bucket}`)
      .map((row) => row.user_id),
  );
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  const recipients: Recipient[] = [];
  for (const id of ids) {
    if (everPaid.has(id) || exclusions.premium.has(id)) summary.skipped.premium += 1;
    else if (hadFailure.has(id)) summary.skipped.failedPayment += 1;
    else if (exclusions.optedOut.has(id)) summary.skipped.optedOut += 1;
    else if (handled.has(id)) summary.skipped.alreadyHandled += 1;
    else {
      const profile = profileById.get(id);
      const order = lastOrder.get(id);
      recipients.push({
        userId: id,
        displayName: profile?.display_name ?? null,
        language: nudgeLanguage(profile?.preferred_language),
        plan: order ? planOfOrder(order.tier, order.cents) : null,
        priceCents: order?.cents ?? null,
      });
    }
  }
  summary.candidates = recipients.length;

  const offer = await getLaunchOffer();
  await processRecipients({
    db,
    recipients,
    summary,
    limit,
    origin,
    // The reminder that matters most goes out through Resend first, from the room kept for important mail.
    priority: "important",
    makeEvent: (_r, holdout) => ({
      type: "CHECKOUT_ABANDONED",
      bucket,
      ...(holdout ? { holdout } : {}),
    }),
    buildEmail: (r, unsubscribe) =>
      abandonedCheckoutEmail({
        origin,
        displayName: r.displayName,
        language: r.language,
        unsubscribe,
        plan: r.plan ?? null,
        priceCents: r.plan ? (r.priceCents ?? null) : null,
        offer: checkoutOffer(offer, now, r.plan ?? null),
      }),
  });
  return summary;
}

/**
 * Sends ONE sample of an email to an address, to see it in a real inbox (while the SES account is
 * still in its sandbox that address must be a verified one). Touches no learner, writes nothing.
 */
export async function sendNudgePreview(options: {
  kind: "day-one" | "abandoned" | "reminder" | "session-reminder";
  to: string;
  language: NudgeLanguage;
  origin: string;
}): Promise<{ status: "sent" | "queued"; detail?: string }> {
  const { kind, to, language, origin } = options;
  const now = new Date();
  const content =
    kind === "day-one"
      ? dayOneNudgeEmail({ origin, displayName: null, language })
      : kind === "session-reminder"
        ? sessionReminderEmail({ origin, displayName: null, language })
        : kind === "reminder"
          ? reminderEmail({
              origin,
              displayName: null,
              language,
              showOffer: isOfferActive(await getLaunchOffer(), now),
            })
          : abandonedCheckoutEmail({
              origin,
              displayName: null,
              language,
              plan: "3m",
              priceCents: planPriceCents("A", "3m"),
              offer: checkoutOffer(await getLaunchOffer(), now, "3m"),
            });
  // A sample goes the same way the real one would, so a preview also proves that route works.
  const result = await sendTemplateEmail(to, content, {
    priority: kind === "abandoned" || kind === "session-reminder" ? "important" : "bulk",
  });
  return result.status === "sent"
    ? { status: "sent" }
    : { status: "queued", detail: result.reason };
}
