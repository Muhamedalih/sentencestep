/**
 * Read-only before/after numbers for the free-path change (see scripts/apply-free-path.ts):
 * did learners come back more, press upgrade more, rate more, and use the app more?
 *
 * Reads the live database through the service role (nothing is written) and prints, per UTC
 * day and per window, the same measures on both sides of the change: new learners and what
 * they did on their first day, how many came back the next day, daily active learners (and how
 * many of them were not new), lessons and sentences per active learner, the funnel from a lock
 * to a payment, and ratings. The change went live at the time given with --since.
 *
 * What it cannot see: time spent (the database has no durations — read "Active time spent" and
 * the daily_lessons_* events in Microsoft Clarity for the same dates) and learners who never
 * signed up (Clarity again).
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/measure-free-path.ts --since 2026-10-18T23:20:00Z
 * Optional: --days 12 (how many days to show), --hours 48 (length of the before and after windows).
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this.");
  process.exit(1);
}

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const sinceArg = arg("--since");
if (!sinceArg || Number.isNaN(Date.parse(sinceArg))) {
  console.error("Pass --since <ISO time the change went live>, e.g. --since 2026-10-18T23:20:00Z");
  process.exit(1);
}
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const T = Date.parse(sinceArg);
const NOW = Date.now();
const WINDOW_HOURS = Number(arg("--hours") ?? 48);
const SHOW_DAYS = Number(arg("--days") ?? 12);
const afterEnd = Math.min(NOW, T + WINDOW_HOURS * HOUR);
const beforeStart = T - WINDOW_HOURS * HOUR;
const dataStart = Date.parse(
  `${new Date(Math.min(beforeStart, T - 10 * DAY, NOW - SHOW_DAYS * DAY)).toISOString().slice(0, 10)}T00:00:00Z`,
);

type Row = Record<string, unknown>;

async function all<R = Row>(path: string): Promise<R[]> {
  const rows: R[] = [];
  for (let from = 0; ; from += 1000) {
    const response = await fetch(`${url}/rest/v1/${path}`, {
      headers: {
        apikey: serviceRoleKey!,
        Authorization: `Bearer ${serviceRoleKey}`,
        Range: `${from}-${from + 999}`,
        "Range-Unit": "items",
      },
    });
    if (!response.ok) {
      throw new Error(
        `${path.split("?")[0]}: ${response.status} ${(await response.text()).slice(0, 160)}`,
      );
    }
    const page = (await response.json()) as R[];
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

/** How many rows match, without reading them (the count comes back in the content-range header). */
async function countRows(path: string): Promise<number> {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: "HEAD",
    headers: {
      apikey: serviceRoleKey!,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "count=exact",
    },
  });
  if (!response.ok) throw new Error(`${path.split("?")[0]}: ${response.status}`);
  return Number(response.headers.get("content-range")?.split("/")[1] ?? 0);
}

const iso = (ms: number) => new Date(ms).toISOString();
const dayOf = (value: string | number) =>
  iso(typeof value === "number" ? value : Date.parse(value)).slice(0, 10);
const dayStart = (day: string) => Date.parse(`${day}T00:00:00Z`);
const pct = (part: number, whole: number) =>
  whole === 0 ? "-" : `${((100 * part) / whole).toFixed(1)}%`;
const ratio = (part: number, whole: number, digits = 2) =>
  whole === 0 ? "-" : (part / whole).toFixed(digits);

interface Profile {
  id: string;
  created_at: string;
}
interface Progress {
  user_id: string;
  completed_at: string;
}
interface Activity {
  user_id: string;
  day: string;
  sentences: number;
}
interface AppEvent {
  user_id: string | null;
  event_name: string;
  event_properties: { shape?: string } | null;
  created_at: string;
}
interface Order {
  user_id: string;
  status: string;
  created_at: string;
  paid_at: string | null;
}
type Shape = "gate" | "preview" | "milestone";
interface PassageRow {
  user_id: string;
  created_at: string;
  completed_at: string | null;
}
interface Rating {
  rating: number;
  user_type: string;
  created_at: string;
}

