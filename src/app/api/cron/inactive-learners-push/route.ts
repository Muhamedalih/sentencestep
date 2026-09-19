import { NextResponse } from "next/server";

import { isValidCronAuth } from "@/lib/cron/auth";
import type { NotificationEvent } from "@/lib/email/events";
import { getInactiveLearners } from "@/lib/email/inactive-learners";
import {
  markNotificationEventSent,
  recordNotificationEvent,
} from "@/lib/email/notification-events";
import {
  getPushSubscriptionsForUsers,
  deletePushSubscriptionByEndpoint,
} from "@/lib/push/subscriptions";
import { isPushConfigured, sendPushNotification, PushSubscriptionGoneError } from "@/lib/push/send";

/**
 * The push-notification sibling of /api/cron/inactive-learners: same
 * inactivity signal (getInactiveLearners), completely independent opt-in
 * (a push_subscriptions row instead of email_preferences.learning_reminders)
 * and its own dedupe ledger entry (INACTIVE_LEARNER_PUSH, not
 * INACTIVE_LEARNER — see events.ts's doc comment on that type) so a learner
 * who gets the email can still get the push, and vice versa. Kept as a
 * separate route rather than folded into inactive-learners/route.ts so each
 * channel stays independently testable/triggerable, matching how
 * translation-sweep/voice-sweep are already separate single-purpose routes.
 *
 * Same bound as inactive-learners for the same reason (see that route's own
 * doc comment on MAX_NOTIFICATIONS_PER_RUN) — a learner left over this run
 * is still eligible tomorrow, nobody is skipped forever.
 */
const MAX_NOTIFICATIONS_PER_RUN = 500;

const PUSH_TITLE = "SentenceStep";
const PUSH_BODY =
  "You haven't practiced in a few days. Your next lesson is ready whenever you are.";

async function handleInactiveLearnersPushCron(request: Request): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 501 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (!isValidCronAuth(authHeader, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Web Push is not configured." }, { status: 501 });
  }

  let inactiveLearners;
  try {
    inactiveLearners = (await getInactiveLearners(new Date())).slice(0, MAX_NOTIFICATIONS_PER_RUN);
  } catch {
    return NextResponse.json({ error: "Failed to read learner activity." }, { status: 500 });
  }

  let notified = 0;
  let skipped = 0;
  let failed = 0;

  if (inactiveLearners.length > 0) {
    const subscriptionsByUserId = await getPushSubscriptionsForUsers(
      inactiveLearners.map((row) => row.userId),
    );

    for (const { userId, daysInactive } of inactiveLearners) {
      const subscriptions = subscriptionsByUserId.get(userId);
      if (!subscriptions || subscriptions.length === 0) {
        // The common case — most learners have never enabled push at all.
        skipped += 1;
        continue;
      }

      const event: NotificationEvent = { type: "INACTIVE_LEARNER_PUSH", daysInactive };
      const record = await recordNotificationEvent(userId, event, "queued");
      if (record.status === "duplicate") continue;

      // One learner can have several subscribed browsers/devices — send to
      // all of them, same as any other multi-device push setup, and treat
      // the event as "sent" if at least one actually went through.
      let sentToAny = false;
      for (const subscription of subscriptions) {
        try {
          await sendPushNotification(subscription, {
            title: PUSH_TITLE,
            body: PUSH_BODY,
            url: "/learn",
          });
          sentToAny = true;
        } catch (error) {
          if (error instanceof PushSubscriptionGoneError) {
            await deletePushSubscriptionByEndpoint(subscription.endpoint);
            continue;
          }
          failed += 1;
          console.error("[cron:inactive-learners-push] sendPushNotification failed", {
            userId,
            error,
          });
        }
      }

      if (sentToAny) {
        await markNotificationEventSent(record.id);
        notified += 1;
      }
    }
  }

  return NextResponse.json({ notified, skipped, failed });
}

export async function GET(request: Request): Promise<NextResponse> {
  return handleInactiveLearnersPushCron(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  return handleInactiveLearnersPushCron(request);
}
