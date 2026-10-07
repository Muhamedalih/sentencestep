import { escapeHtml, renderEmailLayout } from "@/lib/email/templates/layout";
import type { EmailContent } from "@/lib/email/templates/layout";
import { modeMeta } from "@/lib/learning-modes";
import type { NotificationEvent } from "@/lib/email/events";

/** Inactivity reminders (either channel) use learningReminderEmail/the push cron, and a Premium-ending notice uses premiumExpiryEmail — this template only covers genuine achievements. */
export type MilestoneEvent = Exclude<
  NotificationEvent,
  { type: "INACTIVE_LEARNER" | "INACTIVE_LEARNER_PUSH" | "PREMIUM_EXPIRY_REMINDER" }
>;

export interface MilestoneEmailInput {
  origin: string;
  displayName: string | null;
  event: MilestoneEvent;
}

interface MilestoneCopy {
  heading: string;
  message: string;
  preview: string;
  /** Adds a quiet "see what Premium includes" link under the message. Only the level email for a free learner whose next level is Premium sets it. */
  premiumLink?: boolean;
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
      // A free learner who just finished the last level they can open must not
      // be told the next one is "ready": it is Premium. Say so plainly and
      // kindly, promise nothing is lost, and keep the button on learning.
      if (event.nextLevelLocked) {
        return {
          heading: `Level ${event.level} completed`,
          message: `You've completed Level ${event.level} in ${modeName} — nice work. Your progress and streak stay saved. The next levels are part of Premium (a one-time payment, no auto-renewal) whenever you'd like to keep going.`,
          preview: `Level ${event.level} complete.`,
          premiumLink: true,
        };
      }
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
  const upgradeUrl = `${origin}/upgrade`;
  const copy = milestoneCopy(event);
  const safeMessage = escapeHtml(copy.message);

  const premiumLinkHtml = copy.premiumLink
    ? `<p style="margin:12px 0 0 0;"><a href="${escapeHtml(upgradeUrl)}" style="color:#5b45e0;">See what Premium includes</a></p>`
    : "";
  const bodyHtml = `
    <p style="margin:0 0 12px 0;">Hi ${safeName},</p>
    <p style="margin:0;">${safeMessage}</p>${premiumLinkHtml}
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
    text: `Hi ${displayName ?? "there"},\n\n${copy.message}\n\n${learnUrl}${copy.premiumLink ? `\n\nSee what Premium includes: ${upgradeUrl}` : ""}\n\nManage email preferences: ${settingsUrl}`,
  };
}
