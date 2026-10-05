import { createHmac } from "node:crypto";

import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getAccessState } from "@/lib/billing/access";
import { getAccessSettings } from "@/lib/billing/access-settings-queries";
import { freeForAllAppliesTo, parseExcludedEmails } from "@/lib/billing/free-access";
import { resolvePricingCountry } from "@/lib/billing/geo-pricing";
import { TIER_PRICE_USD_CENTS, formatUsd, tierForCountry } from "@/lib/billing/pricing";
import {
  listOwnOrderReferences,
  listOwnOrders,
  listRecordedWaylEvents,
  listWebhookAttempts,
} from "@/lib/billing/payments/webhook-attempts";
import type { PaymentProvider } from "@/lib/billing/payment-provider";
import { getPaymentProvider } from "@/lib/billing/provider-registry";
import { getSiteUrl } from "@/lib/site-url";
import { getCurrentUser } from "@/lib/supabase/auth";

// Per request and per visitor: never cached or shared.
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

function briefError(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 300) : "unknown error";
}

/** Asks Wayl about the visitor's own latest orders with the same batch call the reconcile job makes. */
async function lookUpOrdersInBatch(provider: PaymentProvider, references: string[]) {
  try {
    const payments = await provider.getPayments(references);
    return payments.map((payment) => ({
      status: payment.status,
      providerStatus: payment.rawStatus,
      amount: payment.amount,
      currency: payment.currency,
      completed: payment.paidAt !== null,
    }));
  } catch (error) {
    return { error: briefError(error) };
  }
}

/**
 * Sends this deployment's own webhook endpoint a delivery signed the way the
 * adapter expects, through the public URL, so the route, the raw body, the
 * signature check and the audit write are exercised end to end. It names the
 * visitor's latest order, which a webhook can only ever re-verify with Wayl.
 */
async function pingOwnWebhook(referenceId: string) {
  const body = JSON.stringify({
    verb: "POST",
    event: "test.ping",
    referenceId,
    paymentStatus: "Complete",
  });
  const signature = createHmac("sha256", process.env.WAYL_WEBHOOK_SECRET ?? "")
    .update(body)
    .digest("hex");
  try {
    const response = await fetch(`${getSiteUrl().replace(/\/+$/, "")}/api/billing/webhook/wayl`, {
      method: "POST",
      headers: {
        "content-type": "text/plain",
        "x-wayl-signature-256": signature,
        "user-agent": "sentencestep-selfcheck",
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    return { status: response.status, body: await response.json().catch(() => null) };
  } catch (error) {
    return { error: briefError(error) };
  }
}

async function runSelfCheck(userId: string, provider: PaymentProvider | null) {
  if (!provider) return { error: "no_provider_configured" };
  const references = await listOwnOrderReferences(userId);
  const latest = references[0];
  if (!latest) return { error: "no_orders_yet" };

  const [batchLookup, webhookPing] = await Promise.all([
    lookUpOrdersInBatch(provider, references),
    pingOwnWebhook(latest),
  ]);
  return { batchLookup, webhookPing };
}

/**
 * Temporary pre-launch diagnostics for trying the payment flow on a Netlify
 * deploy preview. For the signed-in visitor only, it reports what this
 * deployment's server actually sees: the origin Wayl is told to call back, the
 * Wayl mode, the country and price, whether the free-access promotion applies
 * to this account, their own latest orders, and what Wayl's webhook has
 * delivered (kind and shape only). It never returns a key, a secret, a
 * signature, anyone's email or any personal detail, and it does not exist on a
 * deployment taking real payments (WAYL_ENV=live). Remove it once the payment
 * flow has been verified.
 *
 * Adding ?check=1 also runs a self-check: the batch lookup the reconcile job
 * depends on, against Wayl itself, and a signed delivery to this deployment's
 * own webhook endpoint.
 */
export async function GET(request: Request) {
  if (process.env.WAYL_ENV === "live") {
    return new NextResponse("Not found", { status: 404, headers: NO_STORE });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ signedIn: false }, { headers: NO_STORE });

  try {
    const excludedRaw = process.env.FREE_ACCESS_EXCLUDED_EMAILS;
    const excluded = parseExcludedEmails(excludedRaw);
    const provider = getPaymentProvider();
    // Before the lists below are read, so its own delivery shows up in them.
    const selfCheck =
      new URL(request.url).searchParams.get("check") === "1"
        ? await runSelfCheck(user.id, provider)
        : undefined;
    const [settings, access, requestHeaders, orders, events, attempts] = await Promise.all([
      getAccessSettings(),
      getAccessState(),
      headers(),
      listOwnOrders(user.id),
      listRecordedWaylEvents(),
      listWebhookAttempts(),
    ]);
    const { country, source } = resolvePricingCountry(requestHeaders);
    const tier = tierForCountry(country);

    return NextResponse.json(
      {
        signedIn: true,
        site: { url: getSiteUrl() },
        wayl: { configured: provider !== null, environment: provider?.environment ?? null },
        pricing: {
          country,
          source,
          tier,
          price: formatUsd(TIER_PRICE_USD_CENTS[tier]),
        },
        access: {
          promotionOn: settings.freeForAll,
          exclusionListEntries: excluded.size,
          yourEmailIsListed: excluded.has(user.email.trim().toLowerCase()),
          promotionAppliesToYou: freeForAllAppliesTo(settings.freeForAll, user.email, excludedRaw),
          yourAccessIsPremium: access.isPremium,
          yourAccessEndsAt: access.expiresAt,
        },
        yourOrders: orders,
        webhookEventsRecorded: events,
        webhookDeliveries: attempts,
        ...(selfCheck !== undefined && { selfCheck }),
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error("[payments] test-status failed", error);
    return NextResponse.json(
      { signedIn: true, error: "status_check_failed" },
      {
        status: 500,
        headers: NO_STORE,
      },
    );
  }
}
