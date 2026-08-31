import { escapeHtml, renderEmailLayout } from "@/lib/email/templates/layout";
import type { EmailContent } from "@/lib/email/templates/layout";

export interface WelcomeEmailInput {
  origin: string;
  displayName: string | null;
}

const MESSAGE =
  "Welcome to SentenceStep. The best way to start is with one short lesson — hear a sentence, type it, and see how it feels.";
const SUBMESSAGE =
  "Free lessons are ready whenever you are, across ordinary sentences, stories, and conversations.";

export function welcomeEmail({ origin, displayName }: WelcomeEmailInput): EmailContent {
  const safeName = displayName ? escapeHtml(displayName) : "there";
  const learnUrl = `${origin}/learn`;
  const settingsUrl = `${origin}/learn/settings`;

  const bodyHtml = `
    <p style="margin:0 0 12px 0;">Hi ${safeName},</p>
    <p style="margin:0 0 12px 0;">${MESSAGE}</p>
    <p style="margin:0;">${SUBMESSAGE}</p>
  `;

  return {
    subject: "Welcome to SentenceStep",
    html: renderEmailLayout({
      previewText: "Your first SentenceStep lesson is ready.",
      heading: `Welcome, ${safeName}`,
      bodyHtml,
      ctaLabel: "Start your first lesson",
      ctaUrl: learnUrl,
      unsubscribeUrl: settingsUrl,
    }),
    text: `Hi ${displayName ?? "there"},\n\n${MESSAGE}\n\n${SUBMESSAGE}\n\n${learnUrl}\n\nManage email preferences: ${settingsUrl}`,
  };
}
