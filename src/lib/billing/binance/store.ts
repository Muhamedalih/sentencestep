import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { PaymentOrderStatus } from "@/lib/billing/payments/types";
import type { Database } from "@/types/database";

import { BINANCE_PAY_PROVIDER } from "./constants";
import type { MatchableOrder } from "./matching";
import type { IncomingTransfer } from "./records";
import { sanitizeBinancePaySettings } from "./settings";
import type { BinancePaySettings } from "./settings";

export type LinkResultName =
  Database["public"]["Functions"]["link_binance_transaction"]["Returns"]["result"];

/** A stored transfer, with the id the database gave it, ready to be matched again. */
export interface StoredTransfer {
  id: string;
  transfer: IncomingTransfer;
  notifiedAt: string | null;
}

/** What the provider adapter needs to answer "has this order been paid?". */
export interface PaymentState {
  referenceId: string;
  orderCode: string;
  /** Whole USDT the order costs. */
  chargeAmount: number;
  /** The transfer linked to the order, if any. */
  linked: { transactionId: string; transactedAt: string } | null;
}

export interface RelayState {
  lastPollAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
}

export interface IntentOrder {
  id: string;
  status: PaymentOrderStatus;
  createdAt: string;
  chargeAmount: number;
}

/**
 * The database side of Binance Pay. One narrow interface so the matching,
 * ingest and provider logic can be tested against an in-memory fake, while the
 * real thing is a handful of plain queries (service role: nobody but server
 * code can read or write these tables).
 */
export interface BinancePayStore {
  getSettings(): Promise<BinancePaySettings>;
  saveSettings(settings: BinancePaySettings): Promise<void>;

  /** The Binance Pay order with this reference, whatever its state. */
  getOrderForIntent(referenceId: string): Promise<IntentOrder | null>;
  insertIntent(input: {
    orderId: string;
    orderCode: string;
    expiresAt: string;
  }): Promise<"ok" | "code_taken" | "order_has_intent">;
  getIntentCode(orderId: string): Promise<string | null>;
  listPaymentStates(referenceIds: string[]): Promise<PaymentState[]>;
  /** Orders created since then, not counting one whose creation failed: the button's daily limit. */
  countOrdersSince(since: Date, providerEnv: "live" | "test"): Promise<number>;
  /** The same count for one learner: how many orders they have opened lately. */
  countUserOrdersSince(userId: string, since: Date, providerEnv: "live" | "test"): Promise<number>;
  /** Orders still waiting for their transfer inside the payment window. */
  countActiveOrders(providerEnv: "live" | "test", now: Date): Promise<number>;

  /** Stores the transfers it has not seen before; returns how many were new. */
  insertTransfers(transfers: IncomingTransfer[]): Promise<number>;
  /** Transfers not yet linked or ignored, oldest first. */
  listUnlinkedSince(since: Date, limit: number): Promise<StoredTransfer[]>;
  /** One stored transfer, linked or not. */
  getTransferById(transferId: string): Promise<(StoredTransfer & { status: string }) | null>;
  /** One Binance Pay order (with its code), whatever its state; null if it has no code. */
  getOrderById(orderId: string): Promise<MatchableOrder | null>;
  /** The Binance Pay orders that own these codes, keyed by code. */
  findOrdersByCodes(codes: string[]): Promise<Map<string, MatchableOrder>>;
  /** Binance Pay orders that could still be paid, newest first. */
  listOpenOrders(since: Date, limit: number): Promise<MatchableOrder[]>;
  linkTransfer(input: {
    transferId: string;
    orderId: string;
    method: "note_code" | "manual";
    reason: string;
  }): Promise<LinkResultName>;
  markNotified(transferId: string, now: Date): Promise<void>;
  ignoreTransfer(transferId: string): Promise<void>;

  getRelayState(): Promise<RelayState>;
  recordRelay(
    update: { polled?: boolean; success?: boolean; error?: string | null },
    now: Date,
  ): Promise<void>;
}

type ServiceRoleClient = ReturnType<typeof createServiceRoleClient>;

const OPEN_STATUSES: PaymentOrderStatus[] = ["created", "pending", "expired"];

type TransferRow = Database["public"]["Tables"]["binance_pay_transactions"]["Row"];

function toStoredTransfer(row: TransferRow): StoredTransfer {
  return {
    id: row.id,
    notifiedAt: row.notified_at,
    transfer: {
      transactionId: row.transaction_id,
      transactedAt: row.transacted_at,
      // numeric comes back as a JSON number; eight decimals is what the matcher expects.
      amount: Number(row.amount).toFixed(8),
      currency: row.currency,
      orderType: row.order_type,
      note: row.note,
      payerBinanceId: row.payer_binance_id,
      payerName: row.payer_name,
      raw: {},
    },
  };
}

