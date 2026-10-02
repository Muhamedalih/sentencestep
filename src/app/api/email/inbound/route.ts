import { NextResponse } from "next/server";

import { fetchReceivedEmail } from "@/lib/email/inbound/fetch";
import { buildInboundEmailRow, parseInboundWebhook } from "@/lib/email/inbound/parse";
import { verifyWebhookSignature } from "@/lib/email/inbound/signature";
import { inboundEmailExists, storeInboundEmail } from "@/lib/email/inbound/store";
import { isServiceRoleConfigured } from "@/lib/supabase/service-role";

/**
 * Where Resend posts `email.received` when a learner replies to one of our
 * emails (Reply-To must be an address on the receiving domain — see
 * .env.example). Stores the message for Admin > Inbox.
 *
 * Follows the billing webhook's rules: 501 (never a fake success) when not
 * configured, signature verified against the RAW body before anything is
 * parsed, and idempotent — a redelivery is acknowledged without storing a
 * second copy. Non-`email.received` events and unusable senders get a 200 so
 * the provider doesn't retry something that can never succeed; a failure to
 * fetch the body or write the row returns 5xx so it does retry.
 */
export async function POST(request: Request) {
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;

  if (!secret || !apiKey || !isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Inbound email isn't configured yet." }, { status: 501 });
  }

  const rawBody = await request.text();

  const verified = verifyWebhookSignature({
    body: rawBody,
    id: request.headers.get("svix-id"),
    timestamp: request.headers.get("svix-timestamp"),
    signature: request.headers.get("svix-signature"),
    secret,
  });
  if (!verified) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const event = parseInboundWebhook(rawBody);
  if (!event) return NextResponse.json({ received: true, ignored: true });

  try {
    if (await inboundEmailExists(event.emailId)) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    const content = await fetchReceivedEmail(event.emailId, apiKey);
    const row = buildInboundEmailRow(event, content, new Date().toISOString());
    if (!row) return NextResponse.json({ received: true, ignored: true });

    const result = await storeInboundEmail(row);
    return NextResponse.json({ received: true, duplicate: result === "duplicate" });
  } catch (error) {
    console.error("[inbound-email] failed to process webhook", error);
    return NextResponse.json({ error: "Couldn't process this email." }, { status: 500 });
  }
}
