/**
 * Redeem codes: a one-time code that an agent sells for local money and a learner types on the
 * plans page to get Premium days (see docs/redeem-codes.md). Nothing in this folder talks to the
 * database or the network; it is the rules, so they can be tested without either.
 */

/**
 * The same 31 symbols the Binance order codes use: no 0/O and no 1/I/L, so a code read off a screen
 * or heard on a call cannot be mistaken for another one.
 */
export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** 15 random symbols is 31^15 (about 2^74) possible codes: a code can't be guessed even by a patient script. */
export const CODE_BODY_LENGTH = 15;
/** The body plus one check symbol, so a typo is caught before it is counted as a failed attempt. */
export const CODE_LENGTH = CODE_BODY_LENGTH + 1;
/** Shown as four groups of four, like a gift card: ABCD-EFGH-JKMN-PQRS. */
export const CODE_GROUP_SIZE = 4;

/** Most codes one batch can hold, so a typo in the quantity can't mint a thousand days of Premium by accident. */
export const MAX_BATCH_SIZE = 200;
/** An agent who has never bought before gets this many codes at first: trust is earned in small steps. */
export const FIRST_BATCH_MAX = 5;
/**
 * Most unredeemed codes a NEW agent may hold. The owner raises it per agent (say to 20, then 50) as
 * their codes get redeemed, which is how "trust grows with sales" is carried out: the next order can't
 * be placed until enough of the last one has been used.
 */
export const DEFAULT_AGENT_MAX_OUTSTANDING = 5;

/** How long a batch's codes stay redeemable. Unsold stock can't sit for years as a liability. */
export const MIN_VALID_DAYS = 30;
export const DEFAULT_VALID_DAYS = 120;
export const MAX_VALID_DAYS = 365;

/** A wholesale price below this share of the plan's lowest list price is almost certainly a typo. */
export const MIN_WHOLESALE_FRACTION_OF_LIST = 0.5;

/** Failed attempts allowed per learner and per address before the box pauses (see attempts.ts). */
export const USER_FAILURE_LIMITS = [
  { windowMs: 10 * 60 * 1000, max: 5 },
  { windowMs: 24 * 60 * 60 * 1000, max: 20 },
] as const;
/** Looser, because many learners share one mobile-carrier address. */
export const IP_FAILURE_LIMITS = [{ windowMs: 60 * 60 * 1000, max: 40 }] as const;
