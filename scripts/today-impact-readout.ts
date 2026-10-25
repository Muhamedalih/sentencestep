/**
 * Read-only before / after readout of Today's session (the daily tasks): once they were open to
 * everyone, did learners stay longer, come back more, and try to subscribe more?
 *
 * Reads the live database through the service role (nothing is written), cuts time into 24-hour
 * windows that start at the moment the tasks went live (read from the audit log of
 * /admin/permissions unless --since gives it), and writes an Arabic Markdown report: the daily
 * tasks themselves, time spent (an estimate from event times: the database stores no durations),
 * return, and the road to paying (lock, upgrade page, pay button, order, payment). The windows
 * after the change are set against the windows before it and against their usual swing.
 *
 * What it cannot say: this is a before / after reading with no control group, and other things
 * changed in the same weeks (listed in the report), so it describes and never proves. Time on the
 * whole site (visitors included) is Microsoft Clarity's: pass its days with --clarity.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/today-impact-readout.ts --out reports/today-impact.md
 * Optional: --since <ISO time it went live to everyone>, --before 12 (windows before to compare
 * with; the lock returned on 2026-10-10, so more than that mixes in the free-for-all days),
 * --cache <folder> (keep what was read and reuse it on the next run, to spare the database),
 * --stable (count only the kinds of event that were recorded before Today existed: a check that
 * a rise in activity or time is not just new things being recorded),
 * --clarity <file.json> (an array of days: date, sessions, users, pages, active, returningSessions,
 * events).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { computeImpact, MINUTE_MS, pairLessonEvents, WINDOW_MS } from "../src/lib/readout/impact";
import type {
  ImpactInput,
  LessonEvent,
  LockKind,
  LockSeen,
  Moment,
  OrderRecord,
  Presence,
  TaskRecord,
  UnitDone,
  UserAt,
} from "../src/lib/readout/impact";
import { renderImpactReport } from "../src/lib/readout/impact-report";
import type { ClarityDay } from "../src/lib/readout/impact-report";
import { all, arg, readRollouts } from "./_readout-rest";

/** The lock came back on this day (the free-for-all days before it have no lock to measure). */
const LOCK_RETURNED_AT = Date.parse("2026-10-10T00:00:00Z");

/** Other launches around the same weeks, from the project notes (the audit log adds the rest). */
const KNOWN_CHANGES: { at: string; text: string }[] = [
  {
    at: "2026-10-10T00:00:00Z",
    text: "عاد قفل المحتوى بعد أيام «كل شيء مجاني» (أول يوم تظهر فيه أحداث القفل)",
  },
  {
    at: "2026-10-15T00:00:00Z",
    text: "وصلت «النصوص» للمتعلمين تدريجيًا (15–17 أكتوبر): تغيّر ما يفعله النشِط، وانخفضت الجمل المكتوبة لكل نشِط",
  },
  { at: "2026-10-18T08:54:00Z", text: "فُتح الدفع عبر Binance Pay للجميع" },
  {
    at: "2026-10-19T13:25:00Z",
    text: "أُلغي تعديل «المسار المجاني» (دام نحو 11 ساعة)، وبقي عرض الإطلاق 7/10/15 يومًا",
  },
  { at: "2026-10-21T15:00:00Z", text: "أول رسائل التذكير بالبريد (اليوم الأول وتذكير الدفع)" },
  {
    at: "2026-10-23T07:18:00Z",
    text: "نُشر تحديث الكلمات الخمس: من قصة اليوم ونصّه بدل مصادر أخرى",
  },
  {
    at: "2026-10-24T12:58:00Z",
    text: "نُشر تحديث الكلمات الخمس (من نص وقصة اليوم فقط، بلا بديل) وبطاقة الاختبار المقفلة",
  },
];

const FEATURE_LABELS: Record<string, string> = {
  newHome: "الصفحة الرئيسية الجديدة",
  sentenceBank: "بنك الجمل والاختبار اليومي والأسبوعي",
};

interface AuditRow {
  entity_id: string | null;
  metadata: { mode?: string; percent?: number } | null;
  created_at: string;
}

interface EventRow {
  user_id: string | null;
  event_name: string;
  event_properties: Record<string, unknown> | null;
  created_at: string;
}

const cacheDir = arg("--cache");
const stable = process.argv.includes("--stable");

