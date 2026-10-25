import { compareSeries, windowIndex, windowStart } from "@/lib/readout/impact";
import type {
  CohortBlock,
  CohortGroup,
  Comparison,
  ImpactResult,
  ReturnTally,
  Verdict,
} from "@/lib/readout/impact";
import { DAY_MS } from "@/lib/readout/returns";

/**
 * The written report of the before / after readout of Today's session (Arabic, Markdown), built
 * from an ImpactResult. Pure, so it is tested. The numbers come first and the wording stays
 * descriptive: "up", "down", "no clear difference", "too early" — never "it worked".
 */

/** One day of Microsoft Clarity (read by hand from its dashboard; the database has no durations). */
export interface ClarityDay {
  /** The local (Baghdad) date, "YYYY-MM-DD". */
  date: string;
  sessions: number;
  users: number;
  pages: number;
  /** Average minutes of active time per session. */
  active: number;
  /** Sessions whose user had visited before. */
  returningSessions: number;
  /** Smart events: sessions that stayed N seconds on a kind of page, e.g. "passages_300s". */
  events: Record<string, number>;
}

export interface ReportContext {
  /** The setting as saved: who the feature is open to, and where the go-live time came from. */
  feature: { mode: string; percent: number; source: "audit log" | "saved setting" | "--since" };
  /** Other launches and changes around the same weeks. */
  otherChanges: { atMs: number; text: string }[];
  clarity?: readonly ClarityDay[];
  /** Lines to print under "how we compared", e.g. that a robustness variant was used. */
  notes?: readonly string[];
}

const BAGHDAD_MS = 3 * 3_600_000;

export function baghdad(ms: number): string {
  return new Date(ms + BAGHDAD_MS).toISOString().slice(0, 16).replace("T", " ");
}

/** "نافذة واحدة", "نافذتان", "3 نوافذ", "12 نافذة". */
export function windowsPhrase(n: number): string {
  if (n === 1) return "نافذة واحدة";
  if (n === 2) return "نافذتان";
  return n >= 3 && n <= 10 ? `${n} نوافذ` : `${n} نافذة`;
}

const SOURCES: Record<ReportContext["feature"]["source"], string> = {
  "audit log": "سجل التدقيق في صفحة الصلاحيات",
  "saved setting": "آخر حفظ للإعداد",
  "--since": "حُدّد يدويًا",
};

const VERDICTS: Record<Verdict, string> = {
  up: "⬆ ارتفاع واضح",
  down: "⬇ انخفاض واضح",
  maybeUp: "↗ يميل للارتفاع",
  maybeDown: "↘ يميل للانخفاض",
  flat: "≈ لا فرق واضح",
  early: "… مبكر",
};

type Format = "pct" | "min" | "count" | "int" | "perLearner" | "per1000";

function show(value: number | null, format: Format): string {
  if (value === null) return "—";
  switch (format) {
    case "pct":
      return `${(100 * value).toFixed(1)}%`;
    case "min":
    case "per1000":
      return value.toFixed(1);
    case "perLearner":
      return value.toFixed(2);
    case "int":
      return value.toFixed(0);
    case "count":
      return value >= 100 ? value.toFixed(0) : value.toFixed(1);
  }
}

function showDiff(comparison: Comparison, format: Format): string {
  if (comparison.diff === null) return "—";
  const sign = comparison.diff > 0 ? "+" : comparison.diff < 0 ? "−" : "";
  const size = Math.abs(comparison.diff);
  const body =
    format === "pct"
      ? `${(100 * size).toFixed(1)} نقطة`
      : format === "count" && size >= 100
        ? size.toFixed(0)
        : size.toFixed(format === "perLearner" ? 2 : 1);
  // A share of a baseline near zero says nothing ("+139300%"): leave it out.
  const relative =
    comparison.relative === null || Math.abs(comparison.relative) > 10
      ? ""
      : ` (${comparison.relative > 0 ? "+" : "−"}${Math.abs(100 * comparison.relative).toFixed(0)}%)`;
  return `${sign}${body}${relative}`;
}

