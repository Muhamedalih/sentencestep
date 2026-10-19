import { signAwsRequest } from "@/lib/email/providers/aws-sigv4";
import type { EmailProvider, SendEmailInput, SendEmailResult } from "@/lib/email/provider";

export interface SesConfig {
  accessKeyId: string;
  secretAccessKey: string;
  /** The AWS region the sending identity lives in, e.g. "us-east-1". */
  region: string;
  /** The verified sender: "hello@sentencestep.com" or "SentenceStep <hello@sentencestep.com>". */
  from: string;
  replyTo?: string;
}

interface SesSuccessBody {
  MessageId?: string;
}

/**
 * Amazon SES (API v2) adapter for the EmailProvider boundary (see provider.ts). One signed POST
 * to the regional endpoint, no AWS SDK (see aws-sigv4.ts). Registered from provider-registry.ts
 * when EMAIL_PROVIDER=ses.
 *
 * Like the Resend adapter it throws on any non-2xx response or network failure and never
 * returns a fabricated "sent": SES answering 200 with a MessageId means it accepted the message,
 * not that it was delivered. While the account is in the SES sandbox, SES refuses any recipient
 * that is not a verified address — that comes back as a 400 and is thrown the same way.
 */
export function createSesProvider(
  config: SesConfig,
  fetchImpl: typeof fetch = fetch,
): EmailProvider {
  const url = `https://email.${config.region}.amazonaws.com/v2/email/outbound-emails`;

  return {
    name: "ses",
    async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
      const replyTo = input.replyTo === undefined ? config.replyTo : (input.replyTo ?? undefined);
      const body = JSON.stringify({
        FromEmailAddress: config.from,
        Destination: { ToAddresses: [input.to] },
        ...(replyTo ? { ReplyToAddresses: [replyTo] } : {}),
        Content: {
          Simple: {
            Subject: { Data: input.subject, Charset: "UTF-8" },
            Body: {
              Html: { Data: input.html, Charset: "UTF-8" },
              Text: { Data: input.text, Charset: "UTF-8" },
            },
          },
        },
      });

      const { headers } = signAwsRequest({
        method: "POST",
        url,
        region: config.region,
        service: "ses",
        headers: { "content-type": "application/json" },
        body,
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        now: new Date(),
      });

      const response = await fetchImpl(url, { method: "POST", headers, body });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Amazon SES error (${response.status}): ${text.slice(0, 500)}`);
      }

      const data = (await response.json()) as SesSuccessBody;
      if (!data.MessageId) {
        throw new Error("Amazon SES returned a success response with no message id.");
      }
      return { status: "sent", providerMessageId: data.MessageId };
    },
  };
}
