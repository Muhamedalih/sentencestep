import { NextResponse } from "next/server";

import { getPaymentRuntime, toWebhookDeps } from "@/lib/billing/payments/runtime";
import type { PaymentRuntime } from "@/lib/billing/payments/runtime";
import { handleProviderWebhook } from "@/lib/billing/payments/webhook-handler";

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
  return NextResponse.json(body, { status });
}
