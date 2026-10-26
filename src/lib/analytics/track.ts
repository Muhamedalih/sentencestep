import { cookies, headers } from "next/headers";

import { ATTRIBUTION_COOKIE, attributionProperties } from "@/lib/analytics/attribution";
import { resolvePricingCountry } from "@/lib/billing/geo-pricing";
import { FIRST_RUN_COOKIE, parseFirstRunCookie } from "@/lib/first-run/variant";
import { IN_APP_BUCKET_COOKIE, parseBucket } from "@/lib/in-app-strip/strip";
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

/** The events that carry `firstRun`, the first-run variant the visitor was given (see src/lib/first-run/variant.ts) — enough to read reaching the first lesson, signing up and coming back per variant. */
const FIRST_RUN_EVENTS: ReadonlySet<AnalyticsEventName> = new Set([
  "USER_SIGNED_UP",
  "LESSON_STARTED",
  "LESSON_COMPLETED",
]);

/** The events that carry `inAppBucket`, the visitor's number from 0 to 99 that the "Open in browser strip" share is cut with (see src/lib/in-app-strip/strip.ts) — enough to read signing up and the first lessons per group, in whichever browser they happen. Only a browser that has the cookie (one that arrived in Facebook's or Instagram's browser, or was sent on from it by the strip) adds it. */
const IN_APP_BUCKET_EVENTS: ReadonlySet<AnalyticsEventName> = new Set([
  "USER_SIGNED_UP",
  "LESSON_STARTED",
  "LESSON_COMPLETED",
]);

/**
 * Read from the request that is already being served, so no extra database or
 * network call. Outside a request (a webhook, a cron) there is nothing to
 * read, and the event is simply written without it.
 */
async function requestPropertiesFor(name: AnalyticsEventName): Promise<Record<string, string>> {
  const attributed = ATTRIBUTED_EVENTS.has(name);
  const firstRun = FIRST_RUN_EVENTS.has(name);
  const inAppBucket = IN_APP_BUCKET_EVENTS.has(name);
  if (!attributed && !firstRun && !inAppBucket) return {};
  try {
    const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
    const properties: Record<string, string> = attributed
      ? attributionProperties({
          cookie: cookieStore.get(ATTRIBUTION_COOKIE)?.value,
          userAgent: requestHeaders.get("user-agent"),
          country: resolvePricingCountry(requestHeaders).country,
        })
      : {};
    const variant = firstRun ? parseFirstRunCookie(cookieStore.get(FIRST_RUN_COOKIE)?.value) : null;
    if (variant) properties.firstRun = variant;
    const bucket = inAppBucket ? parseBucket(cookieStore.get(IN_APP_BUCKET_COOKIE)?.value) : null;
    if (bucket !== null) properties.inAppBucket = String(bucket);
    return properties;
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
    const properties = { ...(await requestPropertiesFor(event.name)), ...event.properties };
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
