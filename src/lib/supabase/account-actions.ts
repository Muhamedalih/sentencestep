"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";
import { fallbackDictionary, getDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/get-locale";

export interface AccountActionState {
  error?: string;
}

/**
 * Permanently deletes the signed-in learner's account. Every user-owned
 * table (progress, streaks, subscriptions, saved sentences, mistakes…) has
 * an `on delete cascade` foreign key back to auth.users (see
 * supabase/migrations/20250101000000_init_schema.sql onward), so deleting
 * the auth user via the service-role admin API is enough to remove
 * everything tied to this account in one atomic operation — there's no
 * separate per-table cleanup to get right or forget.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY to be configured (see
 * service-role.ts's doc comment for why this is the one client allowed to
 * bypass RLS) — a deployment without it simply can't offer this yet, and
 * says so rather than silently doing nothing.
 */
export async function deleteAccountAction(
  _prevState: AccountActionState | null,
  formData: FormData,
): Promise<AccountActionState> {
  const locale = await getLocale();
  const t = locale ? getDictionary(locale) : fallbackDictionary;

  const confirmation = String(formData.get("confirmation") ?? "");
  if (confirmation !== "DELETE") {
    return { error: t.settings.deleteAccountMismatch };
  }

  if (!isServiceRoleConfigured()) {
    return { error: t.settings.deleteAccountError };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return { error: t.auth.errors.genericError };

  try {
    const serviceRole = createServiceRoleClient();
    const { error } = await serviceRole.auth.admin.deleteUser(claims.sub);
    if (error) return { error: t.settings.deleteAccountError };
  } catch {
    return { error: t.settings.deleteAccountError };
  }

  // The session tied to the just-deleted user is already dead server-side;
  // this only clears the local session cookie.
  await supabase.auth.signOut();
  redirect("/");
}
