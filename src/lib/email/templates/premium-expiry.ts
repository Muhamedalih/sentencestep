import { escapeHtml, renderEmailLayout } from "@/lib/email/templates/layout";
import type { EmailContent } from "@/lib/email/templates/layout";

export interface PremiumExpiryInput {
  origin: string;
  displayName: string | null;
  /** The end date, already formatted for reading, e.g. "2 February 2027". */
  endsOn: string;
  /** Whole days left, rounded up. */
  daysLeft: number;
  /** The learner's live streak when it is long enough to mention, otherwise 0. */
  streak: number;
}

/**
 * A plain, honest heads-up that a paid period is ending: the date, what
 * happens to their progress (nothing is lost), and that days added now stack
 * on top of what is left. It states no price and no deadline pressure, and
 * quotes a streak only when there is a real one.
 */
export function premiumExpiryEmail({
  origin,
  displayName,
  endsOn,
  daysLeft,
  streak,
}: PremiumExpiryInput): EmailContent {
  const safeName = displayName ? escapeHtml(displayName) : "there";
  const upgradeUrl = `${origin}/upgrade`;

  const lines = [
    `Your SentenceStep Premium access ends on ${endsOn}. After that you go back to the Free plan — your progress, streak and XP stay saved.`,
    ...(streak > 0
      ? [
          `You're on a ${streak}-day streak. Adding days now keeps every lesson open while you keep it going.`,
        ]
      : []),
    "Any days you add are put on top of the days you have left, so there's no need to wait for the last day.",
  ];

  const bodyHtml = `
    <p style="margin:0 0 12px 0;">Hi ${safeName},</p>
    ${lines.map((line) => `<p style="margin:0 0 12px 0;">${escapeHtml(line)}</p>`).join("\n    ")}
  `;

  const daysText = daysLeft === 1 ? "1 day left" : `${daysLeft} days left`;

  return {
    subject: `Your SentenceStep Premium ends on ${endsOn}`,
    html: renderEmailLayout({
      previewText: `${daysText} — add days whenever you like.`,
      heading: `Your Premium ends on ${endsOn}`,
      bodyHtml,
      ctaLabel: "Add more days",
      ctaUrl: upgradeUrl,
      footerNote: "You're receiving this because you have Premium access on SentenceStep.",
    }),
    text: `Hi ${displayName ?? "there"},\n\n${lines.join("\n\n")}\n\nAdd more days: ${upgradeUrl}`,
  };
}
