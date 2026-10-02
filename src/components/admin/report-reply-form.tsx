"use client";

import { EmailReplyPanel } from "@/components/admin/email-reply-panel";
import { replyToProblemReport } from "@/lib/admin/email-actions";

/** "Reply by email" under a report — the recipient is the report's own email, resolved server-side from the report id. */
export function ReportReplyForm({ reportId, userEmail }: { reportId: string; userEmail: string }) {
  return (
    <EmailReplyPanel
      recipient={userEmail}
      defaultSubject="Re: your SentenceStep report"
      send={(subject, message) => replyToProblemReport(reportId, subject, message)}
    />
  );
}
