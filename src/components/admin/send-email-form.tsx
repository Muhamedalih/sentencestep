"use client";

import { useState } from "react";

import { EmailComposer } from "@/components/admin/email-composer";
import { sendEmailToUser } from "@/lib/admin/email-actions";

/** The Users page's "send an email" form — any registered user, looked up by email server-side (sendEmailToUser refuses an address with no account). */
export function SendEmailForm() {
  const [email, setEmail] = useState("");

  return (
    <EmailComposer
      recipientLabel={email.trim()}
      hasRecipient={email.trim() !== ""}
      send={(subject, message) => sendEmailToUser(email, subject, message)}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="send-email-recipient" className="text-xs font-medium">
          User email
        </label>
        <input
          id="send-email-recipient"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          className="border-input bg-background h-9 w-64 rounded-lg border px-3 text-sm"
        />
      </div>
    </EmailComposer>
  );
}
