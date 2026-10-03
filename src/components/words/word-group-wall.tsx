"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, GraduationCap, Layers, PencilLine, Target } from "lucide-react";

import { MasteryRankBadge } from "@/components/words/mastery-rank-badge";
import { CountUp } from "@/components/words/count-up";
import { MasteryRing } from "@/components/words/mastery-ring";
import { StrengthPips } from "@/components/words/strength-pips";
import { WordPosBadge } from "@/components/words/word-pos-badge";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { useWordProgress } from "@/hooks/use-word-progress";
import { difficultyForLevel, tierSupportLabel } from "@/lib/levels";
import { TIER_BADGE_CLASS } from "@/lib/tier-colors";
import { cn } from "@/lib/utils";
import { splitWordHint } from "@/lib/word-lists-hint";
import { formatIpa } from "@/lib/word-lists-ipa";
import {
  bandOf,
  isWeak,
  masteredPercent,
  nextRank,
  rankFor,
  selectWeakWords,
  strengthPips,
  summarizeBands,
} from "@/lib/word-mastery/dashboard";
import type { Bands, WordBand } from "@/lib/word-mastery/dashboard";
import type { MasteryState } from "@/lib/word-mastery/schedule";
import type { VocabularyWord, WordGroup } from "@/types/word-lists";

type Filter = "all" | WordBand;

const BAND_TILE_CLASS: Record<WordBand, string> = {
  new: "border-dashed border-border bg-card",
  learning: "border-primary/30 bg-primary/[0.06]",
  mastered: "border-success/35 bg-success/[0.07]",
};

const BAND_BAR_CLASS: Record<WordBand, string> = {
  new: "bg-muted-foreground/40",
  learning: "bg-primary",
  mastered: "bg-success",
};

/**
 * The redesigned topic page — the "word wall": every word of a topic as a tile
 * showing how strong it is (five bars), what it means, how it sounds and what
 * kind of word it is, above a header with the topic's mastery ring, counted
 * figures and rank, and the ways in: Learn, Continue, review the whole list and
 * "practice the weak ones only".
 *
 * `states` is the learner's schedule for this topic's words (null for a guest or
 * when Smart word practice is off). Without it the wall shows local progress —
 * a word typed right at least once is "learning", and nothing is claimed as
 * mastered or weak, so those two ways in are simply not offered.
 */
