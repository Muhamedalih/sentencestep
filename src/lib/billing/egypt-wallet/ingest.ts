import { createHash, timingSafeEqual } from "node:crypto";

import type { FulfillmentOutcome, PaymentAlert } from "@/lib/billing/payments/fulfillment";

import { MAX_SMS_CHARS, SMS_SECRET_HEADER } from "./constants";
import { decideLink, decideReferenceLink, SKIP_REASON_TEXT } from "./matching";
import type { MatchableOrder, SkipReason } from "./matching";
import { parseSms } from "./sms";
import type { EgyptWalletSettings } from "./settings";
import type { EgyptWalletStore, StoredMessage } from "./store";

export const SMS_PATH = "/api/payments/egypt-wallet/sms";

interface HeadersLike {
  get(name: string): string | null;
}

export interface SmsDeps {
  secret: string;
  store: EgyptWalletStore;
  providerEnv: "live" | "test";
  /** The server's clock in milliseconds. */
  now: () => number;
  /** Grants Premium for an order whose message has just been linked: the one idempotent fulfillment path. */
  fulfill: (referenceId: string) => Promise<FulfillmentOutcome>;
  /** Tells the admins about something that needs a person; must never throw. */
  report: (alert: PaymentAlert) => void | Promise<void>;
}

export interface HandlerResponse {
  status: number;
  body: Record<string, unknown>;
}

const unauthorized: HandlerResponse = { status: 401, body: { error: "unauthorized" } };

/**
 * A message whose sender number is on an order but could not be linked is a customer's money that
 * nothing activated: an admin is told. A message with no order behind its number only waits in the
 * report, unless an order is waiting at the moment (see alertForUnmatched).
 */
const ALERT_REASONS: ReadonlySet<SkipReason> = new Set([
  "order_closed",
  "order_already_paid",
  "before_order",
  "too_late",
  "wrong_amount",
  "ambiguous",
]);

const UNLINKED_BATCH = 200;
/** More waiting orders than this at once is far beyond the daily cap. */
const WAITING_ORDERS_LOOKED_AT = 20;

/** Compares two secrets without leaking, through timing, how much of one was right (both are hashed to one length first). */
export function secretsMatch(given: string, expected: string): boolean {
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** The shared secret from `x-secret` or `Authorization: Bearer`, whichever the forwarding app can send. */
export function readSecret(headers: HeadersLike): string {
  const direct = headers.get(SMS_SECRET_HEADER);
  if (direct) return direct.trim();
  const bearer = /^Bearer\s+(.+)$/i.exec(headers.get("authorization") ?? "");
  return bearer ? bearer[1]!.trim() : "";
}

const MESSAGE_KEYS = ["message", "text", "body", "sms", "content", "msg"] as const;
const SENDER_KEYS = ["from", "sender", "address", "originatingAddress", "number"] as const;

function pick(source: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return null;
}

/** The text and (when the app sends it) the sender of a forwarded message: JSON, a form, or the bare text. */
export function readMessage(
  raw: string,
  contentType: string | null,
): { message: string; sender: string | null } {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed && typeof parsed === "object") {
        const record = parsed as Record<string, unknown>;
        const message = pick(record, MESSAGE_KEYS);
        if (message) return { message, sender: pick(record, SENDER_KEYS) };
      }
    } catch {
      // Not JSON after all: the text is the message.
    }
  }
  if (contentType?.includes("application/x-www-form-urlencoded")) {
    const form = Object.fromEntries(new URLSearchParams(raw));
    const message = pick(form, MESSAGE_KEYS);
    if (message) return { message, sender: pick(form, SENDER_KEYS) };
  }
  return { message: trimmed, sender: null };
}

/** True when the app reported no sender, or the sender is Vodafone's: a text from an ordinary number can never be a payment. */
export function senderIsVodafone(sender: string | null): boolean {
  if (sender === null || sender.trim() === "") return true;
  return /vodafone|vf[\s_-]?cash|^vf$/i.test(sender.trim());
}

