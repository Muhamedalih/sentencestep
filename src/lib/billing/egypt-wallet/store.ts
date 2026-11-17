import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { PaymentOrderStatus } from "@/lib/billing/payments/types";
import type { Database } from "@/types/database";

import { EGYPT_WALLET_PROVIDER } from "./constants";
import type { MatchableMessage, MatchableOrder } from "./matching";
import { sanitizeEgyptWalletSettings } from "./settings";
import type { EgyptWalletSettings } from "./settings";
import type { ParsedTransfer } from "./sms";

export type LinkResultName =
  Database["public"]["Functions"]["link_egypt_wallet_message"]["Returns"]["result"];

/** A stored message, with the id the database gave it. */
export interface StoredMessage extends MatchableMessage {
  id: string;
  status: "new" | "linked" | "ignored";
  balancePiasters: number | null;
  payerName: string | null;
  rawText: string;
  seenAt: string;
  notifiedAt: string | null;
  linkedOrderId: string | null;
  linkMethod: "phone" | "reference" | "manual" | null;
}

/** What the provider adapter needs to answer "has this order been paid?". */
export interface PaymentState {
  referenceId: string;
  /** Whole pounds the order costs. */
  chargeAmount: number;
  /** The message linked to the order, if any. */
  linked: { transactionId: string; receivedAt: string } | null;
}

export interface IntentRecord {
  payerPhone: string | null;
  expiresAt: string;
  /** When the learner pressed "I sent the money". */
  claimedPaidAt: string | null;
  /** When the admins were told that nothing matching arrived after that. */
  claimAlertedAt: string | null;
}

/** An order whose learner said they paid, and whose transfer has not shown up. */
export interface UnansweredClaim {
  order: MatchableOrder;
  claimedAt: string;
}

export interface OrderForIntent {
  id: string;
  status: PaymentOrderStatus;
  createdAt: string;
  chargeAmount: number;
  userId: string;
}

/**
 * The database side of Vodafone Cash. One narrow interface so the matching, ingest and provider logic
 * can be tested against an in-memory fake, while the real thing is a handful of plain queries (service
 * role: nobody but server code can read or write these tables).
 */
export interface EgyptWalletStore {
  getSettings(): Promise<EgyptWalletSettings>;

  /** The Vodafone Cash order with this reference, whatever its state. */
  getOrderForIntent(referenceId: string): Promise<OrderForIntent | null>;
  /** Creates the order's intent (no number yet). Asked twice for one order it does nothing the second time. */
  insertIntent(input: { orderId: string; expiresAt: string }): Promise<void>;
  getIntent(orderId: string): Promise<IntentRecord | null>;
  /** Records that the learner says they sent the money (the first time only). */
  claimPaid(orderId: string, now: Date): Promise<void>;
  /** Wins the one right to alert about this order's unanswered claim: true for exactly one caller, ever. */
  claimAlertDue(orderId: string, claimedBefore: Date, now: Date): Promise<boolean>;
  /** Orders whose learner said they paid before `claimedBefore` (not earlier than `since`), still unpaid, not yet alerted. */
  listUnansweredClaims(claimedBefore: Date, since: Date, limit: number): Promise<UnansweredClaim[]>;
  /** The learner's e-mail, for the alert. */
  getEmail(userId: string): Promise<string | null>;
  /** Writes the number the learner will send from. False when the order already has a transfer or is paid. */
  setPayerPhone(orderId: string, phone: string, now: Date): Promise<boolean>;
  listPaymentStates(referenceIds: string[]): Promise<PaymentState[]>;
  /** Orders created since then, not counting one whose creation failed: the button's daily limit. */
  countOrdersSince(since: Date, providerEnv: "live" | "test"): Promise<number>;
  /** The same count for one learner. */
  countUserOrdersSince(userId: string, since: Date, providerEnv: "live" | "test"): Promise<number>;

  /** Stores a transfer message. "duplicate" when Vodafone's operation number was already stored. */
  insertMessage(
    transfer: ParsedTransfer,
    rawText: string,
    seenAt: Date,
  ): Promise<"inserted" | "duplicate">;
  insertUnreadable(input: {
    rawText: string;
    sender: string | null;
    looksLikeTransfer: boolean;
  }): Promise<void>;
  /** Messages not yet linked or ignored, oldest first. */
  listUnlinkedSince(since: Date, limit: number): Promise<StoredMessage[]>;
  getMessageByTransactionId(transactionId: string): Promise<StoredMessage | null>;
  /** One order of this learner with its payer number, whatever its state; null when it is not theirs or not a Vodafone Cash order. */
  getOrderForUser(referenceId: string, userId: string): Promise<MatchableOrder | null>;
  /** The Vodafone Cash orders whose learner wrote this sender number, created since then, any state. */
  findOrdersByPhone(phone: string, since: Date): Promise<MatchableOrder[]>;
  /** Orders that could still be paid, created since then, newest first. */
  listOpenOrders(since: Date, limit: number): Promise<MatchableOrder[]>;
  linkMessage(input: {
    messageId: string;
    orderId: string;
    method: "phone" | "reference" | "manual";
    reason: string;
  }): Promise<LinkResultName>;
  markNotified(messageId: string, now: Date): Promise<void>;
  ignoreMessage(messageId: string): Promise<void>;

