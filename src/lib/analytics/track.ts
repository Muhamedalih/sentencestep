import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { AnalyticsEvent } from "@/lib/analytics/events";

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
    const { error } = await supabase.from("analytics_events").insert({
      user_id: userId,
      event_name: event.name,
      event_properties: event.properties,
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
