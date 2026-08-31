import { NextResponse } from "next/server";

import { isValidCronAuth } from "@/lib/cron/auth";
import { shouldNotify } from "@/lib/email/events";
import type { NotificationEvent } from "@/lib/email/events";
import {
  markNotificationEventSent,
  recordNotificationEvent,
} from "@/lib/email/notification-events";
import { sendTemplateEmail } from "@/lib/email/send";
import { learningReminderEmail } from "@/lib/email/templates/reminder";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Identifies learners inactive long enough to warrant a reminder and sends
 * one — triggered by an external scheduler, never by a user's browser being
 * open. vercel.json at the repo root registers this on a daily Vercel Cron
 * schedule once deployed there; any other scheduler that can call a URL on a
 * timer (a GitHub Actions schedule, cron-job.org) works the same way.
 *
 * Fails closed: without CRON_SECRET configured, or without a matching
 * Authorization header, this never runs.
 *
 * Handles both GET and POST with identical logic (see the two exports at
 * the bottom): Vercel Cron invokes scheduled endpoints with GET, while other
 * schedulers (GitHub Actions, cron-job.org, a manual curl) more commonly use
 * POST — both are gated by the exact same isValidCronAuth check either way.
 */
async function handleInactiveLearnersCron(request: Request): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 501 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (!isValidCronAuth(authHeader, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const now = new Date();
  // Unlike a browser-originated Server Action (where the Origin header is
  // set by the browser itself and can't be spoofed from page content), this
  // is a machine-to-machine call — any client that knows CRON_SECRET could
  // set an arbitrary Origin header. The request URL's own origin is
  // trustworthy (it's how the request reached this server), a client-sent
  // header is not, so only the former is used to build links in the emails
  // this sends to real users.
  const origin = new URL(request.url).origin;

  const { data: streaks, error: streaksError } = await supabase
    .from("streaks")
    .select("user_id, last_active_date");
  if (streaksError) {
    return NextResponse.json({ error: "Failed to read learner activity." }, { status: 500 });
  }

  // Everything below this filter has a real side effect (notification
  // ledger write, an outbound email) or an ordering requirement (the
  // idempotency check must run before sending), so it stays per-row and
  // sequential. This preferences lookup is a plain read with no such
  // constraint, so it's batched into one query instead of one-per-eligible-row
  // — the previous version did a round trip per streak row that passed
  // shouldNotify, which scales linearly with active learner count.
  const eligible = (streaks ?? []).filter((row) => {
    if (!row.last_active_date) return false;
    const daysInactive = Math.floor(
      (now.getTime() - new Date(row.last_active_date).getTime()) / 86_400_000,
    );
    return shouldNotify({ type: "INACTIVE_LEARNER", daysInactive });
  });

  const { data: prefsRows } = eligible.length
    ? await supabase
        .from("email_preferences")
        .select("user_id, learning_reminders")
        .in(
          "user_id",
          eligible.map((row) => row.user_id),
        )
    : { data: [] };
  const prefsByUserId = new Map((prefsRows ?? []).map((p) => [p.user_id, p]));

  let notified = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of eligible) {
    const daysInactive = Math.floor(
      (now.getTime() - new Date(row.last_active_date!).getTime()) / 86_400_000,
    );
    const event: NotificationEvent = { type: "INACTIVE_LEARNER", daysInactive };

    const prefs = prefsByUserId.get(row.user_id);
    if (prefs && !prefs.learning_reminders) {
      skipped += 1;
      continue;
    }

    const record = await recordNotificationEvent(row.user_id, event, "queued");
    if (record.status === "duplicate") continue;

    const { data: authUser } = await supabase.auth.admin.getUserById(row.user_id);
    const email = authUser.user?.email;
    if (!email) continue;

    const displayName = (authUser.user?.user_metadata?.display_name as string | undefined) ?? null;
    const content = learningReminderEmail({ origin, displayName, daysInactive });

    // A real provider call can fail transiently (rate limit, timeout) for
    // one learner without that being a reason to abort the whole run and
    // skip every learner after them — each send is isolated so one failure
    // is logged and counted, not thrown past this loop.
    try {
      const result = await sendTemplateEmail(email, content);
      if (result.status === "sent") {
        await markNotificationEventSent(record.id);
        notified += 1;
      }
    } catch (error) {
      failed += 1;
      console.error("[cron:inactive-learners] sendTemplateEmail failed", {
        userId: row.user_id,
        error,
      });
    }
  }

  return NextResponse.json({ notified, skipped, failed });
}

export async function GET(request: Request): Promise<NextResponse> {
  return handleInactiveLearnersCron(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  return handleInactiveLearnersCron(request);
}
