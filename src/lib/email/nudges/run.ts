import { isOfferActive } from "@/lib/billing/launch-offer";
import { getLaunchOffer } from "@/lib/billing/launch-offer-queries";
import type { NotificationEvent } from "@/lib/email/events";
import {
  markNotificationEventSent,
  recordNotificationEvent,
} from "@/lib/email/notification-events";
import { abandonedCheckoutEmail, dayOneNudgeEmail, nudgeLanguage } from "@/lib/email/nudges/copy";
import type { NudgeLanguage } from "@/lib/email/nudges/copy";
import {
  ABANDONED_MAX_AGE_MS,
  ABANDONED_MIN_AGE_MS,
  ABANDONED_STATUSES,
  DAY_ONE_MAX_AGE_MS,
  DAY_ONE_MIN_AGE_MS,
  abandonedBucket,
  canEmailAccount,
  holdoutPercent,
  isDayOneCandidate,
  isHoldout,
  maxSendsPerRun,
} from "@/lib/email/nudges/select";
import { getEmailProvider, resolveReplyTo } from "@/lib/email/provider-registry";
import { sendTemplateEmail } from "@/lib/email/send";
import type { EmailContent } from "@/lib/email/templates/layout";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * The two nudge emails (see copy.ts) planned and sent. Nothing here sends unless
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
  };
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
    },
  };
}

interface Recipient {
  userId: string;
  displayName: string | null;
  language: NudgeLanguage;
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
  recipients: Recipient[];
  makeEvent: (holdout: boolean) => NotificationEvent;
  buildEmail: (recipient: Recipient) => EmailContent;
  summary: NudgeRunSummary;
  limit: number;
}): Promise<void> {
  const { db, recipients, makeEvent, buildEmail, summary, limit } = args;
  const percent = holdoutPercent(process.env.NUDGE_EMAIL_HOLDOUT_PERCENT);
  const allowPassword = process.env.NUDGE_EMAIL_ALLOW_PASSWORD_ACCOUNTS === "true";
  let lookups = 0;

  for (const recipient of recipients) {
    if (isHoldout(recipient.userId, percent)) {
      summary.holdout += 1;
      if (!summary.dryRun)
        await recordNotificationEvent(recipient.userId, makeEvent(true), "skipped");
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
    const record = await recordNotificationEvent(recipient.userId, makeEvent(false), "queued");
    if (record.status === "duplicate") {
      summary.skipped.alreadyHandled += 1;
      continue;
    }
    try {
      const result = await sendTemplateEmail(user.email, buildEmail(recipient));
      if (result.status === "sent") {
        await markNotificationEventSent(record.id);
        summary.sent += 1;
      } else {
        summary.failed += 1;
      }
    } catch (error) {
      summary.failed += 1;
      console.error("[nudge] send failed", { userId: recipient.userId, error });
    }
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
    makeEvent: (holdout) => ({ type: "DAY_ONE_NUDGE", ...(holdout ? { holdout } : {}) }),
    buildEmail: (r) =>
      dayOneNudgeEmail({ origin, displayName: r.displayName, language: r.language }),
  });
  return summary;
}

/** What the payment email may truthfully mention right now. */
async function paymentFacts(now: Date) {
  let binancePay = false;
  try {
    binancePay = (await getEffectiveFeatures()).binancePay.enabled;
  } catch {
    // Unknown means "do not mention it".
  }
  return {
    binancePay,
    offerRunning: isOfferActive(await getLaunchOffer(), now),
    canReply: resolveReplyTo(process.env.EMAIL_REPLY_TO_ADDRESS) !== undefined,
  };
}

/** "Did something go wrong with your payment?": orders started 2 to 30 hours ago that did not end in Premium. */
export async function runAbandonedCheckoutNudge(options: {
  origin: string;
  now: Date;
  dryRun: boolean;
}): Promise<NudgeRunSummary> {
  const { origin, now, dryRun } = options;
  const summary = emptySummary(dryRun);
  const limit = gate(summary);
  if (limit === null) return summary;

  const db = createServiceRoleClient();
  const { data: orders, error } = await db
    .from("payment_orders")
    .select("user_id")
    .eq("provider_env", "live")
    .in("status", [...ABANDONED_STATUSES])
    .gte("created_at", new Date(now.getTime() - ABANDONED_MAX_AGE_MS).toISOString())
    .lte("created_at", new Date(now.getTime() - ABANDONED_MIN_AGE_MS).toISOString())
    .limit(5000);
  if (error) throw error;
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
    else if (exclusions.optedOut.has(id)) summary.skipped.optedOut += 1;
    else if (handled.has(id)) summary.skipped.alreadyHandled += 1;
    else {
      const profile = profileById.get(id);
      recipients.push({
        userId: id,
        displayName: profile?.display_name ?? null,
        language: nudgeLanguage(profile?.preferred_language),
      });
    }
  }
  summary.candidates = recipients.length;

  const facts = await paymentFacts(now);
  await processRecipients({
    db,
    recipients,
    summary,
    limit,
    makeEvent: (holdout) => ({
      type: "CHECKOUT_ABANDONED",
      bucket,
      ...(holdout ? { holdout } : {}),
    }),
    buildEmail: (r) =>
      abandonedCheckoutEmail({
        origin,
        displayName: r.displayName,
        language: r.language,
        ...facts,
      }),
  });
  return summary;
}

/**
 * Sends ONE sample of an email to an address, to see it in a real inbox (while the SES account is
 * still in its sandbox that address must be a verified one). Touches no learner, writes nothing.
 */
export async function sendNudgePreview(options: {
  kind: "day-one" | "abandoned";
  to: string;
  language: NudgeLanguage;
  origin: string;
}): Promise<{ status: "sent" | "queued"; detail?: string }> {
  const { kind, to, language, origin } = options;
  const content =
    kind === "day-one"
      ? dayOneNudgeEmail({ origin, displayName: null, language })
      : abandonedCheckoutEmail({
          origin,
          displayName: null,
          language,
          ...(await paymentFacts(new Date())),
        });
  const result = await sendTemplateEmail(to, content);
  return result.status === "sent"
    ? { status: "sent" }
    : { status: "queued", detail: result.reason };
}
