const API_ERROR_PATTERN = /^Resend API error \((\d{3})\):\s*([\s\S]*)$/;
const MAX_DETAIL_LENGTH = 200;

function truncate(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > MAX_DETAIL_LENGTH ? `${trimmed.slice(0, MAX_DETAIL_LENGTH)}…` : trimmed;
}

/**
 * Turns what the email adapter threw into one sentence an admin can act on.
 * Only used for the admin-only "send an email" screens: Resend's error
 * bodies are `{ statusCode, name, message }` (e.g. an invalid Reply-To, a
 * revoked key, an unverified domain) and never contain credentials, and
 * seeing that reason is the difference between a one-minute fix and a
 * guessing game. Anything that isn't a provider API error (a network
 * failure, say) gets a short generic line plus the first part of its
 * message.
 */
export function describeProviderError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  const match = message.match(API_ERROR_PATTERN);
  if (match) {
    const [, status, body = ""] = match;
    try {
      const parsed = JSON.parse(body) as { name?: unknown; message?: unknown };
      const detail = typeof parsed.message === "string" ? parsed.message : body;
      const name = typeof parsed.name === "string" ? ` ${parsed.name}` : "";
      return `Resend rejected the message (${status}${name}): ${truncate(detail)}`;
    } catch {
      return `Resend rejected the message (${status}): ${truncate(body)}`;
    }
  }

  return `The email couldn't be sent: ${truncate(message) || "unknown error"}`;
}