export function WordGroupWall({
  group,
  states,
  today,
}: {
  group: WordGroup;
  states: Readonly<Record<string, MasteryState>> | null;
  /** The learner's calendar date, "YYYY-MM-DD" — what "due" is measured against. */
  today: string;
}) {
  const { locale, dir, t } = useLocale();
  const copy = t.wordLists.redesign;
  const { isLoaded, isWordCompleted } = useWordProgress();
  const [filter, setFilter] = useState<Filter>("all");

  const scheduled = states !== null;
  const stateMap = useMemo(() => new Map(Object.entries(states ?? {})), [states]);
  const words = useMemo(() => [...group.words].sort((a, b) => a.order - b.order), [group.words]);

  const bandFor = (word: VocabularyWord): WordBand => {
    if (scheduled) return bandOf(stateMap.get(word.id));
    return isLoaded && isWordCompleted(word.id) ? "learning" : "new";
  };

  const bands: Bands = scheduled
    ? summarizeBands(
        words.map((word) => word.id),
        stateMap,
      )
    : words.reduce<Bands>(
        (sum, word) => {
          sum[bandFor(word)] += 1;
          return sum;
        },
        { total: words.length, new: 0, learning: 0, mastered: 0 },
      );

  const dueCount = scheduled
    ? words.filter((word) => {
        const state = stateMap.get(word.id);
        return state !== undefined && state.dueOn <= today;
      }).length
    : 0;
  const weakCount = scheduled ? selectWeakWords(words, stateMap).length : 0;
  const percent = masteredPercent(bands);
  const rank = scheduled ? rankFor(bands) : "none";
  const next = scheduled ? nextRank(bands) : null;
  const rankNames = {
    bronze: copy.rankBronze,
    silver: copy.rankSilver,
    gold: copy.rankGold,
  };

  const difficulty = difficultyForLevel(group.level);
  const tierText = locale ? tierSupportLabel(difficulty, locale) : "";
  const supportTitle = group.supportTitle ?? group.title;
  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  const shown = words.filter((word) => filter === "all" || bandFor(word) === filter);
  const filters: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: copy.filterAll, count: bands.total },
    { value: "new", label: copy.bandNew, count: bands.new },
    { value: "learning", label: copy.bandLearning, count: bands.learning },
    { value: "mastered", label: copy.bandMastered, count: bands.mastered },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
      <Link
        href="/learn/word-lists"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm font-medium"
        dir={dir}
      >
        <BackArrow className="size-4" aria-hidden="true" />
        {copy.backToTopics}
      </Link>

      <header className="border-border/60 bg-card mb-8 flex flex-col gap-6 rounded-2xl border p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
          <MasteryRing
            bands={bands}
            size={120}
            stroke={11}
            label={
              scheduled
                ? copy.ringAria
                    .replace("{mastered}", String(bands.mastered))
                    .replace("{total}", String(bands.total))
                : copy.ringAriaNoSchedule
                    .replace("{done}", String(bands.total - bands.new))
                    .replace("{total}", String(bands.total))
            }
          >
            <span className="text-3xl font-bold tabular-nums" dir="ltr">
              <CountUp value={percent} />
              <span className="text-muted-foreground text-base font-semibold">%</span>
            </span>
          </MasteryRing>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  TIER_BADGE_CLASS[difficulty],
                )}
                dir={dir}
              >
                {tierText}
              </span>
              <MasteryRankBadge rank={rank} size="md" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight" dir="ltr">
              {group.title}
            </h1>
            <p className="text-muted-foreground mt-0.5" dir={dir}>
              {supportTitle}
            </p>
            {scheduled && (
              <p className="text-muted-foreground mt-2 text-sm" dir={dir}>
                {next
                  ? copy.rankNext
                      .replace("{n}", String(next.wordsToGo))
                      .replace("{rank}", rankNames[next.rank])
                  : rank !== "none"
                    ? copy.rankTop
                    : null}
              </p>
            )}
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4" dir={dir}>
              <Figure value={bands.mastered} label={copy.bandMastered} dotClass="bg-success" />
              <Figure value={bands.learning} label={copy.bandLearning} dotClass="bg-primary" />
              <Figure value={bands.new} label={copy.bandNew} dotClass="bg-muted-foreground/30" />
              {scheduled && (
                <Figure value={dueCount} label={copy.overviewDue} dotClass="bg-accent" />
              )}
            </dl>
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-3" dir={dir}>
          <Button asChild variant="outline" className="gap-1.5">
            <Link href={`/learn/word-lists/${group.id}/learn`}>
              <GraduationCap className="size-4" aria-hidden="true" />
              {t.wordLists.learnAction}
            </Link>
          </Button>
          <Button asChild className="gap-1.5">
            <Link href={`/learn/word-lists/${group.id}`}>
              <PencilLine className="size-4" aria-hidden="true" />
              {scheduled ? t.wordLists.smart.continueAction : t.wordLists.practiceAction}
            </Link>
          </Button>
          {scheduled && (
            <>
              <Button asChild variant="outline" className="gap-1.5">
                <Link href={`/learn/word-lists/${group.id}?scope=all`}>
                  <Layers className="size-4" aria-hidden="true" />
                  {t.wordLists.smart.practiceAllAction}
                </Link>
              </Button>
              <div className="flex flex-col gap-1">
                {weakCount > 0 ? (
                  <Button asChild variant="outline" className="gap-1.5">
                    <Link href={`/learn/word-lists/${group.id}?scope=weak`}>
                      <Target className="size-4" aria-hidden="true" />
                      {copy.practiceWeak}
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" className="gap-1.5" disabled>
                    <Target className="size-4" aria-hidden="true" />
                    {copy.practiceWeak}
                  </Button>
                )}
                <span className="text-muted-foreground text-xs tabular-nums">
                  {weakCount > 0
                    ? copy.practiceWeakCount.replace("{n}", String(weakCount))
                    : copy.practiceWeakNone}
                </span>
              </div>
            </>
          )}
        </div>
      </header>

      <section aria-labelledby="word-wall-heading">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div dir={dir}>
            <h2 id="word-wall-heading" className="text-xl font-semibold tracking-tight">
              {copy.wallHeading}
            </h2>
            <p className="text-muted-foreground text-sm">{copy.wallSubtitle}</p>
          </div>
          <div
            role="group"
            aria-label={copy.filterAria}
            className="flex flex-wrap gap-1.5"
            dir={dir}
          >
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={filter === item.value}
                onClick={() => setFilter(item.value)}
                className={cn(
                  "focus-visible:ring-ring focus-visible:ring-offset-background rounded-full border px-3 py-1 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  filter === item.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label} <span className="tabular-nums opacity-80">{item.count}</span>
              </button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm" dir={dir}>
            {copy.wallEmpty}
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((word) => (
              <WordTile
                key={word.id}
                word={word}
                band={bandFor(word)}
                state={stateMap.get(word.id)}
                today={today}
                scheduled={scheduled}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function WordTile({
  word,
  band,
  state,
  today,
  scheduled,
}: {
  word: VocabularyWord;
  band: WordBand;
  state: MasteryState | undefined;
  today: string;
  scheduled: boolean;
}) {
  const { dir, t } = useLocale();
  const copy = t.wordLists.redesign;
  const hint = word.supportHint ?? word.hintAr;
  const term = hint ? splitWordHint(hint).term : undefined;
  const ipa = formatIpa(word.ipa);
  const due = state !== undefined && state.dueOn <= today;
  const weak = scheduled && isWeak(state);

  return (
    <li
      className={cn(
        "flex flex-col gap-1.5 rounded-xl border p-3",
        BAND_TILE_CLASS[band],
        weak && "ring-accent/60 ring-1",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 truncate text-lg leading-tight font-bold" dir="ltr">
          {word.targetWord}
        </span>
        {due && (
          <span className="bg-accent/20 text-accent-foreground shrink-0 rounded-full px-1.5 py-0.5 text-xs font-bold sm:text-[10px]">
            {copy.dueTag}
          </span>
        )}
      </div>
      {ipa && (
        <span className="text-muted-foreground truncate text-xs" dir="ltr">
          {ipa}
        </span>
      )}
      {term && (
        <span className="text-foreground/80 truncate text-sm" dir={dir}>
          {term}
        </span>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        {scheduled ? (
          <StrengthPips strength={strengthPips(state)} barClassName={BAND_BAR_CLASS[band]} />
        ) : (
          <span className="text-muted-foreground text-xs font-medium sm:text-[11px]" dir={dir}>
            {band === "new" ? copy.notMetYet : copy.bandLearning}
          </span>
        )}
        <WordPosBadge pos={word.pos} className="px-2 py-0 text-xs sm:text-[10px]" />
      </div>
    </li>
  );
}

function Figure({ value, label, dotClass }: { value: number; label: string; dotClass: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        <span className={cn("size-2 rounded-full", dotClass)} aria-hidden="true" />
        {label}
      </dt>
      <dd className="text-2xl font-bold tabular-nums">
        <CountUp value={value} />
      </dd>
    </div>
  );
}
