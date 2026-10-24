import { planPremiumGrant } from "@/lib/admin/premium-grant";
import type { SubscriptionRow } from "@/lib/billing/domain";

export type StoredCodeStatus = "unused" | "redeemed" | "voided";

/** The few facts about a stored code that redeeming it depends on. */
export interface CodeForRedemption {
  status: StoredCodeStatus;
  /** A voided batch (an agent who cheated, a leaked list) takes its unredeemed codes with it. */
  batchStatus: "active" | "voided";
  validUntil: string;
  days: number;
  redeemedBy: string | null;
}

export type RedemptionDecision =
  /** No stored code has this hash. */
  | { outcome: "unknown" }
  /** Someone else already used it. */
  | { outcome: "used" }
  /** The same learner submitted it again (a double tap, a reload): nothing more is granted. */
  | { outcome: "used_by_you" }
  | { outcome: "voided" }
  | { outcome: "expired" }
  /** The account has Premium with no end date, so there is nothing to add: the code is kept for them. */
  | { outcome: "unlimited" }
  | { outcome: "redeem"; days: number; start: string; end: string; extendedExisting: boolean };

/**
 * What typing this code does, given what the database knows about it and about the learner's
 * subscription. The days stack on Premium the learner still has and otherwise start now, exactly as a
 * paid order and an admin grant do (planPremiumGrant is the shared rule). The database function that
 * really redeems (redeem_code in 20250349000000_redeem_codes.sql) must agree with this one case by
 * case; the tests here are the table it is checked against.
 */
export function decideRedemption(
  code: CodeForRedemption | null,
  userId: string,
  subscription: SubscriptionRow | null,
  now: Date,
): RedemptionDecision {
  if (!code) return { outcome: "unknown" };
  if (code.status === "redeemed") {
    return { outcome: code.redeemedBy === userId ? "used_by_you" : "used" };
  }
  if (code.status === "voided" || code.batchStatus === "voided") return { outcome: "voided" };
  if (Date.parse(code.validUntil) <= now.getTime()) return { outcome: "expired" };

  const plan = planPremiumGrant(subscription, code.days, now);
  if (plan.kind === "unlimited") return { outcome: "unlimited" };
  return {
    outcome: "redeem",
    days: code.days,
    start: plan.start,
    end: plan.end,
    extendedExisting: plan.extendedExisting,
  };
}

/** What the admin pages show for a code: "expired" is an unused code past its batch's date. */
export type CodeDisplayStatus = "unused" | "redeemed" | "voided" | "expired";

export function displayStatus(
  code: Pick<CodeForRedemption, "status" | "batchStatus" | "validUntil">,
  now: Date,
): CodeDisplayStatus {
  if (code.status === "redeemed") return "redeemed";
  if (code.status === "voided" || code.batchStatus === "voided") return "voided";
  return Date.parse(code.validUntil) <= now.getTime() ? "expired" : "unused";
}
