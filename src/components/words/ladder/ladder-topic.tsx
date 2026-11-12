"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { LadderRoundBar } from "@/components/words/ladder/ladder-round-bar";
import { Button } from "@/components/ui/button";
import type { RoundPlan } from "@/lib/word-ladder/rounds";
import { ladderStrings } from "@/lib/word-ladder/strings";
import type { LadderWord } from "@/lib/word-ladder/types";

/**
 * A topic's own screen: where the learner stands, the round that comes next with its words, and ONE
 * button that opens it (Learn and Practice are not two choices any more). When every word is
 * finished the screen says so and offers to go round again.
 */
export function LadderTopic({
  group,
  plan,
  words,
  loading,
  onStart,
  onAgain,
}: {
  group: { id: string; title: string; supportTitle?: string; level: number };
  /** The next round, or null when the topic is finished. */
  plan: RoundPlan<LadderWord> | null;
  words: LadderWord[];
  /** The learner's saved progress is still being read. */
  loading: boolean;
  onStart: () => void;
  onAgain: () => void;
}) {
  const { locale, dir } = useLocale();
  const s = ladderStrings(locale);
  const total = words.length;
  const done = plan ? plan.done : total;
  const count = plan?.count ?? 1;

  return (
    <div className="h-app relative flex w-full flex-col">
      <div className="shrink-0 px-6 pt-4 lg:px-16 lg:pt-5">
        <Link
          href="/learn/word-lists"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium pointer-coarse:min-h-11"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {s.back}
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-6 py-8 lg:px-16">
        <div className="flex w-full max-w-[560px] flex-col items-center text-center">
          <p className="text-muted-foreground mb-1.5 text-[12.5px] font-semibold" dir="auto">
            {s.level(group.level)}
          </p>
          <h1 className="flex flex-wrap items-baseline justify-center gap-x-3.5">
            <span
              className="text-foreground text-[clamp(2.2rem,1.8rem+1.8vw,2.75rem)] font-bold tracking-tight"
              dir="ltr"
            >
              {group.title}
            </span>
            {group.supportTitle && (
              <span className="text-muted-foreground text-[22px]" dir={dir}>
                {group.supportTitle}
              </span>
            )}
          </h1>
          {loading ? (
            <p className="text-muted-foreground mt-6 text-sm" aria-busy="true" dir="auto">
              {s.loading}
            </p>
          ) : (
            <>
              <p className="text-muted-foreground mt-2 text-sm" dir="auto">
                {s.progress(done, total)}
              </p>
              <LadderRoundBar
                className="mt-5"
                count={count}
                done={plan ? plan.number - 1 : count}
                current={plan ? plan.number - 1 : null}
              />
              {plan ? (
                <>
                  <p className="text-muted-foreground mt-3 mb-3.5 text-[13px]" dir="auto">
                    {s.roundOf(plan.number, plan.count)}
                  </p>
                  <div className="border-border bg-card w-full rounded-2xl border px-5 py-1.5 text-start">
                    {plan.words.map((word) => (
                      <div
                        key={word.id}
                        className="border-border flex items-baseline justify-between gap-4 border-b py-3 last:border-b-0"
                      >
                        <span className="text-foreground text-[22px] font-semibold" dir="ltr">
                          {word.word}
                        </span>
                        <span className="text-muted-foreground text-[15px]" dir={dir}>
                          {word.term}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button size="lg" className="mt-5 w-full" onClick={onStart}>
                    <span dir="auto">{s.startRound(plan.number)}</span>
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-foreground mt-6 text-lg font-semibold" dir="auto">
                    {s.topicDone(group.title)}
                  </p>
                  <Button size="lg" className="mt-5 w-full" onClick={onAgain}>
                    <span dir="auto">{s.again}</span>
                  </Button>
                </>
              )}
              <Link
                href={`/learn/word-lists/${group.id}/words`}
                className="text-muted-foreground hover:text-foreground mt-4 text-sm"
              >
                <span dir="auto">{s.allWords(total)}</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
