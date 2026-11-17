import { EGYPT_WALLET_CURRENCY, EGYPT_WALLET_PROVIDER } from "@/lib/billing/egypt-wallet/constants";
import type { EgyptWalletStore, PaymentState } from "@/lib/billing/egypt-wallet/store";
import { InvalidWebhookSignatureError, PaymentProviderError } from "@/lib/billing/payment-provider";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  ProviderPayment,
} from "@/lib/billing/payment-provider";

export interface VodafoneCashConfig {
  environment: "live" | "test";
  /** Called when the database is first needed, so building the provider connects to nothing. */
  store: () => EgyptWalletStore;
  now?: () => Date;
}

/** The id lists sent to the database stay short enough for any URL limit. */
const BATCH_SIZE = 50;
const DEFAULT_EXPIRY_MS = 60 * 60 * 1000;

/** "1h", "30m" (the form CreatePaymentInput carries); anything else is the default hour. */
function expiryMs(expiresIn: string): number {
  const match = /^(\d{1,3})([mh])$/.exec(expiresIn.trim());
  if (!match) return DEFAULT_EXPIRY_MS;
  return Number(match[1]) * (match[2] === "h" ? 60 : 1) * 60 * 1000;
}

/** The provider's own id for an order's payment: ours, derived from the order's unique reference. */
export function vodafoneCashPaymentId(referenceId: string): string {
  return `vc_${referenceId}`;
}

function toProviderPayment(state: PaymentState): ProviderPayment {
  return {
    referenceId: state.referenceId,
    providerPaymentId: vodafoneCashPaymentId(state.referenceId),
    // A linked message was already judged by the matching rules (right sender, right amount, in time),
    // so the order's own price is what was paid; fulfillment re-checks it against the order's snapshot.
    status: state.linked ? "paid" : "pending",
    rawStatus: state.linked ? "message_linked" : "awaiting_transfer",
    amount: state.chargeAmount,
    currency: EGYPT_WALLET_CURRENCY,
    paidAt: state.linked ? new Date(state.linked.receivedAt).toISOString() : null,
  };
}

/**
 * Vodafone Cash adapter for the PaymentProvider boundary (see payment-provider.ts). There is no
 * hosted payment page and no webhook from a payment company: "creating a payment" opens the order's
 * intent and points the learner at our own page (/billing/egypt/<reference>), and "asking the
 * provider" reads our own database, where /api/payments/egypt-wallet/sms has stored the transfer
 * messages. Granting Premium still goes through verifyAndFulfill like every other payment: nothing
 * here can grant anything by itself.
 */
export function createVodafoneCashProvider(config: VodafoneCashConfig): PaymentProvider {
  const now = config.now ?? (() => new Date());

  return {
    name: EGYPT_WALLET_PROVIDER,
    environment: config.environment,
    settlementCurrency: EGYPT_WALLET_CURRENCY,

    async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
      const store = config.store();
      const order = await store.getOrderForIntent(input.referenceId);
      if (!order) {
        throw new PaymentProviderError("Vodafone Cash: the order to pay for was not found.", {
          retryable: false,
        });
      }
      const expiresAt = new Date(now().getTime() + expiryMs(input.expiresIn)).toISOString();
      await store.insertIntent({ orderId: order.id, expiresAt });

      return {
        providerPaymentId: vodafoneCashPaymentId(input.referenceId),
        checkoutUrl: `${new URL(input.redirectUrl).origin}/billing/egypt/${encodeURIComponent(
          input.referenceId,
        )}`,
      };
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
        "Vodafone Cash sends no webhooks: transfer messages arrive from the shop wallet's phone.",
      );
    },
  };
}
