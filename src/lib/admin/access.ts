import { cookies } from "next/headers";

import { DEV_ADMIN_COOKIE } from "@/lib/admin/constants";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * A local-only override so admin authorization can be exercised without a
 * real Supabase project, mirroring the dev-plan cookie from Milestone 6.
 * Hard-gated to non-production on every read, not just at write time, so a
 * stray cookie can never grant admin access on a real deployment.
 */
async function getDevAdminOverride(): Promise<boolean> {
  if (process.env.NODE_ENV === "production") return false;
  const cookieStore = await cookies();
  return cookieStore.get(DEV_ADMIN_COOKIE)?.value === "true";
}

/**
 * The caller's own profiles.role, or null when signed out / no project
 * linked — reads via the normal session-aware client, so RLS only ever lets
 * this see the caller's own row (plus, for an actual admin, every row via
 * the admin policy), meaning this can't be spoofed by querying for someone
 * else's role. Shared by isAdmin/isEditorOrAdmin below so a call site that
 * needs both never pays for two round trips.
 */
async function getRole(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data?.role ?? null;
}

/**
 * The one question anything gating FULL admin functionality should ask —
 * content authoring, settings the CMS treats as sensitive (voice/typing-
 * sound/color/font/completion-theme), Reports, the Audit log, and every
 * other admin's own role. See isEditorOrAdmin for the narrower "content
 * authoring only" tier (20250215000000_editor_role.sql).
 */
export async function isAdmin(): Promise<boolean> {
  if (await getDevAdminOverride()) return true;
  return (await getRole()) === "admin";
}

/**
 * The narrower content-authoring tier: true for 'editor' or 'admin', never
 * 'user'. Gates exactly the areas an editor's RLS policies also cover
 * (lessons, sentences, levels, word lists, library books/sections,
 * categories, translations, their cover/illustration images) — never the
 * admin-only areas isAdmin alone still gates (see admin/layout.tsx's nav
 * and each admin server action for which check it actually uses).
 */
export async function isEditorOrAdmin(): Promise<boolean> {
  if (await getDevAdminOverride()) return true;
  const role = await getRole();
  return role === "editor" || role === "admin";
}

/**
 * Verified first, before any admin mutation is attempted — the RLS admin
 * policies (Milestone 11 migration) enforce the same boundary independently
 * at the database layer, so this app-level check is defense in depth, not
 * the only line of defense. Never trust a hidden button as the real
 * authorization boundary. Shared by every FULL-admin-only server action
 * (settings, Reports, the Audit log, user roles) rather than each defining
 * its own copy — see requireEditorOrAdmin for content-authoring actions.
 */
export async function requireAdmin(): Promise<string | null> {
  if (!(await isAdmin())) return "You don't have permission to do that.";
  return null;
}

/** Same shape as requireAdmin, gated on the wider editor-or-admin tier — shared by every content-authoring server action (lessons, library, word lists, translations). */
export async function requireEditorOrAdmin(): Promise<string | null> {
  if (!(await isEditorOrAdmin())) return "You don't have permission to do that.";
  return null;
}
