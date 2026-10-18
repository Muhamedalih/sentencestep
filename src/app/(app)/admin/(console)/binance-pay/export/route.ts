import { requireAdmin } from "@/lib/admin/access";
import { getLedgerRows } from "@/lib/admin/binance-pay-queries";
import { buildLedgerCsv } from "@/lib/billing/binance/ledger";

// The ledger is read per request and never cached: it is the shop's record of money received.
export const dynamic = "force-dynamic";

/**
 * GET /admin/binance-pay/export — the sales ledger as a CSV: one line per
 * Binance Pay payment that activated an order. Admin only, checked here as well
 * as by the middleware, because a route handler is not covered by the admin layout.
 */
export async function GET(): Promise<Response> {
  const forbidden = await requireAdmin();
  if (forbidden) return new Response("Forbidden", { status: 403 });

  try {
    const csv = buildLedgerCsv(await getLedgerRows());
    const day = new Date().toISOString().slice(0, 10);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="binance-pay-ledger-${day}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[binance] ledger export failed", error);
    return new Response("Couldn't build the ledger.", { status: 500 });
  }
}
