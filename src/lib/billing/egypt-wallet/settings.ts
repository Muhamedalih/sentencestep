import { DEFAULT_DAILY_ORDER_CAP, DEFAULT_LATE_PAYMENT_HOURS } from "./constants";
import { normalizeEgyptPhone } from "./phone";

export interface EgyptWalletSettings {
  /** The Vodafone Cash number learners send to; empty means the way to pay is not set up. */
  walletNumber: string;
  dailyOrderCap: number;
  autoActivate: boolean;
  latePaymentHours: number;
}

export const DEFAULT_EGYPT_WALLET_SETTINGS: EgyptWalletSettings = {
  walletNumber: "",
  dailyOrderCap: DEFAULT_DAILY_ORDER_CAP,
  autoActivate: true,
  latePaymentHours: DEFAULT_LATE_PAYMENT_HOURS,
};

function inRange(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
    ? value
    : fallback;
}

/** Whatever the database row holds, made safe: a missing or odd value falls back to the default. */
export function sanitizeEgyptWalletSettings(
  row: {
    wallet_number?: unknown;
    daily_order_cap?: unknown;
    auto_activate?: unknown;
    late_payment_hours?: unknown;
  } | null,
): EgyptWalletSettings {
  if (!row) return DEFAULT_EGYPT_WALLET_SETTINGS;
  const wallet =
    typeof row.wallet_number === "string" ? normalizeEgyptPhone(row.wallet_number) : null;
  return {
    walletNumber: wallet ?? "",
    dailyOrderCap: inRange(row.daily_order_cap, 0, 200, DEFAULT_DAILY_ORDER_CAP),
    autoActivate: typeof row.auto_activate === "boolean" ? row.auto_activate : true,
    latePaymentHours: inRange(row.late_payment_hours, 1, 168, DEFAULT_LATE_PAYMENT_HOURS),
  };
}
