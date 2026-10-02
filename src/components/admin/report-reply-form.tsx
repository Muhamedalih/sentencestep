"use client";

import { useState } from "react";

import { EmailComposer } from "@/components/admin/email-composer";
import { Button } from "@/components/ui/button";
import { replyToProblemReport } from "@/lib/admin/email-actions";

/** Collapsed "Reply by email" under a report — expands into the shared composer; the recipient is the report's own email, resolved server-side from the report id. */
export function ReportReplyForm({ reportId, userEmail }: { reportId: string; userEmail: string }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        Reply by email
      </Button>
    );
  }

  return (
    <div className="bg-muted/30 flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Reply to {userEmail}</p>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          Close
        </Button>
      </div>
      <EmailComposer
        recipientLabel={userEmail}
        defaultSubject="Re: your SentenceStep report"
        send={(subject, message) => replyToProblemReport(reportId, subject, message)}
        submitLabel="Send reply"
      />
    </div>
  );
}
