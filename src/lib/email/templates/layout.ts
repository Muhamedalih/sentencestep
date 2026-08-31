export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export interface EmailLayoutInput {
  previewText: string;
  heading: string;
  /** Pre-escaped/trusted HTML fragment — callers build this from escapeHtml()'d dynamic values. */
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  /** Always the app-side preferences page — see src/app/learn/settings/page.tsx and the Milestone 9 report for what a provider-side unsubscribe link would add later. */
  unsubscribeUrl: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const BRAND_PURPLE = "#5b45e0";
const INK = "#1a1a2e";
const MUTED_INK = "#42425a";
const FAINT_INK = "#8a8aa3";
const BORDER = "#e5e5ef";
const PAGE_BG = "#f4f4f8";

/**
 * The one HTML shell every template renders through — plain inline-styled
 * markup (no build step, no email-templating dependency) so it survives
 * being stripped down by real email clients. Keep this the only place
 * layout markup lives; templates should only ever change bodyHtml/copy.
 */
export function renderEmailLayout({
  previewText,
  heading,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  unsubscribeUrl,
}: EmailLayoutInput): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${PAGE_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none;font-size:1px;color:${PAGE_BG};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(previewText)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background-color:#ffffff;border-radius:16px;border:1px solid ${BORDER};">
            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <span style="display:inline-block;width:28px;height:28px;background-color:${BRAND_PURPLE};color:#ffffff;border-radius:8px;text-align:center;line-height:28px;font-weight:700;font-size:15px;">S</span>
                <span style="font-size:18px;font-weight:600;color:${INK};margin-inline-start:8px;">SentenceStep</span>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 8px 32px;">
                <h1 style="font-size:22px;line-height:1.3;margin:0 0 12px 0;color:${INK};">${escapeHtml(heading)}</h1>
                <div style="font-size:15px;line-height:1.6;color:${MUTED_INK};">${bodyHtml}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;">
                <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background-color:${BRAND_PURPLE};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:10px;">${escapeHtml(ctaLabel)}</a>
              </td>
            </tr>
          </table>
          <p style="max-width:480px;color:${FAINT_INK};font-size:12px;line-height:1.6;margin-top:16px;padding:0 8px;">
            You're receiving this because of your SentenceStep account.
            <a href="${escapeHtml(unsubscribeUrl)}" style="color:${FAINT_INK};">Manage email preferences</a>.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
