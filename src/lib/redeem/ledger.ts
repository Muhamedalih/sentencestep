import type { PlanId } from "@/lib/billing/plans";

import { displayStatus } from "./redemption";
import type { CodeForRedemption } from "./redemption";

/** One stored code as the agent ledger sees it. */
export interface LedgerCode extends Pick<
  CodeForRedemption,
  "status" | "batchStatus" | "validUntil"
> {
  planId: PlanId;
  /** What the agent paid for it, USD cents. */
  wholesaleCents: number;
  createdAt: string;
  redeemedAt: string | null;
}

export interface AgentSummary {
  issued: number;
  redeemed: number;
  voided: number;
  expired: number;
  /** Still redeemable: the agent has paid for these and the learners' days are still owed. */
  outstanding: number;
  wholesaleIssuedCents: number;
  /** The share of the agent's payments that has turned into real Premium. */
  wholesaleRedeemedCents: number;
  /** What the owner still owes in Premium days, at wholesale value. */
  outstandingCents: number;
  /** redeemed / (issued - voided); null until something is issued. A low value means unsold stock or a weak agent. */
  sellThrough: number | null;
  /** Median days from issue to redemption; null with fewer than 3 redeemed (a median of two is noise). */
  medianDaysToRedeem: number | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

/** The ledger line for one agent (or for all agents together, given all their codes). */
export function summarizeAgent(codes: readonly LedgerCode[], now: Date): AgentSummary {
  const summary: AgentSummary = {
    issued: codes.length,
    redeemed: 0,
    voided: 0,
    expired: 0,
    outstanding: 0,
    wholesaleIssuedCents: 0,
    wholesaleRedeemedCents: 0,
    outstandingCents: 0,
    sellThrough: null,
    medianDaysToRedeem: null,
  };
  const daysToRedeem: number[] = [];

  for (const code of codes) {
    summary.wholesaleIssuedCents += code.wholesaleCents;
    switch (displayStatus(code, now)) {
      case "redeemed":
        summary.redeemed += 1;
        summary.wholesaleRedeemedCents += code.wholesaleCents;
        if (code.redeemedAt) {
          daysToRedeem.push((Date.parse(code.redeemedAt) - Date.parse(code.createdAt)) / DAY_MS);
        }
        break;
      case "voided":
        summary.voided += 1;
        break;
      case "expired":
        summary.expired += 1;
        break;
      case "unused":
        summary.outstanding += 1;
        summary.outstandingCents += code.wholesaleCents;
        break;
    }
  }

  const sellable = summary.issued - summary.voided;
  summary.sellThrough = sellable > 0 ? summary.redeemed / sellable : null;
  if (daysToRedeem.length >= 3) summary.medianDaysToRedeem = median(daysToRedeem);
  return summary;
}
