/**
 * Vodafone Cash (Egypt) as a way to pay: the learner sends Egyptian pounds from their own Vodafone
 * Cash wallet to the shop's wallet; Vodafone texts the shop wallet's phone for every transfer, and an
 * SMS-forwarding app on that phone posts the text to /api/payments/egypt-wallet/sms. Everything about
 * reading a message and matching it to an order lives in this folder.
 */

/** Stored on payment_orders.provider, and the PaymentProvider's name. */
export const EGYPT_WALLET_PROVIDER = "vodafone_cash";

/** The only currency an order can be paid in. Whole pounds, never piasters. */
export const EGYPT_WALLET_CURRENCY = "EGP";

/** The only country the way to pay is offered in (lowercase ISO code, as resolvePricingCountry returns it). */
export const EGYPT_COUNTRY = "eg";

/** The forwarding app's shared secret must be at least this long to be accepted. */
export const MIN_SECRET_LENGTH = 32;

/** A request body bigger than this is refused before it is read (a text message is a few hundred characters). */
export const MAX_BODY_BYTES = 8 * 1024;

/** A message longer than this is cut: it is stored for an admin to read, never interpreted whole. */
export const MAX_SMS_CHARS = 2_000;

/** A transfer older than the order it is for by more than this cannot have been made for it. */
export const TRANSFER_BEFORE_ORDER_TOLERANCE_MS = 10 * 60 * 1000;

/** How long after an order was created a transfer still activates it (admin-tunable, see egypt_wallet_settings). */
export const DEFAULT_LATE_PAYMENT_HOURS = 24;

/** Orders per rolling 24 hours, for everyone together, before the button is paused (admin-tunable). */
export const DEFAULT_DAILY_ORDER_CAP = 50;

/** New Vodafone Cash orders one learner can open in a rolling 24 hours (an order that is still open is handed back, not counted again). */
export const MAX_ORDERS_PER_PERSON_PER_DAY = 5;

/** The order's payment page promises this long; a later transfer is still honoured within the late window. */
export const ORDER_WINDOW_MINUTES = 60;

export const SMS_SECRET_HEADER = "x-secret";
