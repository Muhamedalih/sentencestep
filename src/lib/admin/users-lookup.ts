import { createServiceRoleClient } from "@/lib/supabase/service-role";

const USER_SEARCH_PAGE_SIZE = 1000;
const USER_SEARCH_MAX_PAGES = 10;

export type FindUserByEmailResult =
  { status: "found"; id: string; email: string } | { status: "not_found" } | { status: "error" };

/**
 * Resolves an auth.users row from an email. auth.users is never exposed
 * through PostgREST, so this pages the service-role admin API and matches
 * case-insensitively — the caller must already have passed requireAdmin().
 * Shared by the role-grant and send-email actions so both find users the
 * same way. Server-only: it uses the service-role client.
 */
export async function findUserByEmail(email: string): Promise<FindUserByEmailResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const serviceRole = createServiceRoleClient();

  for (let page = 1; page <= USER_SEARCH_MAX_PAGES; page++) {
    const { data, error } = await serviceRole.auth.admin.listUsers({
      page,
      perPage: USER_SEARCH_PAGE_SIZE,
    });
    if (error) return { status: "error" };
    const match = data.users.find((u) => u.email?.toLowerCase() === normalizedEmail);
    if (match) return { status: "found", id: match.id, email: match.email ?? normalizedEmail };
    if (data.users.length < USER_SEARCH_PAGE_SIZE) break;
  }
  return { status: "not_found" };
}
