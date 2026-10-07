export const LINK_EXPIRES_IN = "1h";
export const LINK_TTL_MS = 60 * 60 * 1000;

/** How long after a link's expiry an unpaid order is kept open, in case a webhook or lookup is still in flight. */
export const LINK_EXPIRY_GRACE_MS = 10 * 60 * 1000;

/** An order that never got a provider link is only declared failed after this long, so a checkout still in flight is left alone. */
export const UNATTACHED_ORDER_GRACE_MS = 5 * 60 * 1000;

/** An existing open link is only handed out again while it still has at least this much life left. */
export const MIN_REUSABLE_LINK_LIFE_MS = 2 * 60 * 1000;

export const MAX_ORDERS_PER_HOUR = 5;

/** The provider's own wording kept on a failed order is cut to this, so one odd response can't bloat a row. */
export const MAX_FAILURE_DETAIL_CHARS = 400;
