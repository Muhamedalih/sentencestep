/**
 * Binance Pay as a way to pay: the learner sends USDT to the shop's Binance
 * account and writes a short order code in the transfer's note; a small relay
 * server (outside the US, where Binance answers) reads the account's Pay
 * history with a read-only key and hands the transfers to /api/payments/binance.
 * Everything about matching a transfer to an order lives in this folder.
 */

/** Stored on payment_orders.provider, and the PaymentProvider's name. */
export const BINANCE_PAY_PROVIDER = "binance_pay";

/** The only coin an order can be paid in. */
export const BINANCE_PAY_CURRENCY = "USDT";

/**
 * Letters and digits that cannot be mistaken for each other when copied by
 * eye: no 0/O, no 1/I/L. 31 symbols, five of them, is about 28 million codes,
 * so a code can't be guessed and two orders almost never draw the same one.
 */
export const ORDER_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const ORDER_CODE_LENGTH = 5;
export const ORDER_CODE_PREFIX = "SS-";

/**
 * Binance Pay transfer types that can be a customer's payment. Refunds, red
 * packets, held transfers and payouts are stored for an admin to read but never
 * linked to an order automatically.
 */
export const PAYMENT_ORDER_TYPES: readonly string[] = ["C2C", "PAY"];

/** A transfer older than the order it names by more than this cannot have been made for it (the code did not exist yet). */
export const TRANSFER_BEFORE_ORDER_TOLERANCE_MS = 5 * 60 * 1000;

/**
 * How long after an order was created a transfer carrying its code still
 * activates it. The payment page promises an hour; a learner who first has to
 * buy USDT on Binance is allowed far longer, because the code is what proves
 * the transfer is theirs.
 */
export const DEFAULT_LATE_PAYMENT_HOURS = 24;

/**
 * Orders per rolling 24 hours, for everyone together, before the Binance Pay button is paused (admin-tunable,
 * see binance_pay_settings). It only guards against a flood: what one person can do is limited separately.
 */
export const DEFAULT_DAILY_ORDER_CAP = 200;

/** New Binance Pay orders one learner can open in a rolling 24 hours (an order that is still open is handed back, not counted again). */
export const MAX_ORDERS_PER_PERSON_PER_DAY = 5;

/** The relay asks how often to look: quickly while an order is waiting, rarely otherwise. */
export const WATCH_INTERVAL_SECONDS = 15;
export const IDLE_INTERVAL_SECONDS = 60;

/** Even with no order waiting the relay looks now and then, so a late payment is still caught. */
export const IDLE_SWEEP_MS = 10 * 60 * 1000;

/** Each look re-reads this far back from the last good one, so a transfer that appeared late in Binance's history is never missed. */
export const RELAY_OVERLAP_MS = 15 * 60 * 1000;

/** The first look ever goes back this far. */
export const FIRST_LOOK_BACK_MS = 24 * 60 * 60 * 1000;

/** The relay is called offline when it has not asked for this long. */
export const RELAY_OFFLINE_AFTER_MS = 3 * 60 * 1000;

export const MIN_RELAY_SECRET_LENGTH = 32;