interface RowSpec {
  id: string;
  label: string;
  format: Format;
  /** What the line says in the summary, where the table's dash would lose its parent ("— من العائدين"). */
  short?: string;
}

function verdictOf(comparison: Comparison): string {
  if (comparison.before.value === null || comparison.after.value === null) return "—";
  const base = VERDICTS[comparison.verdict];
  const doubtful = comparison.verdict !== "early" && comparison.verdict !== "flat";
  return doubtful && !comparison.consistent ? `${base} ⚠` : base;
}

function row(label: string, comparison: Comparison | null, format: Format): string {
  if (!comparison) return `| ${label} | — | — | — | — | — | — |`;
  const { before, after } = comparison;
  const range =
    before.min !== null && before.max !== null && before.windows > 1
      ? ` [${show(before.min, format)}–${show(before.max, format)}]`
      : "";
  const beforeCell = before.value === null ? "—" : `${show(before.value, format)}${range}`;
  const perWindow = after.perWindow.map((value) => show(value, format)).join(" · ");
  const afterCell =
    after.value === null
      ? "—"
      : `**${show(after.value, format)}**${perWindow ? ` (${perWindow})` : ""}`;
  return `| ${label} | ${beforeCell} | ${show(comparison.recent, format)} | ${show(comparison.weekAgo, format)} | ${afterCell} | ${showDiff(comparison, format)} | ${verdictOf(comparison)} |`;
}

const HEADER =
  "| المقياس | قبل (متوسط [أدنى–أعلى]) | قبل مباشرة (آخر 4) | نفس الأيام قبل أسبوع | بعد (المتوسط، ثم كل نافذة) | الفرق | الحكم |\n|---|---|---|---|---|---|---|";

function tableOf(result: ImpactResult, rows: readonly RowSpec[]): string {
  const { beforeKs, afterKs } = result.plan;
  const lines = rows.map(({ id, label, format }) =>
    row(label, compareSeries(result.series.get(id), beforeKs, afterKs), format),
  );
  return [HEADER, ...lines].join("\n");
}

const TASK_ROWS: readonly RowSpec[] = [
  { id: "tasks.dealt", label: "متعلمون ظهرت لهم مهام (عدد/نافذة)", format: "count" },
  { id: "tasks.one", label: "أنجزوا مهمة واحدة على الأقل", format: "pct" },
  { id: "tasks.all", label: "أنجزوا كل مهام اليوم", format: "pct" },
  {
    id: "tasks.today.slot10",
    label: "— الاستماع إلى النص",
    format: "pct",
    short: "إنجاز مهمة الاستماع إلى النص",
  },
  {
    id: "tasks.today.slot11",
    label: "— كتابة القصة",
    format: "pct",
    short: "إنجاز مهمة كتابة القصة",
  },
  {
    id: "tasks.today.slot12",
    label: "— الكلمات الخمس",
    format: "pct",
    short: "إنجاز مهمة الكلمات الخمس",
  },
  { id: "today.finished", label: "وصلوا شاشة نهاية الجلسة (عدد/نافذة)", format: "count" },
];