/** The ids and codes of the Binance Pay orders in this list, joined to what matching needs. */
async function matchableOrders(
  supabase: ServiceRoleClient,
  intents: { order_id: string; order_code: string }[],
  statuses: PaymentOrderStatus[],
): Promise<MatchableOrder[]> {
  if (intents.length === 0) return [];
  const { data, error } = await supabase
    .from("payment_orders")
    .select("id, reference_id, status, charge_amount, created_at")
    .eq("provider", BINANCE_PAY_PROVIDER)
    .in(
      "id",
      intents.map((intent) => intent.order_id),
    )
    .in("status", statuses);
  if (error) throw error;

  const codeByOrder = new Map(intents.map((intent) => [intent.order_id, intent.order_code]));
  return (data ?? []).map((order) => ({
    orderId: order.id,
    referenceId: order.reference_id,
    orderCode: codeByOrder.get(order.id)!,
    status: order.status,
    chargeAmount: order.charge_amount,
    createdAt: order.created_at,
  }));
}

export function createBinancePayStore(
  supabase: ServiceRoleClient = createServiceRoleClient(),
): BinancePayStore {
  return {
    async getSettings() {
      const { data, error } = await supabase
        .from("binance_pay_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return sanitizeBinancePaySettings(data);
    },

    async saveSettings(settings) {
      const { error } = await supabase.from("binance_pay_settings").upsert({
        id: 1,
        binance_id: settings.binanceId,
        display_name: settings.displayName,
        daily_order_cap: settings.dailyOrderCap,
        auto_activate: settings.autoActivate,
        late_payment_hours: settings.latePaymentHours,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },

    async getOrderForIntent(referenceId) {
      const { data, error } = await supabase
        .from("payment_orders")
        .select("id, status, created_at, charge_amount")
        .eq("reference_id", referenceId)
        .eq("provider", BINANCE_PAY_PROVIDER)
        .maybeSingle();
      if (error) throw error;
      return data
        ? {
            id: data.id,
            status: data.status,
            createdAt: data.created_at,
            chargeAmount: data.charge_amount,
          }
        : null;
    },

    async insertIntent({ orderId, orderCode, expiresAt }) {
      const { error } = await supabase
        .from("binance_pay_intents")
        .insert({ order_id: orderId, order_code: orderCode, expires_at: expiresAt });
      if (!error) return "ok";
      if (error.code === "23505") {
        return error.message.includes("order_code") ? "code_taken" : "order_has_intent";
      }
      throw error;
    },

    async getIntentCode(orderId) {
      const { data, error } = await supabase
        .from("binance_pay_intents")
        .select("order_code")
        .eq("order_id", orderId)
        .maybeSingle();
      if (error) throw error;
      return data?.order_code ?? null;
    },

    async listPaymentStates(referenceIds) {
      if (referenceIds.length === 0) return [];
      const { data: orders, error: ordersError } = await supabase
        .from("payment_orders")
        .select("id, reference_id, charge_amount")
        .eq("provider", BINANCE_PAY_PROVIDER)
        .in("reference_id", referenceIds);
      if (ordersError) throw ordersError;
      if (!orders || orders.length === 0) return [];

      const ids = orders.map((order) => order.id);
      const [intents, transfers] = await Promise.all([
        supabase.from("binance_pay_intents").select("order_id, order_code").in("order_id", ids),
        supabase
          .from("binance_pay_transactions")
          .select("linked_order_id, transaction_id, transacted_at")
          .eq("status", "linked")
          .in("linked_order_id", ids),
      ]);
      if (intents.error) throw intents.error;
      if (transfers.error) throw transfers.error;

      const codeByOrder = new Map(
        (intents.data ?? []).map((row) => [row.order_id, row.order_code]),
      );
      const transferByOrder = new Map(
        (transfers.data ?? []).map((row) => [row.linked_order_id, row]),
      );
      return orders.flatMap((order) => {
        const orderCode = codeByOrder.get(order.id);
        // An order with no intent was never given a code: the provider has nothing to say about it.
        if (!orderCode) return [];
        const transfer = transferByOrder.get(order.id);
        return [
          {
            referenceId: order.reference_id,
            orderCode,
            chargeAmount: order.charge_amount,
            linked: transfer
              ? { transactionId: transfer.transaction_id, transactedAt: transfer.transacted_at }
              : null,
          },
        ];
      });
    },

    async countOrdersSince(since, providerEnv) {
      const { count, error } = await supabase
        .from("payment_orders")
        .select("id", { count: "exact", head: true })
        .eq("provider", BINANCE_PAY_PROVIDER)
        .eq("provider_env", providerEnv)
        .gte("created_at", since.toISOString())
        .or("status.neq.failed,provider_payment_id.not.is.null");
      if (error) throw error;
      return count ?? 0;
    },

    async countUserOrdersSince(userId, since, providerEnv) {
      const { count, error } = await supabase
        .from("payment_orders")
        .select("id", { count: "exact", head: true })
        .eq("provider", BINANCE_PAY_PROVIDER)
        .eq("provider_env", providerEnv)
        .eq("user_id", userId)
        .gte("created_at", since.toISOString())
        .or("status.neq.failed,provider_payment_id.not.is.null");
      if (error) throw error;
      return count ?? 0;
    },

    async countActiveOrders(providerEnv, now) {
      // Still inside the window, or only just past it: the reconcile job closes an expired order within minutes.
      const graceStart = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from("payment_orders")
        .select("id", { count: "exact", head: true })
        .eq("provider", BINANCE_PAY_PROVIDER)
        .eq("provider_env", providerEnv)
        .in("status", ["created", "pending"])
        .gt("link_expires_at", graceStart);
      if (error) throw error;
      return count ?? 0;
    },

    async insertTransfers(transfers) {
      if (transfers.length === 0) return 0;
      const { data, error } = await supabase
        .from("binance_pay_transactions")
        .upsert(
          transfers.map((transfer) => ({
            transaction_id: transfer.transactionId,
            transacted_at: transfer.transactedAt,
            amount: transfer.amount,
            currency: transfer.currency,
            order_type: transfer.orderType,
            note: transfer.note,
            payer_binance_id: transfer.payerBinanceId,
            payer_name: transfer.payerName,
            raw: transfer.raw,
          })),
          { onConflict: "transaction_id", ignoreDuplicates: true },
        )
        .select("id");
      if (error) throw error;
      return data?.length ?? 0;
    },

    async listUnlinkedSince(since, limit) {
      const { data, error } = await supabase
        .from("binance_pay_transactions")
        .select("*")
        .eq("status", "new")
        .gte("transacted_at", since.toISOString())
        .order("transacted_at", { ascending: true })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map(toStoredTransfer);
    },

    async getTransferById(transferId) {
      const { data, error } = await supabase
        .from("binance_pay_transactions")
        .select("*")
        .eq("id", transferId)
        .maybeSingle();
      if (error) throw error;
      return data ? { ...toStoredTransfer(data), status: data.status } : null;
    },

    async getOrderById(orderId) {
      const { data: intent, error } = await supabase
        .from("binance_pay_intents")
        .select("order_id, order_code")
        .eq("order_id", orderId)
        .maybeSingle();
      if (error) throw error;
      if (!intent) return null;
      const [order] = await matchableOrders(
        supabase,
        [intent],
        ["created", "pending", "fulfilled", "failed", "cancelled", "expired", "needs_review"],
      );
      return order ?? null;
    },

    async findOrdersByCodes(codes) {
      if (codes.length === 0) return new Map();
      const { data: intents, error } = await supabase
        .from("binance_pay_intents")
        .select("order_id, order_code")
        .in("order_code", codes);
      if (error) throw error;
      // Every status: matching decides what to do with a closed or paid order.
      const orders = await matchableOrders(supabase, intents ?? [], [
        "created",
        "pending",
        "fulfilled",
        "failed",
        "cancelled",
        "expired",
        "needs_review",
      ]);
      return new Map(orders.map((order) => [order.orderCode, order]));
    },

    async listOpenOrders(since, limit) {
      const { data: orders, error } = await supabase
        .from("payment_orders")
        .select("id")
        .eq("provider", BINANCE_PAY_PROVIDER)
        .in("status", OPEN_STATUSES)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      const ids = (orders ?? []).map((order) => order.id);
      if (ids.length === 0) return [];
      const { data: intents, error: intentsError } = await supabase
        .from("binance_pay_intents")
        .select("order_id, order_code")
        .in("order_id", ids);
      if (intentsError) throw intentsError;
      const found = await matchableOrders(supabase, intents ?? [], OPEN_STATUSES);
      return found.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async linkTransfer({ transferId, orderId, method, reason }) {
      const { data, error } = await supabase.rpc("link_binance_transaction", {
        p_transaction: transferId,
        p_order: orderId,
        p_method: method,
        p_reason: reason,
      });
      if (error) throw error;
      return data.result;
    },

    async markNotified(transferId, now) {
      const { error } = await supabase
        .from("binance_pay_transactions")
        .update({ notified_at: now.toISOString() })
        .eq("id", transferId);
      if (error) throw error;
    },

    async ignoreTransfer(transferId) {
      const { error } = await supabase
        .from("binance_pay_transactions")
        .update({ status: "ignored" })
        .eq("id", transferId)
        .eq("status", "new");
      if (error) throw error;
    },

    async getRelayState() {
      const { data, error } = await supabase
        .from("binance_relay_state")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return {
        lastPollAt: data?.last_poll_at ?? null,
        lastSuccessAt: data?.last_success_at ?? null,
        lastError: data?.last_error ?? null,
        lastErrorAt: data?.last_error_at ?? null,
      };
    },

    async recordRelay(update, now) {
      const stamp = now.toISOString();
      const patch: Database["public"]["Tables"]["binance_relay_state"]["Update"] = {};
      if (update.polled) patch.last_poll_at = stamp;
      if (update.success) {
        patch.last_success_at = stamp;
        patch.last_error = null;
        patch.last_error_at = null;
      }
      if (update.error) {
        patch.last_error = update.error;
        patch.last_error_at = stamp;
      }
      if (Object.keys(patch).length === 0) return;
      const { error } = await supabase.from("binance_relay_state").upsert({ id: 1, ...patch });
      if (error) throw error;
    },
  };
}
