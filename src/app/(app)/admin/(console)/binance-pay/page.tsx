import type { Metadata } from "next";
import Link from "next/link";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import {
  BinancePaySettingsForm,
  CloseOrderButton,
  IgnoreTransferButton,
  LinkTransferButton,
} from "@/components/admin/binance-pay-forms";
import { Badge } from "@/components/ui/badge";
import { getBinancePayOverview } from "@/lib/admin/binance-pay-queries";
import type { AdminSuggestion } from "@/lib/admin/binance-pay-queries";
import { RELAY_OFFLINE_AFTER_MS } from "@/lib/billing/binance/constants";
import { SKIP_REASON_TEXT } from "@/lib/billing/binance/matching";
import { isBinancePayConfigured } from "@/lib/billing/provider-registry";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Binance Pay",
};

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Baghdad",
  });
}

function secondsAgo(iso: string | null, now: number): string {
  if (!iso) return "never";
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (seconds < 90) return `${seconds} s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 90) return `${minutes} min ago`;
  return `${Math.round(minutes / 60)} h ago`;
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

const FEATURE_BADGE = {
  off: { label: "Off: nobody sees the button", variant: "muted" },
  admin: { label: "Admin preview: only admins see the button", variant: "secondary" },
  on: { label: "On: everyone sees the button", variant: "success" },
} as const;

function SuggestionLine({ suggestion }: { suggestion: AdminSuggestion }) {
  return (
    <span className="text-xs">
      <span className="font-medium tabular-nums">{suggestion.orderCode}</span>
      <span className="text-muted-foreground">
        {" "}
        · {suggestion.chargeAmount} USDT ·{" "}
        {suggestion.blockedBy
          ? `note names it, but: ${SKIP_REASON_TEXT[suggestion.blockedBy]}`
          : suggestion.basis === "code"
            ? "the note names it"
            : "amount and timing fit"}
      </span>
    </span>
  );
}

export default async function AdminBinancePayPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const overview = await getBinancePayOverview();
  const { settings, relay, waiting, unlinked, recent, stats } = overview;
  const now = Date.now();
  const relayOnline =
    relay.lastPollAt !== null && now - Date.parse(relay.lastPollAt) < RELAY_OFFLINE_AFTER_MS;
  const feature = FEATURE_BADGE[overview.featureState];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Binance Pay</h1>
        <p className="text-muted-foreground mt-1">
          Learners send USDT to your Binance account and write an order code in the note. The relay
          (a small server in Frankfurt) reads your Pay history and this page shows what it found. A
          transfer with the right code and enough USDT activates Premium by itself; anything else
          waits here for you.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={feature.variant}>{feature.label}</Badge>
        <Link href="/admin/features" className="text-primary text-sm underline underline-offset-2">
          Change on the Features page
        </Link>
        <Badge
          variant={relayOnline ? "success" : "muted"}
          className={relayOnline ? "" : "bg-danger/15 text-danger border-transparent"}
        >
          {relayOnline ? "Relay online" : "Relay offline"} · last asked{" "}
          {secondsAgo(relay.lastPollAt, now)} · last Binance read{" "}
          {secondsAgo(relay.lastSuccessAt, now)}
        </Badge>
        {!isBinancePayConfigured() && (
          <Badge variant="muted" className="bg-danger/15 text-danger border-transparent">
            BINANCE_RELAY_SECRET is not set on this server
          </Badge>
        )}
      </div>
      {relay.lastError && (
        <p className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          The relay could not read Binance {secondsAgo(relay.lastErrorAt, now)}: {relay.lastError}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Orders waiting" value={String(waiting.length)} />
        <Tile
          label="Unlinked transfers"
          value={String(unlinked.length)}
          hint="Waiting for you below"
        />
        <Tile
          label="Activated, 24 h"
          value={String(stats.activatedLast24h)}
          hint={`${stats.ordersLast24h} of ${settings.dailyOrderCap} orders used`}
        />
        <Tile
          label="Activated, 7 days"
          value={String(stats.activatedLast7d)}
          hint={`${stats.usdtLast7d} USDT received`}
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Incoming transfers waiting for you</h2>
        <p className="text-muted-foreground text-sm">
          Not linked by themselves. Link one to the right order, or ignore it if it is not a
          learner&apos;s (a friend sending money, for example).
        </p>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-left text-xs font-medium tracking-wide uppercase">
              <tr>
                <th className="px-4 py-3">Time (Baghdad)</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">From</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">Why it waits</th>
                <th className="px-4 py-3">Link to</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {unlinked.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-muted-foreground px-4 py-8 text-center">
                    Nothing is waiting.
                  </td>
                </tr>
              ) : (
                unlinked.map((transfer) => (
                  <tr key={transfer.id} className="align-top">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDate(transfer.transactedAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                      {Number(transfer.amount)} {transfer.currency}
                      <span className="text-muted-foreground block text-xs">
                        {transfer.orderType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {transfer.payerName ?? "—"}
                      {transfer.payerBinanceId && (
                        <span className="text-muted-foreground block text-xs tabular-nums">
                          ID {transfer.payerBinanceId}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 break-words">{transfer.note ?? "—"}</td>
                    <td className="text-muted-foreground px-4 py-3 text-xs">{transfer.reason}</td>
                    <td className="px-4 py-3">
                      {transfer.suggestions.length === 0 ? (
                        <span className="text-muted-foreground text-xs">No open order fits</span>
                      ) : (
                        <ul className="flex flex-col gap-2">
                          {transfer.suggestions.map((suggestion) => (
                            <li key={suggestion.orderId} className="flex flex-col gap-1">
                              <SuggestionLine suggestion={suggestion} />
                              <LinkTransferButton
                                transferId={transfer.id}
                                orderId={suggestion.orderId}
                                label="Link and activate"
                              />
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <IgnoreTransferButton transferId={transfer.id} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Orders waiting for their transfer</h2>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-left text-xs font-medium tracking-wide uppercase">
              <tr>
                <th className="px-4 py-3">Created (Baghdad)</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Learner</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {waiting.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted-foreground px-4 py-8 text-center">
                    No order is waiting.
                  </td>
                </tr>
              ) : (
                waiting.map((order) => {
                  const open =
                    order.status !== "expired" &&
                    (order.expiresAt === null || Date.parse(order.expiresAt) > now);
                  return (
                    <tr key={order.id}>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3 font-medium tabular-nums">
                        {order.orderCode ?? "—"}
                      </td>
                      <td className="px-4 py-3">{order.email ?? "(deleted account)"}</td>
                      <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                        {order.premiumDays} days · {order.chargeAmount} USDT
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={open ? "secondary" : "outline"}>
                          {open ? "Waiting" : "Past its hour (a late transfer still counts)"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <CloseOrderButton orderId={order.id} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Recently activated</h2>
          {/* A file download from a route handler, not a page: a plain link is what a download needs. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/admin/binance-pay/export"
            className="text-primary text-sm underline underline-offset-2"
          >
            Download the sales ledger (CSV)
          </a>
        </div>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-left text-xs font-medium tracking-wide uppercase">
              <tr>
                <th className="px-4 py-3">Transfer (Baghdad)</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Order code</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Linked by</th>
                <th className="px-4 py-3">Binance transfer id</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted-foreground px-4 py-8 text-center">
                    Nothing yet.
                  </td>
                </tr>
              ) : (
                recent.map((row) => (
                  <tr key={row.transactionId}>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(row.transactedAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">{row.amount} USDT</td>
                    <td className="px-4 py-3 font-medium tabular-nums">{row.orderCode ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {row.premiumDays ? `${row.premiumDays} days` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {row.linkMethod === "manual" ? "An admin" : "The order code"}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-xs tabular-nums">
                      {row.transactionId}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Settings</h2>
        <BinancePaySettingsForm settings={settings} />
      </section>
    </div>
  );
}
