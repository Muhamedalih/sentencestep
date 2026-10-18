import type { FulfillmentOutcome, PaymentAlert } from "@/lib/billing/payments/fulfillment";

import {
  FIRST_LOOK_BACK_MS,
  IDLE_INTERVAL_SECONDS,
  IDLE_SWEEP_MS,
  RELAY_OVERLAP_MS,
  WATCH_INTERVAL_SECONDS,
} from "./constants";
import { extractOrderCodes } from "./codes";
import { decideLink, SKIP_REASON_TEXT } from "./matching";
import type { SkipReason } from "./matching";
import { parseRelayBody } from "./records";
import { verifyRelayRequest } from "./relay-auth";
import type { BinancePayStore } from "./store";
import type { BinancePaySettings } from "./settings";

export const PENDING_PATH = "/api/payments/binance/pending";
export const INGEST_PATH = "/api/payments/binance/ingest";

interface HeadersLike {
  get(name: string): string | null;
}

export interface RelayDeps {
  secret: string;
  store: BinancePayStore;
  providerEnv: "live" | "test";
  /** The server's clock in milliseconds. */
  now: () => number;
  /** Grants Premium for an order whose transfer has just been linked: the one idempotent fulfillment path. */
  fulfill: (referenceId: string) => Promise<FulfillmentOutcome>;
  /** Tells the admins about something that needs a person; must never throw. */
  report: (alert: PaymentAlert) => void | Promise<void>;
}

export interface HandlerResponse {
  status: number;
  body: Record<string, unknown>;
}

/**
 * A transfer whose note carries an order's code but could not be linked is a
 * customer's money that nothing activated: an admin is told. A transfer with no
 * code, or of a kind that is not a payment, may just be a friend sending
 * something, so it only waits in the list.
 */
const ALERT_REASONS: ReadonlySet<SkipReason> = new Set([
  "unknown_code",
  "several_codes",
  "order_closed",
  "order_already_paid",
  "before_order",
  "too_late",
  "underpaid",
]);

const UNLINKED_BATCH = 200;

const unauthorized: HandlerResponse = { status: 401, body: { error: "unauthorized" } };

interface Processed {
  linked: number;
  fulfilled: number;
}

/**
 * Looks at every transfer that is not yet linked (not only the new ones, so a
 * transfer whose first attempt hit a database hiccup, or that arrived while
 * automatic activation was switched off, is picked up on the next visit) and
 * links the ones the strict rule accepts. Each transfer is handled on its own:
 * one failure never stops the rest.
 */
export async function processUnlinkedTransfers(
  deps: RelayDeps,
  settings: BinancePaySettings,
): Promise<Processed> {
  const now = new Date(deps.now());
  const lateWindowMs = settings.latePaymentHours * 60 * 60 * 1000;
  const lookBack = new Date(now.getTime() - lateWindowMs - 60 * 60 * 1000);
  const processed: Processed = { linked: 0, fulfilled: 0 };

  for (const stored of await deps.store.listUnlinkedSince(lookBack, UNLINKED_BATCH)) {
    try {
      const orders = await deps.store.findOrdersByCodes(extractOrderCodes(stored.transfer.note));
      const decision = decideLink(stored.transfer, orders, { lateWindowMs });

      if (decision.action === "skip") {
        if (ALERT_REASONS.has(decision.reason) && !stored.notifiedAt) {
          await deps.report({
            code: "binance_transfer_needs_match",
            referenceId: decision.order?.referenceId ?? "batch",
            detail: `${SKIP_REASON_TEXT[decision.reason]} Transfer ${stored.transfer.transactionId}, ${stored.transfer.amount} ${stored.transfer.currency}.`,
          });
          await deps.store.markNotified(stored.id, now);
        }
        continue;
      }

      if (!settings.autoActivate) continue;

      const result = await deps.store.linkTransfer({
        transferId: stored.id,
        orderId: decision.order.orderId,
        method: decision.method,
        reason: "The note holds the order's code and the amount covers its price.",
      });
      if (result !== "linked" && result !== "already_linked_here") {
        if (!stored.notifiedAt) {
          await deps.report({
            code: "binance_transfer_needs_match",
            referenceId: decision.order.referenceId,
            detail: `The transfer could not be attached to the order (${result}). Transfer ${stored.transfer.transactionId}.`,
          });
          await deps.store.markNotified(stored.id, now);
        }
        continue;
      }

      processed.linked += 1;
      const outcome = await deps.fulfill(decision.order.referenceId);
      if (outcome.outcome === "fulfilled") processed.fulfilled += 1;
    } catch (error) {
      // Left as it is: the transfer is still unlinked (or linked and waiting for the reconcile job),
      // and the next visit, the return page or the reconcile job settles it.
      console.error("[binance] a transfer could not be processed", {
        transactionId: stored.transfer.transactionId,
        message: error instanceof Error ? error.message : "unknown error",
      });
    }
  }
  return processed;
}

