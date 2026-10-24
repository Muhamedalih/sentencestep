import { NextResponse } from "next/server";

import { REMINDER_WINDOW_DAYS, planExpiryReminders } from "@/lib/billing/expiry-reminders";
import { loadExpiryProgress } from "@/lib/billing/expiry-progress";
import { isValidCronAuth } from "@/lib/cron/auth";
import type { NotificationEvent } from "@/lib/email/events";
import {
  markNotificationEventSent,
  recordNotificationEvent,
} from "@/lib/email/notification-events";
import { nudgeLanguage } from "@/lib/email/nudges/copy";
import { getEmailProvider } from "@/lib/email/provider-registry";
import { sendTemplateEmail } from "@/lib/email/send";
import { premiumExpiryEmail } from "@/lib/email/templates/premium-expiry";
import { formatLongDate } from "@/lib/i18n/format-date";
import { getRequestOrigin } from "@/lib/request-origin";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Tells learners whose paid Premium period is ending soon, once at about a
 * week out and once at about three days out, with a link to add days. Called
 * by an external scheduler (.github/workflows/cron.yml), never by a browser.
 *
 * Fails closed like the other cron routes: no CRON_SECRET, or a wrong one, and
 * nothing runs. With no email provider configured it does nothing at all
 * rather than record a reminder it could not send, so turning email on later
 * still reaches everyone whose period is still ending.
 *
 * Each reminder is claimed in the notification ledger (unique per learner,
 * stage and end date) before it is sent, so a repeated or overlapping run can
 * never send the same one twice; buying more days moves the end date and so
 * starts a fresh pair. This is an account notice about paid access, not one of
 * the optional email categories, so it is not gated by email_preferences.
 */

/** Bounded like the other sweeps, so one run stays well inside the function time limit; anyone left over is picked up on the next daily run. */
const MAX_REMINDERS_PER_RUN = 300;

async function handlePremiumExpiryCron(request: Request): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 501 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (!isValidCronAuth(authHeader, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!getEmailProvider()) {
    return NextResponse.json({ skipped: "No email provider is configured." });
  }

  const supabase = createServiceRoleClient();
  const now = new Date();
  // The public address this call was sent to (not the server's own 0.0.0.0:3000
  // bind address); a client-sent Origin header is not trustworthy for links put
  // into real users' mail.
  const origin = getRequestOrigin(request);
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 86_400_000);

  const { data: rows, error } = await supabase
    .from("subscriptions")
    .select("user_id, current_period_end")
    .eq("plan", "premium")
    .in("status", ["active", "trialing"])
    .gt("current_period_end", now.toISOString())
    .lte("current_period_end", windowEnd.toISOString())
    .limit(MAX_REMINDERS_PER_RUN);
  if (error) {
    return NextResponse.json({ error: "Failed to read subscriptions." }, { status: 500 });
  }

  const subscriptions = (rows ?? []).flatMap((row) =>
    row.current_period_end ? [{ userId: row.user_id, periodEnd: row.current_period_end }] : [],
  );

  const { data: streaks } = subscriptions.length
    ? await supabase
        .from("streaks")
        .select("user_id, current_streak, last_active_date")
        .in(
          "user_id",
          subscriptions.map((subscription) => subscription.userId),
        )
    : { data: [] };

  const due = planExpiryReminders({ subscriptions, streaks: streaks ?? [], now });

  // Each learner is written to in their own language (ar, es or tr; English otherwise).
  const dueIds = due.map((reminder) => reminder.userId);
  const { data: languages } = dueIds.length
    ? await supabase.from("profiles").select("id, preferred_language").in("id", dueIds)
    : { data: [] };
  const languageById = new Map(
    (languages ?? []).map((row) => [row.id, nudgeLanguage(row.preferred_language)]),
  );

  // One honest line about what each has done (sentences, days practised) when there is enough to say.
  const progressById = await loadExpiryProgress(dueIds);

  let notified = 0;
  let failed = 0;

  for (const reminder of due) {
    const event: NotificationEvent = {
      type: "PREMIUM_EXPIRY_REMINDER",
      stage: reminder.stage,
      periodEnd: reminder.periodEnd,
    };

    const record = await recordNotificationEvent(reminder.userId, event, "queued");
    if (record.status === "duplicate") continue;

    const { data: authUser } = await supabase.auth.admin.getUserById(reminder.userId);
    const email = authUser.user?.email;
    if (!email) continue;

    const displayName = (authUser.user?.user_metadata?.display_name as string | undefined) ?? null;
    const language = languageById.get(reminder.userId) ?? "en";
    const content = premiumExpiryEmail({
      origin,
      displayName,
      endsOn: formatLongDate(reminder.periodEnd, language === "en" ? null : language),
      daysLeft: reminder.daysLeft,
      streak: reminder.streak,
      progress: progressById.get(reminder.userId) ?? null,
      language,
    });

    // A transient provider failure for one learner must not stop everyone after them.
    try {
      const result = await sendTemplateEmail(email, content);
      if (result.status === "sent") {
        await markNotificationEventSent(record.id);
        notified += 1;
      }
    } catch (error) {
      failed += 1;
      console.error("[cron:premium-expiry-reminders] sendTemplateEmail failed", {
        userId: reminder.userId,
        error,
      });
    }
  }

  return NextResponse.json({ due: due.length, notified, failed });
}

export async function GET(request: Request): Promise<NextResponse> {
  return handlePremiumExpiryCron(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  return handlePremiumExpiryCron(request);
}