/** Writes the link, grants Premium through the one fulfillment path, and says whether it worked. */
async function linkAndFulfill(
  deps: SmsDeps,
  message: StoredMessage,
  order: MatchableOrder,
  method: "phone" | "reference",
  reason: string,
): Promise<"linked" | "not_linked"> {
  const result = await deps.store.linkMessage({
    messageId: message.id,
    orderId: order.orderId,
    method,
    reason,
  });
  if (result !== "linked" && result !== "already_linked_here") {
    if (!message.notifiedAt) {
      await deps.report({
        code: "egypt_wallet_message_needs_match",
        referenceId: message.transactionId,
        detail: `The transfer could not be attached to the order (${result}). Operation ${message.transactionId}, ${(message.amountPiasters / 100).toFixed(2)} EGP.`,
      });
      await deps.store.markNotified(message.id, new Date(deps.now()));
    }
    return "not_linked";
  }
  await deps.fulfill(order.referenceId);
  return "linked";
}

interface Processed {
  linked: number;
}

/**
 * Looks at every message that is not yet linked (not only the new ones, so a message whose first
 * attempt hit a database hiccup, or that arrived before its learner wrote their number, is picked up
 * on the next visit) and links the ones the strict rule accepts. Each message is handled on its own:
 * one failure never stops the rest.
 */
export async function processUnlinkedMessages(
  deps: SmsDeps,
  settings: EgyptWalletSettings,
): Promise<Processed> {
  const now = new Date(deps.now());
  const lateWindowMs = settings.latePaymentHours * 60 * 60 * 1000;
  const lookBack = new Date(now.getTime() - lateWindowMs - 60 * 60 * 1000);
  const processed: Processed = { linked: 0 };

  let waiting: MatchableOrder[] | null = null;
  const waitingOrders = async () =>
    (waiting ??= await deps.store.listOpenOrders(lookBack, WAITING_ORDERS_LOOKED_AT));

  for (const stored of await deps.store.listUnlinkedSince(lookBack, UNLINKED_BATCH)) {
    try {
      const orders = stored.payerPhone
        ? await deps.store.findOrdersByPhone(stored.payerPhone, lookBack)
        : [];
      const decision = decideLink(stored, orders, {
        lateWindowMs,
        shopWallet: settings.walletNumber,
      });

      if (decision.action === "skip") {
        if (!stored.notifiedAt) {
          const alert = await alertForUnmatched(stored, decision.reason, waitingOrders);
          if (alert) {
            await deps.report(alert);
            await deps.store.markNotified(stored.id, now);
          }
        }
        continue;
      }

      if (!settings.autoActivate) continue;

      const outcome = await linkAndFulfill(
        deps,
        stored,
        decision.order,
        "phone",
        "The sender's number and the amount match the order.",
      );
      if (outcome === "linked") processed.linked += 1;
    } catch (error) {
      // Left as it is: the message is still unlinked (or linked and waiting for the reconcile job),
      // and the next visit, the payment page or the reconcile job settles it.
      console.error("[egypt-wallet] a message could not be processed", {
        transactionId: stored.transactionId,
        message: error instanceof Error ? error.message : "unknown error",
      });
    }
  }
  return processed;
}

async function alertForUnmatched(
  message: StoredMessage,
  reason: SkipReason,
  waitingOrders: () => Promise<MatchableOrder[]>,
): Promise<PaymentAlert | null> {
  const amount = `${(message.amountPiasters / 100).toFixed(2)} EGP`;
  if (ALERT_REASONS.has(reason)) {
    return {
      code: "egypt_wallet_message_needs_match",
      referenceId: message.transactionId,
      detail: `${SKIP_REASON_TEXT[reason]} Operation ${message.transactionId}, ${amount}.`,
    };
  }
  if (reason === "wrong_wallet") return null;
  // No order behind the number: a friend's money, or a learner who wrote another number. Only worth a
  // word while an order waits that this transfer could be for.
  const pounds = Math.round(message.amountPiasters / 100);
  const candidates = (await waitingOrders()).filter((order) => order.chargeAmount === pounds);
  if (candidates.length === 0) return null;
  return {
    code: "egypt_wallet_message_needs_match",
    referenceId: message.transactionId,
    detail: `A transfer of ${amount} arrived from ${message.payerPhone ?? "an unknown number"} and no order is waiting for that number, but ${candidates.length} order(s) of that price are open. The learner may have written a different number. Operation ${message.transactionId}.`,
  };
}

