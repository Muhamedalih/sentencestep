/**
 * Read-only readout of the hybrid offers (the taste of the day and the moments): the treatment and
 * the control of the share side by side, over one window. The control is the learners the share
 * left out (on the Permissions page the share of "everyone" keeps the rest on today's screens), and
 * both arms live in the same days, so a change in the calendar hits both.
 *
 * Counts per active learner (signed in, admins left out, anything recorded in the window): the lock
 * screens they met, the upgrade page, the pay button, the paid orders per 1,000, and the moments
 * shown, tapped and closed. The mockup's bar: upgrade page and pay button about 30% above the
 * control, paid orders not lower, the return on day 7 not down by more than a point (the day-7 return
 * is read elsewhere, so it is not in this table).
 *
 * Nothing is written. Run with:
 *   npx tsx --env-file=.env.local scripts/hybrid-offers-readout.ts --since 2026-11-03T00:00:00Z --share 90
 * Optional: --until <ISO time> to close the window, --out <file.md> to save the table as Markdown.
 */

import { writeFileSync } from "node:fs";

import { all, arg, readAdminIds } from "./_readout-rest";
import { perThousand, summarizeArms } from "../src/lib/hybrid/readout";
import type { ArmSummary, ReadoutEvent } from "../src/lib/hybrid/readout";

const since = arg("--since");
const until = arg("--until");
const share = Number(arg("--share") ?? "90");
const out = arg("--out");

if (!since || !Number.isFinite(share) || share < 0 || share > 100) {
  console.error(
    "Pass --since <ISO time the offers went to learners> and --share <percent, 0-100>.",
  );
  process.exit(1);
}

interface EventRow {
  user_id: string;
  event_name: string;
  event_properties: { moment?: "B" | "D" | "star" } | null;
}
interface OrderRow {
  user_id: string;
}

const window = `created_at=gte.${encodeURIComponent(since)}${
  until ? `&created_at=lt.${encodeURIComponent(until)}` : ""
}`;
const events = await all<EventRow>(
  `analytics_events?select=user_id,event_name,event_properties&user_id=not.is.null&${window}`,
);
const orders = await all<OrderRow>(
  `payment_orders?select=user_id&status=eq.fulfilled&created_at=gte.${encodeURIComponent(since)}${
    until ? `&created_at=lt.${encodeURIComponent(until)}` : ""
  }`,
);
const admins = await readAdminIds();

const readoutEvents: ReadoutEvent[] = events.map((row) => ({
  userId: row.user_id,
  name: row.event_name,
  moment: row.event_properties?.moment,
}));
const summary = summarizeArms({
  events: readoutEvents,
  paidUserIds: orders.map((row) => row.user_id),
  share,
  excluded: admins,
});

const rows: [string, (arm: ArmSummary) => string][] = [
  ["Active learners", (arm) => String(arm.active)],
  ["Saw a lock screen, per active", (arm) => `${perThousand(arm.paywallSeen, arm.active) / 10}%`],
  [
    "Opened the upgrade page, per active",
    (arm) => `${perThousand(arm.upgradeViewed, arm.active) / 10}%`,
  ],
  ["Pressed pay, per active", (arm) => `${perThousand(arm.payPressed, arm.active) / 10}%`],
  ["Paid orders per 1,000 active", (arm) => String(perThousand(arm.paid, arm.active))],
  ["Learners shown a moment", (arm) => String(arm.offerLearners)],
  ["Moments shown", (arm) => String(arm.offersShown)],
  ["Moments tapped", (arm) => String(arm.offerClicks)],
  ["Moments closed", (arm) => String(arm.offerDismissals)],
];
const header = `| Measure | Treatment (${share}%) | Control (${100 - share}%) |`;
const lines = [
  header,
  "| --- | --- | --- |",
  ...rows.map(
    ([label, value]) => `| ${label} | ${value(summary.treatment)} | ${value(summary.control)} |`,
  ),
];
const text = [
  `Window: from ${since}${until ? ` to ${until}` : " until now"}. Admins left out: ${admins.size}.`,
  "",
  ...lines,
  "",
  "Read it against the bar in the header comment; a window with no control learners reads zeros.",
].join("\n");

console.log(text);
if (out) writeFileSync(out, `${text}\n`);
