import type { Database } from "@/types/database";

export type PaymentOrder = Database["public"]["Tables"]["payment_orders"]["Row"];
export type PaymentOrderInsert = Database["public"]["Tables"]["payment_orders"]["Insert"];
export type PaymentOrderStatus = PaymentOrder["status"];

/** The only columns payment code may change after an order is inserted; the rest is an immutable snapshot. */
export type PaymentOrderPatch = Partial<
  Pick<
    PaymentOrderInsert,
    | "status"
    | "provider_status"
    | "failure_reason"
    | "last_verified_at"
    | "provider_payment_id"
    | "checkout_url"
    | "link_expires_at"
  >
>;

export type FulfillPaymentResult =
  Database["public"]["Functions"]["fulfill_payment_order"]["Returns"];
