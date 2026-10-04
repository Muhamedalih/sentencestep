import type { PaymentProvider } from "@/lib/billing/payment-provider";
import { createWaylProvider } from "@/lib/billing/providers/wayl";

const MIN_WEBHOOK_SECRET_LENGTH = 16;

/**
 * Returns null — never a fake/mock implementation — until WAYL_API_KEY,
 * WAYL_WEBHOOK_SECRET and WAYL_ENV are all set (see .env.example). Every
 * caller (checkout action, webhook route, reconcile cron) handles "no
 * provider configured" as a real, honest state.
 *
 * `live` additionally requires a production build, so a developer machine
 * with a real key in .env.local can never create real payment links.
 */
export function getPaymentProvider(): PaymentProvider | null {
  const apiKey = process.env.WAYL_API_KEY;
  const webhookSecret = process.env.WAYL_WEBHOOK_SECRET;
  const environment = process.env.WAYL_ENV;

  if (!apiKey || !webhookSecret || webhookSecret.length < MIN_WEBHOOK_SECRET_LENGTH) return null;
  if (environment !== "live" && environment !== "test") return null;
  if (environment === "live" && process.env.NODE_ENV !== "production") return null;

  return createWaylProvider({ apiKey, webhookSecret, environment });
}
