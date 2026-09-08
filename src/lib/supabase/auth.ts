import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { hasSupabaseAuthCookie } from "@/lib/supabase/has-session-cookie";

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string | null;
}

/**
 * The signed-in user for the current request, or null if signed out — or if
 * no Supabase project is linked at all, in which case there's no auth system
 * to speak of and every consumer should render its logged-out state. Uses
 * getUser() rather than getSession() because it revalidates the token
 * against Supabase Auth instead of trusting a possibly-stale cookie — the
 * source of identity should never be client-suppliable data.
 *
 * This is the single most-called function in the whole app (24 call sites,
 * several of them — hasPremiumAccess, isAdmin/isEditorOrAdmin's shared
 * getRole — calling it AGAIN independently on the very same request, e.g.
 * /learn's dashboard alone triggers three separate invocations in one
 * render), so the hasSupabaseAuthCookie() fast path below matters far
 * beyond this one function: a guest with no session cookie can never
 * produce a real user, so every one of those calls, on every guest
 * page view across the entire app, used to still stand up a Supabase
 * client and call getClaims() just to arrive at the same `null` — real,
 * multiplied-by-however-many-call-sites-hit-this-request work for no
 * behavioral gain. See src/middleware.ts's identical hasSupabaseAuthCookie
 * (added first, this is its Server Component/Route Handler counterpart).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured()) return null;
  if (!(await hasSupabaseAuthCookie())) return null;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims) return null;

  return {
    id: claims.sub,
    email: claims.email ?? "",
    displayName: (claims.user_metadata?.display_name as string | undefined) ?? null,
  };
}
