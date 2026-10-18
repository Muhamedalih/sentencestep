"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import { linkTransferByAdmin } from "@/lib/billing/binance/manual-link";
import { validateBinancePaySettingsInput } from "@/lib/billing/binance/settings";
import { createBinancePayStore } from "@/lib/billing/binance/store";
import { verifyAndFulfill } from "@/lib/billing/payments/fulfillment";
import { getBinancePayRuntime } from "@/lib/billing/payments/runtime";
import { createPaymentStore } from "@/lib/billing/payments/store";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GENERIC = "Couldn't do that. Please try again.";

function uuidField(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  return typeof value === "string" && UUID.test(value) ? value : null;
}

function refresh() {
  revalidatePath("/admin/binance-pay");
  revalidatePath("/admin/payments");
}

/**
 * Attaches an unlinked transfer to an order by hand and activates the order.
 * The money rules (a USDT payment of at least the price, one transfer per
 * order) live in linkTransferByAdmin; the activation is the same
 * verifyAndFulfill every payment goes through.
 */
export async function linkBinanceTransfer(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const transferId = uuidField(formData, "transferId");
  const orderId = uuidField(formData, "orderId");
  if (!transferId || !orderId) return { error: GENERIC };

  try {
    const runtime = getBinancePayRuntime();
    if (!runtime) return { error: "Binance Pay isn't configured on this server." };

    const result = await linkTransferByAdmin(
      {
        store: createBinancePayStore(),
        fulfill: (referenceId) => verifyAndFulfill(runtime, referenceId, "admin"),
      },
      { transferId, orderId },
    );
    if (!result.ok) return { error: result.error };

    void logAdminAction("binance_pay.transfer_linked", "payment_orders", orderId, { transferId });
    refresh();
    return {
      success:
        result.outcome.outcome === "fulfilled" || result.outcome.outcome === "already_fulfilled"
          ? "Linked, and Premium is active."
          : "Linked. Premium will be active within a few minutes.",
    };
  } catch (error) {
    console.error("[binance] link by hand failed", error);
    return { error: GENERIC };
  }
}

/** Marks a transfer as not a customer's (a friend sending money, say) so it leaves the list. */
export async function ignoreBinanceTransfer(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const transferId = uuidField(formData, "transferId");
  if (!transferId) return { error: GENERIC };

  try {
    await createBinancePayStore().ignoreTransfer(transferId);
    void logAdminAction("binance_pay.transfer_ignored", "binance_pay_transactions", transferId, {});
    refresh();
    return { success: "Ignored." };
  } catch (error) {
    console.error("[binance] ignore failed", error);
    return { error: GENERIC };
  }
}

/** Cancels an order nobody paid. A transfer that arrives for it later can still be linked by hand. */
export async function closeBinanceOrder(
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
    void logAdminAction("binance_pay.order_closed", "payment_orders", orderId, {});
    refresh();
    return { success: "Closed." };
  } catch (error) {
    console.error("[binance] close failed", error);
    return { error: GENERIC };
  }
}

/** The account learners pay to, the daily limit, and whether transfers are activated by themselves. */
export async function saveBinancePaySettings(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const validation = validateBinancePaySettingsInput({
    binanceId: String(formData.get("binanceId") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
    dailyOrderCap: Number(formData.get("dailyOrderCap")),
    autoActivate: formData.get("autoActivate") === "on",
    latePaymentHours: Number(formData.get("latePaymentHours")),
  });
  if (!validation.ok) return { error: validation.error };

  try {
    await createBinancePayStore().saveSettings(validation.settings);
    void logAdminAction("binance_pay.settings_updated", "binance_pay_settings", null, {
      dailyOrderCap: validation.settings.dailyOrderCap,
      autoActivate: validation.settings.autoActivate,
      latePaymentHours: validation.settings.latePaymentHours,
    });
    refresh();
    revalidatePath("/upgrade");
    return { success: "Saved." };
  } catch (error) {
    console.error("[binance] saving the settings failed", error);
    return { error: GENERIC };
  }
}
