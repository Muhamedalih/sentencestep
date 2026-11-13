"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Lock, Search } from "lucide-react";

import { TopicPicture, ProgressRing } from "@/components/words/map/map-parts";
import { coverTones } from "@/components/words/word-cover-art";
import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { difficultyForLevel, tierLabel, tierSupportLabel } from "@/lib/levels";
import { cn } from "@/lib/utils";
import type { MapTopic, WordsMapData } from "@/lib/words-map/load";
import { wordsMapStrings } from "@/lib/words-map/strings";
import { listWords, summarizeMap } from "@/lib/words-map/state";
import type { ListFilter, MapGroup, MapWordState, StateCounts } from "@/lib/words-map/state";

const LEVELS = [1, 2, 3] as const;
const PAGE = 60;
/** The band's colours are the Words banner's own (it is the same band in both themes). */
const BAND = "bg-[#1f4a39] text-[#f1efe6]";

/** How many circles fit a row: five on a laptop and a tablet, three on a phone. */
function useColumns(): 3 | 5 {
  const [columns, setColumns] = useState<3 | 5>(5);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setColumns(query.matches ? 5 : 3);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return columns;
}

const PIPS: Record<MapWordState, number> = { unseen: 0, new: 1, settling: 2, stable: 4 };

/**
 * The Map tab of the Words page («الخريطة», the wordsMap permission): a green band with today's
 * session and its one button, the topics of one level as a path of circles (each with its drawing and
 * a progress ring), and a second view that lists every word with a search and filters. Everything it
 * shows is read; the session opens on its own page. The figures are worked out here from what the
 * server read (see lib/words-map/state.ts).
 */
export function WordsMapView({
  data,
  isPremiumUser,
  initialView = "map",
}: {
  data: WordsMapData;
  isPremiumUser: boolean;
  /** "list" opens the word list directly (where a one-word round sends the learner back to). */
  initialView?: "map" | "list";
}) {
  const { locale } = useLocale();
  const s = wordsMapStrings(locale);
  const topicById = useMemo(
    () => new Map(data.topics.map((topic) => [topic.id, topic])),
    [data.topics],
  );
  const groups = useMemo<MapGroup[]>(
    () =>
      data.topics.map((topic) => ({
        id: topic.id,
        level: topic.level,
        order: topic.order,
        wordIds: [],
      })),
    [data.topics],
  );
  const figures = useMemo(
    () => summarizeMap(groups, data.words, data.shelf, new Set(data.completed)),
    [groups, data.words, data.shelf, data.completed],
  );
  const sessionTopics = useMemo(
    () => new Set(data.session.map((word) => word.groupId)),
    [data.session],
  );

  const firstLevel = topicById.get(data.session[0]?.groupId ?? "")?.level ?? 1;
  const [view, setView] = useState<"map" | "list">(initialView);
  const [level, setLevel] = useState<number>(initialView === "list" ? 0 : firstLevel);

  const levelLabel = (value: number) =>
    locale
      ? tierSupportLabel(difficultyForLevel(value), locale)
      : tierLabel(difficultyForLevel(value)).label;

  return (
    <div>
      <Band
        figures={figures.all}
        session={data.session}
        topicById={topicById}
        isPremiumUser={isPremiumUser}
      />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="bg-muted flex rounded-[10px] p-[3px]">
          {(view === "list" ? [0, ...LEVELS] : [...LEVELS]).map((value) => {
            const counts = value === 0 ? figures.all : figures.byLevel.get(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => setLevel(value)}
                aria-pressed={level === value}
                className={cn(
                  "flex items-baseline gap-2 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-150 md:px-4",
                  level === value
                    ? "bg-brand-muted text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span dir="auto">{value === 0 ? s.levelAll : levelLabel(value)}</span>
                {view === "map" && counts && (
                  <bdi dir="ltr" className="text-[11.5px] font-medium opacity-80">
                    {counts.met} / {counts.total}
                  </bdi>
                )}
              </button>
            );
          })}
        </div>
        <div
          role="group"
          aria-label={s.viewsLabel}
          className="bg-muted flex rounded-[10px] p-[3px]"
        >
          {(["map", "list"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setView(value);
                setLevel(value === "list" ? 0 : (firstLevel ?? 1));
              }}
              aria-pressed={view === value}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-150",
                view === value
                  ? "bg-brand-muted text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span dir="auto">{value === "map" ? s.viewMap : s.viewList}</span>
            </button>
          ))}
        </div>
      </div>

      {view === "map" ? (
        <Board
          topics={data.topics.filter((topic) => topic.level === level)}
          counts={figures.byTopic}
          sessionTopics={sessionTopics}
          isPremiumUser={isPremiumUser}
        />
      ) : (
        <List
          data={data}
          groups={groups}
          topicById={topicById}
          stateOf={figures.stateOf}
          counts={figures.all}
          level={level}
          isPremiumUser={isPremiumUser}
        />
      )}
    </div>
  );
}

