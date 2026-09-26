/**
 * The one place the premium price lives. Read directly by the PayTabs
 * adapter (src/lib/billing/providers/paytabs.ts) to build each checkout's
 * cart_amount/cart_currency — PayTabs has no separate Price/Product object
 * to source this from instead, unlike some other providers.
 */
export const PREMIUM_PRICE = {
  amount: 2,
  currency: "USD",
  interval: "month",
} as const;

export function formatPrice(): string {
  return `$${PREMIUM_PRICE.amount}/${PREMIUM_PRICE.interval}`;
}

/**
 * The exact IQD amount actually charged through Wayl (see
 * providers/wayl.ts) for one billing period. Wayl settles in Iraqi Dinar
 * only, so this is a separate, deliberately chosen business number — not an
 * FX conversion computed at runtime from PREMIUM_PRICE, which would drift
 * with the exchange rate and silently change what a real customer is
 * charged. The $2/month shown on /upgrade (PREMIUM_PRICE above) and this
 * 3,000 IQD are both fixed independently; update this constant directly if
 * the IQD price ever changes.
 */
export const WAYL_PREMIUM_PRICE_IQD = 3000;
