import { escapeHtml, renderEmailLayout } from "@/lib/email/templates/layout";
import type { EmailContent } from "@/lib/email/templates/layout";
import { modeMeta } from "@/lib/learning-modes";
import type { NotificationEvent } from "@/lib/email/events";

/** Inactivity reminders use learningReminderEmail instead — this template only covers genuine achievements. */
export type MilestoneEvent = Exclude<NotificationEvent, { type: "INACTIVE_LEARNER" }>;

export interface MilestoneEmailInput {
  origin: string;
  displayName: string | null;
  event: MilestoneEvent;
}

interface MilestoneCopy {
  heading: string;
  message: string;
  preview: string;
}

/**
 * What to say for each achievement, given only real data already on the
 * event (never invented statistics). CTA always points at the general
 * library (/learn), never a specific lesson — so a free learner is never
 * pointed at a premium lesson as if it were already unlocked.
 */
function milestoneCopy(event: MilestoneEvent): MilestoneCopy {
  switch (event.type) {
    case "LESSON_COMPLETED":
      return {
        heading: `${event.totalCompleted} lessons completed`,
        message: `You've completed ${event.totalCompleted} lessons on SentenceStep. Steady practice is exactly how this works.`,
        preview: `${event.totalCompleted} lessons down.`,
      };
    case "STORY_COMPLETED":
      return {
        heading: "Story completed",
        message:
          "You finished a full story, start to finish. That's real reading and typing practice.",
        preview: "You finished a story.",
      };
    case "CONVERSATION_COMPLETED":
      return {
        heading: "Conversation completed",
        message: "You worked through a full conversation. That's the kind of practice that sticks.",
        preview: "You finished a conversation.",
      };
    case "LEVEL_COMPLETED": {
      const modeName = modeMeta[event.mode].title;
      return {
        heading: `Level ${event.level} completed`,
        message: `You've completed Level ${event.level} in ${modeName}. The next level is ready when you are.`,
        preview: `Level ${event.level} complete.`,
      };
    }
    case "STREAK_MILESTONE":
      return {
        heading: `${event.streak}-day streak`,
        message: `You've practiced ${event.streak} days in a row. That consistency is what builds real fluency.`,
        preview: `${event.streak} days in a row.`,
      };
  }
}

export function milestoneEmail({ origin, displayName, event }: MilestoneEmailInput): EmailContent {
  const safeName = displayName ? escapeHtml(displayName) : "there";
  const learnUrl = `${origin}/learn`;
  const settingsUrl = `${origin}/learn/settings`;
  const copy = milestoneCopy(event);
  const safeMessage = escapeHtml(copy.message);

  const bodyHtml = `
    <p style="margin:0 0 12px 0;">Hi ${safeName},</p>
    <p style="margin:0;">${safeMessage}</p>
  `;

  return {
    subject: copy.heading,
    html: renderEmailLayout({
      previewText: copy.preview,
      heading: copy.heading,
      bodyHtml,
      ctaLabel: "Keep learning",
      ctaUrl: learnUrl,
      unsubscribeUrl: settingsUrl,
    }),
    text: `Hi ${displayName ?? "there"},\n\n${copy.message}\n\n${learnUrl}\n\nManage email preferences: ${settingsUrl}`,
  };
}
