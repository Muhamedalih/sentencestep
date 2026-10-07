// Shared fakes for the payments tests. Nothing here touches a database or the network.

import type {
  CreatePaymentResult,
  PaymentProvider,
  ProviderPayment,
} from "@/lib/billing/payment-provider";

import type { FulfillOrderArgs, PaymentAlert } from "./fulfillment";
import type { PaymentStore } from "./store";
import type {
  FulfillPaymentResult,
  PaymentOrder,
  PaymentOrderInsert,
  PaymentOrderPatch,
} from "./types";

export const NOW = Date.parse("2026-10-04T12:00:00.000Z");
export const MINUTE = 60_000;

export function iso(offsetMs: number): string {
  return new Date(NOW + offsetMs).toISOString();
}

export function makeOrder(overrides: Partial<PaymentOrder> = {}): PaymentOrder {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    user_id: "user-1",
    reference_id: "ss_abc",
    provider: "wayl",
    provider_env: "test",
    provider_payment_id: "link_1",
    pricing_tier: "B",
    pricing_country: null,
    pricing_country_source: "default",
    price_usd_cents: 300,
    fx_rate_per_usd: 1320,
    charge_amount: 3960,
    charge_currency: "IQD",
    premium_days: 30,
    status: "pending",
    provider_status: null,
    checkout_url: "https://pay.example.com/link_1",
    link_expires_at: iso(30 * MINUTE),
    paid_at: null,
    fulfilled_at: null,
    premium_period_start: null,
    premium_period_end: null,
    failure_reason: null,
    last_verified_at: null,
    created_at: iso(-30 * MINUTE),
    updated_at: iso(-30 * MINUTE),
    ...overrides,
  };
}

export function makePayment(overrides: Partial<ProviderPayment> = {}): ProviderPayment {
  return {
    referenceId: "ss_abc",
    providerPaymentId: "link_1",
    status: "paid",
    rawStatus: "Complete",
    amount: 3960,
    currency: "IQD",
    paidAt: iso(-1 * MINUTE),
    ...overrides,
  };
}

export interface FakeProvider extends PaymentProvider {
  /** What the provider's API currently reports; set it to an Error to simulate an outage. */
  payment: ProviderPayment | null | Error;
  /** What a batch lookup returns, or an Error to simulate an outage. */
  batch: ProviderPayment[] | Error;
  getPaymentCalls: string[];
  getPaymentsCalls: string[][];
  created: Parameters<PaymentProvider["createPayment"]>[0][];
}

export function makeFakeProvider(
  options: {
    payment?: ProviderPayment | null | Error;
    environment?: "live" | "test";
    settlementCurrency?: string;
    createResult?: CreatePaymentResult | Error;
  } = {},
): FakeProvider {
  const provider: FakeProvider = {
    name: "wayl",
    environment: options.environment ?? "test",
    settlementCurrency: options.settlementCurrency ?? "IQD",
    payment: options.payment === undefined ? makePayment() : options.payment,
    batch: [],
    getPaymentCalls: [],
    getPaymentsCalls: [],
    created: [],
    async createPayment(input) {
      provider.created.push(input);
      const result = options.createResult ?? {
        providerPaymentId: "link_new",
        checkoutUrl: "https://pay.example.com/link_new",
      };
      if (result instanceof Error) throw result;
      return result;
    },
    async getPayment(referenceId) {
      provider.getPaymentCalls.push(referenceId);
      if (provider.payment instanceof Error) throw provider.payment;
      return provider.payment;
    },
    async getPayments(referenceIds) {
      provider.getPaymentsCalls.push(referenceIds);
      if (provider.batch instanceof Error) throw provider.batch;
      return provider.batch.filter((payment) => referenceIds.includes(payment.referenceId));
    },
    verifyWebhook() {
      throw new Error("not used");
    },
  };
  return provider;
}