const STAY_ROWS: readonly RowSpec[] = [
  { id: "active.all", label: "متعلمون نشِطون (عدد/نافذة)", format: "count" },
  {
    id: "active.returning",
    label: "— منهم عائدون",
    format: "count",
    short: "متعلمون عائدون نشِطون (عدد/نافذة)",
  },
  {
    id: "active.new",
    label: "— منهم جدد",
    format: "count",
    short: "متعلمون جدد نشِطون (عدد/نافذة)",
  },
  { id: "time.minutes.returning", label: "متوسط الدقائق للمتعلم العائد (تقدير)", format: "min" },
  { id: "time.median.returning", label: "وسيط الدقائق للعائد", format: "min" },
  { id: "time.ge10.returning", label: "% من العائدين قضوا 10 دقائق فأكثر", format: "pct" },
  { id: "time.ge20.returning", label: "% من العائدين قضوا 20 دقيقة فأكثر", format: "pct" },
  {
    id: "time.visits.returning",
    label: "زيارات منفصلة للعائد (بينها 30 دقيقة+)",
    format: "perLearner",
  },
  { id: "time.minutes.new", label: "متوسط الدقائق للمتعلم الجديد (تقدير)", format: "min" },
  { id: "units.lesson", label: "دروس يومية مكتملة لكل نشِط", format: "perLearner" },
  { id: "units.story", label: "قصص مكتملة لكل نشِط", format: "perLearner" },
  { id: "units.passage", label: "نصوص مكتملة لكل نشِط", format: "perLearner" },
  { id: "units.word", label: "كلمات (قسم الكلمات) لكل نشِط", format: "perLearner" },
];

const RETURN_ROWS: readonly RowSpec[] = [
  {
    id: "return.next.all",
    label: "% ممن درسوا في النافذة السابقة وعادوا للدراسة في هذه",
    format: "pct",
  },
  {
    id: "return.next.returning",
    label: "— من كان عائدًا أصلًا",
    format: "pct",
    short: "% من العائدين الذين درسوا في النافذة السابقة وعادوا في هذه",
  },
  {
    id: "return.next.new",
    label: "— من كان جديدًا",
    format: "pct",
    short: "% من الجدد الذين درسوا في النافذة السابقة وعادوا في هذه",
  },
  {
    id: "return.r7",
    label: "% من القدامى (سجّلوا قبل 8 أيام+) ودرسوا خلال الأسبوع السابق وعادوا اليوم",
    format: "pct",
  },
  {
    id: "came.returning",
    label: "عائدون ظهروا (درسوا أو فتحوا الرئيسية أو رأوا قفلًا) (عدد/نافذة)",
    format: "count",
  },
];

function subscribeRows(providers: readonly string[]): RowSpec[] {
  return [
    { id: "lock.all", label: "صادفوا قفلًا (نسبة إلى النشِطين)", format: "pct" },
    {
      id: "lock.returning",
      label: "— العائدون (إلى النشِطين العائدين)",
      format: "pct",
      short: "العائدون الذين صادفوا قفلًا (نسبة إلى النشِطين العائدين)",
    },
    {
      id: "lock.new",
      label: "— الجدد (إلى النشِطين الجدد)",
      format: "pct",
      short: "الجدد الذين صادفوا قفلًا (نسبة إلى النشِطين الجدد)",
    },
    {
      id: "lock.kind.lesson",
      label: "— قفل درس يومي (إلى النشِطين)",
      format: "pct",
      short: "صادفوا قفل درس يومي (نسبة إلى النشِطين)",
    },
    {
      id: "lock.kind.story",
      label: "— قفل قصة (إلى النشِطين)",
      format: "pct",
      short: "صادفوا قفل قصة (نسبة إلى النشِطين)",
    },
    {
      id: "lock.kind.wordList",
      label: "— قفل قائمة كلمات (إلى النشِطين)",
      format: "pct",
      short: "صادفوا قفل قائمة كلمات (نسبة إلى النشِطين)",
    },
    {
      id: "lock.kind.passage",
      label: "— قفل نص (إلى النشِطين)",
      format: "pct",
      short: "صادفوا قفل نص (نسبة إلى النشِطين)",
    },
    { id: "upgrade.all", label: "فتحوا صفحة الترقية (نسبة إلى النشِطين)", format: "pct" },
    { id: "press.all", label: "ضغطوا الدفع (نسبة إلى النشِطين)", format: "pct" },
    { id: "upgrade.perLock", label: "فتحوا الترقية (نسبة إلى من صادف قفلًا)", format: "pct" },
    { id: "press.perLock", label: "ضغطوا الدفع (نسبة إلى من صادف قفلًا)", format: "pct" },
    { id: "orders.created", label: "طلبات دفع جديدة (عدد/نافذة)", format: "count" },
    ...providers.map((provider) => ({
      id: `orders.created.${provider}`,
      label: `— طلبات ${provider} (عدد/نافذة)`,
      short: `طلبات ${provider} (عدد/نافذة)`,
      format: "count" as const,
    })),
    { id: "orders.paid", label: "دفعات مكتملة (عدد/نافذة)", format: "count" },
    { id: "orders.paidPer1000", label: "دفعات لكل 1000 نشِط", format: "per1000" },
    {
      id: "visitors.locks",
      label: "شاهد مقارنة: زوار غير مسجَّلين صادفوا قفلًا (مرات/نافذة)",
      format: "count",
    },
    {
      id: "visitors.upgrade",
      label: "شاهد مقارنة: زوار غير مسجَّلين فتحوا الترقية (مرات/نافذة)",
      format: "count",
    },
  ];
}

