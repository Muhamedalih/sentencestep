import { NextResponse } from "next/server";

import { applyBillingEvent } from "@/lib/billing/domain";
import { getBillingProvider } from "@/lib/billing/provider-registry";
import { markWebhookEventProcessed, recordWebhookEvent } from "@/lib/billing/webhook-events";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Where the configured payment provider's webhooks land. 501s honestly
 * (never fakes signature verification or event processing) when no
 * provider is configured — see provider-registry.ts. PayTabs sends its
 * HMAC signature in a `signature` header (see providers/paytabs.ts); the
 * `x-webhook-signature` fallback is kept for a possible future provider
 * that uses that more generic convention instead.
 *
 * Every event is looked up by providerCustomerId, not
 * providerSubscriptionId: the PayTabs adapter sets providerCustomerId to
 * the app's own user_id (PayTabs has no separate customer object for a
 * plain hosted-checkout sale — see that adapter's doc comment), and every
 * user already has exactly one subscriptions row from signup (see the
 * handle_new_user trigger), so this is a direct, always-present lookup
 * rather than one that depends on a prior event having set a provider id.
 * A future provider with real persistent customer objects can still use
 * this same field; the row is a global unique-user-id, provider-agnostic
 * throughout.
 */
export async function POST(request: Request) {
  const provider = getBillingProvider();

  if (!provider) {
    return NextResponse.json({ error: "No billing provider is configured yet." }, { status: 501 });
  }

  const signatureHeader =
    request.headers.get("signature") ?? request.headers.get("x-webhook-signature");
  const rawBody = await request.text();

  let event;
  try {
    event = provider.verifyWebhookSignature(rawBody, signatureHeader);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const record = await recordWebhookEvent(event.id, provider.name, event.type, event.data);
  if (record.status === "already-processed") {
    return NextResponse.json({ received: true, duplicate: true });
  }
  // "retry": recorded on a prior delivery but never finished processing —
  // fall through and (re)apply the event rather than silently dropping it.

  const billingEvents = provider.translateWebhookEvent(event);
  const supabase = createServiceRoleClient();

  for (const billingEvent of billingEvents) {
    const { data: current, error: fetchError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", billingEvent.providerCustomerId)
      .maybeSingle();
    if (fetchError) throw fetchError;
    // No matching user — nothing safe to apply. Never invented/guessed.
    if (!current) continue;

    const next = applyBillingEvent(
      {
        plan: current.plan,
        status: current.status,
        currentPeriodStart: current.current_period_start,
        currentPeriodEnd: current.current_period_end,
        cancelAtPeriodEnd: current.cancel_at_period_end,
        providerCustomerId: current.provider_customer_id,
        providerSubscriptionId: current.provider_subscription_id,
      },
      billingEvent,
    );

    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        plan: next.plan,
        status: next.status,
        current_period_start: next.currentPeriodStart,
        current_period_end: next.currentPeriodEnd,
        cancel_at_period_end: next.cancelAtPeriodEnd,
        provider: provider.name,
        provider_customer_id: next.providerCustomerId,
        provider_subscription_id: next.providerSubscriptionId,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", billingEvent.providerCustomerId);
    if (updateError) throw updateError;
  }

  await markWebhookEventProcessed(event.id);

  return NextResponse.json({ received: true });
}
