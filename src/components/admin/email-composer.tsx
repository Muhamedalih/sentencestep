"use client";

import { useId, useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  ADMIN_EMAIL_MESSAGE_MAX_LENGTH,
  ADMIN_EMAIL_SUBJECT_MAX_LENGTH,
} from "@/lib/admin/email-validation";
import type { AdminEmailActionResult } from "@/lib/admin/email-actions";

interface EmailComposerProps {
  /** Shown in the confirmation prompt — who the email is about to go to. */
  recipientLabel: string;
  defaultSubject?: string;
  /** Subject/message fields are cleared after a successful send; the form stays open. */
  send: (subject: string, message: string) => Promise<AdminEmailActionResult>;
  /** Fields rendered above the subject (the Users page's recipient address). */
  children?: React.ReactNode;
  /** The recipient field's current value; submission is blocked until it is non-empty. */
  hasRecipient?: boolean;
  onSent?: () => void;
  submitLabel?: string;
}

/**
 * The subject + message fields and send button shared by the Users page and
 * the Reports reply form. Sending is irreversible, so it asks for a native
 * confirmation first (same pattern as RevokeRoleButton). Fields use
 * dir="auto" so an Arabic message is typed and previewed right-to-left.
 */
export function EmailComposer({
  recipientLabel,
  defaultSubject = "",
  send,
  children,
  hasRecipient = true,
  onSent,
  submitLabel = "Send email",
}: EmailComposerProps) {
  const id = useId();
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ text: string; isError: boolean } | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!window.confirm(`Send this email to ${recipientLabel || "this user"}?`)) return;
    setResult(null);
    startTransition(async () => {
      const outcome = await send(subject, message);
      if (outcome.error) {
        setResult({ text: outcome.error, isError: true });
        return;
      }
      setResult({ text: outcome.success ?? "Email sent.", isError: false });
      setSubject(defaultSubject);
      setMessage("");
      onSent?.();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {children}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-subject`} className="text-xs font-medium">
          Subject
        </label>
        <input
          id={`${id}-subject`}
          type="text"
          dir="auto"
          required
          maxLength={ADMIN_EMAIL_SUBJECT_MAX_LENGTH}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          disabled={isPending}
          className="border-input bg-background h-9 w-full max-w-xl rounded-lg border px-3 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-message`} className="text-xs font-medium">
          Message
        </label>
        <textarea
          id={`${id}-message`}
          dir="auto"
          required
          rows={6}
          maxLength={ADMIN_EMAIL_MESSAGE_MAX_LENGTH}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          disabled={isPending}
          placeholder="Write your own greeting and sign-off — the email adds the SentenceStep header and footer."
          className="border-input bg-background w-full max-w-xl rounded-lg border p-3 text-sm"
        />
        <p className="text-muted-foreground text-xs">
          {message.length}/{ADMIN_EMAIL_MESSAGE_MAX_LENGTH}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={isPending || !hasRecipient}>
          {isPending ? "Sending…" : submitLabel}
        </Button>
        {result && (
          <span
            role={result.isError ? "alert" : "status"}
            className={`text-xs ${result.isError ? "text-danger" : "text-muted-foreground"}`}
          >
            {result.text}
          </span>
        )}
      </div>
    </form>
  );
}
