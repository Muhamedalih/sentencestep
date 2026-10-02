"use client";

import { useState } from "react";

import { EmailComposer } from "@/components/admin/email-composer";
import { Button } from "@/components/ui/button";
import type { AdminEmailActionResult } from "@/lib/admin/email-actions";

interface EmailReplyPanelProps {
  /** Who the reply goes to — shown in the panel header and the confirmation prompt. */
  recipient: string;
  defaultSubject: string;
  send: (subject: string, message: string) => Promise<AdminEmailActionResult>;
  /** Called after a reply is sent, e.g. to refresh a status badge. */
  onSent?: () => void;
}

/** A collapsed "Reply by email" button that expands into the shared composer — used under both a Report and an Inbox message. */
export function EmailReplyPanel({ recipient, defaultSubject, send, onSent }: EmailReplyPanelProps) {
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
        <p className="text-sm font-medium">Reply to {recipient}</p>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          Close
        </Button>
      </div>
      <EmailComposer
        recipientLabel={recipient}
        defaultSubject={defaultSubject}
        send={send}
        onSent={onSent}
        submitLabel="Send reply"
      />
    </div>
  );
}
