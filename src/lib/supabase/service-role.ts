import { createClient } from "@supabase/supabase-js";

import { supabaseFetchWithTimeout } from "@/lib/supabase/fetch-with-timeout";
import type { Database } from "@/types/database";

/**
 * Bypasses Row Level Security entirely — this is the one client in the
 * codebase that can read or write any user's data. Used for: server-side
 * webhook processing (src/lib/billing/webhook-events.ts), which has to
 * write subscription state on behalf of a payment provider that has no
 * Supabase session of its own; the cron endpoints
 * (src/app/api/cron/inactive-learners, src/app/api/cron/translation-sweep)
 * and the notification-event ledger they share
 * (src/lib/email/notification-events.ts), which run with no user session at
 * all; and the admin dashboard's total registered-user count
 * (src/lib/admin/content-queries.ts's getDashboardStats), which needs the
 * real count regardless of whether the calling session's own row happens to
 * satisfy the "Admins read all profiles" RLS policy (e.g. the
 * dev-admin-cookie override in src/lib/admin/access.ts has no real Supabase
 * session/JWT behind it at all, so `is_admin()` — which reads `auth.uid()` —
 * can't recognize it, and the RLS-scoped count would silently come back as 0
 * instead of the true total).
 *
 * Required for the cron endpoints to do anything at all, not only for
 * billing — see .env.example. Never import this file from a Client
 * Component, a route that handles a normal user request, or anywhere its
 * result could reach the browser — it is not the NEXT_PUBLIC_ anon key, and
 * must never be exposed to client code or logged.
 */
export function isServiceRoleConfigured(): boolean {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "createServiceRoleClient() requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set. " +
        "Required for cron endpoints and admin stats to work — see .env.example.",
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: supabaseFetchWithTimeout },
  });
}
