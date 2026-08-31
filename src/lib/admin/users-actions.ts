"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";
import type { AdminRole } from "@/lib/admin/users-queries";

export interface UserRoleActionResult {
  error?: string;
  success?: string;
}

const USER_SEARCH_PAGE_SIZE = 1000;
const USER_SEARCH_MAX_PAGES = 10;

/**
 * profiles.role can only ever be written by the service-role connection —
 * UPDATE on that column was revoked from `authenticated` entirely
 * (20250111000000_lock_profile_role_column.sql), specifically so an admin
 * session's normal client can't self-promote or promote anyone else through
 * PostgREST. requireAdmin() below is what makes reaching this codepath at
 * all conditional on the CALLER already being a real admin — the
 * service-role client itself has no concept of "who's calling," it's
 * authorization, not identity.
 */
export async function setUserRoleByEmail(
  email: string,
  role: AdminRole,
): Promise<UserRoleActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };
  if (!isServiceRoleConfigured())
    return { error: "Service role key isn't configured for this environment." };

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return { error: "Enter an email address." };

  const serviceRole = createServiceRoleClient();

  let targetUserId: string | null = null;
  for (let page = 1; page <= USER_SEARCH_MAX_PAGES && !targetUserId; page++) {
    const { data, error } = await serviceRole.auth.admin.listUsers({
      page,
      perPage: USER_SEARCH_PAGE_SIZE,
    });
    if (error) return { error: "Couldn't search for that user. Please try again." };
    const match = data.users.find((u) => u.email?.toLowerCase() === normalizedEmail);
    if (match) targetUserId = match.id;
    if (data.users.length < USER_SEARCH_PAGE_SIZE) break;
  }
  if (!targetUserId) return { error: "No account found with that email." };

  const { error } = await serviceRole
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", targetUserId);
  if (error) return { error: "Couldn't update this user's role. Please try again." };

  void logAdminAction("profile.role_changed", "profile", targetUserId, {
    role,
    email: normalizedEmail,
  });
  revalidatePath("/admin/users");
  return { success: `${normalizedEmail} is now ${role === "admin" ? "an admin" : "an editor"}.` };
}

/** Sets a user's role back to 'user' (the default, no elevated access) — the "remove" action on the Users list. */
export async function revokeUserRole(userId: string): Promise<UserRoleActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };
  if (!isServiceRoleConfigured())
    return { error: "Service role key isn't configured for this environment." };

  const serviceRole = createServiceRoleClient();
  const { error } = await serviceRole
    .from("profiles")
    .update({ role: "user", updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { error: "Couldn't update this user's role. Please try again." };

  void logAdminAction("profile.role_changed", "profile", userId, { role: "user" });
  revalidatePath("/admin/users");
  return { success: "Role removed." };
}