  touchState(now: Date): Promise<void>;
  getLastMessageAt(): Promise<string | null>;
}

type ServiceRoleClient = ReturnType<typeof createServiceRoleClient>;

const OPEN_STATUSES: PaymentOrderStatus[] = ["created", "pending", "expired"];
const ALL_STATUSES: PaymentOrderStatus[] = [
  "created",
  "pending",
  "fulfilled",
  "failed",
  "cancelled",
  "expired",
  "needs_review",
];

type MessageRow = Database["public"]["Tables"]["egypt_wallet_messages"]["Row"];

function toStoredMessage(row: MessageRow): StoredMessage {
  return {
    id: row.id,
    status: row.status,
    transactionId: row.transaction_id,
    amountPiasters: row.amount_piasters,
    balancePiasters: row.balance_piasters,
    payerPhone: row.payer_phone,
    payerName: row.payer_name,
    walletNumber: row.wallet_number,
    receivedAt: row.received_at,
    rawText: row.raw_text,
    seenAt: row.seen_at,
    notifiedAt: row.notified_at,
    linkedOrderId: row.linked_order_id,
    linkMethod: row.link_method,
  };
}

/** The Vodafone Cash orders in this list, joined to the number their learner wrote. */
async function matchableOrders(
  supabase: ServiceRoleClient,
  orderIds: string[],
  statuses: PaymentOrderStatus[],
  phoneByOrder: Map<string, string | null>,
): Promise<MatchableOrder[]> {
  if (orderIds.length === 0) return [];
  const { data, error } = await supabase
    .from("payment_orders")
    .select("id, reference_id, user_id, status, charge_amount, created_at")
    .eq("provider", EGYPT_WALLET_PROVIDER)
    .in("id", orderIds)
    .in("status", statuses);
  if (error) throw error;
  return (data ?? []).map((order) => ({
    orderId: order.id,
    referenceId: order.reference_id,
    userId: order.user_id,
    status: order.status,
    chargeAmount: order.charge_amount,
    createdAt: order.created_at,
    payerPhone: phoneByOrder.get(order.id) ?? null,
  }));
}