const GROUPS: Record<CohortGroup, string> = {
  before: "قبل",
  transition: "انتقالية (تُستبعد)",
  after: "بعد",
};

function cohortTable(block: CohortBlock, title: string): string {
  const pct = (part: number, whole: number) =>
    whole === 0 ? "—" : `${((100 * part) / whole).toFixed(1)}%`;
  const line = (label: string, group: string, t: ReturnTally) =>
    `| ${label} | ${group} | ${t.signups} | ${pct(t.studiedFirstDay, t.signups)} | **${pct(t.back, t.signups)}** | ${pct(t.studiedBack, t.studiedFirstDay)} | ${pct(t.restBack, t.signups - t.studiedFirstDay)} |`;
  const rows = block.rows
    .filter((entry) => entry.tally.signups > 0)
    .map((entry) => line(`نافذة ${entry.k}`, GROUPS[entry.group], entry.tally));
  const z = block.z === null ? "—" : block.z.toFixed(2);
  return [
    `**${title}**`,
    "",
    "| دفعة التسجيل | الفئة | مسجَّلون (ناضجون للحكم) | بدأوا نشاطًا في أول 24 ساعة | عادوا | عادوا ممن بدأوا | عادوا من الباقين |",
    "|---|---|---|---|---|---|---|",
    ...rows,
    line("**كل «قبل»**", "قبل", block.before),
    line("**كل «بعد»**", "بعد", block.after),
    "",
    `z لفرق نسبة العودة (بعد − قبل): ${z} (من ±1.96 فما فوق يعني فرقًا يتجاوز ما يفعله الحظ وحده، ضمن شروط هذه المقارنة).`,
  ].join("\n");
}

