import type { EmailProvider, SendEmailInput, SendEmailResult } from "@/lib/email/provider";
import { utcDay, utcMonthStart } from "@/lib/email/usage";
import type { EmailUsageStore } from "@/lib/email/usage";

/**
 * Sends through Resend and Amazon SES together, so each does what it is best at:
 *
 *  - Resend's free plan allows 100 emails a day (and also carries every reply a learner writes
 *    to us), so it is kept for what matters most: payments, receipts, support replies, alerts
 *    ("important"). It is tried first for those, up to `resendDailyBudget` a day.
 *  - SES is a fraction of a cent per email, so it takes the rest ("bulk": reminders, milestones),
 *    up to `sesMonthlyBudget` a month, which is what keeps the bill under a couple of dollars.
 *    A bulk message only borrows Resend's spare room when SES cannot take it, and only up to
 *    `resendBulkCeiling` a day, so bulk can never use up the room the important ones need.
 *  - Each is the other's fallback: an important message that Resend refuses goes to SES.
 *
 * Every send first reserves a slot in a shared counter (see usage.ts) and gives it back if the
 * send fails. When the counter itself cannot be reached, an important message is sent anyway
 * (never lose a receipt over bookkeeping) and a bulk message is held back (never run up a bill
 * blind). Never claims "sent" unless a provider accepted the message.
 */
export interface RoutedConfig {
  resend: EmailProvider | null;
  ses: EmailProvider | null;
  store: EmailUsageStore;
  /** The most Resend sends in a UTC day (its free plan allows 100; the rest is left for the sign-in emails Supabase sends through it). */
  resendDailyBudget: number;
  /** The most Resend sends in a day for bulk messages. */
  resendBulkCeiling: number;
  /** The most SES sends in a UTC month for bulk messages. */
  sesMonthlyBudget: number;
  /**
   * The most SES sends in today's UTC day for bulk messages: the warm-up ramp (see warmup.ts), so a
   * brand-new sending domain is not suddenly asked to send hundreds of emails. Unset means no
   * daily limit. When it throws, bulk is held back (like any counter failure).
   */
  sesBulkDailyBudget?: () => Promise<number>;
  now?: () => Date;
}

/** Thrown when no route had room for a message: nothing was sent, so the caller may try again later. */
export class NoEmailRouteError extends Error {
  constructor() {
    super("No email route has room left for this message.");
    this.name = "NoEmailRouteError";
  }
}

type Route = "resend" | "ses";
interface Slot {
  route: Route;
  period: string;
  /** False when the counter was unreachable and the message goes out untracked. */
  tracked: boolean;
}

/** SES slots are counted per day with no ceiling of their own: the day rows give the monthly total and the day warming-up started. */
const NO_DAILY_CEILING = 1_000_000;
const MONTH_CACHE_MS = 60_000;

export function createRoutedProvider(config: RoutedConfig): EmailProvider {
  const now = config.now ?? (() => new Date());
  let monthly: { used: number; at: number; month: string } | null = null;

  async function monthlySesUsed(): Promise<number> {
    const month = utcMonthStart(now());
    if (monthly && monthly.month === month && now().getTime() - monthly.at < MONTH_CACHE_MS) {
      return monthly.used;
    }
    const used = await config.store.sentSince("ses", month);
    monthly = { used, at: now().getTime(), month };
    return used;
  }

  async function takeSlot(route: Route, priority: "important" | "bulk"): Promise<Slot | null> {
    const day = utcDay(now());
    try {
      if (route === "resend") {
        const limit =
          priority === "important" ? config.resendDailyBudget : config.resendBulkCeiling;
        return (await config.store.reserve("resend", day, limit))
          ? { route, period: day, tracked: true }
          : null;
      }
      if (priority === "bulk" && (await monthlySesUsed()) >= config.sesMonthlyBudget) return null;
      const dailyLimit =
        priority === "bulk" && config.sesBulkDailyBudget
          ? await config.sesBulkDailyBudget()
          : NO_DAILY_CEILING;
      if (!(await config.store.reserve("ses", day, dailyLimit))) return null;
      if (monthly) monthly.used += 1;
      return { route, period: day, tracked: true };
    } catch (error) {
      console.error("[email] usage counter unavailable", { route, priority, error });
      return priority === "important" ? { route, period: day, tracked: false } : null;
    }
  }

  async function giveBack(slot: Slot): Promise<void> {
    if (!slot.tracked) return;
    if (slot.route === "ses" && monthly) monthly.used = Math.max(monthly.used - 1, 0);
    try {
      await config.store.release(slot.route, slot.period);
    } catch {
      // A slot that is not given back only makes the count one too high.
    }
  }

  return {
    name: "hybrid",
    async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
      const priority = input.priority ?? "important";
      const order: Route[] = priority === "important" ? ["resend", "ses"] : ["ses", "resend"];
      let lastError: unknown = null;

      for (const route of order) {
        const provider = route === "resend" ? config.resend : config.ses;
        if (!provider) continue;
        const slot = await takeSlot(route, priority);
        if (!slot) continue;
        try {
          return await provider.sendEmail(input);
        } catch (error) {
          lastError = error;
          console.warn("[email] route failed, trying the next one", { route, priority });
          await giveBack(slot);
        }
      }
      throw lastError ?? new NoEmailRouteError();
    },
  };
}
