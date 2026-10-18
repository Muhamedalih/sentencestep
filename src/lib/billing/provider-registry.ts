import { MIN_RELAY_SECRET_LENGTH } from "@/lib/billing/binance/constants";
import { createBinancePayStore } from "@/lib/billing/binance/store";
import type { BinancePayStore } from "@/lib/billing/binance/store";
import type { PaymentProvider } from "@/lib/billing/payment-provider";
import { createBinancePayProvider } from "@/lib/billing/providers/binance-pay";
import { createWaylProvider } from "@/lib/billing/providers/wayl";

const MIN_WEBHOOK_SECRET_LENGTH = 16;

/** WAYL_SHOW_USD=false (or 0, no, off) leaves Wayl's page showing dinars; anything else, or unset, asks it to show dollars. */
export function showUsdOnWaylPage(): boolean {
  const value = process.env.WAYL_SHOW_USD?.trim().toLowerCase();
  return !(value === "false" || value === "0" || value === "no" || value === "off");
}

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

  return createWaylProvider({ apiKey, webhookSecret, environment, showUsd: showUsdOnWaylPage() });
}

/**
 * The secret shared with the relay (the small server outside the US that reads
 * the shop's Binance Pay history), or null while BINANCE_RELAY_SECRET is unset
 * or too short to be safe. Binance Pay is simply unavailable then: an order
 * could be created but nothing could ever tell the site it had been paid.
 */
export function getBinancePayRelaySecret(): string | null {
  const secret = process.env.BINANCE_RELAY_SECRET;
  return secret && secret.length >= MIN_RELAY_SECRET_LENGTH ? secret : null;
}

export function isBinancePayConfigured(): boolean {
  return getBinancePayRelaySecret() !== null;
}

/**
 * Null — never a fake — until BINANCE_RELAY_SECRET is set. Unlike Wayl there
 * is nothing else to configure here: the account learners pay to lives in the
 * admin-edited binance_pay_settings row, and the database is only opened when a
 * payment is actually created or asked about. Whether anyone is shown the
 * button is decided separately, by the "binancePay" feature switch.
 */
export function getBinancePayProvider(): PaymentProvider | null {
  if (!isBinancePayConfigured()) return null;
  let store: BinancePayStore | undefined;
  return createBinancePayProvider({
    environment: process.env.NODE_ENV === "production" ? "live" : "test",
    store: () => (store ??= createBinancePayStore()),
  });
}
