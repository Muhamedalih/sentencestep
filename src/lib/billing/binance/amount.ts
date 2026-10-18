/**
 * Binance reports amounts as decimal strings with up to eight decimals
 * ("6.00000000"). They are compared as whole numbers of 1e-8 units, never as
 * floating-point numbers, so 2.1 + 0.9 style surprises can't decide whether a
 * learner paid enough.
 */
export const AMOUNT_DECIMALS = 8;
const UNIT = 10n ** BigInt(AMOUNT_DECIMALS);

/** "6.5" becomes 650000000n; anything that is not a plain non-negative decimal with at most eight decimals is null. */
export function parseAmountUnits(value: unknown): bigint | null {
  const text = typeof value === "number" && Number.isFinite(value) ? String(value) : value;
  if (typeof text !== "string") return null;
  const match = /^(\d{1,15})(?:\.(\d{1,8}))?$/.exec(text.trim());
  if (!match) return null;
  const whole = BigInt(match[1]!);
  const fraction = BigInt((match[2] ?? "").padEnd(AMOUNT_DECIMALS, "0") || "0");
  return whole * UNIT + fraction;
}

/** A whole number of coins (an order's price) in the same units. */
export function wholeToUnits(whole: number): bigint {
  return BigInt(Math.round(whole)) * UNIT;
}
