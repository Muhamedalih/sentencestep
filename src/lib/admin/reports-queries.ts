import { createClient } from "@/lib/supabase/server";

export type ProblemReportStatus = "new" | "in_progress" | "resolved" | "dismissed";

export interface AdminProblemReport {
  id: string;
  userEmail: string;
  pagePath: string;
  message: string;
  status: ProblemReportStatus;
  createdAt: string;
  resolvedAt: string | null;
}

/**
 * Admin reads for Reports — the session-aware client, not a service-role
 * one. problem_reports' RLS grants is_admin() sessions unrestricted access
 * (see 20250212000000_problem_reports.sql), so no service-role client is
 * needed here, matching every other admin list (word lists, translations…).
 */
export async function listProblemReports(): Promise<AdminProblemReport[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("problem_reports")
    .select("id, user_email, page_path, message, status, created_at, resolved_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    userEmail: row.user_email,
    pagePath: row.page_path,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  }));
}

/** Powers the admin nav badge — count of reports nobody has triaged yet. */
export async function countNewProblemReports(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("problem_reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  if (error) throw error;
  return count ?? 0;
}
