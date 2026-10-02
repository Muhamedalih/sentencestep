import { escapeHtml, renderEmailLayout } from "@/lib/email/templates/layout";
import type { EmailContent } from "@/lib/email/templates/layout";

export interface InboxAlertEmailInput {
  origin: string;
  fromEmail: string;
  fromName: string | null;
  subject: string;
  bodyText: string;
}

const EXCERPT_LENGTH = 300;
const SUBJECT_LENGTH = 120;

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max).trimEnd()}…` : value;
}

/** "Sara (sara@x.com)" or just the address — used in subjects, push bodies and the alert itself. */
export function senderLabel(fromEmail: string, fromName: string | null): string {
  return fromName ? `${fromName} (${fromEmail})` : fromEmail;
}

/**
 * The "you have a new reply" notice sent to admins when a learner's email
 * lands in Admin > Inbox. Deliberately short: who, what, a short excerpt and
 * a button to the Inbox — the full message and the reply box live there, so
 * the (untrusted) message body is never forwarded in full. Everything
 * learner-supplied is escaped, and dir="auto" lets an Arabic message render
 * right-to-left.
 */
export function inboxAlertEmail({
  origin,
  fromEmail,
  fromName,
  subject,
  bodyText,
}: InboxAlertEmailInput): EmailContent {
  const sender = senderLabel(fromEmail, fromName);
  const cleanSubject = subject.trim() || "(no subject)";
  const excerpt = truncate(bodyText.replace(/\s+/g, " ").trim(), EXCERPT_LENGTH);
  const inboxUrl = `${origin}/admin/inbox`;

  const bodyHtml = `
    <p style="margin:0 0 12px 0;"><strong>${escapeHtml(sender)}</strong> replied:</p>
    <p dir="auto" style="margin:0 0 8px 0;font-weight:600;color:#1a1a2e;">${escapeHtml(cleanSubject)}</p>
    <p dir="auto" style="margin:0;">${escapeHtml(excerpt || "(empty message)")}</p>
  `;

  return {
    subject: truncate(`New reply from ${sender}: ${cleanSubject}`, SUBJECT_LENGTH),
    html: renderEmailLayout({
      previewText: excerpt || cleanSubject,
      heading: "New reply in your Inbox",
      bodyHtml,
      ctaLabel: "Open Inbox",
      ctaUrl: inboxUrl,
    }),
    text: `${sender} replied: ${cleanSubject}\n\n${excerpt}\n\nOpen the Inbox: ${inboxUrl}`,
  };
}
