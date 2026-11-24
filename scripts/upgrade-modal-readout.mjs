// Read-only before/after readout of the upgrade funnel around the day the upgrade pop-up
// (permission upgradeModal) was opened to everyone. Counts are per UTC day, admins excluded.
//
//   node --env-file=.env.local scripts/upgrade-modal-readout.mjs [openedAt] [daysBefore]
//
// openedAt defaults to 2026-11-24T16:01:09Z (the moment the permission was saved as "Everyone").
// The day it was opened is left out of both windows; "before" is the daysBefore full days (default
// 14) before it, "after" is every full day since. What each column means:
//   paywall    a lock page was shown (PAYWALL_VIEWED): a visitor opened a locked lesson's own page
//   viewPage   the plans page was loaded (UPGRADE_VIEWED without surface)
//   viewModal  the pop-up was opened (UPGRADE_VIEWED with surface "modal")
//   payClicks  the pay button was pressed with a plan chosen (UPGRADE_CTA_CLICKED)
//   orders     payment orders opened; paid = orders that were fulfilled
// The pop-up replaces PAYWALL_VIEWED + plans page for a press on a locked card, so judge it by
// payClicks and paid per day, and by payClicks per 100 "upgrade views" (viewPage + viewModal).
// Other changes that land on the same days (emails, traffic surges) move these numbers too.

const base = process.env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !key)
  throw new Error("run with --env-file=.env.local");
const headers = { apikey: key, Authorization: "Bearer " + key };
const openedAt = new Date(process.argv[2] ?? "2026-11-24T16:01:09Z");
const daysBefore = Number(process.argv[3] ?? 14);

async function count(path) {
  const response = await fetch(base + path, {
    headers: { ...headers, Prefer: "count=exact", Range: "0-0" },
  });
  if (!response.ok) throw new Error(`${path} ${response.status}`);
  return Number((response.headers.get("content-range") ?? "").split("/")[1]);
}

const admins = (
  await (await fetch(base + "profiles?select=id&role=eq.admin", { headers })).json()
).map((row) => row.id);
const notAdmin = admins.length ? `&or=(user_id.is.null,user_id.not.in.(${admins.join(",")}))` : "";

const midnight = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};
const openDay = midnight(openedAt);
const today = midnight(new Date());
const dayMs = 864e5;
const days = [];
for (let t = openDay.getTime() - daysBefore * dayMs; t < today.getTime(); t += dayMs) {
  days.push(new Date(t));
}

const rows = [];
for (const day of days) {
  const from = day.toISOString();
  const to = new Date(day.getTime() + dayMs).toISOString();
  const window = `&created_at=gte.${from}&created_at=lt.${to}${notAdmin}`;
  const event = (name, extra = "") =>
    count(`analytics_events?select=id&event_name=eq.${name}${window}${extra}`);
  const [paywall, viewPage, viewModal, payClicks, orders, paid] = await Promise.all([
    event("PAYWALL_VIEWED"),
    event("UPGRADE_VIEWED", "&event_properties->>surface=is.null"),
    event("UPGRADE_VIEWED", "&event_properties->>surface=eq.modal"),
    event("UPGRADE_CTA_CLICKED"),
    count(`payment_orders?select=id${window}`),
    count(`payment_orders?select=id&status=eq.fulfilled${window}`),
  ]);
  const phase =
    day.getTime() < openDay.getTime()
      ? "before"
      : day.getTime() === openDay.getTime()
        ? "opened"
        : "after";
  rows.push({
    day: from.slice(0, 10),
    phase,
    paywall,
    viewPage,
    viewModal,
    payClicks,
    orders,
    paid,
  });
}

const cols = ["paywall", "viewPage", "viewModal", "payClicks", "orders", "paid"];
console.log(["day".padEnd(11), "phase".padEnd(7), ...cols.map((c) => c.padStart(9))].join(" "));
for (const r of rows) {
  console.log(
    [r.day.padEnd(11), r.phase.padEnd(7), ...cols.map((c) => String(r[c]).padStart(9))].join(" "),
  );
}

const mean = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0);
const median = (list) => {
  if (!list.length) return 0;
  const s = [...list].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
for (const phase of ["before", "after"]) {
  const part = rows.filter((r) => r.phase === phase);
  if (!part.length) {
    console.log(`\n${phase}: no full days yet`);
    continue;
  }
  const views = part.reduce((s, r) => s + r.viewPage + r.viewModal, 0);
  const clicks = part.reduce((s, r) => s + r.payClicks, 0);
  console.log(`\n${phase} (${part.length} full days)`);
  for (const c of cols) {
    console.log(
      `  ${c.padEnd(10)} mean/day ${mean(part.map((r) => r[c]))
        .toFixed(1)
        .padStart(7)}   median/day ${String(median(part.map((r) => r[c]))).padStart(6)}`,
    );
  }
  console.log(
    `  payClicks per 100 upgrade views: ${views ? ((clicks / views) * 100).toFixed(1) : "n/a"}`,
  );
}
