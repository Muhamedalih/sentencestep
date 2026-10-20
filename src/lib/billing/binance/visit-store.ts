import { getCurrentUser } from "@/lib/supabase/auth";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { Database } from "@/types/database";

import { BINANCE_PAY_PROVIDER } from "./constants";
import type { NewVisit, VisitDeps, VisitPatch } from "./visit-service";
import type { VisitRecord } from "./visits";

type ServiceRoleClient = ReturnType<typeof createServiceRoleClient>;
type VisitRow = Database["public"]["Tables"]["binance_pay_visits"]["Row"];

function toVisitRecord(row: VisitRow): VisitRecord {
  return {
    id: row.id,
    orderId: row.order_id,
    openedAt: row.opened_at,
    lastSeenAt: row.last_seen_at,
    visibleSeconds: row.visible_seconds,
    leaves: row.leaves,
    country: row.country,
    region: row.region,
    city: row.city,
    timeZone: row.time_zone,
    language: row.language,
    device: row.device,
    os: row.os,
    browser: row.browser,
    source: row.source,
    copiedId: row.copied_id,
    copiedCode: row.copied_code,
    openedGuide: row.opened_guide,
  };
}

function toPatchColumns(
  patch: VisitPatch,
): Database["public"]["Tables"]["binance_pay_visits"]["Update"] {
  const columns: Database["public"]["Tables"]["binance_pay_visits"]["Update"] = {
    last_seen_at: patch.lastSeenAt,
  };
  if (patch.visibleSeconds !== undefined) columns.visible_seconds = patch.visibleSeconds;
  if (patch.leaves !== undefined) columns.leaves = patch.leaves;
  // Only ever turned on: a report that does not mention an action must not turn it back off.
  if (patch.copiedId) columns.copied_id = true;
  if (patch.copiedCode) columns.copied_code = true;
  if (patch.openedGuide) columns.opened_guide = true;
  return columns;
}

/** The real dependencies of handleVisit: service-role writes (the table has no policies), the learner taken from their session. */
export function getVisitDeps(supabase: ServiceRoleClient = createServiceRoleClient()): VisitDeps {
  return {
    async getUser() {
      const user = await getCurrentUser();
      return user ? { id: user.id } : null;
    },

    async findOrder(reference, userId) {
      const { data, error } = await supabase
        .from("payment_orders")
        .select("id")
        .eq("reference_id", reference)
        .eq("user_id", userId)
        .eq("provider", BINANCE_PAY_PROVIDER)
        .maybeSingle();
      if (error) throw error;
      return data ? { id: data.id } : null;
    },

    async countRecentOpens(orderId, since) {
      const { count, error } = await supabase
        .from("binance_pay_visits")
        .select("id", { count: "exact", head: true })
        .eq("order_id", orderId)
        .gte("opened_at", since.toISOString());
      if (error) throw error;
      return count ?? 0;
    },

    async insertVisit(visit: NewVisit) {
      const { data, error } = await supabase
        .from("binance_pay_visits")
        .insert({
          order_id: visit.orderId,
          user_id: visit.userId,
          country: visit.country,
          region: visit.region,
          city: visit.city,
          time_zone: visit.timeZone,
          language: visit.language,
          device: visit.device,
          os: visit.os,
          browser: visit.browser,
          source: visit.source,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },

    async updateVisit({ visitId, userId, patch }) {
      const { error } = await supabase
        .from("binance_pay_visits")
        .update(toPatchColumns(patch))
        .eq("id", visitId)
        .eq("user_id", userId);
      if (error) throw error;
    },
  };
}

/**
 * The visits of these orders, newest page load first within each order; an order
 * never opened has no entry. The admin page is where transfers are linked to
 * orders, and visits are only extra detail beside them, so a failure here (the
 * table not yet created, a database hiccup) is logged and answered with no
 * visits rather than taking that page down.
 */
export async function listVisitsByOrder(
  supabase: ServiceRoleClient,
  orderIds: string[],
): Promise<Map<string, VisitRecord[]>> {
  const byOrder = new Map<string, VisitRecord[]>();
  if (orderIds.length === 0) return byOrder;
  const { data, error } = await supabase
    .from("binance_pay_visits")
    .select("*")
    .in("order_id", orderIds)
    .order("opened_at", { ascending: false })
    .limit(1_000);
  if (error) {
    console.error("[binance] admin: could not read the payment page visits", error);
    return byOrder;
  }
  for (const row of data ?? []) {
    const list = byOrder.get(row.order_id) ?? [];
    list.push(toVisitRecord(row));
    byOrder.set(row.order_id, list);
  }
  return byOrder;
}
