/**
 * Read-only readout of the payments funnel: where payment orders end up by provider and by country,
 * and how many learners go from opening the plans page to pressing Pay to paying. It is the yardstick
 * for any change to how learners can pay (a new provider, a manual channel, a fixed card flow).
 *
 * Reads the live database through the service role (nothing is written). Only counts are printed: no
 * email, no account id, no order reference. Test-mode orders and the admin accounts are left out.
 * A country belongs to an order; the plans-page view and the Pay click carry no country, so that part
 * of the funnel is split by method and price tier only.
 *
 * Read the counts, not the shares, wherever a group is small. "paid % of settled" leaves out orders
 * still inside their link's window. The October baseline of the weak group (Egypt, Maghreb, Levant,
 * Sudan, Yemen) was 4 paid of 148 orders; Iraq about 22%.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/payments-funnel-readout.ts
 * Optional: --since <ISO> (default 30 days ago), --until <ISO> (default now; --since 2026-10-07T00:00:00Z
 * --until 2026-10-18T00:00:00Z reproduces the window of the first report), --min-orders 10 (a country with
 * fewer orders is folded into one "others" row).
 */

import {
  REGION_LABELS,
  countsRow,
  foldSmallCountries,
  isWeakRegion,
  regionOf,
  sumCounts,
  tallyOrders,
  upgradeFunnel,
  upgradeFunnelRows,
} from "../src/lib/billing/payments/funnel-readout";
import type {
  OrderCounts,
  ReadoutOrder,
  Region,
  UpgradeEvent,
} from "../src/lib/billing/payments/funnel-readout";
import { DAY_MS } from "../src/lib/readout/returns";
import { all, arg, readAdminIds } from "./_readout-rest";

const NOW = Date.now();

type OrderRow = ReadoutOrder & { provider_env: string };

function table(title: string, rows: Array<{ key: string } & OrderCounts>) {
  console.log(`\n${title}`);
  if (rows.length === 0) {
    console.log("(no orders)");
    return;
  }
  console.table(Object.fromEntries(rows.map(({ key, ...counts }) => [key, countsRow(counts)])));
}

async function main() {
  const sinceMs = arg("--since") ? Date.parse(arg("--since")!) : NOW - 30 * DAY_MS;
  if (Number.isNaN(sinceMs)) {
    console.error("--since must be an ISO time, e.g. --since 2026-10-07T00:00:00Z");
    process.exit(1);
  }
  const untilMs = arg("--until") ? Date.parse(arg("--until")!) : NOW;
  if (Number.isNaN(untilMs)) {
    console.error("--until must be an ISO time, e.g. --until 2026-10-18T00:00:00Z");
    process.exit(1);
  }
  const minOrders = Number(arg("--min-orders") ?? 10);
  const sinceIso = new Date(sinceMs).toISOString();
  const untilIso = new Date(untilMs).toISOString();
  const period = `created_at=gte.${sinceIso}&created_at=lt.${untilIso}`;

  const [orderRows, views, clicks, adminIds] = await Promise.all([
    all<OrderRow>(
      `payment_orders?select=user_id,reference_id,provider,provider_env,pricing_tier,pricing_country,price_usd_cents,status,provider_payment_id&${period}`,
    ),
    all<UpgradeEvent>(`analytics_events?select=user_id&event_name=eq.UPGRADE_VIEWED&${period}`),
    all<UpgradeEvent>(
      `analytics_events?select=user_id,event_properties&event_name=eq.UPGRADE_CTA_CLICKED&${period}`,
    ),
    readAdminIds(),
  ]);

  const live = orderRows.filter((row) => row.provider_env === "live");
  const orders = live.filter((row) => !adminIds.has(row.user_id));
  const learnerViews = views.filter((row) => !row.user_id || !adminIds.has(row.user_id));
  const learnerClicks = clicks.filter((row) => !row.user_id || !adminIds.has(row.user_id));

  console.log(
    `Payments from ${sinceIso} to ${untilIso}. Orders: ${orders.length} live from learners (left out: ${orderRows.length - live.length} test-mode, ${live.length - orders.length} from admin accounts).`,
  );

  const byProvider = tallyOrders(orders, (order) => order.provider);
  table("By provider (wayl = the card button; binance_pay = Binance Pay)", [
    ...byProvider,
    { key: "ALL", ...sumCounts(byProvider) },
  ]);

  const byRegion = tallyOrders(orders, (order) => regionOf(order.pricing_country));
  table("By region (all providers; * = the weak group)", [
    ...byRegion.map((row) => ({
      ...row,
      key: `${REGION_LABELS[row.key as Region]}${isWeakRegion(row.key as Region) ? " *" : ""}`,
    })),
    {
      key: "* weak group together",
      ...sumCounts(byRegion.filter((row) => isWeakRegion(row.key as Region))),
    },
  ]);

  table(
    "By region and provider",
    tallyOrders(
      orders,
      (order) => `${REGION_LABELS[regionOf(order.pricing_country)]} / ${order.provider}`,
    ),
  );

  table(
    `By country (countries with fewer than ${minOrders} orders are folded together)`,
    foldSmallCountries(
      tallyOrders(orders, (order) => order.pricing_country?.toUpperCase() ?? "unknown"),
      minOrders,
    ),
  );

  table(
    "By price tier (A = full price, B = the lower tier)",
    tallyOrders(orders, (order) => `tier ${order.pricing_tier}`),
  );

  // Learners, from the plans page to a payment.
  const funnel = upgradeFunnel({ views: learnerViews, clicks: learnerClicks, orders });
  console.log(
    `\nLearners from the plans page to a payment (distinct accounts; ${funnel.guestViews} further plans-page views by visitors without an account):`,
  );
  console.table(upgradeFunnelRows(funnel));
  console.log("Of those who pressed each Pay button:");
  console.table(funnel.byMethod);
  console.log("Learners who pressed Pay, by price tier:");
  console.table(funnel.clickedByTier);

  console.log(
    '\n"of the chain" counts learners who also did every step before it inside this period; "learners (period)" counts everyone who did that step. Method matching is by learner, not by time. The plans page carries no country, so the page-to-Pay step cannot be split by country.',
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
