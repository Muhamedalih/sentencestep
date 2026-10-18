import { MAX_ORDERS_PER_PERSON_PER_DAY } from "./constants";

/** Why a new Binance Pay order is not opened right now; null means it may be. */
export type OrderLimitReason = "paused_today" | "personal_limit";

/**
 * The two brakes on opening a NEW Binance Pay order, both over a rolling 24 hours: the admin's limit for
 * everyone together (0 pauses the button), and the number one learner may open. The pause is checked
 * first: when the button is closed for everyone, that is what a learner should be told.
 */
export function orderLimitReason(input: {
  dailyOrderCap: number;
  ordersInLastDay: number;
  ordersByThisLearnerInLastDay: number;
}): OrderLimitReason | null {
  if (input.ordersInLastDay >= input.dailyOrderCap) return "paused_today";
  if (input.ordersByThisLearnerInLastDay >= MAX_ORDERS_PER_PERSON_PER_DAY) return "personal_limit";
  return null;
}
