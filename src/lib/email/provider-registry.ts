import type { EmailProvider } from "@/lib/email/provider";
import { createResendProvider } from "@/lib/email/providers/resend";
import { createRoutedProvider } from "@/lib/email/providers/routed";
import { createSesProvider } from "@/lib/email/providers/ses";
import { createWarmupBudget } from "@/lib/email/providers/warmup";
import { createSupabaseUsageStore } from "@/lib/email/usage";

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
/** A whole number from the environment, or `fallback` when it is unset, blank or not a number. */
function intFromEnv(raw: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(raw?.trim() ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function sesFromEnv(from: string | undefined, replyTo: string | undefined): EmailProvider | null {
  const accessKeyId = process.env.AWS_SES_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SES_SECRET_ACCESS_KEY?.trim();
  if (!accessKeyId || !secretAccessKey || !from) return null;
  return createSesProvider({
    accessKeyId,
    secretAccessKey,
    region: process.env.AWS_SES_REGION?.trim() || "us-east-1",
    from,
    replyTo,
  });
}

function resendFromEnv(
  from: string | undefined,
  replyTo: string | undefined,
): EmailProvider | null {
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  if (!apiKey || !from) return null;
  return createResendProvider(apiKey, from, replyTo);
}

export function getEmailProvider(): EmailProvider | null {
  const from = process.env.EMAIL_FROM_ADDRESS;
  const replyTo = resolveReplyTo(process.env.EMAIL_REPLY_TO_ADDRESS);
  const kind = process.env.EMAIL_PROVIDER?.trim().toLowerCase();

  // EMAIL_PROVIDER=ses sends everything through Amazon SES (keys: AWS_SES_ACCESS_KEY_ID and
  // AWS_SES_SECRET_ACCESS_KEY, region AWS_SES_REGION, default us-east-1).
  if (kind === "ses") return sesFromEnv(from, replyTo);

  // EMAIL_PROVIDER=hybrid uses both (see providers/routed.ts): important messages go through
  // Resend's free plan, the rest through SES, each the other's fallback. With only one of the two
  // configured it simply uses that one. Budgets: EMAIL_RESEND_DAILY_BUDGET (default 80, Resend's
  // free plan allows 100), EMAIL_RESEND_BULK_CEILING (default 40) and EMAIL_SES_MONTHLY_BUDGET
  // (default 12000, about two dollars at SES's highest plan price).
  if (kind === "hybrid") {
    const resend = resendFromEnv(from, replyTo);
    const ses = sesFromEnv(from, replyTo);
    if (!resend || !ses) return resend ?? ses;
    const dailyBudget = intFromEnv(process.env.EMAIL_RESEND_DAILY_BUDGET, 80);
    const store = createSupabaseUsageStore();
    return createRoutedProvider({
      resend,
      ses,
      store,
      sesBulkDailyBudget: createWarmupBudget(store),
      resendDailyBudget: dailyBudget,
      resendBulkCeiling: Math.min(
        intFromEnv(process.env.EMAIL_RESEND_BULK_CEILING, 40),
        dailyBudget,
      ),
      sesMonthlyBudget: intFromEnv(process.env.EMAIL_SES_MONTHLY_BUDGET, 12000),
    });
  }

  // Anything else is Resend, exactly as before, so setting nothing changes nothing.
  return resendFromEnv(from, replyTo);
}
