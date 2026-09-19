import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** The shape `PushManager.subscribe()` returns client-side (via `.toJSON()`), before it's split into the flat columns push_subscriptions stores. */
export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/**
 * RLS-scoped (auth.uid() = user_id) — safe to call from a Server Action on
 * the signed-in user's own behalf, same posture as updateEmailPreferences.
 * `endpoint` is globally unique per push_subscriptions' own constraint, so
 * re-subscribing the same browser (permission re-granted, SW re-registered)
 * upserts in place instead of accumulating duplicate rows for one device.
 */
export async function savePushSubscription(
  userId: string,
  subscription: PushSubscriptionInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" },
  );
  if (error) throw error;
}

/** Called both when the user explicitly disables push (Settings) and when the browser's own unsubscribe() already ran — matched by endpoint, not id, since the client only ever knows the endpoint. */
export async function deletePushSubscription(userId: string, endpoint: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", endpoint);
  if (error) throw error;
}

/** Whether this learner has at least one subscribed browser — the entire "is push enabled" signal (see the migration's own doc comment: no separate boolean column). */
export async function hasPushSubscription(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

/**
 * Service-role only (bypasses RLS to read across every user) — the cron
 * route's own lookup, batched into one `in(...)` query rather than one round
 * trip per inactive learner, same reasoning as that route's existing
 * email_preferences batch read.
 */
export async function getPushSubscriptionsForUsers(
  userIds: string[],
): Promise<Map<string, PushSubscriptionRecord[]>> {
  const byUserId = new Map<string, PushSubscriptionRecord[]>();
  if (userIds.length === 0) return byUserId;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth")
    .in("user_id", userIds);
  if (error) throw error;

  for (const row of data ?? []) {
    const list = byUserId.get(row.user_id) ?? [];
    list.push({ endpoint: row.endpoint, p256dh: row.p256dh, auth: row.auth });
    byUserId.set(row.user_id, list);
  }
  return byUserId;
}

/** Service-role only — called once a push service reports an endpoint as gone (404/410), the same signal the browser itself would eventually surface as a revoked permission. */
export async function deletePushSubscriptionByEndpoint(endpoint: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) throw error;
}
