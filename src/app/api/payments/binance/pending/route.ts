import { NextResponse } from "next/server";

import { handlePending } from "@/lib/billing/binance/ingest";
import { getRelayDeps } from "@/lib/billing/binance/relay-deps";
import type { RelayDeps } from "@/lib/billing/binance/ingest";

// Answers the relay per request: never cached, never prerendered.
export const dynamic = "force-dynamic";

/**
 * GET /api/payments/binance/pending — the relay (a small server outside the US
 * that reads the shop's Binance Pay history) asks whether to look at Binance now
 * and from when. Signed requests only: handlePending checks the signature before
 * it touches anything. 501s honestly while BINANCE_RELAY_SECRET is not set.
 */
export async function GET(request: Request): Promise<NextResponse> {
  let deps: RelayDeps | null;
  try {
    deps = getRelayDeps();
  } catch (error) {
    console.error("[binance] pending: payment storage is not configured", error);
    return NextResponse.json({ error: "Payment storage is not configured." }, { status: 501 });
  }
  if (!deps) {
    return NextResponse.json({ error: "Binance Pay is not configured yet." }, { status: 501 });
  }

  const { status, body } = await handlePending(deps, { headers: request.headers });
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