/**
 * POST /api/payments/egypt-wallet/sms: the app on the shop wallet's phone hands over each text
 * message it receives. The secret is checked first; only then is anything read. Every message is
 * stored (a transfer by its operation number, anything else as "unreadable") before anything is
 * decided, so nothing is ever lost, and the response says only what happened, never anything about
 * a learner.
 */
export async function handleSms(
  deps: SmsDeps,
  request: { body: string; headers: HeadersLike },
): Promise<HandlerResponse> {
  if (!secretsMatch(readSecret(request.headers), deps.secret)) {
    console.warn("[egypt-wallet] sms refused: wrong secret");
    return unauthorized;
  }

  const { message, sender } = readMessage(request.body, request.headers.get("content-type"));
  const rawText = message.slice(0, MAX_SMS_CHARS);
  if (rawText.trim() === "") return { status: 400, body: { error: "empty" } };

  try {
    const now = new Date(deps.now());
    const parsed = parseSms(rawText);

    if (!senderIsVodafone(sender)) {
      // A text from an ordinary number is kept and never trusted. Only one that claims to be money
      // received is worth an alert (the app's own TEST message, for one, is not).
      const claimsMoney =
        parsed.kind === "transfer" || (parsed.kind === "other" && parsed.looksLikeTransfer);
      await deps.store.insertUnreadable({
        rawText,
        sender: sender?.slice(0, 64) ?? null,
        looksLikeTransfer: claimsMoney,
      });
      // The request was authenticated: the phone's path works, whatever the text said.
      await deps.store.touchState(now);
      if (claimsMoney) {
        await deps.report({
          code: "egypt_wallet_untrusted_sender",
          referenceId: "batch",
          detail: `A message that looks like a transfer came from "${sender?.slice(0, 40)}", not from Vodafone, and was not trusted.`,
        });
      }
      return { status: 200, body: { ok: true, status: "ignored" } };
    }

    if (parsed.kind === "activity") {
      // Money sent out, or any other text with a balance: the wallet's own record, never an order's payment.
      const stored = await deps.store.insertActivity(parsed.activity, rawText, now);
      await deps.store.touchState(now);
      return {
        status: 200,
        body: { ok: true, status: stored === "inserted" ? "recorded" : "duplicate" },
      };
    }

    if (parsed.kind === "other") {
      await deps.store.insertUnreadable({
        rawText,
        sender: sender?.slice(0, 64) ?? null,
        looksLikeTransfer: parsed.looksLikeTransfer,
      });
      if (parsed.looksLikeTransfer) {
        await deps.report({
          code: "egypt_wallet_unreadable_message",
          referenceId: "batch",
          detail:
            "A text about money arrived in a shape the reader does not know. It is saved in Admin > Vodafone Cash > Unread messages; if it is a payment, the reader needs updating.",
        });
      }
      await deps.store.touchState(now);
      return { status: 200, body: { ok: true, status: "ignored" } };
    }

    const result = await deps.store.insertMessage(parsed.transfer, rawText, now);
    await deps.store.touchState(now);
    const settings = await deps.store.getSettings();
    const processed = await processUnlinkedMessages(deps, settings);
    return {
      status: 200,
      body: {
        ok: true,
        status: result === "inserted" ? "stored" : "duplicate",
        linked: processed.linked,
      },
    };
  } catch (error) {
    console.error("[egypt-wallet] sms handling failed", error);
    // 500 so the forwarding app retries: nothing is lost, and a repeat is recognised by its operation number.
    return { status: 500, body: { error: "sms_failed" } };
  }
}