/**
 * POST /api/payments/binance/ingest: the relay hands over the incoming transfers
 * it found. The signature is checked against the exact body first; only then is
 * anything read, validated, stored and matched. The response says how many were
 * new and how many orders were activated, never anything about other learners.
 */
export async function handleIngest(
  deps: RelayDeps,
  request: { body: string; headers: HeadersLike },
): Promise<HandlerResponse> {
  const auth = verifyRelayRequest({
    secret: deps.secret,
    method: "POST",
    path: INGEST_PATH,
    body: request.body,
    headers: request.headers,
    now: deps.now(),
  });
  if (!auth.ok) {
    console.warn("[binance] ingest refused", { reason: auth.reason });
    return unauthorized;
  }

  const parsed = parseRelayBody(request.body, deps.now());
  if (!parsed.ok) return { status: 400, body: { error: parsed.reason } };

  try {
    const now = new Date(deps.now());
    const { transfers, skipped, error } = parsed.value;

    if (error) await deps.store.recordRelay({ polled: true, error }, now);
    const inserted = await deps.store.insertTransfers(transfers);
    const settings = await deps.store.getSettings();
    const processed = await processUnlinkedTransfers(deps, settings);
    if (!error) await deps.store.recordRelay({ polled: true, success: true }, now);

    return {
      status: 200,
      body: {
        ok: true,
        received: transfers.length,
        inserted,
        skipped,
        linked: processed.linked,
        fulfilled: processed.fulfilled,
      },
    };
  } catch (error) {
    console.error("[binance] ingest failed", error);
    return { status: 500, body: { error: "ingest_failed" } };
  }
}

/**
 * GET /api/payments/binance/pending: the relay asks "should I look at Binance
 * now, and from when?". It looks every few seconds while an order waits for its
 * transfer, and otherwise only now and then (to catch a late payment), so
 * Binance and this server are asked as little as possible. Asking is also the
 * relay's heartbeat.
 */
export async function handlePending(
  deps: RelayDeps,
  request: { headers: HeadersLike },
): Promise<HandlerResponse> {
  const nowMs = deps.now();
  const auth = verifyRelayRequest({
    secret: deps.secret,
    method: "GET",
    path: PENDING_PATH,
    body: "",
    headers: request.headers,
    now: nowMs,
  });
  if (!auth.ok) {
    console.warn("[binance] pending refused", { reason: auth.reason });
    return unauthorized;
  }

  try {
    const now = new Date(nowMs);
    const [state, active] = await Promise.all([
      deps.store.getRelayState(),
      deps.store.countActiveOrders(deps.providerEnv, now),
    ]);
    await deps.store.recordRelay({ polled: true }, now);

    const lastSuccess = state.lastSuccessAt ? Date.parse(state.lastSuccessAt) : null;
    const sweepDue = lastSuccess === null || nowMs - lastSuccess >= IDLE_SWEEP_MS;
    const from = lastSuccess ?? nowMs - FIRST_LOOK_BACK_MS;
    return {
      status: 200,
      body: {
        watch: active > 0 || sweepDue,
        // Re-reads a little before the last good look, and never more than a week back.
        sinceMs: Math.max(nowMs - 7 * 24 * 60 * 60 * 1000, from - RELAY_OVERLAP_MS),
        intervalSeconds: active > 0 ? WATCH_INTERVAL_SECONDS : IDLE_INTERVAL_SECONDS,
        serverTimeMs: nowMs,
      },
    };
  } catch (error) {
    console.error("[binance] pending failed", error);
    return { status: 500, body: { error: "pending_failed" } };
  }
}