/** In-memory stand-in for the database. fulfillOrder mirrors the semantics of the fulfill_payment_order SQL function. */
export class InMemoryPaymentStore implements PaymentStore {
  orders = new Map<string, PaymentOrder>();
  fulfillCalls: FulfillOrderArgs[] = [];
  premiumGrants: string[] = [];
  rpcOverride: FulfillPaymentResult | null = null;
  recentOrderCount = 0;
  reusable: PaymentOrder | null = null;
  inserted: PaymentOrderInsert[] = [];
  listQueries: {
    provider: string;
    providerEnv: "live" | "test";
    olderThan: Date;
    limit: number;
  }[] = [];

  constructor(orders: PaymentOrder[] = []) {
    for (const order of orders) this.orders.set(order.reference_id, order);
  }

  get(referenceId: string): PaymentOrder {
    const order = this.orders.get(referenceId);
    if (!order) throw new Error(`no order ${referenceId}`);
    return order;
  }

  async getOrderByReference(referenceId: string) {
    return this.orders.get(referenceId) ?? null;
  }

  async getOrderForUser(referenceId: string, userId: string) {
    const order = this.orders.get(referenceId);
    return order && order.user_id === userId ? order : null;
  }

  async getLatestOrderForUser() {
    return null;
  }

  async updateOrder(orderId: string, patch: PaymentOrderPatch) {
    for (const [reference, order] of this.orders) {
      if (order.id !== orderId) continue;
      if (order.status === "fulfilled") return;
      if (order.status === "needs_review" && patch.status !== "needs_review") return;
      this.orders.set(reference, { ...order, ...patch } as PaymentOrder);
    }
  }

  async fulfillOrder(args: FulfillOrderArgs): Promise<FulfillPaymentResult> {
    this.fulfillCalls.push(args);
    if (this.rpcOverride) return this.rpcOverride;

    const order = this.orders.get(args.referenceId);
    if (!order) return { result: "not_found" };
    if (order.status === "fulfilled") {
      return { result: "already_fulfilled", premium_period_end: order.premium_period_end };
    }
    if (order.status === "needs_review") return { result: "needs_review" };
    if (
      args.chargeAmount !== order.charge_amount ||
      args.chargeCurrency !== order.charge_currency ||
      (order.provider_payment_id && args.providerPaymentId !== order.provider_payment_id)
    ) {
      this.orders.set(args.referenceId, { ...order, status: "needs_review" });
      return { result: "mismatch" };
    }

    const premiumEnd = iso(30 * 24 * 60 * MINUTE);
    this.orders.set(args.referenceId, {
      ...order,
      status: "fulfilled",
      paid_at: args.paidAt,
      fulfilled_at: iso(0),
      premium_period_end: premiumEnd,
    });
    this.premiumGrants.push(order.user_id);
    return { result: "fulfilled", premium_period_end: premiumEnd };
  }

  async findReusableOrder() {
    return this.reusable;
  }

  async countRecentOrders() {
    return this.recentOrderCount;
  }

  async insertOrder(order: PaymentOrderInsert) {
    this.inserted.push(order);
    const row = makeOrder({
      ...(order as Partial<PaymentOrder>),
      id: order.id ?? "generated-id",
      status: order.status ?? "created",
      provider_payment_id: null,
      checkout_url: null,
      link_expires_at: null,
      created_at: iso(0),
    });
    this.orders.set(row.reference_id, row);
    return row;
  }

  async listReconcilableOrders(query: {
    provider: string;
    providerEnv: "live" | "test";
    olderThan: Date;
    limit: number;
  }) {
    this.listQueries.push(query);
    return [...this.orders.values()]
      .filter((o) => o.status === "created" || o.status === "pending")
      .slice(0, query.limit);
  }
}

export function collectAlerts(): { alerts: PaymentAlert[]; report: (alert: PaymentAlert) => void } {
  const alerts: PaymentAlert[] = [];
  return { alerts, report: (alert) => alerts.push(alert) };
}
