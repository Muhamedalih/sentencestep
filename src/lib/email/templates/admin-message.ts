import { escapeHtml, renderEmailLayout } from "@/lib/email/templates/layout";
import type { EmailContent } from "@/lib/email/templates/layout";

export interface AdminMessageEmailInput {
  origin: string;
  subject: string;
  /** Plain text exactly as the admin typed it — escaped and paragraph-split here, never trusted as HTML. */
  message: string;
}

const PREVIEW_LENGTH = 90;

/**
 * A one-to-one message an admin writes by hand (Admin > Users / Reports) —
 * support replies and direct notes, not an automated lifecycle email. The
 * admin writes their own greeting and sign-off, so this adds neither: the
 * learners are largely Arabic-speaking and an auto-added English "Hi" would
 * sit awkwardly in front of an Arabic message. Each paragraph carries
 * dir="auto" so Arabic text renders right-to-left without any locale flag.
 */
export function adminMessageEmail({
  origin,
  subject,
  message,
}: AdminMessageEmailInput): EmailContent {
  const normalized = message.replace(/\r\n?/g, "\n").trim();
  const paragraphs = normalized.split(/\n{2,}/).filter((paragraph) => paragraph.trim() !== "");

  const bodyHtml = paragraphs
    .map(
      (paragraph, index) =>
        `<p dir="auto" style="margin:0 0 ${index === paragraphs.length - 1 ? "0" : "12px"} 0;">${escapeHtml(paragraph.trim()).replace(/\n/g, "<br />")}</p>`,
    )
    .join("\n    ");

  const settingsUrl = `${origin}/learn/settings`;
  const previewText = normalized.replace(/\s+/g, " ").slice(0, PREVIEW_LENGTH);

  return {
    subject,
    html: renderEmailLayout({
      previewText,
      heading: subject,
      bodyHtml: `\n    ${bodyHtml}\n  `,
      unsubscribeUrl: settingsUrl,
    }),
    text: `${normalized}\n\nManage email preferences: ${settingsUrl}`,
  };
}
