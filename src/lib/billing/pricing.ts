/**
 * The one place the premium price lives. Read directly by the PayTabs
 * adapter (src/lib/billing/providers/paytabs.ts) to build each checkout's
 * cart_amount/cart_currency — PayTabs has no separate Price/Product object
 * to source this from instead, unlike some other providers.
 */
export const PREMIUM_PRICE = {
  amount: 3,
  currency: "USD",
  interval: "month",
} as const;

export function formatPrice(): string {
  return `$${PREMIUM_PRICE.amount}/${PREMIUM_PRICE.interval}`;
}
