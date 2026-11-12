import Link from "next/link";
import { ArrowRight, BookmarkCheck, Check } from "lucide-react";

import type { Dictionary } from "@/lib/i18n/dictionary";
import type { SupportLocale } from "@/lib/i18n/locales";
import { STRONG_STRENGTH } from "@/lib/word-mastery/schedule";
import type { BankWordState } from "@/lib/word-bank/select";
import { BANK_ACTIVE_CAP, daysUntil } from "@/lib/word-bank/shelves";
import type { BankOverview, BankShelf, BankShelves } from "@/lib/word-bank/shelves";
import type { BankStrings } from "@/lib/word-bank/strings";
import { firstMetLabel } from "@/lib/word-bank/when-label";
import { cn } from "@/lib/utils";

/** The list's tabs: every word, or one shelf. */
export const BANK_LIST_VIEWS = ["all", "active", "waiting", "stable"] as const;
export type BankListView = (typeof BANK_LIST_VIEWS)[number];

export function isBankListView(value: unknown): value is BankListView {
  return typeof value === "string" && (BANK_LIST_VIEWS as readonly string[]).includes(value);
}

/** The two lighter tones of the balance bar: the brand colour let down into the card. */
const SEGMENT = {
  stable: "var(--primary)",
  active: "color-mix(in oklch, var(--primary) 60%, var(--card))",
  waiting: "color-mix(in oklch, var(--primary) 32%, var(--card))",
} as const;

/** An English title inside a line of the learner's language: its own direction, so the line around it reads right. */
function Title({ children }: { children: string }) {
  return (
    <span dir="ltr" className="text-foreground font-semibold [unicode-bidi:isolate]">
      {children}
    </span>
  );
}

/** "{n} from {title}" with the title set apart (see Title). */
function FromTitle({ template, n, title }: { template: string; n: number; title: string }) {
  const [before = "", after = ""] = template.replace("{n}", String(n)).split("{title}");
  return (
    <>
      {before}
      <Title>{title}</Title>
      {after}
    </>
  );
}

/**
 * The «كلماتي» section's page: today's words and the one button on the left, where the learner's
 * words stand on the right (stable, being learned, waiting), and three tiles that open the list. A
 * server component: nothing on it changes without a new page load. The page never shows a pile: the
 * big number is today's round, five at most (see bankDay).
 */
