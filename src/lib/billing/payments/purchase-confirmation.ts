import { withinTime } from "@/lib/admin/alert-admins";
import { sendTemplateEmail } from "@/lib/email/send";
import { premiumPurchasedEmail } from "@/lib/email/templates/premium-purchased";
import { getSiteUrl } from "@/lib/site-url";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

import type { FulfilledEvent } from "./fulfillment";

/** The webhook and the payment page both wait for this, so a slow email provider must not hold either for long. */
const EMAIL_DEADLINE_MS = 4_000;

/**
 * Emails the learner the receipt for a payment that has just been confirmed.
 * Called once per order (see FulfillmentDeps.onFulfilled), best effort: a
 * missing address, an unconfigured email provider or a failed send is logged
 * and never affects the payment or the learner's Premium.
 */
export async function sendPurchaseConfirmation({
  order,
  premiumUntil,
}: FulfilledEvent): Promise<void> {
  try {
    const { data } = await createServiceRoleClient().auth.admin.getUserById(order.user_id);
    const address = data.user?.email;
    if (!address) return;

    const content = premiumPurchasedEmail({
      origin: getSiteUrl(),
      days: order.premium_days,
      premiumUntil,
      priceUsdCents: order.price_usd_cents,
      reference: order.reference_id,
    });
    await withinTime(sendTemplateEmail(address, content), EMAIL_DEADLINE_MS);
  } catch (error) {
    console.error("[payments] purchase confirmation email failed", error);
  }
}
