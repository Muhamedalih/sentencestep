import { NextResponse } from "next/server";

import { handleIngest } from "@/lib/billing/binance/ingest";
import type { RelayDeps } from "@/lib/billing/binance/ingest";
import { getRelayDeps } from "@/lib/billing/binance/relay-deps";
import { MAX_BODY_BYTES } from "@/lib/billing/binance/records";
import { readBodyCapped } from "@/lib/security/read-body";

// Answers the relay per request: never cached, never prerendered.
export const dynamic = "force-dynamic";

/**
 * POST /api/payments/binance/ingest — the relay hands over the incoming Binance
 * Pay transfers it found. The body is read as exact text because the signature
 * covers it; handleIngest verifies that signature before it parses, stores or
 * matches anything. 501s honestly while BINANCE_RELAY_SECRET is not set.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let deps: RelayDeps | null;
  try {
    deps = getRelayDeps();
  } catch (error) {
    console.error("[binance] ingest: payment storage is not configured", error);
    return NextResponse.json({ error: "Payment storage is not configured." }, { status: 501 });
  }
  if (!deps) {
    return NextResponse.json({ error: "Binance Pay is not configured yet." }, { status: 501 });
  }

  // A body larger than the cap is refused, whether it announces its size or arrives in chunks: this
  // address is open to the internet before the signature is checked.
  const text = await readBodyCapped(request, MAX_BODY_BYTES);
  if (text === null) return NextResponse.json({ error: "too_large" }, { status: 413 });

  const { status, body } = await handleIngest(deps, {
    body: text,
    headers: request.headers,
  });
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