export function MyWordsOverview({
  overview,
  todayISO,
  locale,
  t,
  s,
  saved = null,
}: {
  overview: BankOverview;
  todayISO: string;
  locale: SupportLocale | null;
  t: Dictionary;
  s: BankStrings;
  /** The words saved with the star (feature "Personal word cards"): when present, a tile at the foot opens them. */
  saved?: SavedWordsTileData | null;
}) {
  const count = overview.today.length;
  const lastReview = overview.lastReviewedOn
    ? s.lastReview.replace(
        "{when}",
        firstMetLabel(overview.lastReviewedOn, todayISO, locale, t.myWords),
      )
    : null;
  const nextIn = overview.nextDueOn ? daysUntil(overview.nextDueOn, todayISO) : null;

  return (
    <div className="mx-auto w-full max-w-[1060px] px-4 pt-4 pb-10 md:px-6 md:pt-6">
      <div className="mb-3.5 md:mb-5 md:min-h-[52px]">
        <h1 className="text-left text-2xl leading-[1.2] font-semibold tracking-[-0.01em] md:text-[28px]">
          <span dir="auto">{t.myWords.title}</span>
        </h1>
        <p
          className="text-muted-foreground mt-1 max-w-[640px] text-left text-sm max-md:hidden"
          dir="auto"
        >
          {s.sub}
        </p>
      </div>

      {overview.total === 0 ? (
        <div className="bg-card border-border rounded-2xl border px-7 py-[26px]">
          <p className="text-left text-[22px] font-semibold" dir="auto">
            {s.emptyTitle}
          </p>
          <p className="text-muted-foreground mt-1.5 max-w-[560px] text-left text-sm" dir="auto">
            {s.emptyBody}
          </p>
          <Link
            href="/learn/stories"
            className="text-primary mt-4 inline-flex items-center gap-1 text-[13px] font-semibold"
          >
            <span dir="auto">{s.emptyAction}</span>
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <>
          <div className="md:bg-card md:border-border grid gap-3 md:grid-cols-[1.25fr_1fr] md:gap-0 md:rounded-2xl md:border">
            <section className="max-md:bg-card max-md:border-border md:border-border p-[18px] max-md:rounded-2xl max-md:border md:border-e md:px-7 md:py-[26px]">
              <p
                className="text-muted-foreground mb-2.5 text-left text-[12.5px] font-semibold"
                dir="auto"
              >
                {s.today}
              </p>
              {count > 0 ? (
                <>
                  <p className="flex items-baseline gap-3">
                    <span className="text-[64px] leading-none font-semibold tracking-[-0.02em] tabular-nums">
                      {count}
                    </span>
                    <span className="text-[22px] font-semibold" dir="auto">
                      {s.todayLabel(count)}
                    </span>
                  </p>
                  <p className="text-muted-foreground mt-2 text-left text-[13px]" dir="auto">
                    {lastReview ? `${s.minutes(count)} · ${lastReview}` : s.minutes(count)}
                  </p>
                  <p
                    className="text-muted-foreground mt-2.5 text-left text-[13px] leading-[1.8]"
                    dir="auto"
                  >
                    {overview.todaySources.slice(0, 3).map((source, index) => (
                      <span key={`${source.source}:${source.lessonTitle ?? ""}`}>
                        {index > 0 && " · "}
                        {source.lessonTitle ? (
                          <FromTitle
                            template={s.fromTitle}
                            n={source.count}
                            title={source.lessonTitle}
                          />
                        ) : (
                          s.fromSource[source.source].replace("{n}", String(source.count))
                        )}
                      </span>
                    ))}
                  </p>
                  <Link
                    href="/learn/words/review"
                    prefetch={false}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring mt-4 inline-flex h-12 w-full items-center justify-center rounded-[10px] px-6 text-[15px] font-semibold whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2 md:h-11 md:w-auto"
                  >
                    <span dir="auto">{s.start}</span>
                  </Link>
                </>
              ) : (
                <>
                  <p className="flex items-center gap-2.5 text-[22px] font-semibold">
                    {overview.askedToday > 0 && (
                      <Check className="text-success size-6 shrink-0" aria-hidden="true" />
                    )}
                    <span dir="auto">{overview.askedToday > 0 ? s.doneToday : s.nothingDue}</span>
                  </p>
                  {nextIn !== null && (
                    <p className="text-muted-foreground mt-2 text-left text-[13px]" dir="auto">
                      {nextIn <= 1 ? s.nextTomorrow : s.nextInDays(nextIn)}
                    </p>
                  )}
                </>
              )}
            </section>

            <section className="max-md:bg-card max-md:border-border flex flex-col justify-center p-5 max-md:rounded-2xl max-md:border md:px-7 md:py-[26px]">
              <p className="flex items-baseline gap-2.5 md:block">
                <span className="text-[40px] leading-none font-semibold tracking-[-0.02em] tabular-nums md:text-5xl">
                  {overview.stable}
                </span>
                <span
                  className="text-muted-foreground text-left text-[15px] md:mt-1.5 md:block"
                  dir="auto"
                >
                  {s.stableLabel(overview.stable)}
                </span>
              </p>
              <div className="mt-4 flex h-2.5 gap-[3px]" aria-hidden="true">
                {(["stable", "active", "waiting"] as const).map((shelf) =>
                  overview[shelf] > 0 ? (
                    <i
                      key={shelf}
                      className="block rounded-full transition-[flex-grow] duration-[400ms]"
                      style={{ flexGrow: overview[shelf], background: SEGMENT[shelf] }}
                    />
                  ) : null,
                )}
              </div>
              <p className="text-muted-foreground mt-2.5 flex flex-wrap gap-x-[18px] gap-y-1 text-[13px]">
                <Legend color={SEGMENT.stable}>
                  {s.legendStable.replace("{n}", String(overview.stable))}
                </Legend>
                <Legend color={SEGMENT.active}>
                  {s.legendActive
                    .replace("{n}", String(overview.active))
                    .replace("{cap}", String(BANK_ACTIVE_CAP))}
                </Legend>
                <Legend color={SEGMENT.waiting}>
                  {s.legendWaiting.replace("{n}", String(overview.waiting))}
                </Legend>
              </p>
              {overview.waiting > 0 && (
                <p className="text-muted-foreground mt-2.5 text-left text-[12.5px]" dir="auto">
                  {s.waitingNote}
                </p>
              )}
            </section>
          </div>

          <div className="mt-3 grid gap-3 md:mt-4 md:grid-cols-3 md:gap-4">
            <Tile
              href="/learn/words?show=active"
              title={s.activeTitle}
              sub={s.activeSub
                .replace("{count}", s.words(overview.active))
                .replace("{cap}", String(BANK_ACTIVE_CAP))}
              show={s.show}
            />
            <Tile
              href="/learn/words?show=waiting"
              title={s.waitingTitle}
              sub={s.waitingSub.replace("{count}", s.words(overview.waiting))}
              show={s.show}
            />
            <Tile
              href="/learn/words?show=stable"
              title={s.stableTitle}
              sub={s.stableSub.replace("{count}", s.words(overview.stable))}
              show={s.show}
            />
          </div>
        </>
      )}
      {saved && <SavedWordsTile saved={saved} t={t} />}
    </div>
  );
}

