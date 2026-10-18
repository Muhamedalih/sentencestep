import { parseAmountUnits } from "./amount";
import { extractOrderCodes } from "./codes";

/** One incoming transfer, cleaned: the only shape the rest of the system ever sees. */
export interface IncomingTransfer {
  transactionId: string;
  /** ISO timestamp of the transfer. */
  transactedAt: string;
  /** The amount exactly as Binance wrote it. */
  amount: string;
  currency: string;
  orderType: string;
  /** What the sender typed in the note, trimmed; null when empty. */
  note: string | null;
  payerBinanceId: string | null;
  payerName: string | null;
  /** A small allow-list of Binance's own fields, kept for the audit trail. Never contains contact details. */
  raw: Record<string, string | number>;
}

export interface ParsedRelayBody {
  transfers: IncomingTransfer[];
  /** Records that were not incoming payments, or were malformed, and were left out. */
  skipped: number;
  /** A short message from the relay when its own call to Binance failed; null otherwise. */
  error: string | null;
}

export type ParseResult = { ok: true; value: ParsedRelayBody } | { ok: false; reason: string };

export const MAX_BODY_BYTES = 512 * 1024;
export const MAX_RECORDS = 200;
const MAX_NOTE_LENGTH = 200;
const MAX_NAME_LENGTH = 80;
const MAX_ERROR_LENGTH = 200;
const EARLIEST_TRANSFER_MS = Date.UTC(2020, 0, 1);
const FUTURE_TOLERANCE_MS = 24 * 60 * 60 * 1000;

// Names and notes are typed by strangers: keep them as plain, bounded text.
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/g;

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(CONTROL_CHARACTERS, " ").replace(/\s+/g, " ").trim().slice(0, max);
  return text === "" ? null : text;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Binance's own field for what a sender writes is "note", but its history is only partly documented and
// the text of an incoming transfer could sit under another name. So when "note" holds no order code the
// rest of the record is searched for one: the code is a random token that only the owner of an order has
// seen, so finding it anywhere in a transfer is as good as finding it in the note. Who sent it and who
// received it are never searched (those are names, not messages), nor the ids.
const SCAN_SKIPPED_KEYS = new Set([
  "note",
  "transactionId",
  "orderId",
  "payerInfo",
  "receiverInfo",
]);
const SCAN_MAX_DEPTH = 3;
const SCAN_MAX_STRINGS = 60;

function codeTextElsewhere(
  record: Record<string, unknown>,
): { text: string; field: string } | null {
  let budget = SCAN_MAX_STRINGS;

  const visit = (
    value: unknown,
    field: string,
    depth: number,
  ): { text: string; field: string } | null => {
    if (budget <= 0) return null;
    if (typeof value === "string") {
      budget -= 1;
      const text = cleanText(value, MAX_NOTE_LENGTH);
      return text !== null && extractOrderCodes(text).length > 0 ? { text, field } : null;
    }
    if (depth >= SCAN_MAX_DEPTH) return null;
    if (Array.isArray(value)) {
      for (const item of value.slice(0, 20)) {
        const found = visit(item, field, depth + 1);
        if (found) return found;
      }
      return null;
    }
    if (isRecord(value)) {
      for (const inner of Object.values(value)) {
        const found = visit(inner, field, depth + 1);
        if (found) return found;
      }
    }
    return null;
  };

  for (const [key, value] of Object.entries(record)) {
    if (SCAN_SKIPPED_KEYS.has(key)) continue;
    const found = visit(value, key, 1);
    if (found) return found;
  }
  return null;
}

/** The exact text of a Binance amount, or null when it is missing or not a positive number. */
function positiveAmount(value: unknown): string | null {
  const text = typeof value === "number" ? String(value) : value;
  if (typeof text !== "string") return null;
  const units = parseAmountUnits(text);
  return units !== null && units > 0n ? text.trim() : null;
}

function toTransfer(record: unknown, now: number): IncomingTransfer | null {
  if (!isRecord(record)) return null;

  const transactionId = record.transactionId;
  if (typeof transactionId !== "string" || !/^[A-Za-z0-9_-]{4,64}$/.test(transactionId)) {
    return null;
  }

  const time = record.transactionTime;
  if (
    typeof time !== "number" ||
    !Number.isFinite(time) ||
    time < EARLIEST_TRANSFER_MS ||
    time > now + FUTURE_TOLERANCE_MS
  ) {
    return null;
  }

  // Negative amounts are what the shop sent out, zero is nothing: neither is a payment.
  const amount = positiveAmount(record.amount);
  if (amount === null) return null;

  const currency = typeof record.currency === "string" ? record.currency.trim().toUpperCase() : "";
  const orderType =
    typeof record.orderType === "string" ? record.orderType.trim().toUpperCase() : "";
  if (!/^[A-Z0-9]{2,12}$/.test(currency) || !/^[A-Z0-9_]{2,32}$/.test(orderType)) return null;

  const payer = isRecord(record.payerInfo) ? record.payerInfo : {};
  const payerId = payer.binanceId;
  const payerBinanceId =
    (typeof payerId === "string" || typeof payerId === "number") &&
    /^\d{3,20}$/.test(String(payerId))
      ? String(payerId)
      : null;

  const raw: Record<string, string | number> = {
    transactionId,
    transactionTime: time,
    amount,
    currency,
    orderType,
  };
  if (typeof record.walletType === "number") raw.walletType = record.walletType;
  const orderId = cleanText(record.orderId, 64);
  if (orderId) raw.orderId = orderId;

  let note = cleanText(record.note, MAX_NOTE_LENGTH);
  if (extractOrderCodes(note).length === 0) {
    const elsewhere = codeTextElsewhere(record);
    if (elsewhere) {
      // The text that holds the code goes first, so the bound on the note can never cut it off.
      note = [elsewhere.text, note].filter(Boolean).join(" | ").slice(0, MAX_NOTE_LENGTH);
      raw.noteField = elsewhere.field.slice(0, 40);
    }
  }

  return {
    transactionId,
    transactedAt: new Date(time).toISOString(),
    amount,
    currency,
    orderType,
    note,
    payerBinanceId,
    payerName: cleanText(payer.name, MAX_NAME_LENGTH),
    raw,
  };
}

/**
 * Reads the relay's request body. The relay is trusted to be who it says it is
 * (the signature was already checked), but not to be bug-free: every field is
 * validated and bounded here, and a record that is not a clean incoming payment
 * is dropped instead of stored.
 */
export function parseRelayBody(text: string, now: number): ParseResult {
  if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) return { ok: false, reason: "too_large" };

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false, reason: "not_json" };
  }
  if (!isRecord(body)) return { ok: false, reason: "not_an_object" };

  const records = body.records === undefined ? [] : body.records;
  if (!Array.isArray(records)) return { ok: false, reason: "records_not_a_list" };
  if (records.length > MAX_RECORDS) return { ok: false, reason: "too_many_records" };

  const transfers: IncomingTransfer[] = [];
  const seen = new Set<string>();
  let skipped = 0;
  for (const record of records) {
    const transfer = toTransfer(record, now);
    if (!transfer || seen.has(transfer.transactionId)) {
      skipped += 1;
      continue;
    }
    seen.add(transfer.transactionId);
    transfers.push(transfer);
  }

  return {
    ok: true,
    value: { transfers, skipped, error: cleanText(body.error, MAX_ERROR_LENGTH) },
  };
}