function clarityBlock(
  days: readonly ClarityDay[],
  originMs: number,
  nowMs: number,
  firstDate: string,
): string {
  const launchDate = baghdad(originMs).slice(0, 10);
  const todayDate = baghdad(nowMs).slice(0, 10);
  const before = days.filter((day) => day.date >= firstDate && day.date < launchDate);
  const after = days.filter((day) => day.date > launchDate && day.date < todayDate);
  const weighted = (list: readonly ClarityDay[], pick: (day: ClarityDay) => number) => {
    const sessions = list.reduce((sum, day) => sum + day.sessions, 0);
    return sessions === 0
      ? null
      : list.reduce((sum, day) => sum + pick(day) * day.sessions, 0) / sessions;
  };
  const mean = (list: readonly ClarityDay[], pick: (day: ClarityDay) => number) =>
    list.length === 0 ? null : list.reduce((sum, day) => sum + pick(day), 0) / list.length;
  const f = (value: number | null, digits = 1) => (value === null ? "—" : value.toFixed(digits));
  const share = (list: readonly ClarityDay[], event: string) => {
    const withEvent = list.filter((day) => day.events[event] !== undefined);
    const sessions = withEvent.reduce((sum, day) => sum + day.sessions, 0);
    const hits = withEvent.reduce((sum, day) => sum + (day.events[event] ?? 0), 0);
    return sessions === 0 ? null : (100 * hits) / sessions;
  };
  const lines = [
    "| المقياس (Clarity، أيام بتوقيت بغداد) | قبل | بعد |",
    "|---|---|---|",
    `| أيام محسوبة | ${before.length} | ${after.length} |`,
    `| متوسط الوقت الفعّال لكل جلسة (دقيقة، موزون بالجلسات) | ${f(weighted(before, (d) => d.active))} | ${f(weighted(after, (d) => d.active))} |`,
    `| صفحات لكل جلسة | ${f(
      weighted(before, (d) => d.pages),
      2,
    )} | ${f(
      weighted(after, (d) => d.pages),
      2,
    )} |`,
    `| جلسات لمستخدمين عائدين (يوميًا) | ${f(
      mean(before, (d) => d.returningSessions),
      0,
    )} | ${f(
      mean(after, (d) => d.returningSessions),
      0,
    )} |`,
    `| جلسات الموقع (يوميًا) | ${f(
      mean(before, (d) => d.sessions),
      0,
    )} | ${f(
      mean(after, (d) => d.sessions),
      0,
    )} |`,
  ];
  for (const [name, event] of [
    ["الدروس اليومية", "daily_lessons_300s"],
    ["النصوص", "passages_300s"],
    ["القصص", "stories_300s"],
    ["قائمة الكلمات", "word_lists_300s"],
  ] as const) {
    lines.push(
      `| % جلسات بقيت 5 دقائق فأكثر في: ${name} | ${f(share(before, event))}% | ${f(share(after, event))}% |`,
    );
  }
  const daily = [
    "| اليوم | جلسات | مستخدمون | وقت فعّال/جلسة | % عائدون |",
    "|---|---|---|---|---|",
    ...days.map(
      (day) =>
        `| ${day.date}${day.date === launchDate ? " ← الإطلاق" : ""}${day.date === todayDate ? " (جزئي)" : ""} | ${day.sessions} | ${day.users} | ${day.active.toFixed(1)} | ${((100 * day.returningSessions) / Math.max(1, day.sessions)).toFixed(0)}% |`,
    ),
  ];
  return [
    "الوقت الفعلي على الموقع لا يُسجَّل في قاعدة البيانات، لذلك هذه الأرقام من Microsoft Clarity وهي لكل زوار الموقع (مسجَّلون وزوار)، فيغلب عليها الزوار الجدد وحملات الفيسبوك. اليوم ذو الحملة الكبيرة يخفض المتوسط وحده.",
    "",
    ...lines,
    "",
    ...daily,
  ].join("\n");
}

