import { NextResponse } from "next/server";

import { getPaymentRuntime, toWebhookDeps } from "@/lib/billing/payments/runtime";
import type { PaymentRuntime } from "@/lib/billing/payments/runtime";
import { recordWebhookAttempt } from "@/lib/billing/payments/webhook-attempts";
import { handleProviderWebhook } from "@/lib/billing/payments/webhook-handler";
import { summarizeWaylWebhookAttempt } from "@/lib/billing/providers/wayl-diagnostics";

/**
 * Where the configured payment provider's webhooks land
 * (/api/billing/webhook/wayl). 501s honestly — never fakes verification —
 * when no provider is configured. All the actual decisions live in
 * handleProviderWebhook: the signature is checked against the exact raw
 * bytes, and a webhook alone never grants premium (see that file).
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ provider: string }> },
): Promise<NextResponse> {
  const { provider: providerName } = await context.params;

  let runtime: PaymentRuntime | null;
  try {
    runtime = getPaymentRuntime();
  } catch (error) {
    console.error("[payments] webhook: payment storage is not configured", error);
    return NextResponse.json({ error: "Payment storage is not configured." }, { status: 501 });
  }

  if (!runtime) {
    return NextResponse.json({ error: "No payment provider is configured yet." }, { status: 501 });
  }
  if (runtime.provider.name !== providerName) {
    return NextResponse.json({ error: "Unknown payment provider." }, { status: 404 });
  }

  const rawBody = new Uint8Array(await request.arrayBuffer());
  const { status, body } = await handleProviderWebhook(
    toWebhookDeps(runtime),
    rawBody,
    request.headers,
  );
  if (status >= 400) console.warn("[payments] webhook not accepted", { providerName, status });

  // Temporary, test mode only, and unable to change the response: keep a
  // summary of what was delivered so a missing or rejected webhook can be
  // explained. Removed together with /api/billing/test-status.
  if (runtime.provider.environment === "test" && providerName === "wayl") {
    try {
      await recordWebhookAttempt(
        summarizeWaylWebhookAttempt({
          status,
          rawBody,
          headers: request.headers,
          secret: process.env.WAYL_WEBHOOK_SECRET ?? "",
        }),
      );
    } catch (error) {
      console.error("[payments] webhook diagnostics failed", error);
    }
  }

  return NextResponse.json(body, { status });
}
