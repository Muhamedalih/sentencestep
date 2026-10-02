import type { EmailProvider } from "@/lib/email/provider";
import { createResendProvider } from "@/lib/email/providers/resend";

const BARE_ADDRESS = /^[^\s<>@"]+@[^\s<>@"]+\.[^\s<>@"]+$/;
const NAMED_ADDRESS = /^[^<>]+<[^\s<>@"]+@[^\s<>@"]+\.[^\s<>@"]+>$/;

/**
 * The optional EMAIL_REPLY_TO_ADDRESS, trimmed — or undefined when it is
 * unset OR not a valid address ("name@host" or "Name <name@host>"). A
 * mistyped value (say, a pasted "<anything>@host" placeholder) is dropped
 * with a warning instead of being passed on: the provider rejects an invalid
 * reply_to, which would make EVERY email the app sends fail, not just the
 * ones that wanted a reply address. Replies then go to EMAIL_FROM_ADDRESS.
 */
export function resolveReplyTo(raw: string | undefined): string | undefined {
  const value = raw?.trim();
  if (!value) return undefined;
  if (BARE_ADDRESS.test(value) || NAMED_ADDRESS.test(value)) return value;

  console.warn(
    "[email] EMAIL_REPLY_TO_ADDRESS is not a valid email address and was ignored — expected name@host or Name <name@host>.",
  );
  return undefined;
}

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
  const replyTo = resolveReplyTo(process.env.EMAIL_REPLY_TO_ADDRESS);

  if (!apiKey || !from) return null;

  return createResendProvider(apiKey, from, replyTo);
}