/** What the saved-words tile shows: how many words, and the newest few. */
export interface SavedWordsTileData {
  count: number;
  latest: readonly string[];
}

/**
 * The place inside «كلماتي» for the words a learner saves with the star in a lesson: a card with
 * how many are saved, the newest few as chips, and a link to the full list (due words, practice and
 * the Anki export live there). Always shown for a learner the feature is open to, empty or not, so
 * the place is found before the first word is saved.
 */
function SavedWordsTile({ saved, t }: { saved: SavedWordsTileData; t: Dictionary }) {
  return (
    <Link
      href="/learn/words/saved"
      prefetch={false}
      className="bg-card border-border hover:border-primary/40 focus-visible:ring-ring mt-3 flex items-center gap-4 rounded-2xl border px-[18px] py-4 transition-colors duration-150 outline-none focus-visible:ring-2 md:mt-4 md:px-7"
    >
      <BookmarkCheck className="text-primary size-6 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-left text-[15px] font-semibold" dir="auto">
          {t.myCards.title}
        </span>
        <span className="text-muted-foreground mt-0.5 block text-left text-[13px]" dir="auto">
          {saved.count > 0
            ? t.myCards.savedTileCount.replace("{n}", String(saved.count))
            : t.myCards.emptyBody}
        </span>
        {saved.latest.length > 0 && (
          <span className="mt-2 flex flex-wrap gap-1.5" dir="ltr">
            {saved.latest.map((word) => (
              <span
                key={word}
                className="bg-muted text-foreground rounded-full px-2.5 py-0.5 text-[12.5px] font-medium"
              >
                {word}
              </span>
            ))}
          </span>
        )}
      </span>
      <span className="text-primary flex shrink-0 items-center gap-1 text-[13px] font-semibold">
        <span dir="auto">{t.myCards.openSaved}</span>
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

function Legend({ color, children }: { color: string; children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i className="block size-2 rounded-full" style={{ background: color }} aria-hidden="true" />
      <span dir="auto">{children}</span>
    </span>
  );
}

function Tile({
  href,
  title,
  sub,
  show,
}: {
  href: string;
  title: string;
  sub: string;
  show: string;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="bg-card border-border hover:border-primary/40 focus-visible:ring-ring block rounded-2xl border px-[18px] py-3.5 transition-colors duration-150 outline-none focus-visible:ring-2"
    >
      <span className="block text-left text-[14.5px] font-semibold" dir="auto">
        {title}
      </span>
      <span className="text-muted-foreground mt-0.5 block text-left text-[13px]" dir="auto">
        {sub}
      </span>
      <span className="text-primary mt-2.5 flex items-center gap-1 text-[13px] font-semibold">
        <span dir="auto">{show}</span>
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

/** One lesson's words in the list. */
interface ListGroup {
  key: string;
  title: string | null;
  source: BankWordState["source"];
  /** The latest day one of its words was first met: the newest lesson comes first. */
  latest: string;
  words: BankWordState[];
}

function groupByLesson(words: readonly BankWordState[]): ListGroup[] {
  const groups = new Map<string, ListGroup>();
  for (const word of words) {
    const title = word.lessonTitle?.trim() || null;
    const key = title ? `t:${title}` : `s:${word.source}`;
    const group = groups.get(key);
    if (group) {
      group.words.push(word);
      if (word.firstSeenOn > group.latest) group.latest = word.firstSeenOn;
    } else {
      groups.set(key, {
        key,
        title,
        source: word.source,
        latest: word.firstSeenOn,
        words: [word],
      });
    }
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      words: [...group.words].sort((a, b) => a.word.localeCompare(b.word)),
    }))
    .sort((a, b) => b.latest.localeCompare(a.latest) || a.key.localeCompare(b.key));
}

/**
 * Every target word the learner has met, under the name of its lesson: the word, its meaning, the
 * sentence it was met in, how strong it is and when it comes back. To look at only: a word is
 * reviewed from the page's one button.
 */
export function MyWordsList({
  shelves,
  view,
  todayISO,
  t,
  s,
}: {
  shelves: BankShelves;
  view: BankListView;
  todayISO: string;
  t: Dictionary;
  s: BankStrings;
}) {
  const shelfOf = new Map<string, BankShelf>();
  for (const shelf of ["stable", "active", "waiting"] as const) {
    for (const word of shelves[shelf]) shelfOf.set(word.word, shelf);
  }
  const everything = [...shelves.active, ...shelves.waiting, ...shelves.stable];
  const shown = view === "all" ? everything : shelves[view];
  const tabs: { view: BankListView; label: string; count: number }[] = [
    { view: "all", label: s.tabAll, count: everything.length },
    { view: "active", label: s.activeTitle, count: shelves.active.length },
    { view: "waiting", label: s.waitingTitle, count: shelves.waiting.length },
    { view: "stable", label: s.stableTitle, count: shelves.stable.length },
  ];

  function when(word: BankWordState): string {
    const shelf = shelfOf.get(word.word);
    if (shelf === "waiting") return s.waitingTitle;
    if (shelf === "stable") return s.stableTitle;
    const days = daysUntil(word.dueOn, todayISO);
    return days <= 0 ? s.dueToday : days === 1 ? s.dueTomorrow : s.dueInDays(days);
  }

  return (
    <div className="mx-auto w-full max-w-[1060px] px-4 pt-4 pb-10 md:px-6 md:pt-6">
      <Link
        href="/learn/words"
        prefetch={false}
        className="hover:text-primary mb-3.5 inline-flex items-center gap-2 text-2xl leading-[1.2] font-semibold tracking-[-0.01em] transition-colors duration-150 md:mb-5 md:text-[28px]"
      >
        <ArrowRight className="text-muted-foreground size-5 rotate-180" aria-hidden="true" />
        <span dir="auto">{t.myWords.title}</span>
      </Link>

      <nav className="mb-3.5 flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <Link
            key={tab.view}
            href={`/learn/words?show=${tab.view}`}
            prefetch={false}
            aria-current={tab.view === view ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3.5 py-[5px] text-[13px] font-medium transition-colors duration-150",
              tab.view === view
                ? "bg-brand-muted text-primary border-transparent"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <span dir="auto">{tab.label}</span>
            <b className="font-semibold tabular-nums">{tab.count}</b>
          </Link>
        ))}
      </nav>

      {shown.length === 0 ? (
        <p className="text-muted-foreground bg-card border-border rounded-2xl border px-5 py-6 text-left text-sm">
          <span dir="auto">{s.listEmpty}</span>
        </p>
      ) : (
        <div className="bg-card border-border overflow-hidden rounded-2xl border">
          {groupByLesson(shown).map((group, index) => (
            <section key={group.key} className={cn(index > 0 && "border-border/60 border-t")}>
              <h2 className="text-muted-foreground px-5 pt-3 pb-1 text-left text-xs font-semibold">
                {group.title ? (
                  <>
                    <span dir="ltr">{group.title}</span>
                    {" · "}
                    <span dir="auto">{s.kind[group.source]}</span>
                  </>
                ) : (
                  <span dir="auto">{s.kind[group.source]}</span>
                )}
              </h2>
              <ul>
                {group.words.map((word) => (
                  <li
                    key={word.word}
                    className="border-border/60 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3.5 border-t px-5 py-3 first:border-t-0 md:grid-cols-[150px_120px_minmax(0,1fr)_70px_96px]"
                  >
                    <span className="truncate text-[15px] font-semibold" dir="ltr">
                      {word.word}
                    </span>
                    <span
                      className="text-muted-foreground truncate text-left text-[13.5px]"
                      dir="auto"
                    >
                      {word.ar}
                    </span>
                    <span
                      className="text-muted-foreground truncate text-[13px] max-md:hidden"
                      dir="ltr"
                    >
                      {word.homeSentence ?? ""}
                    </span>
                    <span className="flex gap-[3px] max-md:hidden" aria-hidden="true">
                      {Array.from({ length: STRONG_STRENGTH }, (_, pip) => (
                        <i
                          key={pip}
                          className={cn(
                            "block h-[5px] w-2.5 rounded-full",
                            pip < word.strength ? "bg-primary" : "bg-border",
                          )}
                        />
                      ))}
                    </span>
                    <span className="text-muted-foreground text-right text-[13px]" dir="auto">
                      {when(word)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
