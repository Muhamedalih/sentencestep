import { EGYPT_WALLET_PROVIDER } from "@/lib/billing/egypt-wallet/constants";
import { decideLink, SKIP_REASON_TEXT, wholePounds } from "@/lib/billing/egypt-wallet/matching";
import type { MatchableOrder } from "@/lib/billing/egypt-wallet/matching";
import type { EgyptWalletSettings } from "@/lib/billing/egypt-wallet/settings";
import { createEgyptWalletStore } from "@/lib/billing/egypt-wallet/store";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const DAY_MS = 24 * 60 * 60 * 1000;
const TRANSFERS_LIMIT = 200;
const UNREADABLE_LIMIT = 30;
const WAITING_LIMIT = 50;
const LEDGER_LIMIT = 5_000;

export interface AdminTransfer {
  id: string;
  /** Vodafone's operation number. */
  transactionId: string;
  /** The time written in the message. */
  receivedAt: string;
  seenAt: string;
  amount: string;
  balance: string | null;
  payerPhone: string | null;
  payerName: string | null;
  status: "new" | "linked" | "ignored";
  linkMethod: "phone" | "reference" | "manual" | null;
  linkedAt: string | null;
  /** Why a transfer that is not linked yet was not linked by itself, in plain words. */
  reason: string | null;
  /** The learner and the plan it activated, when linked. */
  email: string | null;
  referenceId: string | null;
  premiumDays: number | null;
  orderStatus: string | null;
  /** Open orders whose price this amount covers, to link by hand. */
  suggestions: AdminOrderOption[];
}

export interface AdminOrderOption {
  orderId: string;
  referenceId: string;
  email: string | null;
  chargeAmount: number;
  premiumDays: number;
  payerPhone: string | null;
}

