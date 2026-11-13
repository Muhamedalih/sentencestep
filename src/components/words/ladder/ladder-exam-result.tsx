"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { useEnterToContinue } from "@/hooks/use-enter-to-continue";
import { cn } from "@/lib/utils";
import { ladderStrings } from "@/lib/word-ladder/strings";
import type { LadderWord } from "@/lib/word-ladder/types";

/**
 * The end of the exam after a round: how many of the words were typed right the one time each was
 * asked, each word with a tick or a cross, and the buttons: take it again, the next round, or leave.
 * Nothing here changes the learner's records: the exam is a way to find out, not a way to be marked.
 */
export function LadderExamResult({
  words,
  results,
  title,
  next,
  onRetake,
  onNext,
  backHref = "/learn/word-lists",
}: {
  words: LadderWord[];
  /** By word id: typed right when it was asked. */
  results: Record<string, boolean>;
  title: string;
  next: { number: number; firstWord: string } | null;
  onRetake: () => void;
  onNext: () => void;
  backHref?: string;
}) {
  const { locale, dir } = useLocale();
  const s = ladderStrings(locale);
  const right = words.filter((word) => results[word.id]).length;
  const all = right === words.length;
  useEnterToContinue(true, next ? onNext : onRetake);

  return (
    <div className="flex w-full max-w-[800px] flex-col text-left">
      <p
        className="text-muted-foreground text-[13px] font-semibold tracking-[0.18em] uppercase"
        dir="ltr"
      >
        {title}
      </p>
      <h2
        className="text-foreground mt-2 text-[clamp(2.2rem,1.7rem+2.4vw,3.2rem)] leading-[1.05] font-bold tracking-tight"
        dir="auto"
      >
        {s.examTitle}
      </h2>
      <p
        className={cn(
          "mt-3 text-[clamp(2.4rem,1.9rem+2vw,3.4rem)] leading-none font-bold",
          all ? "text-success" : "text-foreground",
        )}
        dir="auto"
      >
        {s.examScore(right, words.length)}
      </p>

      <div className="border-border bg-card mt-6 rounded-2xl border px-5 py-1.5">
        {words.map((word) => {
          const ok = results[word.id] === true;
          return (
            <div
              key={word.id}
              className="border-border grid grid-cols-[28px_130px_1fr] items-center gap-3 border-b py-3 last:border-b-0"
            >
              {ok ? (
                <Check className="text-success size-5" strokeWidth={2.6} aria-hidden="true" />
              ) : (
                <X className="text-danger size-5" strokeWidth={2.6} aria-hidden="true" />
              )}
              <span className="text-foreground text-xl font-semibold" dir="ltr">
                {word.word}
              </span>
              <span className="text-muted-foreground text-[15px]" dir={dir}>
                {word.term}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onRetake}
          className="bg-foreground text-background hover:bg-foreground/90 h-[60px] flex-1 rounded-lg text-lg font-semibold transition-colors"
        >
          <span dir="auto">{s.examRetake}</span>
        </button>
        {next && (
          <button
            type="button"
            onClick={onNext}
            className="border-border text-foreground hover:bg-muted/50 h-[60px] flex-1 rounded-lg border text-lg font-semibold transition-colors"
          >
            <span dir="auto">{s.oneMore}</span>
          </button>
        )}
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