export type ReferenceOutcome =
  | "linked"
  | "invalid"
  | "not_found"
  | "already_used"
  | "order_closed"
  | "wrong_amount"
  | "before_order"
  | "too_late"
  | "not_linked";

/** The operation number as Vodafone prints it: digits only, with any spaces or a leading # removed. */
export function normalizeOperationNumber(input: string): string | null {
  const digits = input
    .replace(/[\s#-]/g, "")
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
  return /^\d{6,20}$/.test(digits) ? digits : null;
}

/**
 * A learner who paid from another number types the operation number from Vodafone's receipt: the
 * stored message must be unused, newer than the order, inside its allowed time and cover its price.
 */
export async function linkByOperationNumber(
  deps: SmsDeps,
  order: MatchableOrder,
  input: string,
): Promise<ReferenceOutcome> {
  const transactionId = normalizeOperationNumber(input);
  if (!transactionId) return "invalid";
  const settings = await deps.store.getSettings();
  const message = await deps.store.getMessageByTransactionId(transactionId);
  const decision = decideReferenceLink(message, order, {
    lateWindowMs: settings.latePaymentHours * 60 * 60 * 1000,
  });
  if (decision.action === "refuse") return decision.reason;
  return linkAndFulfill(
    deps,
    message!,
    order,
    "reference",
    "The learner gave the operation number from Vodafone's receipt.",
  );
}

/** How long after "I sent the money" the admins are alerted when no matching transfer has arrived. */
export const CLAIM_ALERT_AFTER_MS = 10 * 60 * 1000;
/** A claim older than this is no longer chased (the order's late window is over anyway). */
const CLAIM_LOOK_BACK_MS = 3 * 24 * 60 * 60 * 1000;
const CLAIMS_BATCH = 50;

/**
 * A learner said they sent the money and nothing matching has arrived: tells the admins once, by
 * e-mail and push, with who it is, which number they send from and what amount. The right to alert
 * is won by one atomic database update, so the payment page, the cron job and a double click can
 * never send it twice. Returns true when this call sent it.
 */
export async function alertUnansweredClaim(
  deps: SmsDeps,
  order: MatchableOrder,
  claimedAt: string,
): Promise<boolean> {
  const now = new Date(deps.now());
  const won = await deps.store.claimAlertDue(
    order.orderId,
    new Date(now.getTime() - CLAIM_ALERT_AFTER_MS),
    now,
  );
  if (!won) return false;
  const email = (await deps.store.getEmail(order.userId).catch(() => null)) ?? "a learner";
  const minutes = Math.max(1, Math.round((now.getTime() - Date.parse(claimedAt)) / 60_000));
  await deps.report({
    code: "egypt_wallet_paid_not_activated",
    referenceId: order.referenceId,
    detail: `${email} pressed "I sent the money" ${minutes} minutes ago for ${order.chargeAmount} EGP from ${order.payerPhone ?? "a number they did not write"}, and no matching transfer message has arrived.`,
  });
  return true;
}

/** Alerts about every claim that has waited long enough without a matching transfer (the cron job's safety net). */
export async function processUnansweredClaims(deps: SmsDeps): Promise<{ alerted: number }> {
  const nowMs = deps.now();
  const claims = await deps.store.listUnansweredClaims(
    new Date(nowMs - CLAIM_ALERT_AFTER_MS),
    new Date(nowMs - CLAIM_LOOK_BACK_MS),
    CLAIMS_BATCH,
  );
  let alerted = 0;
  for (const claim of claims) {
    try {
      if (await alertUnansweredClaim(deps, claim.order, claim.claimedAt)) alerted += 1;
    } catch (error) {
      console.error("[egypt-wallet] a claim alert failed", error);
    }
  }
  return { alerted };
}
