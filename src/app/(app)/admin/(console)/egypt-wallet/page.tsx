import type { Metadata } from "next";
import Link from "next/link";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import {
  CloseOrderButton,
  IgnoreMessageButton,
  LinkMessageButton,
} from "@/components/admin/egypt-wallet-forms";
import {
  AutomaticRateButton,
  RefreshRateButton,
  SetRateForm,
} from "@/components/admin/egypt-wallet-rate-forms";
import { Badge } from "@/components/ui/badge";
import { getEgyptWalletOverview } from "@/lib/admin/egypt-wallet-queries";
import { effectiveRate } from "@/lib/billing/egypt-wallet/rate";
import { PLANS } from "@/lib/billing/plans";
import { quotePrice } from "@/lib/billing/pricing";
import { isEgyptWalletConfigured } from "@/lib/billing/provider-registry";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Vodafone Cash",
};

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Baghdad",
  });
}

function ago(iso: string | null, now: number): string {
  if (!iso) return "never";
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (seconds < 90) return `${seconds} s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 90) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
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

const STATUS_BADGE = {
  linked: { label: "Linked", variant: "success" },
  new: { label: "Not linked", variant: "secondary" },
  ignored: { label: "Ignored", variant: "muted" },
} as const;

const METHOD_LABEL = {
  phone: "by the sender's number",
  reference: "by the operation number",
  manual: "by an admin",
} as const;

/** A learner who said they paid and has waited this long with no matching transfer is flagged red (the admins are also e-mailed and pushed). */
const CLAIM_RED_AFTER_MS = 10 * 60 * 1000;

export default async function AdminEgyptWalletPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const { settings, lastMessageAt, waiting, transfers, unreadable, stats } =
    await getEgyptWalletOverview();
  const now = Date.now();
  const rate = effectiveRate(settings);
  const unanswered = waiting.filter(
    (order) =>
      order.claimedPaidAt !== null && now - Date.parse(order.claimedPaidAt) >= CLAIM_RED_AFTER_MS,
  );
  const suspicious = unreadable.filter((message) => message.looksLikeTransfer);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Vodafone Cash</h1>
        <p className="text-muted-foreground mt-1">
          Learners in Egypt write the Vodafone Cash number they will send from, then send the
          plan&apos;s price in whole pounds to your wallet. Vodafone texts the wallet&apos;s phone;
          an app on that phone hands each text to the site. A transfer from the number a learner
          wrote, for that price, activates Premium by itself; anything else waits here for you.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          Wallet{" "}
          <bdi dir="ltr" className="tabular-nums">
            {settings.walletNumber || "not set"}
          </bdi>
        </Badge>
        <Badge variant="muted">Last text from the phone: {ago(lastMessageAt, now)}</Badge>
        <Link
          href="/admin/permissions"
          className="text-primary text-sm underline underline-offset-2"
        >
          Who sees it: Permissions
        </Link>
        <Link
          href="/admin/egypt-wallet/export"
          className="text-primary text-sm underline underline-offset-2"
        >
          Download every transfer (CSV)
        </Link>
        {!isEgyptWalletConfigured() && (
          <Badge variant="muted" className="bg-danger/15 text-danger border-transparent">
            EGYPT_WALLET_SECRET is not set on this server
          </Badge>
        )}
      </div>
      {settings.walletNumber === "" && (
        <p className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          No wallet number is set, so the option cannot be offered.
        </p>
      )}
      {unanswered.length > 0 && (
        <p className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          {unanswered.length} learner(s) say they sent the money but no matching transfer text has
          arrived (see the red rows below). Check that the wallet&apos;s phone is on and online with
          the forwarding app running; the text is forwarded when the phone is back. If they sent
          from another number or another amount, link their transfer by hand.
        </p>
      )}
      {suspicious.length > 0 && (
        <p className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          {suspicious.length} text(s) about money could not be read (listed at the bottom). If one
          is a payment, the reader needs updating.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Tile
          label="Subscribers"
          value={String(stats.subscribers)}
          hint="Activated by Vodafone Cash"
        />
        <Tile
          label="Received"
          value={`${stats.receivedPounds} EGP`}
          hint="From those subscribers"
        />
        <Tile
          label="Last 7 days"
          value={String(stats.subscribersLast7d)}
          hint={`${stats.receivedLast7dPounds} EGP`}
        />
        <Tile
          label="Last 24 hours"
          value={String(stats.subscribersLast24h)}
          hint={`${stats.ordersLast24h} of ${settings.dailyOrderCap} orders opened`}
        />
        <Tile
          label="Not linked"
          value={String(stats.unmatched)}
          hint={stats.unmatched > 0 ? "Waiting for you below" : "Nothing waiting"}
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Dollar rate</h2>
        <p className="text-muted-foreground text-sm">
          Prices in pounds follow the day&apos;s rate, read once a day and rounded to the nearest
          whole pound. An order keeps the price it was opened at.
        </p>
        <div className="flex flex-col gap-3 rounded-xl border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl font-semibold tabular-nums">{rate.rate} EGP</span>
            <span className="text-muted-foreground text-sm">per USD</span>
            <Badge variant={settings.rateLocked ? "secondary" : "success"}>
              {settings.rateLocked ? "Set by hand" : "Automatic"}
            </Badge>
            <span className="text-muted-foreground text-xs">
              {rate.updatedAt
                ? `from ${rate.source}, ${ago(rate.updatedAt, now)}`
                : "no reading yet: the built-in fallback is in use"}
            </span>
          </div>
          <p className="text-sm tabular-nums">
            {PLANS.map(
              (plan) =>
                `${plan.days} days = ${quotePrice("A", "EGP", plan.id, 0, { ratePerUsd: rate.rate }).amount} EGP`,
            ).join("  ·  ")}
          </p>
          <div className="flex flex-wrap items-start gap-4">
            {settings.rateLocked ? <AutomaticRateButton /> : <RefreshRateButton />}
            <SetRateForm current={rate.rate} />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Orders waiting for a transfer</h2>
        {waiting.length === 0 ? (
          <div className="text-muted-foreground rounded-xl border border-dashed px-4 py-8 text-center text-sm">
            No order is waiting.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground bg-muted/50 text-xs uppercase">
                <tr>
                  <th className="px-3 py-2 font-medium">Opened</th>
                  <th className="px-3 py-2 font-medium">Learner</th>
                  <th className="px-3 py-2 font-medium">Price</th>
                  <th className="px-3 py-2 font-medium">Sends from</th>
                  <th className="px-3 py-2 font-medium">State</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {waiting.map((order) => (
                  <tr key={order.orderId} className="border-t align-top">
                    <td className="px-3 py-2 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                    <td className="px-3 py-2">{order.email ?? "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                      {order.chargeAmount} EGP · {order.premiumDays} days
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {order.payerPhone ?? (
                        <span className="text-muted-foreground">number not written yet</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {order.claimedPaidAt ? (
                        <span
                          className={
                            now - Date.parse(order.claimedPaidAt) >= CLAIM_RED_AFTER_MS
                              ? "text-danger font-medium"
                              : "font-medium"
                          }
                        >
                          Says they paid {ago(order.claimedPaidAt, now)}: no transfer yet
                        </span>
                      ) : order.status === "expired" ? (
                        "Past its hour (a late transfer still counts)"
                      ) : (
                        "Waiting"
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <CloseOrderButton orderId={order.orderId} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Every transfer received</h2>
        <p className="text-muted-foreground text-sm">
          Newest first. Each line is one text from Vodafone, read exactly as it arrived: the amount,
          who sent it, Vodafone&apos;s operation number, and your balance after it. Where a transfer
          activated Premium you see the learner and the plan.
        </p>
        {transfers.length === 0 ? (
          <div className="text-muted-foreground rounded-xl border border-dashed px-4 py-8 text-center text-sm">
            No transfer has arrived yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground bg-muted/50 text-xs uppercase">
                <tr>
                  <th className="px-3 py-2 font-medium">Time</th>
                  <th className="px-3 py-2 font-medium">Amount</th>
                  <th className="px-3 py-2 font-medium">From</th>
                  <th className="px-3 py-2 font-medium">Operation</th>
                  <th className="px-3 py-2 font-medium">Balance</th>
                  <th className="px-3 py-2 font-medium">What happened</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {transfers.map((transfer) => {
                  const badge = STATUS_BADGE[transfer.status];
                  return (
                    <tr key={transfer.id} className="border-t align-top">
                      <td className="px-3 py-2 whitespace-nowrap">
                        {formatDate(transfer.receivedAt)}
                      </td>
                      <td className="px-3 py-2 font-medium whitespace-nowrap tabular-nums">
                        {transfer.amount} EGP
                      </td>
                      <td className="px-3 py-2">
                        <span className="tabular-nums">{transfer.payerPhone ?? "—"}</span>
                        {transfer.payerName && (
                          <span className="text-muted-foreground block text-xs" dir="auto">
                            {transfer.payerName}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums">{transfer.transactionId}</td>
                      <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                        {transfer.balance ? `${transfer.balance} EGP` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                        {transfer.status === "linked" && (
                          <span className="mt-1 block text-xs">
                            {transfer.email ?? "a learner"}
                            {transfer.premiumDays !== null && ` · ${transfer.premiumDays} days`}
                            {transfer.linkMethod && (
                              <span className="text-muted-foreground">
                                {" "}
                                · {METHOD_LABEL[transfer.linkMethod]}
                              </span>
                            )}
                            {transfer.orderStatus && transfer.orderStatus !== "fulfilled" && (
                              <span className="text-danger">
                                {" "}
                                · order is {transfer.orderStatus}
                              </span>
                            )}
                          </span>
                        )}
                        {transfer.status === "new" && transfer.reason && (
                          <span className="text-muted-foreground mt-1 block text-xs">
                            {transfer.reason}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {transfer.status === "new" && (
                          <div className="flex flex-col gap-1.5">
                            {transfer.suggestions.map((suggestion) => (
                              <LinkMessageButton
                                key={suggestion.orderId}
                                messageId={transfer.id}
                                orderId={suggestion.orderId}
                                label={`Link to ${suggestion.email ?? suggestion.referenceId} (${suggestion.chargeAmount} EGP)`}
                              />
                            ))}
                            <IgnoreMessageButton messageId={transfer.id} />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Unread messages</h2>
        <p className="text-muted-foreground text-sm">
          Texts from the phone that are not a readable incoming transfer: offers, money you sent
          out, or a transfer in a shape the reader does not know. Nothing here ever activates
          anything.
        </p>
        {unreadable.length === 0 ? (
          <div className="text-muted-foreground rounded-xl border border-dashed px-4 py-8 text-center text-sm">
            None.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {unreadable.map((message) => (
              <li
                key={message.id}
                className={
                  message.looksLikeTransfer
                    ? "border-danger/40 bg-danger/5 rounded-xl border p-3"
                    : "rounded-xl border p-3"
                }
              >
                <p className="text-muted-foreground text-xs">
                  {formatDate(message.seenAt)}
                  {message.sender && ` · from ${message.sender}`}
                  {message.looksLikeTransfer && " · looks like a transfer"}
                </p>
                <p dir="auto" className="mt-1 text-sm whitespace-pre-wrap">
                  {message.rawText}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
