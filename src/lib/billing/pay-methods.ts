/** The ways to pay on the payment partner's page, written the way each brand writes itself, so never translated. */
export const CARD_METHODS = ["Visa", "Mastercard"] as const;
/** Iraqi wallets and bank accounts: only someone in Iraq can use them, so only they are shown them. */
export const IRAQI_WALLET_METHODS = ["Super Qi", "ZainCash", "FIB"] as const;
/** The brand's own name, never translated; only listed while Binance Pay is offered to this visitor. */
export const BINANCE_PAY_METHOD = "Binance Pay";

/** The names of the ways this visitor can pay, in the order they are shown (the same list as under the pay button on /upgrade). */
export function acceptedMethodNames(options: {
  iraqiWallets: boolean;
  binancePay: boolean;
}): string[] {
  return [
    ...CARD_METHODS,
    ...(options.iraqiWallets ? IRAQI_WALLET_METHODS : []),
    ...(options.binancePay ? [BINANCE_PAY_METHOD] : []),
  ];
}
