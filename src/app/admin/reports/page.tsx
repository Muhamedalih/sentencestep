import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { ReportStatusControl } from "@/components/admin/report-status-control";
import { listProblemReports, type ProblemReportStatus } from "@/lib/admin/reports-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Reports",
};

const STATUS_VARIANT: Record<ProblemReportStatus, "secondary" | "outline" | "success" | "muted"> = {
  new: "secondary",
  in_progress: "outline",
  resolved: "success",
  dismissed: "muted",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminReportsPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const reports = await listProblemReports();
  const newCount = reports.filter((report) => report.status === "new").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          Reports
          {newCount > 0 && <Badge variant="secondary">{newCount} new</Badge>}
        </h1>
        <p className="text-muted-foreground mt-1">
          Problems learners flagged from the &quot;Report a problem&quot; button, newest first.
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed px-4 py-12 text-center text-sm">
          No reports yet — nothing learners have flagged.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report) => (
            <div key={report.id} className="border-border rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{report.userEmail}</span>
                    <Badge variant={STATUS_VARIANT[report.status]}>
                      {report.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {formatDate(report.createdAt)} · <code>{report.pagePath}</code>
                  </p>
                </div>
                <ReportStatusControl id={report.id} status={report.status} />
              </div>
              <p className="mt-3 text-sm whitespace-pre-wrap">{report.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
