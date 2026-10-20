import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ATTRIBUTION_COOKIE } from "@/lib/analytics/attribution";
import { handleVisit } from "@/lib/billing/binance/visit-service";
import { getVisitDeps } from "@/lib/billing/binance/visit-store";
import { MAX_VISIT_BODY_BYTES } from "@/lib/billing/binance/visits";

// Answers a signed-in learner's browser per request: never cached, never prerendered.
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * POST /api/payments/binance/visit — the Binance Pay payment page's browser code
 * reporting that the instructions opened, and later that they are still in
 * front of the learner (see src/components/billing/binance-visit.ts). It is
 * telemetry for the admin page only: the payment never depends on it, so any
 * failure is answered quietly. The learner is whoever the session cookie says;
 * handleVisit scopes everything to them.
 */
export async function POST(request: Request): Promise<NextResponse> {
  // A visit report is a few hundred bytes: a request that announces more is refused before it is read.
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_VISIT_BODY_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 413, headers: NO_STORE });
  }

  let body: unknown = null;
  try {
    const text = await request.text();
    if (text.length <= MAX_VISIT_BODY_BYTES) body = JSON.parse(text);
  } catch {
    body = null;
  }

  let deps;
  try {
    deps = getVisitDeps();
  } catch (error) {
    console.error("[binance] visit: storage is not configured", error);
    return new NextResponse(null, { status: 503, headers: NO_STORE });
  }

  const result = await handleVisit(deps, {
    body,
    headers: request.headers,
    firstTouchCookie: (await cookies()).get(ATTRIBUTION_COOKIE)?.value ?? null,
  });

  if (result.status === 200) {
    return NextResponse.json(result.body, { status: 200, headers: NO_STORE });
  }
  return new NextResponse(null, { status: result.status, headers: NO_STORE });
}
