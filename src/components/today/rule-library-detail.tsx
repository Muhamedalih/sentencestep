"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

import { RulePageOne, RulePageTwo } from "@/components/today/rule-pages";
import { buttonVariants } from "@/components/ui/button";
import { ladderForLevel, LEVEL_LABEL, LEVEL_NUMBER, ruleById } from "@/lib/daily-rule/levels";
import { fill, ruleStrings } from "@/lib/daily-rule/strings";
import type { RuleTeach } from "@/lib/daily-rule/teach-types";
import { unitTitle } from "@/lib/daily-rule/units";
import type { ItemSpec } from "@/lib/daily-rule/visit";
import type { SupportLocale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

/**
 * One rule of the library, opened: the same two pages that taught it (the idea and the examples; what to
 * watch for), without the learner's story (that was the day it came), and under them the way on to a
 * practice of three sentences from the learner's own texts. It is a page to read at any time, so it needs
 * nothing from the database: the practice is where the texts are read, one press later.
 *
 * An admin can open every rule of the course, met or not (a preview, to read the cards before the learners reach
 * them): a rule not met yet says so in a small note and shows the examples it is taught with, and every page has
 * arrows to the rules around it.
 */
export interface RulePreview {
  /** The learner has not met this rule yet: the page says it is a preview. */
  unmet: boolean;
  previous?: { href: string; title: string };
  next?: { href: string; title: string };
}

export function RuleLibraryDetail({
  ruleId,
  teach,
  locale,
  backHref,
  practiceHref,
  practiceCount,
  noSentences = false,
  notice = [],
  noticeFrom = "examples",
  preview,
}: {
  ruleId: string;
  /** What the rule teaches, read on the server (see RulePageOne). */
  teach: RuleTeach | undefined;
  locale: SupportLocale | null;
  /** The library. */
  backHref: string;
  /** The practice of this rule (the runner's practice mode). */
  practiceHref: string;
  /** How many sentences a practice asks (the button says it). */
  practiceCount: number;
  /** The learner pressed practice and their texts do not hold three sentences of this rule yet. */
  noSentences?: boolean;
  /** The sentences the rule is taught with, shown on its first page (an admin preview of a rule not met yet). */
  notice?: readonly ItemSpec[];
  noticeFrom?: "story" | "examples";
  /** Set for an admin: the note on a rule not met yet, and the arrows to the rules around it. */
  preview?: RulePreview | undefined;
}) {
  const copy = ruleStrings(locale);
  const rule = ruleById(ruleId);
  const hasNotes = (teach?.notes.length ?? 0) > 0;
  const [page, setPage] = useState<1 | 2>(1);
  const levelLabel = rule ? (LEVEL_LABEL[LEVEL_NUMBER[rule.level]] ?? "") : "";
  // Above the rule's name: its place on its level and the unit it belongs to.
  const kicker = rule
    ? `${fill(copy.ruleNumber, {
        n: rule.order,
        total: ladderForLevel(LEVEL_NUMBER[rule.level])?.length ?? 0,
      })} · ${unitTitle(rule.unit, locale)}`
    : copy.ruleTitle;

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
    <section className="app-shell bg-background flex min-h-svh flex-col px-5 pt-5 pb-6 sm:px-8">
      <div className="flex min-h-9 items-center justify-between gap-3">
        <Link
          href={backHref}
          prefetch={false}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span dir="auto">{copy.myRules}</span>
        </Link>
        <span className="flex items-center gap-3">
          {preview?.unmet && (
            <span
              className="border-border text-muted-foreground rounded-full border px-2.5 py-0.5 text-xs"
              dir="auto"
            >
              {copy.previewNote}
            </span>
          )}
          <span className="text-muted-foreground text-xs" dir="ltr">
            {levelLabel}
          </span>
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center py-2">
        <div className="flex w-full max-w-4xl flex-col">
          {page === 1 ? (
            <RulePageOne
              key="one"
              rule={rule}
              teach={teach}
              notice={notice}
              noticeFrom={noticeFrom}
              copy={copy}
              locale={locale}
              kicker={kicker}
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
            <RulePageTwo key="two" rule={rule} teach={teach} copy={copy} locale={locale}>
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

      {preview && (preview.previous || preview.next) && (
        <nav
          className="text-muted-foreground mx-auto mt-2 flex w-full max-w-4xl items-center justify-between gap-6 text-sm"
          dir="ltr"
        >
          {preview.previous ? (
            <Link
              href={preview.previous.href}
              prefetch={false}
              aria-label={`${copy.previousRule}: ${preview.previous.title}`}
              className="hover:text-foreground inline-flex min-w-0 items-center gap-1.5"
            >
              <ChevronLeft aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">{preview.previous.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {preview.next ? (
            <Link
              href={preview.next.href}
              prefetch={false}
              aria-label={`${copy.nextRule}: ${preview.next.title}`}
              className="hover:text-foreground inline-flex min-w-0 items-center gap-1.5"
            >
              <span className="truncate">{preview.next.title}</span>
              <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </section>
  );
}
