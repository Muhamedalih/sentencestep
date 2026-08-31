import { getEmailProvider } from "@/lib/email/provider-registry";
import type { EmailContent } from "@/lib/email/templates/layout";

export type SendTemplateEmailResult =
  { status: "sent"; providerMessageId: string } | { status: "queued"; reason: string };

/** Never logs a full address — only enough to spot-check in development logs. */
function redactEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  return `${local.slice(0, 1)}${"*".repeat(Math.max(local.length - 1, 1))}@${domain}`;
}

/**
 * The one function the rest of the app calls to send an email — never a
 * provider's SDK directly (see provider-registry.ts). When no provider is
 * configured, this logs a redacted, development-only record of what would
 * have been sent and returns "queued". It never claims "sent" without a
 * provider actually accepting the request, and never claims "delivered" at
 * all — only a provider webhook (not built yet) could confirm that.
 */
export async function sendTemplateEmail(
  to: string,
  content: EmailContent,
): Promise<SendTemplateEmailResult> {
  const provider = getEmailProvider();

  if (!provider) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[email:dev] queued — no provider configured", {
        to: redactEmail(to),
        subject: content.subject,
      });
    }
    return { status: "queued", reason: "No email provider configured." };
  }

  const result = await provider.sendEmail({
    to,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });

  return { status: "sent", providerMessageId: result.providerMessageId };
}
