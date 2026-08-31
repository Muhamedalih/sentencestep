import { escapeHtml, renderEmailLayout } from "@/lib/email/templates/layout";
import type { EmailContent } from "@/lib/email/templates/layout";

export interface LearningReminderInput {
  origin: string;
  displayName: string | null;
  daysInactive: number;
}

/**
 * Kept as one plain constant, not buried in markup, so the tone (no guilt,
 * no urgency, no streak-loss pressure) stays easy to review and change in
 * one place — see the Milestone 9 report for why this phrasing was chosen.
 */
const REMINDER_MESSAGE =
  "You haven't practiced in a few days. Your next lesson is ready whenever you are — no pressure, just pick up where you left off.";

// daysInactive is part of the public contract (the caller naturally has it
// when deciding eligibility — see events.ts) but deliberately not surfaced
// as a number in the copy itself ("You haven't practiced in N days!") — a
// specific count reads like pressure/guilt-tracking rather than a gentle
// nudge, so the template intentionally never uses it.
export function learningReminderEmail({
  origin,
  displayName,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- see comment above
  daysInactive,
}: LearningReminderInput): EmailContent {
  const safeName = displayName ? escapeHtml(displayName) : "there";
  const learnUrl = `${origin}/learn`;
  const settingsUrl = `${origin}/learn/settings`;

  const bodyHtml = `
    <p style="margin:0 0 12px 0;">Hi ${safeName},</p>
    <p style="margin:0;">${REMINDER_MESSAGE}</p>
  `;

  return {
    subject: "Your next SentenceStep lesson is ready",
    html: renderEmailLayout({
      previewText: "Pick up where you left off, whenever you're ready.",
      heading: "Ready when you are",
      bodyHtml,
      ctaLabel: "Continue learning",
      ctaUrl: learnUrl,
      unsubscribeUrl: settingsUrl,
    }),
    text: `Hi ${displayName ?? "there"},\n\n${REMINDER_MESSAGE}\n\n${learnUrl}\n\nManage email preferences: ${settingsUrl}`,
  };
}
