import { createServiceRoleClient } from "@/lib/supabase/service-role";

const POSTGRES_UNIQUE_VIOLATION = "23505";

export type RecordWebhookEventResult =
  { status: "recorded" } | { status: "already-processed" } | { status: "retry" };

/**
 * The pure half of the decision below — given the existing row's
 * processed_at, was this delivery already fully handled (a genuine
 * duplicate) or did a previous attempt record the event and then fail
 * before finishing (a retry that must still (re)apply it)? Split out so it
 * doesn't require a live Supabase connection to test.
 */
export function classifyExistingWebhookEvent(
  processedAt: string | null,
): "already-processed" | "retry" {
  return processedAt ? "already-processed" : "retry";
}

/**
 * Idempotency guard for webhook deliveries. The provider's own event id is
 * the table's primary key (see the billing_events migration), so a
 * duplicate delivery — every provider's webhooks are "at least once", never
 * "exactly once" — fails this insert with a unique violation instead of
 * being processed twice.
 *
 * A unique violation alone isn't enough to call something a true duplicate,
 * though: the row is inserted *before* the subscription update runs (see
 * route.ts), so a redelivery arriving after a transient failure between
 * that insert and markWebhookEventProcessed would otherwise find the row,
 * assume it was fully handled, and silently never apply the event — a real
 * successful payment could then never grant premium. Distinguishing
 * "already processed" (processed_at set — a genuine duplicate, skip) from
 * "retry" (row exists but processed_at is still null — a previous attempt
 * didn't finish, so this delivery should still (re)apply the event) closes
 * that gap.
 */
export async function recordWebhookEvent(
  id: string,
  provider: string,
  type: string,
  payload: unknown,
): Promise<RecordWebhookEventResult> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("billing_events").insert({ id, provider, type, payload });

  if (!error) return { status: "recorded" };
  if (error.code !== POSTGRES_UNIQUE_VIOLATION) throw error;

  const { data, error: selectError } = await supabase
    .from("billing_events")
    .select("processed_at")
    .eq("id", id)
    .single();
  if (selectError) throw selectError;

  return { status: classifyExistingWebhookEvent(data.processed_at) };
}

export async function markWebhookEventProcessed(id: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("billing_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
