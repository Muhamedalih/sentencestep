import { cookies } from "next/headers";

import { SUPABASE_AUTH_COOKIE_PATTERN } from "@/lib/supabase/auth-cookie-pattern";

/**
 * Server-side counterpart to src/middleware.ts's hasSupabaseAuthCookie()
 * and has-session-cookie-client.ts's hasSupabaseAuthCookieClient() — same
 * SUPABASE_AUTH_COOKIE_PATTERN, reading the Server Component/Route Handler
 * cookie jar via next/headers instead of a NextRequest or document.cookie.
 *
 * Only ever used to decide whether it's worth standing up a Supabase
 * client and calling getClaims() at all (see getCurrentUser's own doc
 * comment) — a guest with no session cookie can never produce claims, so
 * skipping straight to `null` is behaviorally identical, just without
 * paying for a client + JWT-verification call that was always going to
 * resolve to nothing. Never used to grant access on its own: a forged or
 * stale cookie only ever gets as far as getClaims() actually verifying it.
 */
export async function hasSupabaseAuthCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.getAll().some((c) => SUPABASE_AUTH_COOKIE_PATTERN.test(c.name));
}
