import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { dedupeKeyFor } from "@/lib/email/events";
import type { NotificationEvent } from "@/lib/email/events";

const POSTGRES_UNIQUE_VIOLATION = "23505";

export type RecordNotificationEventResult =
  { status: "recorded"; id: string } | { status: "duplicate" };

/**
 * Idempotency guard for notification events, mirroring
 * src/lib/billing/webhook-events.ts: the unique (user_id, type, dedupe_key)
 * constraint (see the Milestone 9 migration) makes re-processing the same
 * milestone for the same user a no-op instead of a duplicate email.
 */
export async function recordNotificationEvent(
  userId: string,
  event: NotificationEvent,
  emailStatus: "queued" | "sent" | "skipped",
): Promise<RecordNotificationEventResult> {
  const supabase = createServiceRoleClient();
  const dedupeKey = dedupeKeyFor(event);

  const { data, error } = await supabase
    .from("notification_events")
    .insert({
      user_id: userId,
      type: event.type,
      dedupe_key: dedupeKey,
      payload: event,
      email_status: emailStatus,
    })
    .select("id")
    .single();

  if (!error) return { status: "recorded", id: data.id };
  if (error.code === POSTGRES_UNIQUE_VIOLATION) return { status: "duplicate" };
  throw error;
}

export async function markNotificationEventSent(id: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("notification_events")
    .update({ email_status: "sent" })
    .eq("id", id);
  if (error) throw error;
}
