import { formatUsd } from "@/lib/billing/pricing";
import { escapeHtml, renderEmailLayout } from "@/lib/email/templates/layout";
import type { EmailContent } from "@/lib/email/templates/layout";

export interface PremiumPurchasedEmailInput {
  origin: string;
  /** The days this purchase gave, launch-offer bonus included. */
  days: number;
  /** When Premium now ends (an ISO timestamp), or null when unknown. */
  premiumUntil: string | null;
  priceUsdCents: number;
  /** Our reference for the order, the one to quote to support. */
  reference: string;
}

function formatEnglishDate(iso: string): string | null {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  return new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(time);
}

/**
 * The receipt sent once, the moment a payment is confirmed and Premium is
 * granted. It is an account notice about the learner's own purchase, so it is
 * not gated by email preferences. The price is in dollars, the way the learner
 * saw it; the reference is what to quote if anything needs sorting out.
 */
export function premiumPurchasedEmail({
  origin,
  days,
  premiumUntil,
  priceUsdCents,
  reference,
}: PremiumPurchasedEmailInput): EmailContent {
  const until = premiumUntil ? formatEnglishDate(premiumUntil) : null;
  const price = formatUsd(priceUsdCents);
  const intro = until
    ? `Thank you for supporting SentenceStep. Your Premium access is active until ${until}.`
    : "Thank you for supporting SentenceStep. Your Premium access is active.";
  const startUrl = `${origin}/learn`;

  const rows: [string, string][] = [
    ["Plan", `${days} days of Premium`],
    ["Price", price],
    ["Reference", reference],
  ];

  const bodyHtml = `
    <p style="margin:0 0 16px 0;">${escapeHtml(intro)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;border:1px solid #e5e5ef;border-radius:8px;">
      ${rows
        .map(
          ([label, value]) => `<tr>
        <td style="padding:8px 12px;color:#8a8aa3;font-size:13px;">${escapeHtml(label)}</td>
        <td style="padding:8px 12px;font-size:13px;color:#1a1a2e;" align="right">${escapeHtml(value)}</td>
      </tr>`,
        )
        .join("")}
    </table>
    <p style="margin:0;">Days you buy while Premium is active are added after the days you have left, and nothing renews on its own.</p>
  `;

  return {
    subject: "Your SentenceStep Premium is active",
    html: renderEmailLayout({
      previewText: intro,
      heading: "Premium is active",
      bodyHtml,
      ctaLabel: "Start learning",
      ctaUrl: startUrl,
      footerNote:
        "This confirms your purchase on SentenceStep. If anything looks wrong, reply to this email or write to support@sentencestep.com and quote the reference.",
    }),
    text: `${intro}\n\n${rows.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\nDays you buy while Premium is active are added after the days you have left, and nothing renews on its own.\n\nStart learning: ${startUrl}\n\nThis confirms your purchase on SentenceStep. If anything looks wrong, reply to this email or write to support@sentencestep.com and quote the reference.`,
  };
}
