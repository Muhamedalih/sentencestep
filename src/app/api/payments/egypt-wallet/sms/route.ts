import { NextResponse } from "next/server";

import { MAX_BODY_BYTES } from "@/lib/billing/egypt-wallet/constants";
import { readBodyCapped } from "@/lib/security/read-body";
import { getEgyptWalletDeps } from "@/lib/billing/egypt-wallet/deps";
import { handleSms } from "@/lib/billing/egypt-wallet/ingest";
import type { SmsDeps } from "@/lib/billing/egypt-wallet/ingest";

// Answers the forwarding app per request: never cached, never prerendered.
export const dynamic = "force-dynamic";

/**
 * POST /api/payments/egypt-wallet/sms — the app on the Vodafone Cash wallet's phone hands over each
 * text message it receives. handleSms checks the shared secret before it reads, stores or matches
 * anything. 501s honestly while EGYPT_WALLET_SECRET is not set.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let deps: SmsDeps | null;
  try {
    deps = getEgyptWalletDeps();
  } catch (error) {
    console.error("[egypt-wallet] sms: payment storage is not configured", error);
    return NextResponse.json({ error: "Payment storage is not configured." }, { status: 501 });
  }
  if (!deps) {
    return NextResponse.json({ error: "Vodafone Cash is not configured yet." }, { status: 501 });
  }

  // A body larger than the cap is refused, whether it announces its size or arrives in chunks: this
  // address is open to the internet before the secret is checked.
  const text = await readBodyCapped(request, MAX_BODY_BYTES);
  if (text === null) return NextResponse.json({ error: "too_large" }, { status: 413 });

  const { status, body } = await handleSms(deps, {
    body: text,
    headers: request.headers,
  });
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
