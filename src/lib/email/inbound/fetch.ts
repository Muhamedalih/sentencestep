import type { ReceivedEmailContent } from "@/lib/email/inbound/parse";

const RESEND_RECEIVING_URL = "https://api.resend.com/emails/receiving";

/**
 * Fetches a received message's body from Resend — the webhook itself carries
 * metadata only. Throws on any non-2xx or network failure (the route turns
 * that into a 5xx so Resend retries the delivery) and never invents content.
 */
export async function fetchReceivedEmail(
  emailId: string,
  apiKey: string,
): Promise<ReceivedEmailContent> {
  const response = await fetch(`${RESEND_RECEIVING_URL}/${encodeURIComponent(emailId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend receiving API error (${response.status}): ${body.slice(0, 500)}`);
  }

  return (await response.json()) as ReceivedEmailContent;
}