export interface AdminWaitingOrder extends AdminOrderOption {
  /** When the learner pressed "I sent the money", or null. */
  claimedPaidAt: string | null;
  status: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface AdminUnreadable {
  id: string;
  rawText: string;
  sender: string | null;
  looksLikeTransfer: boolean;
  seenAt: string;
}

export interface AdminEgyptOverview {
  settings: EgyptWalletSettings;
  lastMessageAt: string | null;
  waiting: AdminWaitingOrder[];
  transfers: AdminTransfer[];
  unreadable: AdminUnreadable[];
  stats: {
    /** Learners whose payment by Vodafone Cash activated Premium, ever. */
    subscribers: number;
    /** What those payments were worth, in pounds. */
    receivedPounds: string;
    subscribersLast7d: number;
    receivedLast7dPounds: string;
    subscribersLast24h: number;
    ordersLast24h: number;
    /** Transfers that no order claimed and nobody ignored. */
    unmatched: number;
  };
}

function providerEnvironment(): "live" | "test" {
  return process.env.NODE_ENV === "production" ? "live" : "test";
}

const pounds = (piasters: number) => (piasters / 100).toFixed(2);

/**
 * Everything the Vodafone Cash admin page shows, read with the service-role client (these tables have
 * no policies on purpose), so the caller must already have passed the admin gate.
 */
export async function getEgyptWalletOverview(): Promise<AdminEgyptOverview> {
  const supabase = createServiceRoleClient();
  const store = createEgyptWalletStore(supabase);
  const now = Date.now();

  const settings = await store.getSettings();
  const lateWindowMs = settings.latePaymentHours * 60 * 60 * 1000;
  const since = new Date(now - lateWindowMs - 60 * 60 * 1000);

  const [lastMessageAt, messagesResult, unreadableResult, waitingResult, ordersLast24h] =
    await Promise.all([
      store.getLastMessageAt(),
      supabase
        .from("egypt_wallet_messages")
        .select("*")
        .order("received_at", { ascending: false })
        .limit(TRANSFERS_LIMIT),
      supabase
        .from("egypt_wallet_unreadable")
        .select("*")
        .order("seen_at", { ascending: false })
        .limit(UNREADABLE_LIMIT),
      supabase
        .from("payment_orders")
        .select(
          "id, reference_id, user_id, premium_days, charge_amount, status, created_at, link_expires_at",
        )
        .eq("provider", EGYPT_WALLET_PROVIDER)
        .in("status", ["created", "pending", "expired"])
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(WAITING_LIMIT),
      store.countOrdersSince(new Date(now - DAY_MS), providerEnvironment()),
    ]);
  if (messagesResult.error) throw messagesResult.error;
  if (unreadableResult.error) throw unreadableResult.error;
  if (waitingResult.error) throw waitingResult.error;

  const messages = messagesResult.data ?? [];
  const waitingRows = waitingResult.data ?? [];
  const linkedOrderIds = messages.flatMap((row) =>
    row.linked_order_id ? [row.linked_order_id] : [],
  );
  const orderIds = [...new Set([...linkedOrderIds, ...waitingRows.map((row) => row.id)])];

  const [ordersResult, intentsResult] =
    orderIds.length === 0
      ? [
          { data: [], error: null },
          { data: [], error: null },
        ]
      : await Promise.all([
          supabase
            .from("payment_orders")
            .select("id, reference_id, user_id, premium_days, charge_amount, status, created_at")
            .in("id", orderIds),
          supabase
            .from("egypt_wallet_intents")
            .select("order_id, payer_phone, claimed_paid_at")
            .in("order_id", orderIds),
        ]);
  if (ordersResult.error) throw ordersResult.error;
  if (intentsResult.error) throw intentsResult.error;

  const orderById = new Map((ordersResult.data ?? []).map((row) => [row.id, row]));
  const phoneByOrder = new Map(
    (intentsResult.data ?? []).map((row) => [row.order_id, row.payer_phone]),
  );

  const claimedByOrder = new Map(
    (intentsResult.data ?? []).map((row) => [row.order_id, row.claimed_paid_at]),
  );
  const emailByUser = new Map<string, string>();
  const userIds = [...new Set((ordersResult.data ?? []).map((row) => row.user_id))];
  await Promise.all(
    userIds.map(async (userId) => {
      const { data } = await supabase.auth.admin.getUserById(userId);
      if (data.user?.email) emailByUser.set(userId, data.user.email);
    }),
  );

  const waiting: AdminWaitingOrder[] = waitingRows.map((row) => ({
    orderId: row.id,
    referenceId: row.reference_id,
    email: emailByUser.get(row.user_id) ?? null,
    chargeAmount: row.charge_amount,
    premiumDays: row.premium_days,
    payerPhone: phoneByOrder.get(row.id) ?? null,
    claimedPaidAt: claimedByOrder.get(row.id) ?? null,
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.link_expires_at,
  }));

  // The orders each unlinked message might belong to, found the way the automatic rule looks.
  const matchable: MatchableOrder[] = waitingRows.map((row) => ({
    orderId: row.id,
    referenceId: row.reference_id,
    userId: row.user_id,
    status: row.status,
    chargeAmount: row.charge_amount,
    createdAt: row.created_at,
    payerPhone: phoneByOrder.get(row.id) ?? null,
  }));

  const transfers: AdminTransfer[] = messages.map((row) => {
    const order = row.linked_order_id ? orderById.get(row.linked_order_id) : undefined;
    let reason: string | null = null;
    let suggestions: AdminOrderOption[] = [];
    if (row.status === "new") {
      const forPhone = row.payer_phone
        ? matchable.filter((candidate) => candidate.payerPhone === row.payer_phone)
        : [];
      const decision = decideLink(
        {
          transactionId: row.transaction_id,
          amountPiasters: row.amount_piasters,
          payerPhone: row.payer_phone,
          walletNumber: row.wallet_number,
          receivedAt: row.received_at,
        },
        forPhone,
        { lateWindowMs, shopWallet: settings.walletNumber },
      );
      reason =
        decision.action === "skip"
          ? SKIP_REASON_TEXT[decision.reason]
          : settings.autoActivate
            ? "Ready: it is linked on the next message or the next check."
            : "Automatic activation is off: link it by hand.";
      const paidPounds = wholePounds(row.amount_piasters);
      suggestions = waiting
        .filter((candidate) => candidate.chargeAmount <= paidPounds)
        .slice(0, 5)
        .map((candidate) => ({ ...candidate }));
    }
    return {
      id: row.id,
      transactionId: row.transaction_id,
      receivedAt: row.received_at,
      seenAt: row.seen_at,
      amount: pounds(row.amount_piasters),
      balance: row.balance_piasters === null ? null : pounds(row.balance_piasters),
      payerPhone: row.payer_phone,
      payerName: row.payer_name,
      status: row.status,
      linkMethod: row.link_method,
      linkedAt: row.linked_at,
      reason,
      email: order ? (emailByUser.get(order.user_id) ?? null) : null,
      referenceId: order?.reference_id ?? null,
      premiumDays: order?.premium_days ?? null,
      orderStatus: order?.status ?? null,
      suggestions,
    };
  });

  const dayAgo = now - DAY_MS;
  const weekAgo = now - 7 * DAY_MS;
  const activated = transfers.filter(
    (transfer) => transfer.status === "linked" && transfer.orderStatus === "fulfilled",
  );
  const sum = (list: AdminTransfer[]) => list.reduce((total, t) => total + Number(t.amount), 0);
  const within = (list: AdminTransfer[], from: number) =>
    list.filter((t) => t.linkedAt !== null && Date.parse(t.linkedAt) >= from);

  return {
    settings,
    lastMessageAt,
    waiting,
    transfers,
    unreadable: (unreadableResult.data ?? []).map((row) => ({
      id: row.id,
      rawText: row.raw_text,
      sender: row.sender,
      looksLikeTransfer: row.looks_like_transfer,
      seenAt: row.seen_at,
    })),
    stats: {
      subscribers: activated.length,
      receivedPounds: sum(activated).toFixed(2),
      subscribersLast7d: within(activated, weekAgo).length,
      receivedLast7dPounds: sum(within(activated, weekAgo)).toFixed(2),
      subscribersLast24h: within(activated, dayAgo).length,
      ordersLast24h,
      unmatched: transfers.filter((t) => t.status === "new").length,
    },
  };
}

export interface LedgerRow {
  receivedAt: string;
  linkedAt: string | null;
  transactionId: string;
  amount: string;
  balance: string | null;
  payerPhone: string | null;
  payerName: string | null;
  status: string;
  linkMethod: string | null;
  orderReference: string | null;
  orderStatus: string | null;
  premiumDays: number | null;
  priceEgp: number | null;
  email: string | null;
}

/** Every transfer ever received, oldest first, for the CSV ledger. */
export async function getLedgerRows(): Promise<LedgerRow[]> {
  const supabase = createServiceRoleClient();
  const { data: messages, error } = await supabase
    .from("egypt_wallet_messages")
    .select("*")
    .order("received_at", { ascending: true })
    .limit(LEDGER_LIMIT);
  if (error) throw error;

  const rows = messages ?? [];
  const orderIds = rows.flatMap((row) => (row.linked_order_id ? [row.linked_order_id] : []));
  const { data: orders, error: ordersError } =
    orderIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("payment_orders")
          .select("id, reference_id, user_id, premium_days, charge_amount, status")
          .in("id", orderIds);
  if (ordersError) throw ordersError;
  const orderById = new Map((orders ?? []).map((order) => [order.id, order]));

  const emailByUser = new Map<string, string>();
  await Promise.all(
    [...new Set((orders ?? []).map((order) => order.user_id))].map(async (userId) => {
      const { data } = await supabase.auth.admin.getUserById(userId);
      if (data.user?.email) emailByUser.set(userId, data.user.email);
    }),
  );

  return rows.map((row) => {
    const order = row.linked_order_id ? orderById.get(row.linked_order_id) : undefined;
    return {
      receivedAt: row.received_at,
      linkedAt: row.linked_at,
      transactionId: row.transaction_id,
      amount: pounds(row.amount_piasters),
      balance: row.balance_piasters === null ? null : pounds(row.balance_piasters),
      payerPhone: row.payer_phone,
      payerName: row.payer_name,
      status: row.status,
      linkMethod: row.link_method,
      orderReference: order?.reference_id ?? null,
      orderStatus: order?.status ?? null,
      premiumDays: order?.premium_days ?? null,
      priceEgp: order?.charge_amount ?? null,
      email: order ? (emailByUser.get(order.user_id) ?? null) : null,
    };
  });
}

function csvCell(value: string | number | null): string {
  if (value === null) return "";
  const text = String(value);
  // A cell that starts with = + - or @ would be run as a formula by a spreadsheet; the apostrophe stops that.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function buildLedgerCsv(rows: LedgerRow[]): string {
  const header = [
    "received_at",
    "linked_at",
    "operation_number",
    "amount_egp",
    "balance_egp",
    "from_number",
    "from_name",
    "status",
    "link_method",
    "order_reference",
    "order_status",
    "premium_days",
    "price_egp",
    "learner_email",
  ];
  const lines = rows.map((row) =>
    [
      row.receivedAt,
      row.linkedAt,
      row.transactionId,
      row.amount,
      row.balance,
      row.payerPhone,
      row.payerName,
      row.status,
      row.linkMethod,
      row.orderReference,
      row.orderStatus,
      row.premiumDays,
      row.priceEgp,
      row.email,
    ]
      .map(csvCell)
      .join(","),
  );
  return `﻿${[header.join(","), ...lines].join("\r\n")}\r\n`;
}
