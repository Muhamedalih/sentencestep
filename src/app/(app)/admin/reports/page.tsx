import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { ReportReplyForm } from "@/components/admin/report-reply-form";
import { ReportStatusControl } from "@/components/admin/report-status-control";
import {
  listProblemReports,
  type AdminProblemReport,
  type ProblemReportStatus,
} from "@/lib/admin/reports-queries";
import { isPaymentReportPath, paymentReportOriginalPath } from "@/lib/billing/payment-report";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatAdminDateTime } from "@/lib/admin/format-date-time";

export const metadata: Metadata = {
  title: "Reports",
};

const STATUS_VARIANT: Record<ProblemReportStatus, "secondary" | "outline" | "success" | "muted"> = {
  new: "secondary",
  in_progress: "outline",
  resolved: "success",
  dismissed: "muted",
};

const PAYMENT_BADGE_CLASS = "bg-danger/15 text-danger border-transparent";

/** An unhandled payment problem may mean someone is waiting to use what they paid for, so those come first; the rest keep their newest-first order. */
function paymentProblemsFirst(reports: AdminProblemReport[]): AdminProblemReport[] {
  const urgent = (report: AdminProblemReport) =>
    report.status === "new" && isPaymentReportPath(report.pagePath);
  return [...reports.filter(urgent), ...reports.filter((report) => !urgent(report))];
}

export default async function AdminReportsPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const reports = paymentProblemsFirst(await listProblemReports());
  const newCount = reports.filter((report) => report.status === "new").length;
  const newPaymentCount = reports.filter(
    (report) => report.status === "new" && isPaymentReportPath(report.pagePath),
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          Reports
          {newCount > 0 && <Badge variant="secondary">{newCount} new</Badge>}
          {newPaymentCount > 0 && (
            <Badge variant="muted" className={PAYMENT_BADGE_CLASS}>
              {newPaymentCount} payment
            </Badge>
          )}
        </h1>
        <p className="text-muted-foreground mt-1">
          Problems learners flagged from the &quot;Report a problem&quot; button and from
          &quot;Problem with your payment?&quot;, newest first. Unhandled payment problems are kept
          at the top: each one lists the learner&apos;s account and newest orders, and you were
          emailed the moment it arrived.
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed px-4 py-12 text-center text-sm">
          No reports yet — nothing learners have flagged.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report) => {
            const isPayment = isPaymentReportPath(report.pagePath);
            return (
              <div
                key={report.id}
                className={
                  isPayment
                    ? "border-danger/40 bg-danger/5 rounded-xl border p-4"
                    : "border-border rounded-xl border p-4"
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{report.userEmail}</span>
                      {isPayment && (
                        <Badge variant="muted" className={PAYMENT_BADGE_CLASS}>
                          Payment
                        </Badge>
                      )}
                      <Badge variant={STATUS_VARIANT[report.status]}>
                        {report.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {formatAdminDateTime(report.createdAt)} ·{" "}
                      <code>{paymentReportOriginalPath(report.pagePath)}</code>
                    </p>
                  </div>
                  <ReportStatusControl id={report.id} status={report.status} />
                </div>
                <p
                  dir="auto"
                  className={
                    isPayment
                      ? "mt-3 font-mono text-xs leading-relaxed whitespace-pre-wrap"
                      : "mt-3 text-sm whitespace-pre-wrap"
                  }
                >
                  {report.message}
                </p>
                <div className="mt-3">
                  <ReportReplyForm reportId={report.id} userEmail={report.userEmail} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
