"use server";

import { getEgyptWalletDeps } from "@/lib/billing/egypt-wallet/deps";
import { linkByOperationNumber, processUnlinkedMessages } from "@/lib/billing/egypt-wallet/ingest";
import { normalizeEgyptPhone } from "@/lib/billing/egypt-wallet/phone";
import { egyptStrings } from "@/lib/billing/egypt-wallet/strings";
import { getLocale } from "@/lib/i18n/get-locale";
import { getCurrentUser } from "@/lib/supabase/auth";

export interface EgyptActionState {
  ok?: boolean;
  error?: string;
}

const MAX_REFERENCE_LENGTH = 255;
const MAX_INPUT_LENGTH = 64;

function text(formData: FormData, name: string, max: number): string | null {
  const value = formData.get(name);
  return typeof value === "string" && value.length <= max ? value : null;
}

/**
 * The learner writes the Vodafone Cash number they will send from. It is the identity the transfer
 * is matched on, so it is validated as an Egyptian mobile number and stored in one form. Only the
 * order's own learner can set it, and not once a transfer has been linked. A transfer that already
 * arrived (a learner who paid first) is picked up straight away.
 */
export async function savePayerPhone(
  _previous: EgyptActionState | null,
  formData: FormData,
): Promise<EgyptActionState> {
  const t = egyptStrings(await getLocale());
  const user = await getCurrentUser();
  const reference = text(formData, "reference", MAX_REFERENCE_LENGTH);
  if (!user || !reference) return { error: t.genericError };

  const phone = normalizeEgyptPhone(text(formData, "phone", MAX_INPUT_LENGTH) ?? "");
  if (!phone) return { error: t.phoneInvalid };

  try {
    const deps = getEgyptWalletDeps();
    if (!deps) return { error: t.genericError };
    const order = await deps.store.getOrderForUser(reference, user.id);
    if (!order) return { error: t.genericError };
    if (order.status === "fulfilled") return { ok: true };

    const saved = await deps.store.setPayerPhone(order.orderId, phone, new Date(deps.now()));
    if (!saved) return { error: t.phoneLocked };

    try {
      await processUnlinkedMessages(deps, await deps.store.getSettings());
    } catch (error) {
      // The number is saved; the next message, the payment page or the reconcile job finishes the match.
      console.error("[egypt-wallet] matching after saving the number failed", error);
    }
    return { ok: true };
  } catch (error) {
    console.error("[egypt-wallet] saving the payer number failed", error);
    return { error: t.genericError };
  }
}

/** The learner paid from another number and gives the operation number from Vodafone's receipt. */
export async function submitOperationNumber(
  _previous: EgyptActionState | null,
  formData: FormData,
): Promise<EgyptActionState> {
  const t = egyptStrings(await getLocale());
  const user = await getCurrentUser();
  const reference = text(formData, "reference", MAX_REFERENCE_LENGTH);
  const operation = text(formData, "operation", MAX_INPUT_LENGTH);
  if (!user || !reference || operation === null) return { error: t.genericError };

  try {
    const deps = getEgyptWalletDeps();
    if (!deps) return { error: t.genericError };
    const order = await deps.store.getOrderForUser(reference, user.id);
    if (!order) return { error: t.genericError };
    if (order.status === "fulfilled") return { ok: true };

    const outcome = await linkByOperationNumber(deps, order, operation);
    if (outcome === "linked") return { ok: true };
    return { error: t.otherErrors[outcome] };
  } catch (error) {
    console.error("[egypt-wallet] linking by operation number failed", error);
    return { error: t.otherErrors.failed };
  }
}

/**
 * The learner says they sent the money. It only records the claim (and looks once more for a transfer
 * that may already have arrived); nothing is granted because of it. If no matching transfer shows up
 * within a few minutes, the admins are alerted (see alertUnansweredClaim).
 */
export async function claimPaid(
  _previous: EgyptActionState | null,
  formData: FormData,
): Promise<EgyptActionState> {
  const t = egyptStrings(await getLocale());
  const user = await getCurrentUser();
  const reference = text(formData, "reference", MAX_REFERENCE_LENGTH);
  if (!user || !reference) return { error: t.genericError };

  try {
    const deps = getEgyptWalletDeps();
    if (!deps) return { error: t.genericError };
    const order = await deps.store.getOrderForUser(reference, user.id);
    if (!order) return { error: t.genericError };
    if (order.status === "fulfilled") return { ok: true };
    if (!order.payerPhone) return { error: t.claimNeedsPhone };

    await deps.store.claimPaid(order.orderId, new Date(deps.now()));
    try {
      await processUnlinkedMessages(deps, await deps.store.getSettings());
    } catch (error) {
      console.error("[egypt-wallet] matching after the claim failed", error);
    }
    return { ok: true };
  } catch (error) {
    console.error("[egypt-wallet] recording the claim failed", error);
    return { error: t.genericError };
  }
}
