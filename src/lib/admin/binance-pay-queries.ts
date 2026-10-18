import { BINANCE_PAY_PROVIDER } from "@/lib/billing/binance/constants";
import { extractOrderCodes } from "@/lib/billing/binance/codes";
import type { LedgerRow } from "@/lib/billing/binance/ledger";
import { decideLink, SKIP_REASON_TEXT, suggestOrders } from "@/lib/billing/binance/matching";
import type { SkipReason } from "@/lib/billing/binance/matching";
import type { BinancePaySettings } from "@/lib/billing/binance/settings";
import { createBinancePayStore } from "@/lib/billing/binance/store";
import type { RelayState } from "@/lib/billing/binance/store";
import type { FeatureState } from "@/lib/features/config";
import { getFeatureConfig } from "@/lib/features/queries";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const WAITING_LIMIT = 50;
const UNLINKED_LIMIT = 100;
const RECENT_LIMIT = 20;
const LEDGER_LIMIT = 5_000;
const UNLINKED_LOOK_BACK_MS = 14 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface AdminWaitingOrder {
  id: string;
  referenceId: string;
  orderCode: string | null;
  email: string | null;
  premiumDays: number;
  chargeAmount: number;
  status: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface AdminSuggestion {
  orderId: string;
  orderCode: string;
  referenceId: string;
  chargeAmount: number;
  basis: "code" | "amount_time";
  blockedBy: SkipReason | null;
}

export interface AdminUnlinkedTransfer {
  id: string;
  transactionId: string;
  transactedAt: string;
  amount: string;
  currency: string;
  orderType: string;
  payerBinanceId: string | null;
  payerName: string | null;
  note: string | null;
  /** Why it was not linked by itself, in plain words. */
  reason: string;
  suggestions: AdminSuggestion[];
}

export interface AdminLinkedTransfer {
  transactionId: string;
  transactedAt: string;
  amount: string;
  orderCode: string | null;
  referenceId: string | null;
  premiumDays: number | null;
  linkMethod: string | null;
  linkedAt: string | null;
}

export interface AdminBinanceOverview {
  settings: BinancePaySettings;
  relay: RelayState;
  featureState: FeatureState;
  waiting: AdminWaitingOrder[];
  unlinked: AdminUnlinkedTransfer[];
  recent: AdminLinkedTransfer[];
  stats: {
    ordersLast24h: number;
    activatedLast24h: number;
    activatedLast7d: number;
    usdtLast7d: string;
  };
}

function providerEnvironment(): "live" | "test" {
  return process.env.NODE_ENV === "production" ? "live" : "test";
}

function toAdminSuggestion(suggestion: ReturnType<typeof suggestOrders>[number]): AdminSuggestion {
  return {
    orderId: suggestion.order.orderId,
    orderCode: suggestion.order.orderCode,
    referenceId: suggestion.order.referenceId,
    chargeAmount: suggestion.order.chargeAmount,
    basis: suggestion.basis,
    blockedBy: suggestion.blockedBy ?? null,
  };
}

/**
 * Everything the Binance Pay admin page shows, read with the service-role
 * client (these tables have no policies on purpose), so the caller must already
 * have passed the admin gate.
 */
export async function getBinancePayOverview(): Promise<AdminBinanceOverview> {
  const supabase = createServiceRoleClient();
  const store = createBinancePayStore(supabase);
  const now = Date.now();

  const settings = await store.getSettings();
  const lateWindowMs = settings.latePaymentHours * 60 * 60 * 1000;
  const since = new Date(now - lateWindowMs);
  const weekAgo = new Date(now - 7 * DAY_MS).toISOString();

  const [
    relay,
    openOrders,
    unlinkedAscending,
    waitingResult,
    recentResult,
    weekResult,
    config,
    ordersLast24h,
  ] = await Promise.all([
    store.getRelayState(),
    store.listOpenOrders(since, 200),
    store.listUnlinkedSince(new Date(now - UNLINKED_LOOK_BACK_MS), UNLINKED_LIMIT),
    supabase
      .from("payment_orders")
      .select(
        "id, reference_id, user_id, premium_days, charge_amount, status, created_at, link_expires_at",
      )
      .eq("provider", BINANCE_PAY_PROVIDER)
      .in("status", ["created", "pending", "expired"])
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(WAITING_LIMIT),
    supabase
      .from("binance_pay_transactions")
      .select("transaction_id, transacted_at, amount, link_method, linked_at, linked_order_id")
      .eq("status", "linked")
      .order("linked_at", { ascending: false })
      .limit(RECENT_LIMIT),
    supabase
      .from("binance_pay_transactions")
      .select("amount, linked_at")
      .eq("status", "linked")
      .gte("linked_at", weekAgo)
      .limit(2_000),
    getFeatureConfig(),
    store.countOrdersSince(new Date(now - DAY_MS), providerEnvironment()),
  ]);
  if (waitingResult.error) throw waitingResult.error;
  if (recentResult.error) throw recentResult.error;
  if (weekResult.error) throw weekResult.error;

  // Waiting orders: the code and the learner's email (the same lookup the payments page uses).
  const waitingRows = waitingResult.data ?? [];
  const waitingIds = waitingRows.map((row) => row.id);
  const codeResult =
    waitingIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("binance_pay_intents")
          .select("order_id, order_code")
          .in("order_id", waitingIds);
  if (codeResult.error) throw codeResult.error;
  const codeByOrder = new Map((codeResult.data ?? []).map((row) => [row.order_id, row.order_code]));
  const emailByUser = new Map<string, string>();
  await Promise.all(
    [...new Set(waitingRows.map((row) => row.user_id))].map(async (userId) => {
      const { data } = await supabase.auth.admin.getUserById(userId);
      if (data.user?.email) emailByUser.set(userId, data.user.email);
    }),
  );
  const waiting: AdminWaitingOrder[] = waitingRows.map((row) => ({
    id: row.id,
    referenceId: row.reference_id,
    orderCode: codeByOrder.get(row.id) ?? null,
    email: emailByUser.get(row.user_id) ?? null,
    premiumDays: row.premium_days,
    chargeAmount: row.charge_amount,
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.link_expires_at,
  }));

  // Unlinked transfers, newest first, each with why it waits and which orders it might belong to.
  const unlinkedStored = [...unlinkedAscending].reverse();
  const codes = [
    ...new Set(unlinkedStored.flatMap((stored) => extractOrderCodes(stored.transfer.note))),
  ];
  const ordersByCode = await store.findOrdersByCodes(codes);
  const unlinked: AdminUnlinkedTransfer[] = unlinkedStored.map((stored) => {
    const decision = decideLink(stored.transfer, ordersByCode, { lateWindowMs });
    return {
      id: stored.id,
      transactionId: stored.transfer.transactionId,
      transactedAt: stored.transfer.transactedAt,
      amount: stored.transfer.amount,
      currency: stored.transfer.currency,
      orderType: stored.transfer.orderType,
      payerBinanceId: stored.transfer.payerBinanceId,
      payerName: stored.transfer.payerName,
      note: stored.transfer.note,
      reason:
        decision.action === "skip"
          ? SKIP_REASON_TEXT[decision.reason]
          : settings.autoActivate
            ? "Ready: it is linked on the relay's next visit."
            : "Automatic activation is off: link it by hand.",
      suggestions: suggestOrders(stored.transfer, openOrders, { lateWindowMs }).map(
        toAdminSuggestion,
      ),
    };
  });

  // The last payments that activated an order.
  const recentRows = recentResult.data ?? [];
  const linkedOrderIds = recentRows.flatMap((row) =>
    row.linked_order_id ? [row.linked_order_id] : [],
  );
  const [recentOrders, recentCodes] =
    linkedOrderIds.length === 0
      ? [{ data: [] }, { data: [] }]
      : await Promise.all([
          supabase
            .from("payment_orders")
            .select("id, reference_id, premium_days")
            .in("id", linkedOrderIds),
          supabase
            .from("binance_pay_intents")
            .select("order_id, order_code")
            .in("order_id", linkedOrderIds),
        ]);
  const orderById = new Map((recentOrders.data ?? []).map((row) => [row.id, row]));
  const recentCodeByOrder = new Map(
    (recentCodes.data ?? []).map((row) => [row.order_id, row.order_code]),
  );
  const recent: AdminLinkedTransfer[] = recentRows.map((row) => {
    const order = row.linked_order_id ? orderById.get(row.linked_order_id) : undefined;
    return {
      transactionId: row.transaction_id,
      transactedAt: row.transacted_at,
      amount: Number(row.amount).toFixed(2),
      orderCode: row.linked_order_id ? (recentCodeByOrder.get(row.linked_order_id) ?? null) : null,
      referenceId: order?.reference_id ?? null,
      premiumDays: order?.premium_days ?? null,
      linkMethod: row.link_method,
      linkedAt: row.linked_at,
    };
  });

  const weekRows = weekResult.data ?? [];
  const dayAgo = now - DAY_MS;
  return {
    settings,
    relay,
    featureState: config.features.binancePay.state,
    waiting,
    unlinked,
    recent,
    stats: {
      ordersLast24h,
      activatedLast24h: weekRows.filter(
        (row) => row.linked_at && Date.parse(row.linked_at) >= dayAgo,
      ).length,
      activatedLast7d: weekRows.length,
      usdtLast7d: weekRows.reduce((sum, row) => sum + Number(row.amount), 0).toFixed(2),
    },
  };
}

/** Every payment that activated an order, oldest first, for the CSV ledger. */
export async function getLedgerRows(): Promise<LedgerRow[]> {
  const supabase = createServiceRoleClient();
  const { data: transfers, error } = await supabase
    .from("binance_pay_transactions")
    .select(
      "transaction_id, transacted_at, amount, payer_binance_id, payer_name, link_method, linked_at, linked_order_id",
    )
    .eq("status", "linked")
    .order("transacted_at", { ascending: true })
    .limit(LEDGER_LIMIT);
  if (error) throw error;

  const rows = transfers ?? [];
  const orderIds = rows.flatMap((row) => (row.linked_order_id ? [row.linked_order_id] : []));
  if (orderIds.length === 0) return [];

  const [orders, intents] = await Promise.all([
    supabase
      .from("payment_orders")
      .select("id, reference_id, premium_days, price_usd_cents, status, created_at, fulfilled_at")
      .in("id", orderIds),
    supabase.from("binance_pay_intents").select("order_id, order_code").in("order_id", orderIds),
  ]);
  if (orders.error) throw orders.error;
  if (intents.error) throw intents.error;
  const orderById = new Map((orders.data ?? []).map((order) => [order.id, order]));
  const codeByOrder = new Map((intents.data ?? []).map((row) => [row.order_id, row.order_code]));

  return rows.flatMap((row) => {
    const order = row.linked_order_id ? orderById.get(row.linked_order_id) : undefined;
    if (!order || !row.linked_order_id) return [];
    return [
      {
        orderCreatedAt: order.created_at,
        transferredAt: row.transacted_at,
        linkedAt: row.linked_at,
        orderReference: order.reference_id,
        orderCode: codeByOrder.get(row.linked_order_id) ?? null,
        premiumDays: order.premium_days,
        priceUsdCents: order.price_usd_cents,
        amountUsdt: Number(row.amount).toFixed(8),
        transactionId: row.transaction_id,
        payerBinanceId: row.payer_binance_id,
        payerName: row.payer_name,
        linkMethod: row.link_method,
        orderStatus: order.status,
        fulfilledAt: order.fulfilled_at,
      },
    ];
  });
}