/** Every window, one line: the numbers behind the averages, so nothing hides in a pooled value. */
function windowTable(result: ImpactResult): string {
  const { originMs, plan } = result;
  const lastK = plan.partialK ?? plan.afterKs[plan.afterKs.length - 1] ?? -1;
  const columns: { id: string; label: string; format: Format }[] = [
    { id: "active.all", label: "نشِطون", format: "int" },
    { id: "active.returning", label: "عائدون", format: "int" },
    { id: "tasks.all", label: "أنجزوا كل المهام", format: "pct" },
    { id: "time.minutes.returning", label: "دقائق (عائد)", format: "min" },
    { id: "time.ge10.returning", label: "10 د+", format: "pct" },
    { id: "return.next.all", label: "عادوا للنافذة التالية", format: "pct" },
    { id: "lock.all", label: "صادفوا قفلًا", format: "pct" },
    { id: "upgrade.all", label: "فتحوا الترقية", format: "pct" },
    { id: "press.all", label: "ضغطوا الدفع", format: "pct" },
    { id: "orders.created", label: "طلبات", format: "int" },
    { id: "orders.paid", label: "دفعات", format: "int" },
  ];
  const value = (id: string, k: number): number | null => {
    const series = result.series.get(id);
    const cell = series?.cells.get(k);
    if (!series || !cell) return null;
    if (series.kind === "count") return cell.num;
    return cell.den > 0 ? cell.num / cell.den : null;
  };
  const lines = [
    `| النافذة | تبدأ (بغداد) | ${columns.map((column) => column.label).join(" | ")} |`,
    `|---|---|${columns.map(() => "---").join("|")}|`,
  ];
  for (let k = plan.beforeKs[0] ?? -1; k <= lastK; k++) {
    const tag = k === plan.partialK ? " (جارية)" : k === 0 ? " ← الفتح" : "";
    const cells = columns.map((column) => show(value(column.id, k), column.format));
    lines.push(`| ${k}${tag} | ${baghdad(windowStart(k, originMs))} | ${cells.join(" | ")} |`);
  }
  return lines.join("\n");
}

function summaryLists(result: ImpactResult, rows: readonly RowSpec[]): string[] {
  const { beforeKs, afterKs } = result.plan;
  const groups: Record<"clear" | "lean", string[]> = { clear: [], lean: [] };
  for (const spec of rows) {
    const comparison = compareSeries(result.series.get(spec.id), beforeKs, afterKs);
    if (!comparison || comparison.before.value === null || comparison.after.value === null)
      continue;
    const label = spec.short ?? spec.label;
    const text = `${label}: ${show(comparison.before.value, spec.format)} ← ${show(comparison.after.value, spec.format)} (${showDiff(comparison, spec.format)})`;
    if (comparison.verdict === "up" || comparison.verdict === "down") {
      groups.clear.push(`${comparison.verdict === "up" ? "⬆" : "⬇"} ${text}`);
    } else if (comparison.verdict === "maybeUp" || comparison.verdict === "maybeDown") {
      groups.lean.push(`${comparison.verdict === "maybeUp" ? "↗" : "↘"} ${text}`);
    }
  }
  const lines: string[] = [];
  lines.push(
    "**تحركت بوضوح** (خارج التذبذب المعتاد، ويتفق معها آخر 4 نوافذ ونفس الأيام قبل أسبوع):",
  );
  lines.push("");
  lines.push(
    ...(groups.clear.length > 0 ? groups.clear.map((line) => `- ${line}`) : ["- لا شيء بعد"]),
  );
  lines.push("");
  lines.push("**تميل للحركة ولم تُحسم** (تحتاج أيامًا إضافية):");
  lines.push("");
  lines.push(...(groups.lean.length > 0 ? groups.lean.map((line) => `- ${line}`) : ["- لا شيء"]));
  return lines;
}

