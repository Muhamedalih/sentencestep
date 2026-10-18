import { DEFAULT_DAILY_ORDER_CAP, DEFAULT_LATE_PAYMENT_HOURS } from "./constants";

/**
 * The admin-edited knobs of Binance Pay, one row in binance_pay_settings. The
 * account the learner pays to is here, not in the code, so changing it never
 * needs a deploy.
 */
export interface BinancePaySettings {
  /** The Binance ID learners type in Send; shown on the payment page. */
  binanceId: string;
  /** The nickname Binance shows the sender when they confirm, so they can check they are paying the right account. */
  displayName: string;
  /** Orders created in any rolling 24 hours before the button pauses. 0 pauses it. */
  dailyOrderCap: number;
  /** When false, nothing is activated by itself: every transfer waits for an admin. */
  autoActivate: boolean;
  /** How long after an order a transfer with its code still activates it. */
  latePaymentHours: number;
}

export const DEFAULT_BINANCE_PAY_SETTINGS: BinancePaySettings = {
  binanceId: "",
  displayName: "",
  dailyOrderCap: DEFAULT_DAILY_ORDER_CAP,
  autoActivate: true,
  latePaymentHours: DEFAULT_LATE_PAYMENT_HOURS,
};

export const DAILY_ORDER_CAP_RANGE = { min: 0, max: 200 } as const;
export const LATE_PAYMENT_HOURS_RANGE = { min: 1, max: 168 } as const;

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** A row from the database (or anything else) coerced into usable settings; whatever is missing or malformed falls back to the default. */
export function sanitizeBinancePaySettings(raw: unknown): BinancePaySettings {
  const base = { ...DEFAULT_BINANCE_PAY_SETTINGS };
  if (!isRecord(raw)) return base;
  const id = typeof raw.binance_id === "string" ? raw.binance_id.trim() : "";
  const name = typeof raw.display_name === "string" ? raw.display_name.trim() : "";
  return {
    binanceId: /^\d{3,20}$/.test(id) ? id : base.binanceId,
    displayName: name !== "" && name.length <= 40 && !CONTROL_CHARACTERS.test(name) ? name : "",
    dailyOrderCap: clampInt(
      raw.daily_order_cap,
      DAILY_ORDER_CAP_RANGE.min,
      DAILY_ORDER_CAP_RANGE.max,
      base.dailyOrderCap,
    ),
    autoActivate: typeof raw.auto_activate === "boolean" ? raw.auto_activate : base.autoActivate,
    latePaymentHours: clampInt(
      raw.late_payment_hours,
      LATE_PAYMENT_HOURS_RANGE.min,
      LATE_PAYMENT_HOURS_RANGE.max,
      base.latePaymentHours,
    ),
  };
}

export type SettingsInputResult =
  { ok: true; settings: BinancePaySettings } | { ok: false; error: string };

/** What the admin form submits, checked strictly: a bad value is an error to show, never silently corrected. */
export function validateBinancePaySettingsInput(input: {
  binanceId: string;
  displayName: string;
  dailyOrderCap: number;
  autoActivate: boolean;
  latePaymentHours: number;
}): SettingsInputResult {
  const binanceId = input.binanceId.trim();
  if (!/^\d{3,20}$/.test(binanceId)) {
    return { ok: false, error: "The Binance ID is a number (digits only), as shown in Pay." };
  }
  const displayName = input.displayName.trim();
  if (displayName === "" || displayName.length > 40 || CONTROL_CHARACTERS.test(displayName)) {
    return { ok: false, error: "The name shown to senders must be 1 to 40 characters." };
  }
  if (
    !Number.isInteger(input.dailyOrderCap) ||
    input.dailyOrderCap < DAILY_ORDER_CAP_RANGE.min ||
    input.dailyOrderCap > DAILY_ORDER_CAP_RANGE.max
  ) {
    return {
      ok: false,
      error: `Orders per day must be a whole number from ${DAILY_ORDER_CAP_RANGE.min} to ${DAILY_ORDER_CAP_RANGE.max}.`,
    };
  }
  if (
    !Number.isInteger(input.latePaymentHours) ||
    input.latePaymentHours < LATE_PAYMENT_HOURS_RANGE.min ||
    input.latePaymentHours > LATE_PAYMENT_HOURS_RANGE.max
  ) {
    return {
      ok: false,
      error: `Late payments must be a whole number of hours from ${LATE_PAYMENT_HOURS_RANGE.min} to ${LATE_PAYMENT_HOURS_RANGE.max}.`,
    };
  }
  return {
    ok: true,
    settings: {
      binanceId,
      displayName,
      dailyOrderCap: input.dailyOrderCap,
      autoActivate: input.autoActivate,
      latePaymentHours: input.latePaymentHours,
    },
  };
}
