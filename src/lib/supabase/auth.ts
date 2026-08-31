import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

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
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    displayName: (user.user_metadata?.display_name as string | undefined) ?? null,
  };
}