function topicHref(topic: MapTopic, wordLadder: boolean) {
  return wordLadder ? `/learn/word-lists/${topic.id}` : `/learn/word-lists/${topic.id}/words`;
}

/** The green band: how many words the learner has, how they stand, today's four on the shelf and the button. */
function Band({
  figures,
  session,
  topicById,
  isPremiumUser,
}: {
  figures: StateCounts;
  session: WordsMapData["session"];
  topicById: Map<string, MapTopic>;
  isPremiumUser: boolean;
}) {
  const { locale } = useLocale();
  const s = wordsMapStrings(locale);
  const shown = session.filter((word) => {
    const topic = topicById.get(word.groupId);
    return topic && (topic.isFree || isPremiumUser);
  });
  return (
    <section
      dir="ltr"
      className={cn(
        "relative mt-5 flex flex-col gap-4 overflow-hidden rounded-[18px] px-5 pt-5 pb-5 xl:min-h-[206px] xl:flex-row xl:items-center xl:gap-7 xl:px-0 xl:py-0 xl:pl-[34px]",
        BAND,
      )}
    >
      <div className="grid shrink-0 justify-items-start gap-3.5">
        <p className="flex items-baseline gap-3">
          <span className="text-[52px] leading-none font-extrabold tracking-[-0.03em] xl:text-[76px]">
            {figures.met}
          </span>
          <span className="text-[17px] font-semibold" dir="auto">
            {s.learned}
          </span>
        </p>
        <span
          className="rounded-lg bg-white/10 px-3 py-[5px] text-[13.5px] font-semibold text-[#c2e5d1]"
          dir="auto"
        >
          {s.bandLine(figures.settling, figures.new)}
        </span>
      </div>

      {shown.length > 0 ? (
        <Link
          href="/learn/word-lists/session"
          prefetch={false}
          className="rounded-xl bg-[#f3efe3] px-[26px] py-[13px] text-center text-base font-bold whitespace-nowrap text-[#17261e] shadow-[0_2px_0_rgba(0,0,0,0.18)] outline-none focus-visible:ring-2 focus-visible:ring-[#f3efe3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1f4a39] xl:ms-auto"
        >
          <span dir="auto">{s.startSession}</span>
        </Link>
      ) : (
        <span className="text-[15px] font-semibold text-[#c2e5d1] xl:ms-auto" dir="auto">
          {s.noneLeft}
        </span>
      )}

      <div className="flex items-end gap-1.5 self-start pb-0 xl:gap-3 xl:self-stretch xl:pt-[22px] xl:pr-[30px] xl:pl-2">
        {shown.map((word) => {
          const topic = topicById.get(word.groupId)!;
          return (
            <div key={word.id} className="flex w-[72px] flex-col gap-0.5 xl:w-[112px]">
              <span className="relative mb-1.5 block h-[56px] w-full overflow-hidden rounded-[10px] shadow-[0_0_0_1px_rgba(255,255,255,0.16),0_6px_14px_rgba(0,0,0,0.28)] xl:h-[84px] xl:rounded-xl">
                <TopicPicture topic={topic} />
              </span>
              <b
                className="truncate text-[12.5px] leading-tight font-bold xl:text-[15px]"
                dir="ltr"
              >
                {word.word}
              </b>
              <i
                className="hidden truncate text-[11px] text-[#9fc7b2] not-italic xl:block"
                dir="ltr"
              >
                {topic.title}
              </i>
            </div>
          );
        })}
      </div>
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-black/[0.22]" />
    </section>
  );
}

