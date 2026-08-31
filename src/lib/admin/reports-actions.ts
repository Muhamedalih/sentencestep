"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ProblemReportStatus } from "@/lib/admin/reports-queries";

export interface ReportActionState {
  error?: string;
}

const VALID_STATUSES: ProblemReportStatus[] = ["new", "in_progress", "resolved", "dismissed"];

export async function updateProblemReportStatus(
  id: string,
  status: ProblemReportStatus,
): Promise<ReportActionState> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  if (!VALID_STATUSES.includes(status)) return { error: "Invalid status." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("problem_reports")
    .update({
      status,
      updated_at: new Date().toISOString(),
      resolved_at: status === "resolved" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) return { error: "Failed to update this report. Please try again." };

  void logAdminAction("report.status_changed", "problem_report", id, { status });
  revalidatePath("/admin/reports");
  return {};
}
