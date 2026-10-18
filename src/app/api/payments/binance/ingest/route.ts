import { NextResponse } from "next/server";

import { handleIngest } from "@/lib/billing/binance/ingest";
import type { RelayDeps } from "@/lib/billing/binance/ingest";
import { getRelayDeps } from "@/lib/billing/binance/relay-deps";
import { MAX_BODY_BYTES } from "@/lib/billing/binance/records";

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

  // A request that announces a huge body is refused before any of it is read.
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  const { status, body } = await handleIngest(deps, {
    body: await request.text(),
    headers: request.headers,
  });
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
