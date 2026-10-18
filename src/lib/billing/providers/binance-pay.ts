import { generateOrderCode } from "@/lib/billing/binance/codes";
import { BINANCE_PAY_CURRENCY, BINANCE_PAY_PROVIDER } from "@/lib/billing/binance/constants";
import type { BinancePayStore, PaymentState } from "@/lib/billing/binance/store";
import { InvalidWebhookSignatureError, PaymentProviderError } from "@/lib/billing/payment-provider";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  ProviderPayment,
} from "@/lib/billing/payment-provider";

export interface BinancePayConfig {
  environment: "live" | "test";
  /** Called when the database is first needed, so building the provider connects to nothing. */
  store: () => BinancePayStore;
  /** Draws an order code; replaceable in tests. */
  newCode?: () => string;
  now?: () => Date;
}

/** An order that keeps drawing a taken code gives up after this many tries (one in 28 million each, so it never happens in practice). */
const MAX_CODE_ATTEMPTS = 6;
/** The id lists sent to the database stay short enough for any URL limit. */
const BATCH_SIZE = 50;
const DEFAULT_EXPIRY_MS = 60 * 60 * 1000;

/** "1h", "30m" (the form CreatePaymentInput carries); anything else is the default hour. */
function expiryMs(expiresIn: string): number {
  const match = /^(\d{1,3})([mh])$/.exec(expiresIn.trim());
  if (!match) return DEFAULT_EXPIRY_MS;
  return Number(match[1]) * (match[2] === "h" ? 60 : 1) * 60 * 1000;
}

function toProviderPayment(state: PaymentState): ProviderPayment {
  return {
    referenceId: state.referenceId,
    // The order code is this provider's id for the payment, and is what fulfill_payment_order re-checks.
    providerPaymentId: state.orderCode,
    // A linked transfer was already judged by the matching rules (right coin, code, enough USDT), so
    // the order's own price is what was paid; fulfillment re-checks it against the order's snapshot.
    status: state.linked ? "paid" : "pending",
    rawStatus: state.linked ? "transfer_linked" : "awaiting_transfer",
    amount: state.chargeAmount,
    currency: BINANCE_PAY_CURRENCY,
    paidAt: state.linked ? new Date(state.linked.transactedAt).toISOString() : null,
  };
}

/**
 * Binance Pay adapter for the PaymentProvider boundary (see payment-provider.ts).
 * There is no hosted payment page and no webhook: "creating a payment" gives the
 * order a short code to write in the transfer's note and points the learner at
 * our own page (/billing/binance/<reference>), and "asking the provider" reads
 * our own database, where /api/payments/binance/ingest has stored the transfers
 * the relay found. Granting Premium still goes through verifyAndFulfill like
 * every other payment: nothing here can grant anything by itself.
 */
export function createBinancePayProvider(config: BinancePayConfig): PaymentProvider {
  const now = config.now ?? (() => new Date());
  const newCode = config.newCode ?? generateOrderCode;

  return {
    name: BINANCE_PAY_PROVIDER,
    environment: config.environment,
    settlementCurrency: BINANCE_PAY_CURRENCY,

    async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
      const store = config.store();
      const order = await store.getOrderForIntent(input.referenceId);
      if (!order) {
        throw new PaymentProviderError("Binance Pay: the order to pay for was not found.", {
          retryable: false,
        });
      }

      const checkoutUrl = `${new URL(input.redirectUrl).origin}/billing/binance/${encodeURIComponent(
        input.referenceId,
      )}`;
      const expiresAt = new Date(now().getTime() + expiryMs(input.expiresIn)).toISOString();

      for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
        const orderCode = newCode();
        const result = await store.insertIntent({ orderId: order.id, orderCode, expiresAt });
        if (result === "ok") return { providerPaymentId: orderCode, checkoutUrl };
        if (result === "order_has_intent") {
          // Asked twice for the same order: hand back the code it already has.
          const existing = await store.getIntentCode(order.id);
          if (existing) return { providerPaymentId: existing, checkoutUrl };
        }
      }
      throw new PaymentProviderError("Binance Pay could not give the order a free code.", {
        retryable: true,
      });
    },

    async getPayment(referenceId: string): Promise<ProviderPayment | null> {
      const [state] = await config.store().listPaymentStates([referenceId]);
      return state ? toProviderPayment(state) : null;
    },

    async getPayments(referenceIds: string[]): Promise<ProviderPayment[]> {
      const payments: ProviderPayment[] = [];
      for (let start = 0; start < referenceIds.length; start += BATCH_SIZE) {
        const states = await config
          .store()
          .listPaymentStates(referenceIds.slice(start, start + BATCH_SIZE));
        payments.push(...states.map(toProviderPayment));
      }
      return payments;
    },

    verifyWebhook() {
      throw new InvalidWebhookSignatureError(
        "Binance Pay sends no webhooks: transfers arrive from the relay.",
      );
    },
  };
}
