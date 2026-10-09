import { parseExcludedEmails } from "@/lib/billing/free-access";
import {
  orderStage,
  reachedForm,
  signalsByReference,
  summarizeFunnel,
} from "@/lib/billing/payments/funnel";
import type { Funnel, OrderStage } from "@/lib/billing/payments/funnel";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

import { findUserByEmail } from "./users-lookup";

/** Stated on the page when reached, so a growing shop never silently reads partial numbers. */
export const PAYMENTS_ORDER_SCAN_LIMIT = 1000;
const EVENT_SCAN_LIMIT = 2000;
const TABLE_ROWS = 50;

export interface AdminPaymentOrder {
  id: string;
  createdAt: string;
  email: string | null;
  isTester: boolean;
  country: string | null;
  tier: string;
  premiumDays: number;
  usdCents: number;
  status: string;
  stage: OrderStage;
  reachedForm: boolean;
  method: string | null;
  providerStatus: string | null;
  failureReason: string | null;
}

export interface AdminPaymentsOverview {
  /** Test accounts left out: the numbers are about real learners. */
  funnel: Funnel;
  testerOrders: number;
  scanned: number;
  orders: AdminPaymentOrder[];
}

/** The accounts listed in FREE_ACCESS_EXCLUDED_EMAILS: the ones kept out of the free promotion so the owner can try the paid flow. */
async function testerUserIds(): Promise<Set<string>> {
  const emails = [...parseExcludedEmails(process.env.FREE_ACCESS_EXCLUDED_EMAILS)];
  const found = await Promise.all(emails.map((email) => findUserByEmail(email)));
  return new Set(found.flatMap((result) => (result.status === "found" ? [result.id] : [])));
}

/**
 * Every live payment order with where it ended up, read with the service-role
 * client (payment_orders and billing_events have no policies on purpose), so the
 * caller must already have passed the admin gate. "Reached the form" comes from
 * the Wayl webhooks kept in billing_events, which hold no personal data.
 */
export async function getPaymentsOverview(): Promise<AdminPaymentsOverview> {
  const supabase = createServiceRoleClient();

  const [ordersResult, eventsResult, testerIds] = await Promise.all([
    supabase
      .from("payment_orders")
      .select(
        "id, user_id, reference_id, pricing_tier, pricing_country, premium_days, price_usd_cents, status, provider_status, provider_payment_id, failure_reason, created_at",
      )
      .eq("provider_env", "live")
      .order("created_at", { ascending: false })
      .limit(PAYMENTS_ORDER_SCAN_LIMIT),
    supabase
      .from("billing_events")
      .select("payload")
      .eq("provider", "wayl")
      .order("created_at", { ascending: false })
      .limit(EVENT_SCAN_LIMIT),
    testerUserIds(),
  ]);
  if (ordersResult.error) throw ordersResult.error;
  if (eventsResult.error) throw eventsResult.error;

  const orders = ordersResult.data ?? [];
  const signals = signalsByReference(eventsResult.data ?? []);
  const realOrders = orders.filter((order) => !testerIds.has(order.user_id));

  const shown = orders.slice(0, TABLE_ROWS);
  const emailById = new Map<string, string>();
  await Promise.all(
    [...new Set(shown.map((order) => order.user_id))].map(async (userId) => {
      const { data } = await supabase.auth.admin.getUserById(userId);
      if (data.user?.email) emailById.set(userId, data.user.email);
    }),
  );

  return {
    funnel: summarizeFunnel(realOrders, signals),
    testerOrders: orders.length - realOrders.length,
    scanned: orders.length,
    orders: shown.map((order) => {
      const reached = reachedForm(order, signals);
      return {
        id: order.id,
        createdAt: order.created_at,
        email: emailById.get(order.user_id) ?? null,
        isTester: testerIds.has(order.user_id),
        country: order.pricing_country,
        tier: order.pricing_tier,
        premiumDays: order.premium_days,
        usdCents: order.price_usd_cents,
        status: order.status,
        stage: orderStage(order, reached),
        reachedForm: reached,
        method: signals.get(order.reference_id)?.method ?? null,
        providerStatus: order.provider_status,
        failureReason: order.failure_reason,
      };
    }),
  };
}
