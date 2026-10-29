"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { RulePageOne, RulePageTwo } from "@/components/today/rule-pages";
import { buttonVariants } from "@/components/ui/button";
import { LEVEL_LABEL, LEVEL_NUMBER, ruleById } from "@/lib/daily-rule/levels";
import { fill, ruleStrings } from "@/lib/daily-rule/strings";
import { teachFor } from "@/lib/daily-rule/teach";
import type { SupportLocale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

/**
 * One rule of the library, opened: the same two pages that taught it (the idea and the examples; what to
 * watch for), without the learner's story (that was the day it came), and under them the way on to a
 * practice of three sentences from the learner's own texts. It is a page to read at any time, so it needs
 * nothing from the database: the practice is where the texts are read, one press later.
 */
export function RuleLibraryDetail({
  ruleId,
  locale,
  backHref,
  practiceHref,
  practiceCount,
  noSentences = false,
}: {
  ruleId: string;
  locale: SupportLocale | null;
  /** The library. */
  backHref: string;
  /** The practice of this rule (the runner's practice mode). */
  practiceHref: string;
  /** How many sentences a practice asks (the button says it). */
  practiceCount: number;
  /** The learner pressed practice and their texts do not hold three sentences of this rule yet. */
  noSentences?: boolean;
}) {
  const copy = ruleStrings(locale);
  const rule = ruleById(ruleId);
  const hasNotes = (teachFor(ruleId)?.notes.length ?? 0) > 0;
  const [page, setPage] = useState<1 | 2>(1);
  const levelLabel = rule ? (LEVEL_LABEL[LEVEL_NUMBER[rule.level]] ?? "") : "";

  const practice = (
    <Link
      href={practiceHref}
      prefetch={false}
      className={cn(buttonVariants({ size: "lg" }), "w-full")}
    >
      <span dir="auto">{fill(copy.practiceRule, { n: practiceCount })}</span>
    </Link>
  );

  return (
    <section className="flex min-h-svh flex-col px-5 pt-5 pb-6 sm:px-8">
      <div className="flex min-h-9 items-center justify-between gap-3">
        <Link
          href={backHref}
          prefetch={false}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span dir="auto">{copy.myRules}</span>
        </Link>
        <span className="text-muted-foreground text-xs" dir="ltr">
          {levelLabel}
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center py-2">
        <div className="flex w-full max-w-4xl flex-col">
          {page === 1 ? (
            <RulePageOne
              key="one"
              rule={rule}
              notice={[]}
              copy={copy}
              locale={locale}
              kicker={`${copy.ruleTitle} · ${levelLabel}`}
            >
              <div className="mt-1 flex w-full max-w-md flex-col items-center gap-3 self-center">
                {practice}
                {hasNotes && (
                  <button
                    type="button"
                    onClick={() => setPage(2)}
                    className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-full")}
                  >
                    <span dir="auto">{copy.exceptionsButton}</span>
                  </button>
                )}
                {noSentences && (
                  <p className="text-muted-foreground text-sm" dir="auto">
                    {copy.noSentences}
                  </p>
                )}
              </div>
            </RulePageOne>
          ) : (
            <RulePageTwo key="two" rule={rule} copy={copy} locale={locale}>
              <div className="flex w-full max-w-md flex-col items-center gap-3 self-center">
                {practice}
                <button
                  type="button"
                  onClick={() => setPage(1)}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  <span dir="auto">{copy.back}</span>
                </button>
              </div>
            </RulePageTwo>
          )}
        </div>
      </div>
    </section>
  );
}
