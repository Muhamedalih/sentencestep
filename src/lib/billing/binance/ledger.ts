/**
 * The shop's sales ledger for Binance Pay: one line per payment that activated
 * an order, with the facts that let anyone (the shop's owner, an accountant, or
 * Binance itself, if it ever asks) follow the money from a learner's order to
 * the transfer that paid it. Built from what is stored, never from anything a
 * learner could edit.
 */

export interface LedgerRow {
  /** When the order was created. */
  orderCreatedAt: string;
  /** When the transfer reached the Binance account. */
  transferredAt: string;
  /** When the transfer was attached to the order. */
  linkedAt: string | null;
  orderReference: string;
  orderCode: string | null;
  premiumDays: number;
  priceUsdCents: number;
  amountUsdt: string;
  /** Binance's own id for the transfer. */
  transactionId: string;
  payerBinanceId: string | null;
  payerName: string | null;
  linkMethod: string | null;
  orderStatus: string;
  fulfilledAt: string | null;
}

export const LEDGER_COLUMNS: readonly { header: string; value: (row: LedgerRow) => string }[] = [
  { header: "order_created_at_utc", value: (row) => row.orderCreatedAt },
  { header: "transfer_time_utc", value: (row) => row.transferredAt },
  { header: "linked_at_utc", value: (row) => row.linkedAt ?? "" },
  { header: "order_reference", value: (row) => row.orderReference },
  { header: "order_code", value: (row) => row.orderCode ?? "" },
  { header: "premium_days", value: (row) => String(row.premiumDays) },
  { header: "price_usd", value: (row) => (row.priceUsdCents / 100).toFixed(2) },
  { header: "amount_usdt", value: (row) => row.amountUsdt },
  { header: "binance_transaction_id", value: (row) => row.transactionId },
  { header: "payer_binance_id", value: (row) => row.payerBinanceId ?? "" },
  { header: "payer_name", value: (row) => row.payerName ?? "" },
  { header: "link_method", value: (row) => row.linkMethod ?? "" },
  { header: "order_status", value: (row) => row.orderStatus },
  { header: "fulfilled_at_utc", value: (row) => row.fulfilledAt ?? "" },
];

/**
 * One CSV cell. Quoted when it holds a comma, quote or line break; and a cell
 * that starts with = + - or @ gets a leading apostrophe, because a spreadsheet
 * would otherwise run it as a formula (payer names are typed by strangers).
 */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function buildLedgerCsv(rows: readonly LedgerRow[]): string {
  const lines = [
    LEDGER_COLUMNS.map((column) => column.header).join(","),
    ...rows.map((row) => LEDGER_COLUMNS.map((column) => csvCell(column.value(row))).join(",")),
  ];
  // CRLF is what spreadsheets expect; the trailing newline closes the last row.
  return `${lines.join("\r\n")}\r\n`;
}