/** The topics of a level as a path of circles, started ones first, snaking row by row. */
function Board({
  topics,
  counts,
  sessionTopics,
  isPremiumUser,
}: {
  topics: MapTopic[];
  counts: Map<string, StateCounts>;
  sessionTopics: ReadonlySet<string>;
  isPremiumUser: boolean;
}) {
  const { locale } = useLocale();
  const s = wordsMapStrings(locale);
  const { rollouts } = useFeatures();
  const columns = useColumns();

  const ordered = useMemo(() => {
    const ratio = (topic: MapTopic) =>
      topic.total === 0 ? 0 : (counts.get(topic.id)?.met ?? 0) / topic.total;
    const begun = topics.filter((topic) => (counts.get(topic.id)?.met ?? 0) > 0);
    const rest = topics.filter((topic) => (counts.get(topic.id)?.met ?? 0) === 0);
    return [
      ...begun.sort((a, b) => ratio(b) - ratio(a) || a.order - b.order),
      ...rest.sort((a, b) => a.order - b.order),
    ];
  }, [topics, counts]);

  const placed = ordered.map((topic, index) => {
    const row = Math.floor(index / columns);
    const slot = index % columns;
    const column = row % 2 === 0 ? slot : columns - 1 - slot;
    return { topic, row, column, forward: row % 2 === 0 };
  });

  return (
    <div
      dir="ltr"
      className="mt-6 grid"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {placed.map(({ topic, row, column, forward }, index) => {
        const met = counts.get(topic.id)?.met ?? 0;
        const total = topic.total;
        const locked = !topic.isFree && !isPremiumUser;
        const finished = !locked && total > 0 && met >= total;
        const next = placed[index + 1];
        const prev = placed[index - 1];
        const nextBegun = next ? (counts.get(next.topic.id)?.met ?? 0) > 0 : false;
        const thisBegun = met > 0;
        const lane = (on: boolean) => (on ? "border-primary/80" : "border-border");
        const sameRowNext = next && next.row === row;
        const sameRowPrev = prev && prev.row === row;
        const turnsDown = next && next.row !== row;
        const turnsFromAbove = prev && prev.row !== row;
        return (
          <div
            key={topic.id}
            className="relative flex flex-col items-center px-1 pt-2 pb-6"
            style={{ gridRow: row + 1, gridColumn: column + 1 }}
          >
            {sameRowNext && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-[50px] h-0 border-t-[3px] border-dotted md:top-[62px]",
                  forward ? "right-0 left-1/2" : "right-1/2 left-0",
                  lane(nextBegun),
                )}
              />
            )}
            {sameRowPrev && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-[50px] h-0 border-t-[3px] border-dotted md:top-[62px]",
                  forward ? "right-1/2 left-0" : "right-0 left-1/2",
                  lane(thisBegun),
                )}
              />
            )}
            {turnsDown && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-[50px] bottom-0 left-1/2 w-0 border-l-[3px] border-dotted md:top-[62px]",
                  lane(nextBegun),
                )}
              />
            )}
            {turnsFromAbove && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-0 left-1/2 h-[50px] w-0 border-l-[3px] border-dotted md:h-[62px]",
                  lane(thisBegun),
                )}
              />
            )}
            <Link
              href={
                locked ? `/learn/word-lists/${topic.id}` : topicHref(topic, rollouts.wordLadder)
              }
              prefetch={false}
              aria-label={topic.title}
              className="focus-visible:ring-ring focus-visible:ring-offset-background group relative z-10 flex flex-col items-center rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <span className="bg-background relative block size-[84px] rounded-full md:size-[108px]">
                <ProgressRing ratio={total === 0 ? 0 : met / total} size={108} stroke={5} />
                <span className="absolute inset-[6px] block overflow-hidden rounded-full md:inset-2">
                  <TopicPicture topic={topic} dimmed={locked || (!thisBegun && !finished)} />
                </span>
                {locked && (
                  <span className="absolute inset-0 grid place-items-center">
                    <Lock className="size-5 text-white/90" aria-hidden="true" />
                  </span>
                )}
                {finished && (
                  <span className="bg-success text-background absolute -right-0.5 bottom-1 grid size-6 place-items-center rounded-full ring-[3px] ring-[var(--background)]">
                    <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                  </span>
                )}
                {sessionTopics.has(topic.id) && (
                  <em
                    dir="auto"
                    className="bg-primary text-primary-foreground absolute -top-1 -right-2 rounded-full px-2 py-px text-[10px] font-bold not-italic ring-[3px] ring-[var(--background)] md:text-[11.5px]"
                  >
                    {s.today}
                  </em>
                )}
              </span>
              <span
                dir="ltr"
                className={cn(
                  "mt-2.5 max-w-full truncate text-[12.5px] font-semibold tracking-[-0.005em] md:text-[15.5px]",
                  !thisBegun && !finished && "text-muted-foreground",
                )}
              >
                {topic.title}
              </span>
              {topic.supportTitle && (
                <span
                  dir="auto"
                  className="text-muted-foreground hidden max-w-full truncate text-[12.5px] md:block"
                >
                  {topic.supportTitle}
                </span>
              )}
              <span
                dir="ltr"
                className={cn(
                  "text-muted-foreground mt-0.5 text-xs tabular-nums",
                  !thisBegun && "opacity-60",
                )}
              >
                {met} / {total}
              </span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

