import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";

export type AdminRole = "editor" | "admin";

export interface ElevatedUser {
  id: string;
  email: string;
  displayName: string | null;
  role: AdminRole;
}

/**
 * Every profile with an elevated role — the small, bounded list this page
 * actually needs to show (never "browse every registered user," which would
 * need real pagination this feature doesn't warrant yet). Session-aware
 * client is enough for the profiles read ("Admins read all profiles" RLS
 * policy), but profiles carries no email column (see profiles' own schema —
 * email lives in auth.users, which PostgREST never exposes), so each row's
 * email is resolved afterward via the service-role admin API.
 */
export async function listElevatedUsers(): Promise<ElevatedUser[]> {
  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .in("role", ["editor", "admin"])
    .order("role", { ascending: false });
  if (error) throw error;
  if (!profiles || profiles.length === 0) return [];

  if (!isServiceRoleConfigured()) {
    return profiles.map((p) => ({
      id: p.id,
      email: "(email unavailable)",
      displayName: p.display_name,
      role: p.role as AdminRole,
    }));
  }

  const serviceRole = createServiceRoleClient();
  const emailById = new Map<string, string>();
  await Promise.all(
    profiles.map(async (p) => {
      const { data } = await serviceRole.auth.admin.getUserById(p.id);
      if (data.user?.email) emailById.set(p.id, data.user.email);
    }),
  );

  return profiles.map((p) => ({
    id: p.id,
    email: emailById.get(p.id) ?? "(email unavailable)",
    displayName: p.display_name,
    role: p.role as AdminRole,
  }));
}
