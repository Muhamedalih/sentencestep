import type { Metadata } from "next";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { Badge } from "@/components/ui/badge";
import { getPaymentsOverview, PAYMENTS_ORDER_SCAN_LIMIT } from "@/lib/admin/payments-queries";
import type { FunnelCounts, OrderStage } from "@/lib/billing/payments/funnel";
import { formatUsd } from "@/lib/billing/pricing";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Payments",
};

export const dynamic = "force-dynamic";

const STAGES: Record<
  OrderStage,
  { label: string; variant: "success" | "secondary" | "outline" | "muted"; className?: string }
> = {
  paid: { label: "Paid", variant: "success" },
  needs_review: {
    label: "Needs review",
    variant: "muted",
    className: "bg-danger/15 text-danger border-transparent",
  },
  link_failed: { label: "Link failed", variant: "muted" },
  waiting: { label: "Waiting", variant: "secondary" },
  left_at_payment: { label: "Left at payment", variant: "outline" },
  left_before_form: { label: "Left before form", variant: "outline" },
};

function percent(part: number, whole: number): string {
  return whole === 0 ? "—" : `${Math.round((part / whole) * 100)}%`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Baghdad",
  });
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border px-4 py-3">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>}
    </div>
  );
}

function Counts({ counts }: { counts: FunnelCounts }) {
  return (
    <>
      <td className="px-4 py-3 tabular-nums">{counts.links}</td>
      <td className="px-4 py-3 tabular-nums">
        {counts.reachedForm}{" "}
        <span className="text-muted-foreground">({percent(counts.reachedForm, counts.links)})</span>
      </td>
      <td className="px-4 py-3 tabular-nums">
        {counts.paid}{" "}
        <span className="text-muted-foreground">({percent(counts.paid, counts.reachedForm)})</span>
      </td>
      <td className="px-4 py-3 tabular-nums">{counts.waiting}</td>
      <td className="px-4 py-3 tabular-nums">{counts.left}</td>
    </>
  );
}

export default async function AdminPaymentsPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const { funnel, testerOrders, scanned, orders } = await getPaymentsOverview();
  const { totals } = funnel;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Payments</h1>
        <p className="text-muted-foreground mt-1">
          Where each learner who pressed Pay ended up. &quot;Reached the form&quot; means Wayl told
          us the learner submitted their details on its payment page. A waiting link is still inside
          its 70 minutes, so it is not a failure yet.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Links created" value={String(totals.links)} />
        <Tile
          label="Reached the form"
          value={String(totals.reachedForm)}
          hint={`${percent(totals.reachedForm, totals.links)} of links`}
        />
        <Tile
          label="Paid"
          value={String(totals.paid)}
          hint={`${percent(totals.paid, totals.reachedForm)} of those who reached the form`}
        />
        <Tile label="Still waiting" value={String(totals.waiting)} />
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-left text-xs font-medium tracking-wide uppercase">
            <tr>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Links</th>
              <th className="px-4 py-3">Reached form</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Waiting</th>
              <th className="px-4 py-3">Left</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {funnel.rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted-foreground px-4 py-8 text-center">
                  No payment links yet.
                </td>
              </tr>
            ) : (
              funnel.rows.map((row) => (
                <tr key={`${row.tier}-${row.country ?? "none"}`}>
                  <td className="px-4 py-3 font-medium">{row.tier}</td>
                  <td className="px-4 py-3 uppercase">{row.country ?? "unknown"}</td>
                  <Counts counts={row} />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-muted-foreground text-xs">
        {testerOrders > 0
          ? `${testerOrders} order${testerOrders === 1 ? "" : "s"} from the accounts listed in FREE_ACCESS_EXCLUDED_EMAILS (your test accounts) are left out of the numbers above and marked Test below.`
          : "To keep your own test orders out of these numbers, list your test accounts in FREE_ACCESS_EXCLUDED_EMAILS."}
        {totals.linkFailed > 0 &&
          ` ${totals.linkFailed} more never got a payment link (Wayl did not answer) and are not counted as links.`}
        {scanned >= PAYMENTS_ORDER_SCAN_LIMIT &&
          ` Only the newest ${PAYMENTS_ORDER_SCAN_LIMIT} orders are read.`}
      </p>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-left text-xs font-medium tracking-wide uppercase">
            <tr>
              <th className="px-4 py-3">Time (Baghdad)</th>
              <th className="px-4 py-3">Learner</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Where it ended</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Wayl status</th>
              <th className="px-4 py-3">Note</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-muted-foreground px-4 py-8 text-center">
                  Nothing yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const stage = STAGES[order.stage];
                return (
                  <tr key={order.id}>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      {order.email ?? "(deleted account)"}
                      {order.isTester && (
                        <Badge variant="outline" className="ms-2">
                          Test
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 uppercase">
                      {order.country ?? "—"}
                      <span className="text-muted-foreground ms-1 normal-case">({order.tier})</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {order.premiumDays} days · {formatUsd(order.usdCents)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={stage.variant} className={stage.className}>
                        {stage.label}
                      </Badge>
                      {order.stage === "waiting" && order.reachedForm && (
                        <span className="text-muted-foreground ms-2 text-xs">form sent</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{order.method ?? "—"}</td>
                    <td className="px-4 py-3">{order.providerStatus ?? "—"}</td>
                    <td className="text-muted-foreground px-4 py-3 text-xs">
                      {order.failureReason ?? ""}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
