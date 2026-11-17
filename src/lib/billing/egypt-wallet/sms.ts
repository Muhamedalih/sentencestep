import { MAX_SMS_CHARS } from "./constants";
import { normalizeEgyptPhone, toAsciiDigits } from "./phone";

/** A Vodafone Cash "money received" message, read into its facts. */
export interface ParsedTransfer {
  /** Vodafone's operation number, kept as text so a leading zero is never lost. */
  transactionId: string;
  amountPiasters: number;
  balancePiasters: number | null;
  payerPhone: string | null;
  payerName: string | null;
  walletNumber: string | null;
  /** The time written in the message (Cairo time) as an instant; null when the message has none we can read. */
  receivedAt: string | null;
}

export type ParsedMessage =
  | { kind: "transfer"; transfer: ParsedTransfer }
  /** Not a readable incoming transfer. `looksLikeTransfer` is true when it still smells like money (an admin should look). */
  | { kind: "other"; looksLikeTransfer: boolean };

/** "215.00" or "1,215.5" as piasters (21500, 121550); null for anything that is not a plain amount. */
export function parseAmountPiasters(text: string): number | null {
  const cleaned = toAsciiDigits(text).replace(/,/g, "").trim();
  const match = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) return null;
  const pounds = Number(match[1]);
  const piasters = match[2] ? Number(match[2].padEnd(2, "0")) : 0;
  return pounds * 100 + piasters;
}

/** Offset of Africa/Cairo from UTC at that instant, in milliseconds (Egypt moves its clocks in summer). */
function cairoOffsetMs(utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(new Date(utcMs));
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asIfUtc = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
    value("second"),
  );
  return asIfUtc - Math.floor(utcMs / 1000) * 1000;
}

/** A wall-clock time in Cairo as an ISO instant; null when it is not a real date. */
export function cairoLocalToIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const first = guess - cairoOffsetMs(guess);
  const utc = guess - cairoOffsetMs(first);
  const date = new Date(utc);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** "13:05 26-11-17" is 13:05 on 17 November 2026 (hour:minute year-month-day). */
function parseMessageTime(text: string): string | null {
  const match = /(\d{1,2}):(\d{2})\s+(\d{2})-(\d{2})-(\d{2})(?!\d)/.exec(text);
  if (!match) return null;
  return cairoLocalToIso(
    2000 + Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[1]),
    Number(match[2]),
  );
}

function cleanName(raw: string | undefined): string | null {
  if (!raw) return null;
  const name = raw
    .replace(/[.؛;]+$/u, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return name === "" ? null : name;
}

const MONEY_WORDS = /(?:جنيه|ج\.?\s?م|egp)/i;
const TRANSFER_WORDS = /(?:استلام|استلمت|تحويل|received|transfer)/i;

/**
 * Reads one text message from the shop wallet's phone. Only the Vodafone Cash "تم استلام مبلغ ..."
 * message is a transfer, and only when it carries an amount and Vodafone's operation number, because
 * the operation number is what stops one transfer from ever being paid twice. Every other message
 * (offers, balance notices, money sent out) is "other": stored for reading, never acted on.
 *
 * The message looks like:
 *   تم استلام مبلغ 215.00 جنيه من 01120395164؛ المسجل بإسم <name> على رقم محفظتك 01093958598
 *   بتاريخ 13:05 26-11-17. رصيدك الحالي: 299.87 جنيه رقم العملية: 025878179077
 * Each fact is read next to its own label, so the balance is never mistaken for the amount.
 */
export function parseSms(rawText: string): ParsedMessage {
  const text = toAsciiDigits(rawText.slice(0, MAX_SMS_CHARS));
  const looksLikeTransfer = MONEY_WORDS.test(text) && TRANSFER_WORDS.test(text);

  if (!/تم\s+استلام\s+مبلغ/u.test(text)) return { kind: "other", looksLikeTransfer };

  const amountMatch = /استلام\s+مبلغ\s+([\d.,]+)\s*(?:جنيه|ج\.?\s?م|egp)/iu.exec(text);
  const transactionMatch = /رقم\s+العملية\s*[:：]?\s*(\d{6,20})/u.exec(text);
  const amountPiasters = amountMatch ? parseAmountPiasters(amountMatch[1]!) : null;
  if (amountPiasters === null || amountPiasters <= 0 || !transactionMatch) {
    return { kind: "other", looksLikeTransfer: true };
  }

  const payerMatch = /(?:جنيه|ج\.?\s?م|egp)\s+من\s+(\+?[\d][\d\s-]{8,16})/iu.exec(text);
  const walletMatch = /محفظتك\s+(\+?[\d][\d\s-]{8,16})/u.exec(text);
  const nameMatch = /(?:بإسم|باسم|بأسم)\s+([^\n\r]+?)(?=\s+على\s+رقم|\s*[\n\r]|$)/u.exec(text);
  const balanceMatch = /رصيدك\s+الحالي\s*[:：]?\s*([\d.,]+)/u.exec(text);

  return {
    kind: "transfer",
    transfer: {
      transactionId: transactionMatch[1]!,
      amountPiasters,
      balancePiasters: balanceMatch
        ? parseAmountPiasters(balanceMatch[1]!.replace(/\.$/, ""))
        : null,
      payerPhone: payerMatch ? normalizeEgyptPhone(payerMatch[1]!) : null,
      payerName: cleanName(nameMatch?.[1]),
      walletNumber: walletMatch ? normalizeEgyptPhone(walletMatch[1]!) : null,
      receivedAt: parseMessageTime(text),
    },
  };
}
