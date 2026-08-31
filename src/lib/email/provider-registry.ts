import type { EmailProvider } from "@/lib/email/provider";
import { createResendProvider } from "@/lib/email/providers/resend";

/**
 * Resolves the configured email provider from environment variables. Reads
 * env fresh on every call rather than caching — this is cheap (no network
 * I/O), and staying uncached keeps it trivially testable across different
 * env states in the same process.
 *
 * Returns null — never a mock/fake implementation — when EMAIL_PROVIDER_API_KEY
 * or EMAIL_FROM_ADDRESS is unset. See src/lib/email/send.ts, which requires
 * every caller to handle "no provider configured" as a real, honest state
 * (logged as QUEUED in development, never claimed as sent). Adding a second
 * provider means writing another adapter under providers/ and branching here,
 * most likely on an EMAIL_PROVIDER env var, so the choice stays configuration.
 */
export function getEmailProvider(): EmailProvider | null {
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  const from = process.env.EMAIL_FROM_ADDRESS;

  if (!apiKey || !from) return null;

  return createResendProvider(apiKey, from);
}