export function createEgyptWalletStore(
  supabase: ServiceRoleClient = createServiceRoleClient(),
): EgyptWalletStore {
  return {
    async getSettings() {
      const { data, error } = await supabase
        .from("egypt_wallet_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return sanitizeEgyptWalletSettings(data);
    },

    async getOrderForIntent(referenceId) {
      const { data, error } = await supabase
        .from("payment_orders")
        .select("id, status, created_at, charge_amount, user_id")
        .eq("reference_id", referenceId)
        .eq("provider", EGYPT_WALLET_PROVIDER)
        .maybeSingle();
      if (error) throw error;
      return data
        ? {
            id: data.id,
            status: data.status,
            createdAt: data.created_at,
            chargeAmount: data.charge_amount,
            userId: data.user_id,
          }
        : null;
    },

    async insertIntent({ orderId, expiresAt }) {
      const { error } = await supabase
        .from("egypt_wallet_intents")
        .upsert(
          { order_id: orderId, expires_at: expiresAt },
          { onConflict: "order_id", ignoreDuplicates: true },
        );
      if (error) throw error;
    },

    async getIntent(orderId) {
      const { data, error } = await supabase
        .from("egypt_wallet_intents")
        .select("payer_phone, expires_at, claimed_paid_at, claim_alerted_at")
        .eq("order_id", orderId)
        .maybeSingle();
      if (error) throw error;
      return data
        ? {
            payerPhone: data.payer_phone,
            expiresAt: data.expires_at,
            claimedPaidAt: data.claimed_paid_at,
            claimAlertedAt: data.claim_alerted_at,
          }
        : null;
    },

    async claimPaid(orderId, now) {
      const { error } = await supabase
        .from("egypt_wallet_intents")
        .update({ claimed_paid_at: now.toISOString() })
        .eq("order_id", orderId)
        .not("payer_phone", "is", null)
        .is("claimed_paid_at", null);
      if (error) throw error;
    },

    async claimAlertDue(orderId, claimedBefore, now) {
      const { data, error } = await supabase
        .from("egypt_wallet_intents")
        .update({ claim_alerted_at: now.toISOString() })
        .eq("order_id", orderId)
        .not("claimed_paid_at", "is", null)
        .lte("claimed_paid_at", claimedBefore.toISOString())
        .is("claim_alerted_at", null)
        .select("order_id");
      if (error) throw error;
      return (data ?? []).length > 0;
    },

    async listUnansweredClaims(claimedBefore, since, limit) {
      const { data: intents, error } = await supabase
        .from("egypt_wallet_intents")
        .select("order_id, payer_phone, claimed_paid_at")
        .not("claimed_paid_at", "is", null)
        .is("claim_alerted_at", null)
        .lte("claimed_paid_at", claimedBefore.toISOString())
        .gte("claimed_paid_at", since.toISOString())
        .limit(limit);
      if (error) throw error;
      const rows = intents ?? [];
      if (rows.length === 0) return [];
      const ids = rows.map((row) => row.order_id);
      const [orders, linked] = await Promise.all([
        matchableOrders(
          supabase,
          ids,
          OPEN_STATUSES,
          new Map(rows.map((row) => [row.order_id, row.payer_phone])),
        ),
        supabase.from("egypt_wallet_messages").select("linked_order_id").in("linked_order_id", ids),
      ]);
      if (linked.error) throw linked.error;
      const paid = new Set((linked.data ?? []).map((row) => row.linked_order_id));
      const claimedAt = new Map(rows.map((row) => [row.order_id, row.claimed_paid_at as string]));
      return orders
        .filter((order) => !paid.has(order.orderId))
        .map((order) => ({ order, claimedAt: claimedAt.get(order.orderId)! }));
    },

    async getEmail(userId) {
      const { data } = await supabase.auth.admin.getUserById(userId);
      return data.user?.email ?? null;
    },

    async setPayerPhone(orderId, phone, now) {
      const { data: linked, error: linkedError } = await supabase
        .from("egypt_wallet_messages")
        .select("id")
        .eq("linked_order_id", orderId)
        .limit(1);
      if (linkedError) throw linkedError;
      if ((linked ?? []).length > 0) return false;

      const { data, error } = await supabase
        .from("egypt_wallet_intents")
        .update({ payer_phone: phone, payer_phone_set_at: now.toISOString() })
        .eq("order_id", orderId)
        .select("order_id");
      if (error) throw error;
      return (data ?? []).length > 0;
    },

    async listPaymentStates(referenceIds) {
      if (referenceIds.length === 0) return [];
      const { data: orders, error: ordersError } = await supabase
        .from("payment_orders")
        .select("id, reference_id, charge_amount")
        .eq("provider", EGYPT_WALLET_PROVIDER)
        .in("reference_id", referenceIds);
      if (ordersError) throw ordersError;
      if (!orders || orders.length === 0) return [];

      const ids = orders.map((order) => order.id);
      const [intents, messages] = await Promise.all([
        supabase.from("egypt_wallet_intents").select("order_id").in("order_id", ids),
        supabase
          .from("egypt_wallet_messages")
          .select("linked_order_id, transaction_id, received_at")
          .eq("status", "linked")
          .in("linked_order_id", ids),
      ]);
      if (intents.error) throw intents.error;
      if (messages.error) throw messages.error;

      const withIntent = new Set((intents.data ?? []).map((row) => row.order_id));
      const messageByOrder = new Map(
        (messages.data ?? []).map((row) => [row.linked_order_id, row]),
      );
      return orders.flatMap((order) => {
        // An order with no intent was never set up for this way to pay: the provider has nothing to say about it.
        if (!withIntent.has(order.id)) return [];
        const message = messageByOrder.get(order.id);
        return [
          {
            referenceId: order.reference_id,
            chargeAmount: order.charge_amount,
            linked: message
              ? { transactionId: message.transaction_id, receivedAt: message.received_at }
              : null,
          },
        ];
      });
    },

    async countOrdersSince(since, providerEnv) {
      const { count, error } = await supabase
        .from("payment_orders")
        .select("id", { count: "exact", head: true })
        .eq("provider", EGYPT_WALLET_PROVIDER)
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
        .eq("provider", EGYPT_WALLET_PROVIDER)
        .eq("provider_env", providerEnv)
        .eq("user_id", userId)
        .gte("created_at", since.toISOString())
        .or("status.neq.failed,provider_payment_id.not.is.null");
      if (error) throw error;
      return count ?? 0;
    },

    async insertMessage(transfer, rawText, seenAt) {
      const { data, error } = await supabase
        .from("egypt_wallet_messages")
        .upsert(
          {
            transaction_id: transfer.transactionId,
            // A message whose time could not be read counts as received when it arrived.
            received_at: transfer.receivedAt ?? seenAt.toISOString(),
            amount_piasters: transfer.amountPiasters,
            balance_piasters: transfer.balancePiasters,
            payer_phone: transfer.payerPhone,
            payer_name: transfer.payerName,
            wallet_number: transfer.walletNumber,
            raw_text: rawText,
            seen_at: seenAt.toISOString(),
          },
          { onConflict: "transaction_id", ignoreDuplicates: true },
        )
        .select("id");
      if (error) throw error;
      return (data ?? []).length > 0 ? "inserted" : "duplicate";
    },

    async insertUnreadable({ rawText, sender, looksLikeTransfer }) {
      const { error } = await supabase.from("egypt_wallet_unreadable").insert({
        raw_text: rawText,
        sender,
        looks_like_transfer: looksLikeTransfer,
      });
      if (error) throw error;
    },

    async listUnlinkedSince(since, limit) {
      const { data, error } = await supabase
        .from("egypt_wallet_messages")
        .select("*")
        .eq("status", "new")
        .gte("received_at", since.toISOString())
        .order("received_at", { ascending: true })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map(toStoredMessage);
    },

    async getMessageByTransactionId(transactionId) {
      const { data, error } = await supabase
        .from("egypt_wallet_messages")
        .select("*")
        .eq("transaction_id", transactionId)
        .maybeSingle();
      if (error) throw error;
      return data ? toStoredMessage(data) : null;
    },

    async getOrderForUser(referenceId, userId) {
      const { data: order, error } = await supabase
        .from("payment_orders")
        .select("id")
        .eq("reference_id", referenceId)
        .eq("user_id", userId)
        .eq("provider", EGYPT_WALLET_PROVIDER)
        .maybeSingle();
      if (error) throw error;
      if (!order) return null;
      const { data: intent, error: intentError } = await supabase
        .from("egypt_wallet_intents")
        .select("order_id, payer_phone")
        .eq("order_id", order.id)
        .maybeSingle();
      if (intentError) throw intentError;
      const [found] = await matchableOrders(
        supabase,
        [order.id],
        ALL_STATUSES,
        new Map([[order.id, intent?.payer_phone ?? null]]),
      );
      return found ?? null;
    },

    async findOrdersByPhone(phone, since) {
      const { data: intents, error } = await supabase
        .from("egypt_wallet_intents")
        .select("order_id, payer_phone")
        .eq("payer_phone", phone)
        .gte("created_at", since.toISOString());
      if (error) throw error;
      return matchableOrders(
        supabase,
        (intents ?? []).map((intent) => intent.order_id),
        ALL_STATUSES,
        new Map((intents ?? []).map((intent) => [intent.order_id, intent.payer_phone])),
      );
    },

    async listOpenOrders(since, limit) {
      const { data: orders, error } = await supabase
        .from("payment_orders")
        .select("id")
        .eq("provider", EGYPT_WALLET_PROVIDER)
        .in("status", OPEN_STATUSES)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      const ids = (orders ?? []).map((order) => order.id);
      if (ids.length === 0) return [];
      const { data: intents, error: intentsError } = await supabase
        .from("egypt_wallet_intents")
        .select("order_id, payer_phone")
        .in("order_id", ids);
      if (intentsError) throw intentsError;
      const found = await matchableOrders(
        supabase,
        ids,
        OPEN_STATUSES,
        new Map((intents ?? []).map((intent) => [intent.order_id, intent.payer_phone])),
      );
      return found.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async linkMessage({ messageId, orderId, method, reason }) {
      const { data, error } = await supabase.rpc("link_egypt_wallet_message", {
        p_message: messageId,
        p_order: orderId,
        p_method: method,
        p_reason: reason,
      });
      if (error) throw error;
      return data.result;
    },

    async markNotified(messageId, now) {
      const { error } = await supabase
        .from("egypt_wallet_messages")
        .update({ notified_at: now.toISOString() })
        .eq("id", messageId);
      if (error) throw error;
    },

    async ignoreMessage(messageId) {
      const { error } = await supabase
        .from("egypt_wallet_messages")
        .update({ status: "ignored" })
        .eq("id", messageId)
        .eq("status", "new");
      if (error) throw error;
    },

    async touchState(now) {
      const { error } = await supabase
        .from("egypt_wallet_state")
        .upsert({ id: 1, last_message_at: now.toISOString() });
      if (error) throw error;
    },

    async getLastMessageAt() {
      const { data, error } = await supabase
        .from("egypt_wallet_state")
        .select("last_message_at")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data?.last_message_at ?? null;
    },
  };
}
