import { randomUUID } from "node:crypto";

import type { WaylAttemptSummary } from "@/lib/billing/providers/wayl-diagnostics";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Temporary test-mode log of webhook deliveries, kept in billing_events under
 * its own provider name so it never mixes with the real, signature-verified
 * events (provider "wayl"). Written by the webhook route while WAYL_ENV=test
 * and read by /api/billing/test-status. Remove with them once the flow has
 * been verified.
 */
const ATTEMPT_PROVIDER = "wayl-diagnostic";

export async function recordWebhookAttempt(summary: WaylAttemptSummary): Promise<void> {
  const { error } = await createServiceRoleClient()
    .from("billing_events")
    .insert({
      id: `diag:${new Date().toISOString()}:${randomUUID().slice(0, 8)}`,
      provider: ATTEMPT_PROVIDER,
      type: "webhook_attempt",
      payload: summary,
    });
  if (error) throw error;
}

export async function listWebhookAttempts(limit = 5) {
  const { data, error } = await createServiceRoleClient()
    .from("billing_events")
    .select("created_at, payload")
    .eq("provider", ATTEMPT_PROVIDER)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => ({ at: row.created_at, summary: row.payload }));
}

/** The real, verified Wayl events: kind and timing only, nothing from the payload. */
export async function listRecordedWaylEvents(limit = 5) {
  const { data, error } = await createServiceRoleClient()
    .from("billing_events")
    .select("created_at, type, processed_at")
    .eq("provider", "wayl")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    at: row.created_at,
    type: row.type,
    processedAt: row.processed_at,
  }));
}

/** The visitor's own most recent orders, without any reference or link. */
export async function listOwnOrders(userId: string, limit = 3) {
  const { data, error } = await createServiceRoleClient()
    .from("payment_orders")
    .select(
      "created_at, status, provider_status, charge_amount, charge_currency, pricing_country, premium_period_end, failure_reason",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/** The references of the visitor's own latest orders, newest first. For server use only; never sent to the browser. */
export async function listOwnOrderReferences(userId: string, limit = 3): Promise<string[]> {
  const { data, error } = await createServiceRoleClient()
    .from("payment_orders")
    .select("reference_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => row.reference_id);
}
