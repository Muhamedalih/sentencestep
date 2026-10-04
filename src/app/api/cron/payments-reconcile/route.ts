import { NextResponse } from "next/server";

import { getPaymentRuntime } from "@/lib/billing/payments/runtime";
import { reconcileOpenOrders } from "@/lib/billing/payments/reconcile";
import { isValidCronAuth } from "@/lib/cron/auth";

/**
 * Settles payment orders whose webhook never arrived or whose learner never
 * came back to the site, by asking the provider about every open order (see
 * reconcileOpenOrders). Mirrors the other cron routes: same CRON_SECRET gate,
 * same fail-closed 501 without it, same GET+POST pair. Scheduled from
 * .github/workflows/cron.yml.
 */
async function handlePaymentsReconcileCron(request: Request): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 501 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (!isValidCronAuth(authHeader, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let runtime;
  try {
    runtime = getPaymentRuntime();
  } catch (error) {
    console.error("[payments] reconcile: payment storage is not configured", error);
    return NextResponse.json({ error: "Payment storage is not configured." }, { status: 501 });
  }
  if (!runtime) {
    return NextResponse.json({ skipped: "No payment provider is configured." });
  }

  try {
    return NextResponse.json(await reconcileOpenOrders(runtime));
  } catch (error) {
    console.error("[payments] reconcile failed", error);
    return NextResponse.json({ error: "Reconciliation failed." }, { status: 502 });
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  return handlePaymentsReconcileCron(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  return handlePaymentsReconcileCron(request);
}
