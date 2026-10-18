// Shared fakes for the Binance Pay tests. Nothing here touches a database or the network.

import type { PaymentOrderStatus } from "@/lib/billing/payments/types";

import type { MatchableOrder } from "./matching";
import type { IncomingTransfer } from "./records";
import { DEFAULT_BINANCE_PAY_SETTINGS } from "./settings";
import type { BinancePaySettings } from "./settings";
import type {
  BinancePayStore,
  IntentOrder,
  LinkResultName,
  PaymentState,
  RelayState,
  StoredTransfer,
} from "./store";

export const NOW = Date.parse("2026-10-18T12:00:00.000Z");
export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;

export function iso(offsetMs: number): string {
  return new Date(NOW + offsetMs).toISOString();
}

export function makeTransfer(overrides: Partial<IncomingTransfer> = {}): IncomingTransfer {
  return {
    transactionId: "TX_0001",
    transactedAt: iso(-2 * MINUTE),
    amount: "6.00000000",
    currency: "USDT",
    orderType: "C2C",
    note: "SS-7K3Q2",
    payerBinanceId: "987654321",
    payerName: "Sara A.",
    raw: {},
    ...overrides,
  };
}

interface FakeOrder {
  id: string;
  /** Who opened the order; the tests that do not care about it leave it as the default. */
  userId: string;
  referenceId: string;
  status: PaymentOrderStatus;
  chargeAmount: number;
  createdAt: string;
  orderCode: string | null;
}

interface FakeTransfer {
  id: string;
  transfer: IncomingTransfer;
  status: "new" | "linked" | "ignored";
  linkedOrderId: string | null;
  notifiedAt: string | null;
}

/** An in-memory stand-in for the Binance Pay tables; linkTransfer mirrors the semantics of link_binance_transaction. */
export class InMemoryBinancePayStore implements BinancePayStore {
  settings: BinancePaySettings = {
    ...DEFAULT_BINANCE_PAY_SETTINGS,
    binanceId: "1239354913",
    displayName: "User-f65e4",
  };
  orders = new Map<string, FakeOrder>();
  transfers: FakeTransfer[] = [];
  relay: RelayState = { lastPollAt: null, lastSuccessAt: null, lastError: null, lastErrorAt: null };
  takenCodes = new Set<string>();
  /** Set to make the next call to the named method throw, to simulate an outage. */
  failNext: string | null = null;

  addOrder(overrides: Partial<FakeOrder> = {}): FakeOrder {
    const order: FakeOrder = {
      id: `order-${this.orders.size + 1}`,
      userId: "user-1",
      referenceId: `ss_ref${this.orders.size + 1}`,
      status: "pending",
      chargeAmount: 6,
      createdAt: iso(-10 * MINUTE),
      orderCode: "SS-7K3Q2",
      ...overrides,
    };
    this.orders.set(order.id, order);
    if (order.orderCode) this.takenCodes.add(order.orderCode);
    return order;
  }

  private maybeFail(method: string) {
    if (this.failNext === method) {
      this.failNext = null;
      throw new Error(`simulated outage in ${method}`);
    }
  }

  async getSettings() {
    return this.settings;
  }

  async saveSettings(settings: BinancePaySettings) {
    this.settings = settings;
  }

  async getOrderForIntent(referenceId: string): Promise<IntentOrder | null> {
    const order = [...this.orders.values()].find(
      (candidate) => candidate.referenceId === referenceId,
    );
    return order
      ? {
          id: order.id,
          status: order.status,
          createdAt: order.createdAt,
          chargeAmount: order.chargeAmount,
        }
      : null;
  }

  async insertIntent(input: { orderId: string; orderCode: string; expiresAt: string }) {
    const order = this.orders.get(input.orderId);
    if (order?.orderCode) return "order_has_intent" as const;
    if (this.takenCodes.has(input.orderCode)) return "code_taken" as const;
    this.takenCodes.add(input.orderCode);
    if (order) order.orderCode = input.orderCode;
    return "ok" as const;
  }

  async getIntentCode(orderId: string) {
    return this.orders.get(orderId)?.orderCode ?? null;
  }

  async listPaymentStates(referenceIds: string[]): Promise<PaymentState[]> {
    this.maybeFail("listPaymentStates");
    return [...this.orders.values()]
      .filter((order) => referenceIds.includes(order.referenceId) && order.orderCode)
      .map((order) => {
        const transfer = this.transfers.find((row) => row.linkedOrderId === order.id);
        return {
          referenceId: order.referenceId,
          orderCode: order.orderCode!,
          chargeAmount: order.chargeAmount,
          linked: transfer
            ? {
                transactionId: transfer.transfer.transactionId,
                transactedAt: transfer.transfer.transactedAt,
              }
            : null,
        };
      });
  }

  async countOrdersSince(since: Date) {
    return [...this.orders.values()].filter(
      (order) => Date.parse(order.createdAt) >= since.getTime(),
    ).length;
  }

