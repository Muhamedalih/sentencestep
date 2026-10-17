import { cookies, headers } from "next/headers";

import { ATTRIBUTION_COOKIE, attributionProperties } from "@/lib/analytics/attribution";
import { resolvePricingCountry } from "@/lib/billing/geo-pricing";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { AnalyticsEvent, AnalyticsEventName } from "@/lib/analytics/events";

/**
 * The funnel events that carry where the visitor came from, their country and
 * whether they were in Facebook's or Instagram's built-in browser (see
 * attribution.ts): signing up, being stopped at a lock, opening the upgrade
 * page and choosing a plan. Every other event is written exactly as before.
 */
const ATTRIBUTED_EVENTS: ReadonlySet<AnalyticsEventName> = new Set([
  "USER_SIGNED_UP",
  "PAYWALL_VIEWED",
  "UPGRADE_VIEWED",
  "UPGRADE_CTA_CLICKED",
]);

/**
 * Read from the request that is already being served, so no extra database or
 * network call. Outside a request (a webhook, a cron) there is nothing to
 * read, and the event is simply written without it.
 */
async function attributionFor(name: AnalyticsEventName): Promise<Record<string, string>> {
  if (!ATTRIBUTED_EVENTS.has(name)) return {};
  try {
    const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
    return attributionProperties({
      cookie: cookieStore.get(ATTRIBUTION_COOKIE)?.value,
      userAgent: requestHeaders.get("user-agent"),
      country: resolvePricingCountry(requestHeaders).country,
    });
  } catch {
    return {};
  }
}

/**
 * The one function the rest of the app calls to record a product event —
 * never a direct database write scattered through components. Every call
 * site is server-side, so a raw event name never arrives from client
 * input; TypeScript enforces the shape via the AnalyticsEvent union.
 *
 * Never throws. Analytics must never break lesson completion, progress
 * saving, authentication, premium access, or navigation — a failure here
 * is swallowed after an optional development-only log, exactly like the
 * email/billing dev fallbacks from Milestones 8-9. userId is null for
 * anonymous (guest) events; never accept one as an argument sourced from
 * client input — callers always pass the session-derived id or null.
 */
export async function track(event: AnalyticsEvent, userId: string | null): Promise<void> {
  try {
    const supabase = createServiceRoleClient();
    // The event's own fields come last, so attribution can never overwrite one.
    const properties = { ...(await attributionFor(event.name)), ...event.properties };
    const { error } = await supabase.from("analytics_events").insert({
      user_id: userId,
      event_name: event.name,
      event_properties: properties,
    });
    if (error) throw error;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[analytics:dev] would record", {
        name: event.name,
        userId,
        properties: event.properties,
      });
    } else {
      console.error("[analytics] track failed", error);
    }
  }
}
