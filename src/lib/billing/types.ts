import type { Database } from "@/types/database";

export type Plan = "free" | "premium";

/** Reuses the enum already defined for the subscriptions table's `status` column. */
export type SubscriptionStatus = Database["public"]["Tables"]["subscriptions"]["Row"]["status"];

export interface AccessState {
  plan: Plan;
  status: SubscriptionStatus;
  /** Null for the free plan, or a premium plan without a fixed term. */
  expiresAt: string | null;
  /** True once a premium subscriber has cancelled but is still inside their paid period. */
  cancelAtPeriodEnd: boolean;
  /** The one question the rest of the app should ask — see src/lib/billing/access.ts. */
  isPremium: boolean;
}

export const FREE_ACCESS: AccessState = {
  plan: "free",
  status: "free",
  expiresAt: null,
  cancelAtPeriodEnd: false,
  isPremium: false,
};
