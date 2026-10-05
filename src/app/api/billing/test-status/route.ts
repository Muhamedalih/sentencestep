import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getAccessState } from "@/lib/billing/access";
import { getAccessSettings } from "@/lib/billing/access-settings-queries";
import { freeForAllAppliesTo, parseExcludedEmails } from "@/lib/billing/free-access";
import { resolvePricingCountry } from "@/lib/billing/geo-pricing";
import { TIER_PRICE_USD_CENTS, formatUsd, tierForCountry } from "@/lib/billing/pricing";
import {
  listOwnOrders,
  listRecordedWaylEvents,
  listWebhookAttempts,
} from "@/lib/billing/payments/webhook-attempts";
import { getPaymentProvider } from "@/lib/billing/provider-registry";
import { getSiteUrl } from "@/lib/site-url";
import { getCurrentUser } from "@/lib/supabase/auth";

// Per request and per visitor: never cached or shared.
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

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
 */
export async function GET() {
  if (process.env.WAYL_ENV === "live") {
    return new NextResponse("Not found", { status: 404, headers: NO_STORE });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ signedIn: false }, { headers: NO_STORE });

  try {
    const excludedRaw = process.env.FREE_ACCESS_EXCLUDED_EMAILS;
    const excluded = parseExcludedEmails(excludedRaw);
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
    const provider = getPaymentProvider();

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
