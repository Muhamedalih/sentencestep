import type { EmailProvider, SendEmailInput, SendEmailResult } from "@/lib/email/provider";

const RESEND_API_URL = "https://api.resend.com/emails";

interface ResendSuccessBody {
  id: string;
}

/**
 * Resend adapter for the EmailProvider boundary (see provider.ts). Talks to
 * Resend's REST API directly via fetch rather than pulling in the `resend`
 * SDK — the API surface used here (one POST, one JSON body) doesn't warrant
 * a new dependency. Registered from provider-registry.ts, gated on
 * EMAIL_PROVIDER_API_KEY + EMAIL_FROM_ADDRESS being set.
 *
 * Throws on any non-2xx response or network failure — it never returns a
 * fabricated "sent" result. Callers (see send.ts) are expected to let that
 * propagate to their own error handling rather than this layer inventing a
 * fallback status.
 */
export function createResendProvider(apiKey: string, from: string): EmailProvider {
  return {
    name: "resend",
    async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
      const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: input.to,
          subject: input.subject,
          html: input.html,
          text: input.text,
        }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Resend API error (${response.status}): ${body.slice(0, 500)}`);
      }

      const data = (await response.json()) as ResendSuccessBody;
      if (!data.id) {
        throw new Error("Resend API returned a success response with no message id.");
      }

      return { status: "sent", providerMessageId: data.id };
    },
  };
}
