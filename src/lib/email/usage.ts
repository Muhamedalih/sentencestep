import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * A counter of emails sent per provider per period, kept in the database (email_usage, see
 * 20250343000000_email_usage_and_offer_pref.sql) so that every server, and every restart, sees the
 * same numbers. The routing provider reserves a slot BEFORE it sends and gives it back if the
 * send fails, so a quota (Resend's free 100 a day) is never overrun by two sends at once.
 */
export interface EmailUsageStore {
  /** Takes one slot of `provider` for `period` (YYYY-MM-DD) if fewer than `limit` are used. True when it was taken. Throws when the counter cannot be used. */
  reserve(provider: string, period: string, limit: number): Promise<boolean>;
  /** Gives a slot back (a send that failed). Best effort. */
  release(provider: string, period: string): Promise<void>;
  /** How many emails `provider` has sent from `since` (YYYY-MM-DD) on. */
  sentSince(provider: string, since: string): Promise<number>;
  /** The first period in which `provider` sent anything, or null when it never has. */
  firstPeriod(provider: string): Promise<string | null>;
}

/** The UTC day of a moment, YYYY-MM-DD: the period of a daily quota. */
export const utcDay = (now: Date): string => now.toISOString().slice(0, 10);

/** The first day of the UTC month of a moment, YYYY-MM-01. */
export const utcMonthStart = (now: Date): string => `${now.toISOString().slice(0, 7)}-01`;

export function createSupabaseUsageStore(): EmailUsageStore {
  return {
    async reserve(provider, period, limit) {
      const { data, error } = await createServiceRoleClient().rpc("reserve_email_slot", {
        p_period: period,
        p_provider: provider,
        p_limit: limit,
      });
      if (error) throw error;
      return data === true;
    },
    async release(provider, period) {
      await createServiceRoleClient().rpc("release_email_slot", {
        p_period: period,
        p_provider: provider,
      });
    },
    async sentSince(provider, since) {
      const { data, error } = await createServiceRoleClient()
        .from("email_usage")
        .select("sent")
        .eq("provider", provider)
        .gte("period", since);
      if (error) throw error;
      return (data ?? []).reduce((total, row) => total + row.sent, 0);
    },
    async firstPeriod(provider) {
      const { data, error } = await createServiceRoleClient()
        .from("email_usage")
        .select("period")
        .eq("provider", provider)
        .gt("sent", 0)
        .order("period", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.period ?? null;
    },
  };
}