/** Every word of the level (or of all), with a search and the state filters; sixty at a time. */
function List({
  data,
  groups,
  topicById,
  stateOf,
  counts,
  level,
  isPremiumUser,
}: {
  data: WordsMapData;
  groups: MapGroup[];
  topicById: Map<string, MapTopic>;
  stateOf: Map<string, MapWordState>;
  counts: StateCounts;
  level: number;
  isPremiumUser: boolean;
}) {
  const { locale } = useLocale();
  const s = wordsMapStrings(locale);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ListFilter>("all");
  const [shown, setShown] = useState(PAGE);
  useEffect(() => setShown(PAGE), [query, filter, level]);

  const sessionIds = useMemo(() => data.session.map((word) => word.id), [data.session]);
  const sessionSet = useMemo(() => new Set(sessionIds), [sessionIds]);
  const rows = useMemo(
    () => listWords(data.words, groups, stateOf, { query, filter, level, firstIds: sessionIds }),
    [data.words, groups, stateOf, query, filter, level, sessionIds],
  );
  const filters: { id: ListFilter; label: string; count: number }[] = [
    { id: "all", label: s.filterAll, count: counts.total },
    { id: "new", label: s.state.new, count: counts.new },
    { id: "settling", label: s.state.settling, count: counts.settling },
    { id: "stable", label: s.state.stable, count: counts.stable },
    { id: "unseen", label: s.state.unseen, count: counts.unseen },
  ];

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="border-border bg-card text-muted-foreground flex h-10 w-full items-center gap-2 rounded-[10px] border px-3 text-[13.5px] sm:w-[250px]">
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={s.searchPlaceholder(counts.total)}
            dir="auto"
            className="text-foreground placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              aria-pressed={filter === item.id}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-semibold transition-colors",
                filter === item.id
                  ? "bg-brand-muted text-primary border-transparent"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <span dir="auto">{item.label}</span>
              <bdi dir="ltr" className="opacity-80">
                {item.count}
              </bdi>
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground py-14 text-center text-sm" dir="auto">
          {s.listEmpty}
        </p>
      ) : (
        <div
          dir="ltr"
          className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        >
          {rows.slice(0, shown).map((word) => {
            const topic = topicById.get(word.g);
            const state = stateOf.get(word.id) ?? "unseen";
            const today = sessionSet.has(word.id);
            const locked = topic ? !topic.isFree && !isPremiumUser : false;
            const cardClass = cn(
              locked && "cursor-not-allowed opacity-60",
              "bg-card hover:border-foreground/25 flex min-h-[112px] flex-col gap-0.5 rounded-[14px] border px-3.5 py-3 text-left transition-colors",
              today ? "border-primary/50" : "border-border",
              state === "unseen" && !today && "bg-transparent opacity-70",
            );
            const inner = (
              <>
                <span className="text-muted-foreground flex items-center gap-1.5 text-[11.5px]">
                  <i
                    className="size-2 shrink-0 rounded-full"
                    style={{
                      background: topic ? coverTones(topic.title, topic.level).main : undefined,
                    }}
                  />
                  <span className="truncate">{topic?.title}</span>
                  {today && (
                    <em
                      dir="auto"
                      className="bg-brand-muted text-primary ms-auto rounded-full px-2 py-px text-[10.5px] font-bold not-italic"
                    >
                      {s.today}
                    </em>
                  )}
                </span>
                <span className="mt-1 text-[21px] leading-tight font-semibold tracking-[-0.01em]">
                  {word.w}
                </span>
                <span
                  dir="auto"
                  className="text-muted-foreground line-clamp-2 text-[13px] leading-snug"
                >
                  {word.m}
                </span>
                <span className="text-muted-foreground mt-auto flex items-center gap-2 pt-2 text-[11.5px]">
                  <span className="flex gap-[3px]" aria-hidden="true">
                    {[1, 2, 3, 4].map((step) => (
                      <i
                        key={step}
                        className={cn(
                          "h-[5px] w-3.5 rounded-[3px]",
                          step <= PIPS[state] ? "bg-primary" : "bg-muted",
                        )}
                      />
                    ))}
                  </span>
                  {locked && <Lock className="size-3.5" aria-hidden="true" />}
                  <span dir="auto">{today ? s.startsToday : s.state[state]}</span>
                </span>
              </>
            );
            return locked ? (
              <div key={word.id} aria-disabled="true" className={cardClass}>
                {inner}
              </div>
            ) : (
              <Link
                key={word.id}
                href={`/learn/word-lists/word/${word.id}?g=${word.g}`}
                prefetch={false}
                className={cardClass}
              >
                {inner}
              </Link>
            );
          })}
        </div>
      )}
      {rows.length > shown && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setShown((count) => count + PAGE)}
            className="border-border text-muted-foreground hover:text-foreground rounded-full border px-5 py-2 text-[13px] font-semibold"
          >
            <bdi dir="ltr">
              {shown} / {rows.length}
            </bdi>
          </button>
        </div>
      )}
    </div>
  );
}