/** Reads a dataset from the database, or from the cache folder when it was kept on an earlier run. */
async function dataset<R>(name: string, read: () => Promise<R[]>): Promise<R[]> {
  const file = cacheDir ? join(cacheDir, `${name}.json`) : null;
  if (file && existsSync(file)) return JSON.parse(readFileSync(file, "utf8")) as R[];
  const rows = await read();
  if (file) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(rows));
  }
  return rows;
}

const ms = (iso: string | null | undefined) => (iso ? Date.parse(iso) : NaN);

async function main() {
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const rollouts = await readRollouts();
  const audit = await all<AuditRow>(
    "admin_audit_log?select=entity_id,metadata,created_at&action=eq.rollout.updated&order=created_at.asc,id.asc",
  );

  // When did Today's session reach everyone? The start of the last unbroken stretch of
  // "everyone, 100%" in the audit log; the saved time only says when it was last saved.
  const saved = rollouts.find((row) => row.feature === "todaySession");
  let openSince: number | null = null;
  for (const entry of audit) {
    if (entry.entity_id !== "todaySession") continue;
    const everyone = entry.metadata?.mode === "everyone" && entry.metadata?.percent === 100;
    if (everyone && openSince === null) openSince = ms(entry.created_at);
    if (!everyone) openSince = null;
  }
  const sinceArg = arg("--since");
  const originMs = sinceArg ? Date.parse(sinceArg) : (openSince ?? ms(saved?.updated_at));
  if (Number.isNaN(originMs)) {
    console.error("No time to count from. Pass --since <ISO time the daily tasks went live>.");
    process.exit(1);
  }
  const source = sinceArg ? "--since" : openSince !== null ? "audit log" : "saved setting";

  const requested = Number(arg("--before") ?? 12);
  const beforeWindows = Math.max(
    3,
    Math.min(requested, Math.floor((originMs - LOCK_RETURNED_AT) / WINDOW_MS)),
  );
  if (beforeWindows < requested) {
    console.warn(
      `NOTE: only ${beforeWindows} windows before the change are used (the lock returned on 2026-10-10).`,
    );
  }
  const dataStartMs = originMs - (beforeWindows + 8) * WINDOW_MS;
  const from = new Date(dataStartMs).toISOString();
  const until = `lt.${nowIso}`;

  const profiles = await dataset("profiles", () =>
    all<{ id: string; created_at: string; role: string }>(
      `profiles?select=id,created_at,role&created_at=${until}&order=created_at.asc,id.asc`,
    ),
  );
  const learners = profiles
    .filter((profile) => profile.role === "user")
    .map((profile) => ({ id: profile.id, createdAt: ms(profile.created_at) }));

  // Events: studying markers (signed-in learners) and the premium road (visitors included).
  const studyEvents = await dataset("events_study", () =>
    all<EventRow>(
      `analytics_events?select=user_id,event_name,event_properties,created_at&event_name=in.(LESSON_STARTED,LESSON_COMPLETED,STORY_STARTED,STORY_COMPLETED,AUDIO_PLAYED)&user_id=not.is.null&created_at=gte.${from}&created_at=${until}&order=created_at.asc,id.asc`,
    ),
  );
  const roadEvents = await dataset("events_road", () =>
    all<EventRow>(
      `analytics_events?select=user_id,event_name,event_properties,created_at&event_name=in.(PAYWALL_VIEWED,UPGRADE_VIEWED,UPGRADE_CTA_CLICKED,TODAY_SESSION_COMPLETED,SENTENCE_REVIEW_STARTED,SENTENCE_REVIEW_FINISHED)&created_at=gte.${from}&created_at=${until}&order=created_at.asc,id.asc`,
    ),
  );
  const attempts = await dataset("lesson_attempts", () =>
    all<{ user_id: string; created_at: string }>(
      `lesson_attempts?select=user_id,created_at&created_at=gte.${from}&created_at=${until}&order=created_at.asc,id.asc`,
    ),
  );
  const progress = await dataset("user_progress", () =>
    all<{ user_id: string; mode: string; completed_at: string }>(
      `user_progress?select=user_id,mode,completed_at&completed_at=gte.${from}&completed_at=${until}&order=completed_at.asc,id.asc`,
    ),
  );
  const passages = await dataset("passage_progress", () =>
    all<{ user_id: string; created_at: string; updated_at: string; completed_at: string | null }>(
      `passage_progress?select=user_id,created_at,updated_at,completed_at&updated_at=gte.${from}&updated_at=${until}&order=updated_at.asc,user_id.asc,passage_id.asc`,
    ),
  );
  const words = await dataset("word_progress", () =>
    all<{ user_id: string; completed_at: string }>(
      `word_progress?select=user_id,completed_at&completed_at=gte.${from}&completed_at=${until}&order=completed_at.asc,id.asc`,
    ),
  );
  const reviews = await dataset("vocabulary_encounters", () =>
    all<{ user_id: string; created_at: string; updated_at: string }>(
      `vocabulary_encounters?select=user_id,created_at,updated_at&updated_at=gte.${from}&updated_at=${until}&order=updated_at.asc,id.asc`,
    ),
  );
  const quests = await dataset("daily_quests", () =>
    all<{
      user_id: string;
      slot: number;
      created_at: string;
      completed_at: string | null;
    }>(
      `daily_quests?select=user_id,slot,created_at,completed_at&created_at=gte.${from}&created_at=${until}&order=created_at.asc,user_id.asc,slot.asc`,
    ),
  );
  const sessions = await dataset("daily_sessions", () =>
    all<{ user_id: string; completed_at: string }>(
      `daily_sessions?select=user_id,completed_at&completed_at=gte.${from}&completed_at=${until}&order=completed_at.asc,user_id.asc`,
    ),
  );
  const orders = await dataset("payment_orders", () =>
    all<{
      user_id: string;
      provider: string;
      status: string;
      created_at: string;
      paid_at: string | null;
    }>(
      `payment_orders?select=user_id,provider,status,created_at,paid_at&provider_env=eq.live&created_at=gte.${from}&created_at=${until}&order=created_at.asc,id.asc`,
    ),
  );

  // --- Assemble the input -----------------------------------------------------------------
  const moments: Moment[] = [];
  const point = (userId: string, at: number) => moments.push({ userId, start: at, end: at });
  const lessonEvents: LessonEvent[] = [];
  for (const event of studyEvents) {
    if (!event.user_id) continue;
    const at = ms(event.created_at);
    if (event.event_name === "AUDIO_PLAYED") {
      point(event.user_id, at);
      continue;
    }
    lessonEvents.push({
      userId: event.user_id,
      lessonId: String(event.event_properties?.lessonId ?? ""),
      at,
      type: event.event_name.endsWith("STARTED") ? "start" : "complete",
    });
  }
  const paired = pairLessonEvents(lessonEvents);
  for (const span of paired.spans) moments.push(span);
  for (const open of paired.openStarts) point(open.userId, open.at);
  for (const row of attempts) point(row.user_id, ms(row.created_at));
  for (const row of progress) point(row.user_id, ms(row.completed_at));
  for (const row of passages) {
    const start = ms(row.created_at);
    const end = ms(row.completed_at ?? row.updated_at);
    // A passage open for hours is not one sitting: count its two ends as separate moments.
    if (end - start <= 30 * MINUTE_MS) moments.push({ userId: row.user_id, start, end });
    else {
      point(row.user_id, start);
      point(row.user_id, end);
    }
  }
  for (const row of words) point(row.user_id, ms(row.completed_at));
  // The kinds of event that only exist since Today (word reviews, finished tasks, the day's finish
  // screen, the sentence test) can make time and activity look bigger after it than before: with
  // --stable they are left out, to check that a rise is not just new things being recorded.
  if (!stable) {
    for (const row of reviews) {
      if (ms(row.updated_at) - ms(row.created_at) >= 5 * MINUTE_MS) {
        point(row.user_id, ms(row.updated_at));
      }
    }
    for (const row of quests) if (row.completed_at) point(row.user_id, ms(row.completed_at));
    for (const row of sessions) point(row.user_id, ms(row.completed_at));
  }

  const presence: Presence[] = quests.map((row) => ({
    userId: row.user_id,
    at: ms(row.created_at),
  }));
  const locks: LockSeen[] = [];
  const upgradeViews: UserAt[] = [];
  const payPresses: UserAt[] = [];
  const finishedToday: UserAt[] = [];
  for (const event of roadEvents) {
    const at = ms(event.created_at);
    switch (event.event_name) {
      case "PAYWALL_VIEWED": {
        const props = event.event_properties ?? {};
        const kind: LockKind =
          props.kind === "word_group"
            ? "wordList"
            : props.kind === "passage"
              ? "passage"
              : props.mode === "stories"
                ? "story"
                : "lesson";
        locks.push({ userId: event.user_id, at, kind });
        if (event.user_id) presence.push({ userId: event.user_id, at });
        break;
      }
      case "UPGRADE_VIEWED":
        upgradeViews.push({ userId: event.user_id, at });
        if (event.user_id) presence.push({ userId: event.user_id, at });
        break;
      case "UPGRADE_CTA_CLICKED":
        payPresses.push({ userId: event.user_id, at });
        if (event.user_id) presence.push({ userId: event.user_id, at });
        break;
      case "TODAY_SESSION_COMPLETED":
        finishedToday.push({ userId: event.user_id, at });
        if (event.user_id && !stable) point(event.user_id, at);
        break;
      default:
        // The sentence test (started / finished): a learner studying.
        if (event.user_id && !stable) point(event.user_id, at);
    }
  }

  const units: UnitDone[] = [];
  for (const row of progress) {
    if (row.mode === "normal")
      units.push({ userId: row.user_id, at: ms(row.completed_at), kind: "lesson" });
    else if (row.mode === "stories")
      units.push({ userId: row.user_id, at: ms(row.completed_at), kind: "story" });
  }
  for (const row of passages) {
    if (row.completed_at)
      units.push({ userId: row.user_id, at: ms(row.completed_at), kind: "passage" });
  }
  for (const row of words)
    units.push({ userId: row.user_id, at: ms(row.completed_at), kind: "word" });

  const orderRecords: OrderRecord[] = orders.map((row) => ({
    userId: row.user_id,
    provider: row.provider,
    createdAt: ms(row.created_at),
    paidAt: row.status === "fulfilled" ? ms(row.paid_at) : null,
  }));
  const tasks: TaskRecord[] = [];
  for (const row of quests) {
    if (row.slot > 12) continue; // the optional test row is not one of the day's tasks
    if (row.slot >= 10 && ms(row.created_at) < originMs) continue; // tried before it opened to everyone
    tasks.push({
      userId: row.user_id,
      kind: row.slot >= 10 ? "today" : "old",
      slot: row.slot,
      createdAt: ms(row.created_at),
      done: row.completed_at !== null,
    });
  }

  // Only learners count: admin accounts are not in `learners`, so their rows are dropped by id.
  const input: ImpactInput = {
    originMs,
    nowMs,
    dataStartMs,
    beforeWindows,
    learners,
    moments,
    presence,
    locks,
    upgradeViews,
    payPresses,
    units,
    orders: orderRecords,
    tasks,
    finishedToday,
  };
  const result = computeImpact(input);

  // Other changes: the audit log's openings of other features after the daily tasks, plus the notes.
  const otherChanges = KNOWN_CHANGES.map((change) => ({
    atMs: Date.parse(change.at),
    text: change.text,
  }));
  for (const entry of audit) {
    const feature = entry.entity_id ?? "";
    if (feature === "todaySession" || !FEATURE_LABELS[feature]) continue;
    if (entry.metadata?.mode === "everyone" && entry.metadata?.percent === 100) {
      otherChanges.push({
        atMs: ms(entry.created_at),
        text: `فُتحت للجميع: ${FEATURE_LABELS[feature]}`,
      });
    }
  }

  const clarityFile = arg("--clarity");
  const clarity = clarityFile
    ? (JSON.parse(readFileSync(clarityFile, "utf8")) as ClarityDay[])
    : undefined;
  const markdown = renderImpactReport(result, {
    feature: {
      mode: saved?.mode ?? "unknown",
      percent: saved?.percent ?? 0,
      source,
    },
    otherChanges,
    clarity,
    notes: stable
      ? [
          "حُسب النشاط والوقت من الأحداث التي كانت تُسجَّل قبل «اليوم» فقط (دروس وقصص ونصوص وكلمات وصوت)، بلا مراجعة الكلمات ولا إنجاز المهام ولا شاشة النهاية ولا اختبار الجمل، للتأكد أن الارتفاع ليس من تسجيل أشياء جديدة.",
        ]
      : [],
  });

  const out = arg("--out");
  if (out) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, markdown, "utf8");
    console.log(`Report written to ${out} (${markdown.length} characters).`);
  } else {
    console.log(markdown);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