export function renderImpactReport(result: ImpactResult, context: ReportContext): string {
  const { originMs, nowMs, plan } = result;
  const { beforeKs, afterKs, partialK } = plan;
  const firstK = beforeKs[0] ?? -1;
  const windowLabel = (k: number) => baghdad(windowStart(k, originMs));
  const out: string[] = [];

  out.push("# مقارنة قبل / بعد «المهام اليومية» (اليوم)");
  out.push("");
  out.push(`آخر بيانات: ${baghdad(nowMs)} بتوقيت بغداد.`);
  out.push("");
  out.push("## 1. هل هي مفتوحة للجميع؟");
  out.push("");
  const open = context.feature.mode === "everyone" && context.feature.percent === 100;
  out.push(
    open
      ? `نعم. ميزة «اليوم» مفتوحة لكل المتعلمين المسجَّلين (100%) منذ **${baghdad(originMs)}** بتوقيت بغداد (المصدر: ${SOURCES[context.feature.source]}).`
      : `لا. الإعداد الحالي: ${context.feature.mode}${context.feature.mode === "everyone" ? ` ${context.feature.percent}%` : ""}. الأرقام أدناه تفترض أنها فُتحت للجميع في ${baghdad(originMs)}.`,
  );
  out.push("");
  out.push("## 2. كيف قارنّا");
  out.push("");
  out.push(
    "- **نافذة** = 24 ساعة تبدأ من لحظة الفتح. النافذة 0 هي أول 24 ساعة بعده، والنافذة −1 هي آخر 24 ساعة قبله. هكذا يقع الفتح على حدّ نافذتين بالضبط، ولا يوجد يوم نصفه قبل ونصفه بعد.",
  );
  out.push(
    `- **قبل**: ${windowsPhrase(beforeKs.length)} كاملة (من ${windowLabel(firstK)} حتى ${baghdad(originMs)}). **بعد**: ${
      afterKs.length > 0
        ? `${windowsPhrase(afterKs.length)} كاملة (حتى ${baghdad(windowStart((afterKs[afterKs.length - 1] ?? -1) + 1, originMs))})`
        : "لا توجد نافذة مكتملة بعد"
    }.${partialK !== null ? ` النافذة ${partialK} ما زالت جارية فلا تُحسب.` : ""}`,
  );
  out.push(
    "- **متعلم نشِط** = من قام بأي نشاط تعلّم (درس، قصة، نص، كلمات، مراجعة) خلال النافذة. **عائد** = سجّل قبل بداية النافذة. **جديد** = سجّل داخلها. حسابات المدير مستبعدة.",
  );
  out.push(
    "- في كل جدول: «قبل» = المتوسط المجمّع للنوافذ مع أدنى وأعلى قيمة بينها (هذا هو التذبذب المعتاد)، «قبل مباشرة» = آخر 4 نوافذ، «نفس الأيام قبل أسبوع» = النوافذ المقابلة في الأسبوع السابق (نفس أيام الأسبوع)، «بعد» = المتوسط ثم قيمة كل نافذة.",
  );
  out.push(
    "- **الحكم**: «واضح» يعني أن كل نوافذ «بعد» خرجت عن مدى «قبل» في الاتجاه نفسه، وأن الفرق يتجاوز ما يفعله الحظ وحده، وأنه يتفق مع «قبل مباشرة» و«نفس الأيام قبل أسبوع» (وإلا صار «يميل» وعليه ⚠). «يميل» = شرط واحد فقط. «لا فرق واضح» = ضمن التذبذب المعتاد. «مبكر» = أقل من نافذتين بعد الفتح. الحكم وصف لما حدث لا إثبات أن الميزة هي السبب.",
  );
  for (const note of context.notes ?? []) out.push(`- **ملاحظة**: ${note}`);
  out.push("");
  out.push("**ما الذي تغيّر في الأسابيع نفسها** (كلها تخلط التأثير؛ رقم النافذة بين قوسين):");
  out.push("");
  for (const change of [...context.otherChanges].sort((a, b) => a.atMs - b.atMs)) {
    const k = windowIndex(change.atMs, originMs);
    out.push(
      `- ${baghdad(change.atMs)} (${k < firstK ? "قبل النوافذ" : `نافذة ${k}`}): ${change.text}`,
    );
  }
  out.push("");

  const subscribe = subscribeRows(result.providers);
  out.push("## 3. الخلاصة بالأحكام");
  out.push("");
  out.push(...summaryLists(result, [...TASK_ROWS, ...STAY_ROWS, ...RETURN_ROWS, ...subscribe]));
  out.push("");

  out.push("## 4. المهام اليومية نفسها: هل تُنجَز؟");
  out.push("");
  out.push(
    "«قبل» = المهام العشوائية القديمة (3 مهام مثل «أكمل درسين» و«اكتب 10 جمل»)، «بعد» = مهام اليوم الثلاث (استماع إلى نص، كتابة قصة، خمس كلمات). التعداد = متعلمون ظهرت لهم مهام في تلك النافذة (فتحوا الرئيسية أو أكملوا درسًا).",
  );
  out.push("");
  out.push(tableOf(result, TASK_ROWS));
  out.push("");

  out.push("## 5. هل يبقى المتعلم وقتًا أطول؟");
  out.push("");
  out.push(
    "الوقت **تقدير** من تواقيت الأحداث: كل نشاط متقارب (أقل من 4 دقائق بين حدثين) يُعدّ كتلة واحدة، والحدث المنفرد يُحسب دقيقة، ودرس بدأ وانتهى يُحسب بطوله الفعلي. المفيد هنا المقارنة بين «قبل» و«بعد» لا الرقم المطلق.",
  );
  out.push("");
  out.push(tableOf(result, STAY_ROWS));
  out.push("");
  if (context.clarity && context.clarity.length > 0) {
    out.push("**من Clarity (الوقت على الموقع كله):**");
    out.push("");
    out.push(clarityBlock(context.clarity, originMs, nowMs, windowLabel(firstK).slice(0, 10)));
    out.push("");
  }

  out.push("## 6. هل يعود أكثر؟");
  out.push("");
  out.push(tableOf(result, RETURN_ROWS));
  out.push("");
  out.push("**المسجَّلون الجدد (تُحسب دفعة فقط إذا انتهت كل ساعاتها قبل الفتح أو بدأت بعده):**");
  out.push("");
  out.push(
    cohortTable(result.cohorts.nextDay, "العودة في اليوم التالي (الساعات 24–48 بعد التسجيل)"),
  );
  out.push("");
  out.push(cohortTable(result.cohorts.week, "العودة خلال الأسبوع (الأيام 1–7 بعد التسجيل)"));
  out.push("");

  out.push("## 7. هل يحاول الاشتراك أكثر؟");
  out.push("");
  out.push(
    "الطريق: يصادف قفلًا ← يفتح صفحة الترقية ← يضغط الدفع (وهذا يُنشئ طلبًا) ← يدفع. كل نسبة هنا = عدد من فعل ذلك ÷ عدد **المتعلمين النشِطين** في النافذة نفسها (وقد يكون بين من فعله متعلم لم يدرس في تلك النافذة)، ما لم يُذكر غير ذلك. وكل متعلم يُحسب مرة واحدة في النافذة.",
  );
  out.push("");
  out.push(tableOf(result, subscribe));
  out.push("");

  out.push("## 8. كل نافذة على حدة");
  out.push("");
  out.push(windowTable(result));
  out.push("");

  out.push("## 9. متى تصبح كل قراءة موثوقة؟");
  out.push("");
  const after = (days: number) => baghdad(originMs + days * DAY_MS).slice(0, 10);
  out.push(
    "- **الوقت المقدَّر ونسبة المهام والقفل**: أعداد كبيرة كل يوم، فتُقرأ منذ الآن، وتزداد ثقة كلما مرّت نوافذ.",
  );
  out.push(
    `- **العودة في اليوم التالي للجدد**: تتراكم الدفعات يوميًا؛ المقارنة المقنعة تحتاج نحو أسبوع من الدفعات (بعد ${after(8)} تقريبًا).`,
  );
  out.push(
    `- **العودة خلال الأسبوع للجدد**: أول دفعة كاملة بعد ${after(8)}، وقراءة معقولة بعد ${after(15)}.`,
  );
  out.push(
    `- **الدفع الفعلي**: نحو 3 دفعات يوميًا فقط، فلا يُحكم عليه قبل 3–4 أسابيع (${after(25)} تقريبًا)؛ حتى ذلك الحين الأدق هو «يفتحون الترقية / يضغطون الدفع لكل نشِط».`,
  );
  out.push("");
  return out.join("\n");
}
