"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Lock } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { difficultyForLevel, tierLabel, tierSupportLabel } from "@/lib/levels";
import { CORE_LEVELS, CORE_SET_SIZE } from "@/lib/word-bank/core-sets";
import type { CoreLevel } from "@/lib/word-bank/core-sets";
import { bankStrings } from "@/lib/word-bank/strings";
import { cn } from "@/lib/utils";

/** One set of the shelf as the page hands it over: plain data, so it crosses from the server page as it is. */
export interface ShelfSet {
  n: number;
  level: CoreLevel;
  free: boolean;
  size: number;
  /** How many of its words are in the learner's bank. */
  inBank: number;
  /** The first few words of the set, for the tile. */
  preview: string;
}

export interface CoreShelfData {
  sets: ShelfSet[];
  /** Core words in the learner's bank, and how many there are. */
  inBank: number;
  total: number;
  /** The set to carry on with (the first one not finished), or null when all are. */
  currentN: number | null;
}

/**
 * «كلمات الموقع الأساسية»: the shelf at the top of Word Lists. The most frequent words of the site's own
 * stories and passages in sets of eight, in three levels; a set opens the bank's review screen with
 * its eight words in their home sentences, and its words then wait in the learner's bank like any
 * other. The learner sees how many of the core words are already in their bank and which set to carry
 * on with. The first set of each level is free; the others show a lock to a learner without Premium.
 */
export function CoreWordsShelf({
  data,
  isPremiumUser,
  className,
}: {
  data: CoreShelfData;
  isPremiumUser: boolean;
  className?: string;
}) {
  const { locale } = useLocale();
  const s = bankStrings(locale);
  const currentLevel = data.sets.find((set) => set.n === data.currentN)?.level ?? 1;
  const [level, setLevel] = useState<CoreLevel>(currentLevel);
  const shown = data.sets.filter((set) => set.level === level);

  return (
    <section
      aria-label={s.shelfTitle}
      className={cn("bg-card border-border rounded-2xl border px-[22px] py-5", className)}
    >
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <h2 className="text-left text-[17px] font-semibold" dir="auto">
            {s.shelfTitle}
          </h2>
          <p className="text-muted-foreground mt-0.5 text-left text-[13px]" dir="auto">
            {s.shelfSub.replace("{n}", String(data.total)).replace("{size}", String(CORE_SET_SIZE))}
          </p>
        </div>
        <p className="text-muted-foreground text-[13px] whitespace-nowrap" dir="auto">
          {s.shelfCover.split(/(\{k\}|\{n\})/).map((part, index) =>
            part === "{k}" ? (
              <bdi key={index} dir="ltr" className="text-foreground font-semibold tabular-nums">
                {data.inBank}
              </bdi>
            ) : part === "{n}" ? (
              <bdi key={index} dir="ltr" className="tabular-nums">
                {data.total}
              </bdi>
            ) : (
              part
            ),
          )}
        </p>
      </div>

      <div className="mt-3.5 flex flex-wrap gap-1.5" role="tablist">
        {CORE_LEVELS.map((value) => {
          const levelSets = data.sets.filter((set) => set.level === value);
          const done = levelSets.filter((set) => set.inBank >= set.size).length;
          const difficulty = difficultyForLevel(value);
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={value === level}
              onClick={() => setLevel(value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-[5px] text-[13px] font-medium transition-colors duration-150",
                value === level
                  ? "bg-brand-muted text-primary border-transparent"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <span dir="auto">
                {locale ? tierSupportLabel(difficulty, locale) : tierLabel(difficulty).label}
              </span>
              <b className="font-semibold tabular-nums" dir="ltr">
                {done}/{levelSets.length}
              </b>
            </button>
          );
        })}
      </div>

      <ul className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {shown.map((set) => {
          const complete = set.inBank >= set.size;
          const current = set.n === data.currentN;
          const locked = !set.free && !isPremiumUser;
          const later = data.currentN !== null && set.n > data.currentN + 1 && !complete;
          return (
            <li key={set.n} className="min-w-0">
              <Link
                href={`/learn/words/set/${set.n}`}
                prefetch={false}
                aria-label={s.setAria.replace("{n}", String(set.n))}
                className={cn(
                  "bg-background border-border hover:border-primary/40 focus-visible:ring-ring block h-full rounded-[14px] border px-3 pt-3 pb-2.5 transition-colors duration-150 outline-none focus-visible:ring-2",
                  current && "border-primary/60",
                  later && "opacity-60",
                )}
              >
                <span className="text-muted-foreground flex items-center justify-between text-xs">
                  <span className="tabular-nums" dir="ltr">
                    {set.n}
                  </span>
                  {complete ? (
                    <span
                      className="bg-success text-success-foreground flex size-4 items-center justify-center rounded-full"
                      aria-hidden="true"
                    >
                      <Check className="size-2.5" />
                    </span>
                  ) : locked ? (
                    <Lock className="size-3" aria-label={s.setPremium} />
                  ) : null}
                </span>
                <span
                  className="mt-[7px] line-clamp-3 h-[58px] overflow-hidden text-left text-[13.5px] leading-[1.45] font-semibold"
                  dir="ltr"
                >
                  {set.preview}
                </span>
                <span
                  className={cn(
                    "mt-1.5 block text-left text-xs",
                    current ? "text-primary font-semibold" : "text-muted-foreground",
                  )}
                  dir="auto"
                >
                  {(current ? s.setContinue : s.setProgress)
                    .replace("{k}", String(set.inBank))
                    .replace("{size}", String(set.size))}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
