"use client";

import { EmailReplyPanel } from "@/components/admin/email-reply-panel";
import { replyToInboundEmail } from "@/lib/admin/email-actions";

/** "Reply by email" under an Inbox message — the recipient is the message's sender, resolved server-side from the message id. */
export function InboxReplyForm({
  inboundEmailId,
  fromEmail,
  subject,
}: {
  inboundEmailId: string;
  fromEmail: string;
  subject: string;
}) {
  const defaultSubject = /^re:/i.test(subject.trim()) ? subject.trim() : `Re: ${subject.trim()}`;

  return (
    <EmailReplyPanel
      recipient={fromEmail}
      defaultSubject={defaultSubject === "Re: " ? "Re: your message" : defaultSubject}
      send={(subject, message) => replyToInboundEmail(inboundEmailId, subject, message)}
    />
  );
}
