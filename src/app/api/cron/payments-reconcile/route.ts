import { NextResponse } from "next/server";

import { checkRelayHealth } from "@/lib/billing/binance/health";
import { createBinancePayStore } from "@/lib/billing/binance/store";
import { getBinancePayRuntime, getPaymentRuntime } from "@/lib/billing/payments/runtime";
import type { PaymentRuntime } from "@/lib/billing/payments/runtime";
import { reconcileOpenOrders } from "@/lib/billing/payments/reconcile";
import { isValidCronAuth } from "@/lib/cron/auth";

/**
 * Settles payment orders whose webhook never arrived or whose learner never
 * came back to the site, by asking the provider about every open order (see
 * reconcileOpenOrders). Wayl's summary is returned as before (the same fields at
 * the top level); Binance Pay, when it is configured, is settled the same way
 * (its "provider" is our own database, so this closes orders that ran out of
 * time and fulfils one whose transfer was linked but not yet fulfilled) and its
 * relay is checked for being alive while someone is waiting. Mirrors the other
 * cron routes: same CRON_SECRET gate, same fail-closed 501 without it, same
 * GET+POST pair. Scheduled from .github/workflows/cron.yml.
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

  let runtime: PaymentRuntime | null;
  let binanceRuntime: PaymentRuntime | null;
  try {
    runtime = getPaymentRuntime();
    binanceRuntime = getBinancePayRuntime();
  } catch (error) {
    console.error("[payments] reconcile: payment storage is not configured", error);
    return NextResponse.json({ error: "Payment storage is not configured." }, { status: 501 });
  }
  if (!runtime && !binanceRuntime) {
    return NextResponse.json({ skipped: "No payment provider is configured." });
  }

  let failed = false;
  let summary: Record<string, unknown> = {};

  if (runtime) {
    try {
      summary = { ...(await reconcileOpenOrders(runtime)) };
    } catch (error) {
      console.error("[payments] reconcile failed", error);
      failed = true;
    }
  } else {
    summary = { skipped: "Wayl is not configured." };
  }

  if (binanceRuntime) {
    try {
      const binance = await reconcileOpenOrders(binanceRuntime);
      const relay = await checkRelayHealth({
        store: createBinancePayStore(),
        providerEnv: binanceRuntime.provider.environment,
        now: new Date(),
        report: binanceRuntime.report,
      });
      summary = { ...summary, binance: { ...binance, relay } };
    } catch (error) {
      console.error("[payments] Binance Pay reconcile failed", error);
      failed = true;
    }
  }

  if (failed) return NextResponse.json({ error: "Reconciliation failed." }, { status: 502 });
  return NextResponse.json(summary);
}

export async function GET(request: Request): Promise<NextResponse> {
  return handlePaymentsReconcileCron(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  return handlePaymentsReconcileCron(request);
}
