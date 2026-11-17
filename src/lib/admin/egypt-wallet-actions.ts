"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import { wholePounds } from "@/lib/billing/egypt-wallet/matching";
import { createEgyptWalletStore } from "@/lib/billing/egypt-wallet/store";
import { verifyAndFulfill } from "@/lib/billing/payments/fulfillment";
import { getEgyptWalletRuntime } from "@/lib/billing/payments/runtime";
import { createPaymentStore } from "@/lib/billing/payments/store";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GENERIC = "Couldn't do that. Please try again.";

function uuidField(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  return typeof value === "string" && UUID.test(value) ? value : null;
}

function refresh() {
  revalidatePath("/admin/egypt-wallet");
  revalidatePath("/admin/payments");
}

/**
 * Attaches an unlinked transfer to an order by hand and activates the order. The rule is the same as
 * for a learner who gives the operation number: the transfer must cover the price (to the nearest
 * pound), and one transfer belongs to one order. The activation is the same verifyAndFulfill every
 * payment goes through.
 */
export async function linkEgyptMessage(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const messageId = uuidField(formData, "messageId");
  const orderId = uuidField(formData, "orderId");
  if (!messageId || !orderId) return { error: GENERIC };

  try {
    const runtime = getEgyptWalletRuntime();
    if (!runtime) return { error: "Vodafone Cash isn't configured on this server." };
    const supabase = createServiceRoleClient();
    const store = createEgyptWalletStore(supabase);

    const [{ data: message }, { data: order }] = await Promise.all([
      supabase
        .from("egypt_wallet_messages")
        .select("amount_piasters, status")
        .eq("id", messageId)
        .maybeSingle(),
      supabase
        .from("payment_orders")
        .select("reference_id, charge_amount, provider, status")
        .eq("id", orderId)
        .maybeSingle(),
    ]);
    if (!message || !order || order.provider !== "vodafone_cash") return { error: GENERIC };
    if (message.status !== "new") return { error: "This transfer is already used or ignored." };
    if (!["created", "pending", "expired"].includes(order.status)) {
      return { error: "That order is closed or already paid." };
    }
    if (wholePounds(message.amount_piasters) < order.charge_amount) {
      return { error: "The transfer is less than the order's price." };
    }

    const result = await store.linkMessage({
      messageId,
      orderId,
      method: "manual",
      reason: "Linked by an admin.",
    });
    if (result !== "linked" && result !== "already_linked_here") {
      return { error: `Couldn't link it (${result.replace(/_/g, " ")}).` };
    }
    const outcome = await verifyAndFulfill(runtime, order.reference_id, "admin");

    void logAdminAction("egypt_wallet.message_linked", "payment_orders", orderId, { messageId });
    refresh();
    return {
      success:
        outcome.outcome === "fulfilled" || outcome.outcome === "already_fulfilled"
          ? "Linked, and Premium is active."
          : "Linked. Premium will be active within a few minutes.",
    };
  } catch (error) {
    console.error("[egypt-wallet] link by hand failed", error);
    return { error: GENERIC };
  }
}

/** Marks a transfer as not a customer's (a friend sending money, say) so it leaves the list. */
export async function ignoreEgyptMessage(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const messageId = uuidField(formData, "messageId");
  if (!messageId) return { error: GENERIC };

  try {
    await createEgyptWalletStore().ignoreMessage(messageId);
    void logAdminAction("egypt_wallet.message_ignored", "egypt_wallet_messages", messageId, {});
    refresh();
    return { success: "Ignored." };
  } catch (error) {
    console.error("[egypt-wallet] ignore failed", error);
    return { error: GENERIC };
  }
}

/** Cancels an order nobody paid. A transfer that arrives for it later can still be linked by hand. */
export async function closeEgyptOrder(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const orderId = uuidField(formData, "orderId");
  if (!orderId) return { error: GENERIC };

  try {
    await createPaymentStore().updateOrder(orderId, {
      status: "cancelled",
      failure_reason: "closed_by_admin",
    });
    void logAdminAction("egypt_wallet.order_closed", "payment_orders", orderId, {});
    refresh();
    return { success: "Closed." };
  } catch (error) {
    console.error("[egypt-wallet] close failed", error);
    return { error: GENERIC };
  }
}
