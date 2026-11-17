"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import {
  effectiveRate,
  isSaneRate,
  RATE_MAX,
  RATE_MIN,
  refreshRate,
  roundRate,
} from "@/lib/billing/egypt-wallet/rate";
import { createEgyptWalletStore } from "@/lib/billing/egypt-wallet/store";
import { reportPaymentAlert } from "@/lib/billing/payments/runtime";

const GENERIC = "Couldn't change the rate. Please try again.";

function refresh() {
  revalidatePath("/admin/egypt-wallet");
  revalidatePath("/upgrade");
}

function deps(store: ReturnType<typeof createEgyptWalletStore>) {
  return { store, now: () => Date.now(), report: reportPaymentAlert };
}

/** Reads the day's rate now (the automatic update only reaches out about once a day). Not while an admin's own rate is in use. */
export async function refreshEgyptRate(
  _prev: ActionResult | null,
  _formData: FormData,
): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  try {
    const store = createEgyptWalletStore();
    if ((await store.getSettings()).rateLocked) {
      return { error: "Your own rate is in use. Switch back to the automatic rate first." };
    }
    const outcome = await refreshRate(deps(store), { force: true });
    void logAdminAction("egypt_wallet.rate_refreshed", "egypt_wallet_settings", null, { outcome });
    refresh();
    if (outcome === "updated") return { success: "Updated from the rate service." };
    if (outcome === "refused") {
      return {
        error:
          "The service's number was refused (out of range or too far from the current rate). Set it by hand if the market really moved.",
      };
    }
    return { error: "Couldn't reach the rate service. The current rate is kept." };
  } catch (error) {
    console.error("[egypt-wallet] refreshing the rate failed", error);
    return { error: GENERIC };
  }
}

/** Sets the rate by hand. The automatic update stops until it is given back. */
export async function setEgyptRateByHand(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const rate = Number(String(formData.get("rate") ?? "").replace(",", "."));
  if (!isSaneRate(rate)) return { error: `Enter a rate between ${RATE_MIN} and ${RATE_MAX}.` };

  try {
    await createEgyptWalletStore().saveRate(
      { rate: roundRate(rate), source: "set by an admin", locked: true },
      new Date(),
    );
    void logAdminAction("egypt_wallet.rate_set_by_hand", "egypt_wallet_settings", null, { rate });
    refresh();
    return { success: `Saved. Prices use ${roundRate(rate)} until you switch back to automatic.` };
  } catch (error) {
    console.error("[egypt-wallet] setting the rate failed", error);
    return { error: GENERIC };
  }
}

/** Gives the rate back to the automatic daily update and reads it now. */
export async function resumeAutomaticEgyptRate(
  _prev: ActionResult | null,
  _formData: FormData,
): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  try {
    const store = createEgyptWalletStore();
    const current = effectiveRate(await store.getSettings());
    // Unlock first (keeping the current number), then read the day's rate.
    await store.saveRate({ rate: current.rate, source: current.source, locked: false }, new Date());
    const outcome = await refreshRate(deps(store), { force: true });
    void logAdminAction("egypt_wallet.rate_automatic", "egypt_wallet_settings", null, { outcome });
    refresh();
    return {
      success:
        outcome === "updated"
          ? "Automatic again, and updated just now."
          : "Automatic again. The next daily reading will update it.",
    };
  } catch (error) {
    console.error("[egypt-wallet] switching the rate back to automatic failed", error);
    return { error: GENERIC };
  }
}
