import { createServiceRoleClient } from "@/lib/supabase/service-role";

import type { CheckoutStore } from "./checkout";
import type { FulfillmentStore } from "./fulfillment";
import type { PaymentOrder } from "./types";

export interface PaymentStore extends FulfillmentStore, CheckoutStore {
  getOrderForUser(referenceId: string, userId: string): Promise<PaymentOrder | null>;
  getLatestOrderForUser(userId: string, provider: string): Promise<PaymentOrder | null>;
  /** Open orders, least recently verified first so a stuck order can never starve the others. */
  listReconcilableOrders(query: {
    provider: string;
    providerEnv: "live" | "test";
    olderThan: Date;
    limit: number;
  }): Promise<PaymentOrder[]>;
}

type ServiceRoleClient = ReturnType<typeof createServiceRoleClient>;

/** Service-role access (bypasses RLS): server-side payment code only — see service-role.ts. */
export function createPaymentStore(
  supabase: ServiceRoleClient = createServiceRoleClient(),
): PaymentStore {
  const orders = () => supabase.from("payment_orders");

  return {
    async getOrderByReference(referenceId) {
      const { data, error } = await orders()
        .select("*")
        .eq("reference_id", referenceId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async getOrderForUser(referenceId, userId) {
      const { data, error } = await orders()
        .select("*")
        .eq("reference_id", referenceId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async getLatestOrderForUser(userId, provider) {
      const { data, error } = await orders()
        .select("*")
        .eq("user_id", userId)
        .eq("provider", provider)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async updateOrder(orderId, patch) {
      let query = orders().update(patch).eq("id", orderId).neq("status", "fulfilled");
      if (patch.status !== "needs_review") query = query.neq("status", "needs_review");
      const { error } = await query;
      if (error) throw error;
    },

    async fulfillOrder(args) {
      const { data, error } = await supabase.rpc("fulfill_payment_order", {
        p_reference_id: args.referenceId,
        p_provider_payment_id: args.providerPaymentId,
        p_charge_amount: args.chargeAmount,
        p_charge_currency: args.chargeCurrency,
        p_paid_at: args.paidAt,
        p_provider_status: args.providerStatus,
      });
      if (error) throw error;
      return data;
    },

    async findReusableOrder(query) {
      const { data, error } = await orders()
        .select("*")
        .eq("user_id", query.userId)
        .eq("provider", query.provider)
        .eq("provider_env", query.providerEnv)
        .eq("pricing_tier", query.pricingTier)
        .in("status", ["created", "pending"])
        .not("checkout_url", "is", null)
        .gt("link_expires_at", query.expiringAfter.toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async countRecentOrders(userId, since) {
      const { count, error } = await orders()
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", since.toISOString());
      if (error) throw error;
      return count ?? 0;
    },

    async insertOrder(order) {
      const { data, error } = await orders().insert(order).select("*").single();
      if (error) throw error;
      return data;
    },

    async listReconcilableOrders(query) {
      const { data, error } = await orders()
        .select("*")
        .eq("provider", query.provider)
        .eq("provider_env", query.providerEnv)
        .in("status", ["created", "pending"])
        .lt("created_at", query.olderThan.toISOString())
        .order("last_verified_at", { ascending: true, nullsFirst: true })
        .limit(query.limit);
      if (error) throw error;
      return data ?? [];
    },
  };
}
