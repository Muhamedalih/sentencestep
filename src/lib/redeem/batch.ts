import { PLAN_IDS, getPlan } from "@/lib/billing/plans";
import type { PlanId } from "@/lib/billing/plans";

import {
  FIRST_BATCH_MAX,
  MAX_BATCH_SIZE,
  MAX_VALID_DAYS,
  MIN_VALID_DAYS,
  MIN_WHOLESALE_FRACTION_OF_LIST,
} from "./constants";

const DAY_MS = 24 * 60 * 60 * 1000;

/** What the owner sells a code for, by how many codes the agent takes in one order. Prices are USD cents. */
export type WholesaleLadder = Readonly<
  Record<PlanId, readonly { minQuantity: number; centsEach: number }[]>
>;

/** The ladder step an order of `orderQuantity` codes falls on; null when no step reaches it. */
export function wholesaleCentsFor(
  ladder: WholesaleLadder,
  planId: PlanId,
  orderQuantity: number,
): number | null {
  let price: number | null = null;
  let reached = 0;
  for (const step of ladder[planId]) {
    if (step.minQuantity <= orderQuantity && step.minQuantity >= reached) {
      price = step.centsEach;
      reached = step.minQuantity;
    }
  }
  return price;
}

export interface BatchItem {
  planId: PlanId;
  quantity: number;
  /** USD cents the agent pays per code. */
  wholesaleCentsEach: number;
}

export interface AgentForBatch {
  /** Only a vetted ("active") agent can buy codes. */
  status: "candidate" | "active" | "paused" | "ended";
  /** The most unredeemed codes this agent may hold. */
  maxOutstanding: number;
  /** Unredeemed, unexpired, unvoided codes they hold now. */
  outstanding: number;
  /** Batches bought before; 0 means the first order, which stays small. */
  batchesBought: number;
}

export interface BatchRequest {
  items: readonly BatchItem[];
  /** USD cents the owner has received from the agent for THIS batch. */
  receivedCents: number;
  validDays: number;
}

export interface BatchLine {
  planId: PlanId;
  days: number;
  quantity: number;
  wholesaleCentsEach: number;
}

export type BatchPlan =
  | {
      ok: true;
      lines: BatchLine[];
      totalCodes: number;
      totalCents: number;
      /** What was received beyond the price: a credit toward the next batch, never a reason to issue more. */
      excessCents: number;
      validUntil: string;
    }
  | { ok: false; error: string };

function isWhole(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

/**
 * Whether a batch may be issued, and what it is. The rules are the dealing rules: the agent pays
 * first (what was received must cover the price, there is no credit), the first order stays tiny,
 * nobody holds more unsold codes than the owner allows, and a price that is far from the list
 * price is refused as a typo. Nothing is created here; the caller does that once this says ok.
 */
export function planBatch(agent: AgentForBatch, request: BatchRequest, now: Date): BatchPlan {
  if (agent.status !== "active") {
    return { ok: false, error: "Only an active agent can buy codes. Finish the vetting first." };
  }
  if (request.items.length === 0) return { ok: false, error: "Add at least one plan." };

  const seen = new Set<PlanId>();
  const lines: BatchLine[] = [];
  let totalCodes = 0;
  let totalCents = 0;

  for (const item of request.items) {
    if (!PLAN_IDS.includes(item.planId)) return { ok: false, error: "Unknown plan." };
    if (seen.has(item.planId)) {
      return { ok: false, error: "Each plan can appear once: add its quantities together." };
    }
    seen.add(item.planId);
    if (!isWhole(item.quantity) || item.quantity < 1) {
      return { ok: false, error: "Quantities are whole numbers from 1." };
    }
    if (!isWhole(item.wholesaleCentsEach) || item.wholesaleCentsEach < 1) {
      return { ok: false, error: "A wholesale price is a whole number of cents." };
    }

    const plan = getPlan(item.planId);
    const lowest = Math.min(plan.priceUsdCents.A, plan.priceUsdCents.B);
    const highest = Math.max(plan.priceUsdCents.A, plan.priceUsdCents.B);
    const floor = Math.ceil(lowest * MIN_WHOLESALE_FRACTION_OF_LIST);
    if (item.wholesaleCentsEach < floor || item.wholesaleCentsEach > highest) {
      return {
        ok: false,
        error: `A ${item.planId} code must cost between ${floor} and ${highest} cents wholesale.`,
      };
    }

    totalCodes += item.quantity;
    totalCents += item.quantity * item.wholesaleCentsEach;
    lines.push({
      planId: item.planId,
      days: plan.days,
      quantity: item.quantity,
      wholesaleCentsEach: item.wholesaleCentsEach,
    });
  }

  if (totalCodes > MAX_BATCH_SIZE) {
    return { ok: false, error: `A batch holds at most ${MAX_BATCH_SIZE} codes.` };
  }
  if (agent.batchesBought === 0 && totalCodes > FIRST_BATCH_MAX) {
    return {
      ok: false,
      error: `A first order is at most ${FIRST_BATCH_MAX} codes. Trust grows with sales.`,
    };
  }
  if (agent.outstanding + totalCodes > agent.maxOutstanding) {
    return {
      ok: false,
      error: `This agent already holds ${agent.outstanding} unsold codes; the limit is ${agent.maxOutstanding}.`,
    };
  }
  if (
    !isWhole(request.validDays) ||
    request.validDays < MIN_VALID_DAYS ||
    request.validDays > MAX_VALID_DAYS
  ) {
    return {
      ok: false,
      error: `Codes stay valid for ${MIN_VALID_DAYS} to ${MAX_VALID_DAYS} days.`,
    };
  }
  if (!isWhole(request.receivedCents) || request.receivedCents < totalCents) {
    return {
      ok: false,
      error:
        "The agent pays first: what was received must cover the whole price. There is no credit.",
    };
  }

  return {
    ok: true,
    lines,
    totalCodes,
    totalCents,
    excessCents: request.receivedCents - totalCents,
    validUntil: new Date(now.getTime() + request.validDays * DAY_MS).toISOString(),
  };
}