async function main() {
  const startIso = iso(dataStart);
  const startDay = dayOf(dataStart);
  const [profiles, progress, activity, events, orders, ratings, passagesStarted, passagesDone] =
    await Promise.all([
      all<Profile>(`profiles?select=id,created_at&role=eq.user&created_at=gte.${startIso}`),
      all<Progress>(`user_progress?select=user_id,completed_at&completed_at=gte.${startIso}`),
      all<Activity>(
        `activity_days?select=user_id,day,sentences&kind=eq.active&day=gte.${startDay}`,
      ),
      all<AppEvent>(
        `analytics_events?select=user_id,event_name,event_properties,created_at&event_name=in.(PAYWALL_VIEWED,UPGRADE_VIEWED,UPGRADE_CTA_CLICKED,FREE_PATH_REDIRECTED)&created_at=gte.${startIso}`,
      ),
      all<Order>(
        `payment_orders?select=user_id,status,created_at,paid_at&provider_env=eq.live&created_at=gte.${startIso}`,
      ),
      all<Rating>(`app_ratings?select=rating,user_type,created_at&created_at=gte.${startIso}`),
      all<PassageRow>(
        `passage_progress?select=user_id,created_at,completed_at&created_at=gte.${startIso}`,
      ),
      all<PassageRow>(
        `passage_progress?select=user_id,created_at,completed_at&completed_at=gte.${startIso}`,
      ),
    ]);

  // The profiles of everyone who signed up before the window are needed to tell new learners from returning ones.
  const everyoneActive = Array.from(new Set(activity.map((row) => row.user_id)));
  const knownCreated = new Map(profiles.map((p) => [p.id, Date.parse(p.created_at)]));
  const unknown = everyoneActive.filter((id) => !knownCreated.has(id));
  for (let i = 0; i < unknown.length; i += 150) {
    const chunk = unknown.slice(i, i + 150);
    const rows = await all<Profile>(`profiles?select=id,created_at&id=in.(${chunk.join(",")})`);
    for (const row of rows) knownCreated.set(row.id, Date.parse(row.created_at));
  }

  const activeByDay = new Map<string, Set<string>>();
  const sentencesByDay = new Map<string, number>();
  for (const row of activity) {
    if (!activeByDay.has(row.day)) activeByDay.set(row.day, new Set());
    activeByDay.get(row.day)!.add(row.user_id);
    sentencesByDay.set(row.day, (sentencesByDay.get(row.day) ?? 0) + row.sentences);
  }
  const completionsByUserDay = new Map<string, number>();
  const lessonsByDay = new Map<string, number>();
  for (const row of progress) {
    const day = dayOf(row.completed_at);
    lessonsByDay.set(day, (lessonsByDay.get(day) ?? 0) + 1);
    const key = `${row.user_id}|${day}`;
    completionsByUserDay.set(key, (completionsByUserDay.get(key) ?? 0) + 1);
  }

  const today = dayOf(NOW);
  const days: string[] = [];
  for (let ms = dayStart(dayOf(NOW - SHOW_DAYS * DAY)); ms <= NOW; ms += DAY) days.push(dayOf(ms));

  interface DayStats {
    signups: number;
    dayZeroLessons: number;
    twoPlusOnDayZero: number;
    cohortKnownNextDay: boolean;
    returnedNextDay: number;
    dau: number;
    returningDau: number;
    lessons: number;
    sentences: number;
    wallUsers: Record<Shape, Set<string>>;
    wallAnon: number;
    upgradeViewUsers: Set<string>;
    payPressedUsers: Set<string>;
    redirects: number;
    ordersCreated: number;
    paid: number;
    ratingCount: number;
    ratingSum: number;
    passagesStarted: number;
    passagesDone: number;
    wordsDone: number;
  }
  const empty = (): DayStats => ({
    signups: 0,
    dayZeroLessons: 0,
    twoPlusOnDayZero: 0,
    cohortKnownNextDay: false,
    returnedNextDay: 0,
    dau: 0,
    returningDau: 0,
    lessons: 0,
    sentences: 0,
    wallUsers: { gate: new Set(), preview: new Set(), milestone: new Set() },
    wallAnon: 0,
    upgradeViewUsers: new Set(),
    payPressedUsers: new Set(),
    redirects: 0,
    ordersCreated: 0,
    paid: 0,
    ratingCount: 0,
    ratingSum: 0,
    passagesStarted: 0,
    passagesDone: 0,
    wordsDone: 0,
  });
  const stats = new Map<string, DayStats>(days.map((day) => [day, empty()]));
  const at = (day: string) => stats.get(day);

  for (const profile of profiles) {
    const day = dayOf(profile.created_at);
    const s = at(day);
    if (!s) continue;
    s.signups += 1;
    const lessons = completionsByUserDay.get(`${profile.id}|${day}`) ?? 0;
    s.dayZeroLessons += lessons;
    if (lessons >= 2) s.twoPlusOnDayZero += 1;
    const next = dayOf(dayStart(day) + DAY);
    if (next < today) {
      s.cohortKnownNextDay = true;
      const back =
        activeByDay.get(next)?.has(profile.id) ||
        (completionsByUserDay.get(`${profile.id}|${next}`) ?? 0) > 0;
      if (back) s.returnedNextDay += 1;
    }
  }
  for (const [day, users] of activeByDay) {
    const s = at(day);
    if (!s) continue;
    s.dau = users.size;
    s.returningDau = Array.from(users).filter(
      (id) => (knownCreated.get(id) ?? 0) < dayStart(day),
    ).length;
    s.sentences = sentencesByDay.get(day) ?? 0;
  }
  for (const [day, lessons] of lessonsByDay) {
    const s = at(day);
    if (s) s.lessons = lessons;
  }
  for (const event of events) {
    const s = at(dayOf(event.created_at));
    if (!s) continue;
    const who = event.user_id;
    if (event.event_name === "PAYWALL_VIEWED") {
      const raw = event.event_properties?.shape;
      // Rows written before the shapes existed (and any unknown value) are the full lock.
      const shape: Shape = raw === "preview" || raw === "milestone" ? raw : "gate";
      if (who) s.wallUsers[shape].add(who);
      else s.wallAnon += 1;
    } else if (event.event_name === "UPGRADE_VIEWED" && who) s.upgradeViewUsers.add(who);
    else if (event.event_name === "UPGRADE_CTA_CLICKED" && who) s.payPressedUsers.add(who);
    else if (event.event_name === "FREE_PATH_REDIRECTED") s.redirects += 1;
  }
  for (const order of orders) {
    const created = at(dayOf(order.created_at));
    if (created) created.ordersCreated += 1;
    if (order.status === "fulfilled" && order.paid_at) {
      const paid = at(dayOf(order.paid_at));
      if (paid) paid.paid += 1;
    }
  }
  for (const rating of ratings) {
    const s = at(dayOf(rating.created_at));
    if (!s) continue;
    s.ratingCount += 1;
    s.ratingSum += rating.rating;
  }

  for (const row of passagesStarted) {
    const s = at(dayOf(row.created_at));
    if (s) s.passagesStarted += 1;
  }
  for (const row of passagesDone) {
    const s = at(dayOf(row.completed_at ?? row.created_at));
    if (s && row.completed_at) s.passagesDone += 1;
  }
  // Words finished in Word Lists, counted per day without reading the rows (a few thousand a day).
  for (let i = 0; i < days.length; i += 6) {
    await Promise.all(
      days.slice(i, i + 6).map(async (day) => {
        const s = at(day);
        if (!s) return;
        const from = iso(dayStart(day));
        const to = iso(dayStart(day) + DAY);
        s.wordsDone = await countRows(
          `word_progress?select=id&completed_at=gte.${from}&completed_at=lt.${to}`,
        );
      }),
    );
  }

  const wallTotal = (s: DayStats) =>
    new Set([...s.wallUsers.gate, ...s.wallUsers.preview, ...s.wallUsers.milestone]).size;

  console.log(`Change went live: ${iso(T)}   (all days below are UTC; now ${iso(NOW)})\n`);
  console.log("PER DAY");
  const tableRows: Record<string, string | number>[] = days.map((day) => {
    const s = stats.get(day)!;
    const marker = dayStart(day) <= T && T < dayStart(day) + DAY ? " <- live" : "";
    return {
      day: day + marker,
      signups: s.signups,
      "day0 lessons/new": ratio(s.dayZeroLessons, s.signups),
      "2+ lessons day0": pct(s.twoPlusOnDayZero, s.signups),
      "back next day": s.cohortKnownNextDay ? pct(s.returnedNextDay, s.signups) : "n/a yet",
      DAU: s.dau,
      "returning DAU": `${s.returningDau} (${pct(s.returningDau, s.dau)})`,
      "lessons/active": ratio(s.lessons, s.dau),
      "sentences/active": ratio(s.sentences, s.dau, 1),
      "wall users": wallTotal(s),
      "gate/prev/mile": `${s.wallUsers.gate.size}/${s.wallUsers.preview.size}/${s.wallUsers.milestone.size}`,
      "upgrade opened": s.upgradeViewUsers.size,
      "pay pressed": s.payPressedUsers.size,
      redirects: s.redirects,
      "orders/paid": `${s.ordersCreated}/${s.paid}`,
      "passages start/done": `${s.passagesStarted}/${s.passagesDone}`,
      "list words done": s.wordsDone,
      ratings: s.ratingCount
        ? `${s.ratingCount} (avg ${(s.ratingSum / s.ratingCount).toFixed(2)})`
        : "0",
    };
  });
  console.table(tableRows);

  // Windows: the same length before and after, compared as rates so a busier day does not decide the answer.
  interface Sum {
    days: number;
    signups: number;
    dayZeroLessons: number;
    twoPlus: number;
    knownSignups: number;
    returned: number;
    dau: number;
    returningDau: number;
    lessons: number;
    sentences: number;
    wall: number;
    gate: number;
    preview: number;
    milestone: number;
    upgrade: number;
    pay: number;
    redirects: number;
    orders: number;
    paid: number;
    ratings: number;
    ratingSum: number;
    passagesStarted: number;
    passagesDone: number;
    wordsDone: number;
  }
  function sum(daysIn: string[]): Sum {
    const total: Sum = {
      days: daysIn.length,
      signups: 0,
      dayZeroLessons: 0,
      twoPlus: 0,
      knownSignups: 0,
      returned: 0,
      dau: 0,
      returningDau: 0,
      lessons: 0,
      sentences: 0,
      wall: 0,
      gate: 0,
      preview: 0,
      milestone: 0,
      upgrade: 0,
      pay: 0,
      redirects: 0,
      orders: 0,
      paid: 0,
      ratings: 0,
      ratingSum: 0,
      passagesStarted: 0,
      passagesDone: 0,
      wordsDone: 0,
    };
    for (const day of daysIn) {
      const s = stats.get(day)!;
      total.signups += s.signups;
      total.dayZeroLessons += s.dayZeroLessons;
      total.twoPlus += s.twoPlusOnDayZero;
      if (s.cohortKnownNextDay) {
        total.knownSignups += s.signups;
        total.returned += s.returnedNextDay;
      }
      total.dau += s.dau;
      total.returningDau += s.returningDau;
      total.lessons += s.lessons;
      total.sentences += s.sentences;
      total.wall += wallTotal(s);
      total.gate += s.wallUsers.gate.size;
      total.preview += s.wallUsers.preview.size;
      total.milestone += s.wallUsers.milestone.size;
      total.upgrade += s.upgradeViewUsers.size;
      total.pay += s.payPressedUsers.size;
      total.redirects += s.redirects;
      total.orders += s.ordersCreated;
      total.paid += s.paid;
      total.ratings += s.ratingCount;
      total.ratingSum += s.ratingSum;
      total.passagesStarted += s.passagesStarted;
      total.passagesDone += s.passagesDone;
      total.wordsDone += s.wordsDone;
    }
    return total;
  }
  // Whole UTC days only: the day the change went live is split between both sides, so it is left out of both.
  const liveDay = dayOf(T);
  const beforeDays = days.filter(
    (day) => day < liveDay && dayStart(day) >= dayStart(dayOf(beforeStart)),
  );
  const afterDays = days.filter((day) => day > liveDay && dayStart(day) + DAY <= afterEnd + 1);
  // The whole days since the lock went up (2026-10-09, when the free-for-all promotion ended) and
  // before the live day: what an ordinary day looked like, so the two days right before the change
  // are not mistaken for it (a single odd day can sit in them).
  const typicalDays = days.filter(
    (day) => day < liveDay && dayStart(day) >= dayStart(dayOf(T - 10 * DAY)) && day >= "2026-10-09",
  );
  const before = sum(beforeDays);
  const typical = sum(typicalDays);
  const after = sum(afterDays);

  function line(label: string, f: (x: Sum) => string): Record<string, string> {
    return {
      measure: label,
      "typical day": f(typical),
      before: f(before),
      after: afterDays.length ? f(after) : "waiting",
    };
  }
  console.log(
    `\nTYPICAL: ${typicalDays[0] ?? "-"} to ${typicalDays[typicalDays.length - 1] ?? "-"}   BEFORE: ${beforeDays.join(", ") || "-"}   AFTER: ${afterDays.join(", ") || "none complete yet"}   (the live day ${liveDay} is in none of them)`,
  );
  console.table([
    line("new learners per day", (x) => ratio(x.signups, x.days, 0)),
    line("lessons on day 0, per new learner", (x) => ratio(x.dayZeroLessons, x.signups)),
    line("new learners with 2+ lessons on day 0", (x) => pct(x.twoPlus, x.signups)),
    line("new learners back the next day", (x) => pct(x.returned, x.knownSignups)),
    line("daily active learners per day", (x) => ratio(x.dau, x.days, 0)),
    line("returning active learners per day (count)", (x) => ratio(x.returningDau, x.days, 0)),
    line("share of daily actives who are returning", (x) => pct(x.returningDau, x.dau)),
    line("lessons per active learner per day", (x) => ratio(x.lessons, x.dau)),
    line("sentences per active learner per day", (x) => ratio(x.sentences, x.dau, 1)),
    line("learners who met a lock, per 100 active", (x) => ratio(100 * x.wall, x.dau, 1)),
    line(
      "  as full lock / short look / end of free path, per day",
      (x) =>
        `${ratio(x.gate, x.days, 0)} / ${ratio(x.preview, x.days, 0)} / ${ratio(x.milestone, x.days, 0)}`,
    ),
    line("opened upgrade, per 100 who met a lock", (x) => ratio(100 * x.upgrade, x.wall, 1)),
    line("pressed pay, per 100 who met a lock", (x) => ratio(100 * x.pay, x.wall, 1)),
    line("learners who opened upgrade, per 100 active", (x) => ratio(100 * x.upgrade, x.dau, 2)),
    line("learners who pressed pay, per 100 active", (x) => ratio(100 * x.pay, x.dau, 2)),
    line(
      "payments per day (orders created / paid)",
      (x) => `${ratio(x.orders, x.days, 1)} / ${ratio(x.paid, x.days, 1)}`,
    ),
    line(
      "ratings per day (average)",
      (x) =>
        `${ratio(x.ratings, x.days, 1)}${x.ratings ? ` (${(x.ratingSum / x.ratings).toFixed(2)})` : ""}`,
    ),
    line("ratings per 100 active learners", (x) => ratio(100 * x.ratings, x.dau, 2)),
    line(
      "passages started / finished per day",
      (x) => `${ratio(x.passagesStarted, x.days, 0)} / ${ratio(x.passagesDone, x.days, 0)}`,
    ),
    line("Word Lists words finished per day", (x) => ratio(x.wordsDone, x.days, 0)),
    line("taken to a next free lesson, per day", (x) => ratio(x.redirects, x.days, 1)),
  ]);
  console.log(
    "Read it as rates, not counts: traffic changes a lot from day to day. Payments are a handful a day, so two days cannot prove a change in them.",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