  async countUserOrdersSince(userId: string, since: Date) {
    return [...this.orders.values()].filter(
      (order) => order.userId === userId && Date.parse(order.createdAt) >= since.getTime(),
    ).length;
  }

  async countActiveOrders(_providerEnv: "live" | "test", now: Date) {
    return [...this.orders.values()].filter(
      (order) =>
        (order.status === "created" || order.status === "pending") &&
        Date.parse(order.createdAt) + 70 * MINUTE > now.getTime() - 10 * MINUTE,
    ).length;
  }

  async insertTransfers(transfers: IncomingTransfer[]) {
    this.maybeFail("insertTransfers");
    let inserted = 0;
    for (const transfer of transfers) {
      if (this.transfers.some((row) => row.transfer.transactionId === transfer.transactionId))
        continue;
      this.transfers.push({
        id: `transfer-${this.transfers.length + 1}`,
        transfer,
        status: "new",
        linkedOrderId: null,
        notifiedAt: null,
      });
      inserted += 1;
    }
    return inserted;
  }

  async listUnlinkedSince(since: Date, limit: number): Promise<StoredTransfer[]> {
    return this.transfers
      .filter(
        (row) => row.status === "new" && Date.parse(row.transfer.transactedAt) >= since.getTime(),
      )
      .slice(0, limit)
      .map((row) => ({ id: row.id, transfer: row.transfer, notifiedAt: row.notifiedAt }));
  }

  async getTransferById(transferId: string) {
    const row = this.transfers.find((candidate) => candidate.id === transferId);
    return row
      ? { id: row.id, transfer: row.transfer, notifiedAt: row.notifiedAt, status: row.status }
      : null;
  }

  async getOrderById(orderId: string): Promise<MatchableOrder | null> {
    const order = this.orders.get(orderId);
    return order && order.orderCode
      ? {
          orderId: order.id,
          referenceId: order.referenceId,
          orderCode: order.orderCode,
          status: order.status,
          chargeAmount: order.chargeAmount,
          createdAt: order.createdAt,
        }
      : null;
  }

  async findOrdersByCodes(codes: string[]) {
    const found = new Map<string, MatchableOrder>();
    for (const order of this.orders.values()) {
      if (order.orderCode && codes.includes(order.orderCode)) {
        found.set(order.orderCode, {
          orderId: order.id,
          referenceId: order.referenceId,
          orderCode: order.orderCode,
          status: order.status,
          chargeAmount: order.chargeAmount,
          createdAt: order.createdAt,
        });
      }
    }
    return found;
  }

  async listOpenOrders(since: Date, limit: number) {
    return [...this.orders.values()]
      .filter(
        (order) =>
          order.orderCode &&
          ["created", "pending", "expired"].includes(order.status) &&
          Date.parse(order.createdAt) >= since.getTime(),
      )
      .slice(0, limit)
      .map((order) => ({
        orderId: order.id,
        referenceId: order.referenceId,
        orderCode: order.orderCode!,
        status: order.status,
        chargeAmount: order.chargeAmount,
        createdAt: order.createdAt,
      }));
  }

  async linkTransfer(input: {
    transferId: string;
    orderId: string;
    method: "note_code" | "manual";
    reason: string;
  }): Promise<LinkResultName> {
    this.maybeFail("linkTransfer");
    const transfer = this.transfers.find((row) => row.id === input.transferId);
    if (!transfer) return "transfer_not_found";
    if (transfer.status === "linked") {
      return transfer.linkedOrderId === input.orderId
        ? "already_linked_here"
        : "transfer_already_linked";
    }
    const order = this.orders.get(input.orderId);
    if (!order) return "order_not_found";
    if (order.status === "fulfilled") return "order_already_paid";
    if (this.transfers.some((row) => row.linkedOrderId === input.orderId)) {
      return "order_already_has_transfer";
    }
    transfer.status = "linked";
    transfer.linkedOrderId = input.orderId;
    return "linked";
  }

  async markNotified(transferId: string, now: Date) {
    const transfer = this.transfers.find((row) => row.id === transferId);
    if (transfer) transfer.notifiedAt = now.toISOString();
  }

  async ignoreTransfer(transferId: string) {
    const transfer = this.transfers.find((row) => row.id === transferId);
    if (transfer && transfer.status === "new") transfer.status = "ignored";
  }

  async getRelayState() {
    return this.relay;
  }

  async recordRelay(
    update: { polled?: boolean; success?: boolean; error?: string | null },
    now: Date,
  ) {
    if (update.polled) this.relay.lastPollAt = now.toISOString();
    if (update.success) {
      this.relay.lastSuccessAt = now.toISOString();
      this.relay.lastError = null;
      this.relay.lastErrorAt = null;
    }
    if (update.error) {
      this.relay.lastError = update.error;
      this.relay.lastErrorAt = now.toISOString();
    }
  }
}
