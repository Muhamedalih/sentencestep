"use client";

import Link from "next/link";

import { PAPER } from "@/components/home-cards/palette";
import { useLocale } from "@/components/providers/locale-provider";
import { useEnterToContinue } from "@/hooks/use-enter-to-continue";
import { ladderStrings } from "@/lib/word-ladder/strings";
import type { LadderWord } from "@/lib/word-ladder/types";

/** How a word of the round went, for its card: secure the first time, secure after a second go, or not secure yet. */
export type FinishRun = { earlierMisses: number; typedFirst: boolean | null; typedRight: boolean };

/** The first letter of a word and a line for each of the others: "cousin" becomes "c_____". */
export function maskWord(word: string): string {
  return word.length === 0 ? "" : `${word[0]}${"_".repeat(Math.max(0, word.length - 1))}`;
}

/**
 * The page after a round: the topic's name, a big "Round passed", how many words are the learner's
 * now, each of them on a paper card (the lighter the paper, the surer the word), the first word of
 * the next round with only its first letter, how far the topic is, and two buttons. The round's cards
 * stay on one screen of a laptop whether it held three words or four.
 */
export function LadderFinish({
  words,
  runs,
  number,
  done,
  total,
  title,
  bankFeed,
  next,
  onNext,
  onExam,
  backHref = "/learn/word-lists",
  mixed = false,
}: {
  words: LadderWord[];
  runs: Record<string, FinishRun>;
  number: number;
  done: number;
  total: number;
  title: string;
  bankFeed: boolean;
  /** The round that follows, with its first word, or null when the topic is finished. */
  next: { number: number; firstWord: string } | null;
  onNext: () => void;
  /** Opens the exam of this round's words (every word heard and typed once, then a score). */
  onExam: () => void;
  backHref?: string;
  /** Words of several topics: there is no single topic's progress to show. */
  mixed?: boolean;
}) {
  const { locale, dir } = useLocale();
  const s = ladderStrings(locale);
  const right = words.filter((word) => runs[word.id]?.typedRight);
  const allRight = right.length === words.length;
  useEnterToContinue(next !== null, onNext);
  const columns = Math.max(words.length, 3);
  const doneAfter = Math.min(total, done + right.length);

  return (
    <div className="flex w-full max-w-[800px] flex-col text-left">
      <p
        className="text-muted-foreground text-[13px] font-semibold tracking-[0.18em] uppercase"
        dir="ltr"
      >
        {title}
      </p>
      <h2
        className="text-foreground mt-2 text-[clamp(2.4rem,1.8rem+2.6vw,3.6rem)] leading-[1.05] font-bold tracking-tight"
        dir="auto"
      >
        {allRight ? s.roundPassed : s.roundOver(number)}
      </h2>

      {right.length > 0 && (
        <div className="mt-4 flex items-baseline gap-3">
          <span
            className="text-success text-[clamp(2.4rem,1.9rem+2vw,3.4rem)] leading-none font-bold"
            dir="ltr"
          >
            +{right.length}
          </span>
          <span className="text-muted-foreground text-lg font-medium" dir="auto">
            {s.wordsTail(right.length)}
          </span>
        </div>
      )}

      <div
        className="mt-6 grid gap-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {words.map((word) => {
          const run = runs[word.id]!;
          const paper =
            run.typedFirst && run.earlierMisses === 0
              ? PAPER.sheet
              : run.typedRight
                ? PAPER.back1
                : PAPER.back2;
          return (
            <div
              key={word.id}
              className="flex min-h-[112px] flex-col justify-between rounded-xl px-4 py-3.5"
              style={{ background: paper, color: PAPER.ink, boxShadow: PAPER.stackShadow }}
            >
              <span className="text-[24px] leading-tight font-bold tracking-tight" dir="ltr">
                {word.word}
              </span>
              <span className="text-left text-[17px] font-medium opacity-80" dir={dir}>
                {word.term}
              </span>
            </div>
          );
        })}
      </div>

      {next && (
        <div className="mt-6">
          <p className="text-muted-foreground mb-2.5 text-[14px] font-medium" dir="auto">
            {s.nextFirst}
          </p>
          <div
            className="border-success/40 bg-success/10 flex h-[64px] items-center rounded-xl border px-5"
            style={{ width: `calc((100% - ${(columns - 1) * 12}px) / ${columns})` }}
          >
            <span className="text-foreground/90 font-mono text-[22px] tracking-[0.22em]" dir="ltr">
              {maskWord(next.firstWord)}
            </span>
          </div>
        </div>
      )}

      <div className="mt-6">
        {!mixed && (
          <>
            <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full" aria-hidden="true">
              <div
                className="bg-success h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
                style={{ width: `${total === 0 ? 0 : (doneAfter / total) * 100}%` }}
              />
            </div>
            <p className="text-muted-foreground mt-2.5 text-[15px]" dir="auto">
              <b className="text-foreground">{doneAfter}</b> {s.progressTail(total, title)}
            </p>
          </>
        )}
        <p className="text-muted-foreground/80 mt-0.5 text-[14px]" dir="auto">
          {bankFeed ? s.savedToWords : s.savedProgress}
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        {next && (
          <button
            type="button"
            onClick={onNext}
            className="bg-foreground text-background hover:bg-foreground/90 h-[60px] flex-1 rounded-lg text-lg font-semibold transition-colors"
          >
            <span dir="auto">{s.oneMore}</span>
          </button>
        )}
        <button
          type="button"
          onClick={onExam}
          className="border-border text-foreground hover:bg-muted/50 h-[60px] flex-1 rounded-lg border text-lg font-semibold transition-colors"
        >
          <span dir="auto">{s.exam}</span>
        </button>
        <Link
          href={backHref}
          className="border-border text-foreground hover:bg-muted/50 grid h-[60px] flex-1 place-items-center rounded-lg border text-lg font-semibold transition-colors"
        >
          <span dir="auto">{s.done}</span>
        </Link>
      </div>
    </div>
  );
}
