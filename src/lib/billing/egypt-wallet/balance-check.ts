import { checkBalanceChain, formatPounds } from "./balance";
import type { SmsDeps } from "./ingest";

/** A step is only reported once its text has been here this long: an earlier text still on its way would explain it. */
export const BALANCE_SETTLE_MS = 15 * 60 * 1000;
const LOOK_BACK_MS = 7 * 24 * 60 * 60 * 1000;
const LIMIT = 500;

/**
 * The wallet's balance check as a job (run by the reconcile cron): finds the steps whose balance does
 * not follow from the texts before them (see balance.ts) and tells the admins once per step, by
 * e-mail and push, with the amounts. The right to alert is one atomic insert per operation number, so a
 * step is never reported twice. Watches the wallet only: it never touches an order.
 */
export async function processBalanceChecks(deps: SmsDeps): Promise<{ alerted: number }> {
  const nowMs = deps.now();
  const observations = await deps.store.listBalanceObservations(
    new Date(nowMs - LOOK_BACK_MS),
    LIMIT,
  );
  let alerted = 0;
  for (const step of checkBalanceChain(observations)) {
    if (nowMs - Date.parse(step.seenAt) < BALANCE_SETTLE_MS) continue;
    try {
      if (!(await deps.store.claimBalanceAlert(step.operation))) continue;
      const direction = step.diffPiasters < 0 ? "less" : "more";
      await deps.report({
        code: "egypt_wallet_balance_mismatch",
        referenceId: step.operation,
        detail: `After operation ${step.after} the wallet should hold ${formatPounds(step.expectedPiasters)} EGP, but the text of operation ${step.operation} says ${formatPounds(step.actualPiasters)} EGP: ${formatPounds(Math.abs(step.diffPiasters))} EGP ${direction} than the texts explain.`,
      });
      alerted += 1;
    } catch (error) {
      console.error("[egypt-wallet] a balance alert failed", error);
    }
  }
  return { alerted };
}
