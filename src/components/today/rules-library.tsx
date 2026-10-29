import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { Say } from "@/components/today/rule-text";
import { buttonVariants } from "@/components/ui/button";
import type {
  Library,
  LibraryLevel,
  LibraryRule,
  LibraryUnit,
  MapRule,
} from "@/lib/daily-rule/library";
import { fill, ruleStrings, ruleTextDir, type RuleStrings } from "@/lib/daily-rule/strings";
import type { SupportLocale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

/**
 * The rule library («قواعدي»): the whole course on one calm page, like the contents of a grammar book. The
 * rules that are due today come first (they are asked again at the end of Today, and here they can be read and
 * practised now). Under them the map: a section for the level the course is on (and for any other level the
 * learner has met a rule of), each split into units that fold open. A rule the learner has met is a row with
 * its idea and how it stands, and opens the rule's own pages; the rule that opens next is marked; the others
 * are titles only, in the order they will open: a rule is taught when its day comes, not read ahead.
 */
export function RulesLibrary({
  library,
  locale,
}: {
  library: Library;
  locale: SupportLocale | null;
}) {
  const copy = ruleStrings(locale);
  const { current } = library;
  const percent = current && current.total > 0 ? (current.met / current.total) * 100 : 0;
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl" dir="auto">
          {copy.myRules}
        </h1>
        {current && (
          <p className="text-muted-foreground text-sm" dir="auto">
            {fill(copy.libraryLevel, {
              n: current.met,
              total: current.total,
              level: current.label,
            })}
          </p>
        )}
      </div>
      {current && (
        <div className="bg-muted mt-4 h-1 overflow-hidden rounded-full" aria-hidden="true">
          <span className="bg-primary block h-full rounded-full" style={{ width: `${percent}%` }} />
        </div>
      )}

      {library.met === 0 && (
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <h2 className="text-2xl font-semibold tracking-tight" dir="auto">
            {copy.emptyTitle}
          </h2>
          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed" dir="auto">
            {copy.emptySub}
          </p>
          <Link href="/learn" className={cn(buttonVariants({ size: "lg" }), "mt-2")}>
            <span dir="auto">{copy.emptyAction}</span>
          </Link>
        </div>
      )}

      {library.due.length > 0 && (
        <DueGroup
          title={copy.dueSection}
          rules={library.due}
          showLevel={library.levels.length > 1}
          locale={locale}
          copy={copy}
        />
      )}

      <div className="divide-border/60 mt-10 divide-y">
        {library.levels.map((level) => (
          <LevelSection key={level.label} level={level} locale={locale} copy={copy} />
        ))}
      </div>
    </div>
  );
}

function DueGroup({
  title,
  rules,
  showLevel,
  locale,
  copy,
}: {
  title: string;
  rules: readonly LibraryRule[];
  showLevel: boolean;
  locale: SupportLocale | null;
  copy: RuleStrings;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-muted-foreground text-sm font-medium" dir="auto">
        {title}
      </h2>
      <ul className="divide-border/60 mt-2 divide-y">
        {rules.map((rule) => (
          <li key={rule.id}>
            <RuleLink
              id={rule.id}
              title={rule.title}
              idea={rule.idea}
              levelLabel={showLevel ? rule.levelLabel : undefined}
              tag={<StatusTag status="due" dots={rule.dots} copy={copy} />}
              locale={locale}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** One level of the map: its name with how far the learner is on it, and its units. */
function LevelSection({
  level,
  locale,
  copy,
}: {
  level: LibraryLevel;
  locale: SupportLocale | null;
  copy: RuleStrings;
}) {
  const percent = level.total > 0 ? (level.met / level.total) * 100 : 0;
  return (
    <details open={level.current} className="group py-1">
      <summary className="flex cursor-pointer list-none items-center gap-3 py-3 [&::-webkit-details-marker]:hidden">
        <span className="text-lg font-semibold" dir="ltr">
          {level.label}
        </span>
        <span className="bg-muted h-1 flex-1 overflow-hidden rounded-full" aria-hidden="true">
          <span className="bg-primary block h-full rounded-full" style={{ width: `${percent}%` }} />
        </span>
        <span className="text-muted-foreground text-xs tabular-nums" dir="ltr">
          {level.met} / {level.total}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="text-muted-foreground size-4 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="flex flex-col gap-1 pb-3">
        {level.units.map((unit) => (
          <UnitSection key={unit.id} unit={unit} locale={locale} copy={copy} />
        ))}
      </div>
    </details>
  );
}

/** One unit: its name and count, and its rules in the order they open. */
function UnitSection({
  unit,
  locale,
  copy,
}: {
  unit: LibraryUnit;
  locale: SupportLocale | null;
  copy: RuleStrings;
}) {
  return (
    <details open={unit.open} className="group/unit">
      <summary className="hover:bg-muted/40 -mx-3 flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-3 py-2.5 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <ChevronDown
            aria-hidden="true"
            className="text-muted-foreground size-3.5 -rotate-90 transition-transform group-open/unit:rotate-0"
          />
          <span className="text-sm font-medium" dir="auto">
            {unit.title}
          </span>
        </span>
        <span className="text-muted-foreground text-xs tabular-nums" dir="ltr">
          {unit.met} / {unit.total}
        </span>
      </summary>
      <ul className="divide-border/60 mt-1 mb-2 divide-y">
        {unit.rules.map((rule) => (
          <li key={rule.id}>
            <MapRow rule={rule} locale={locale} copy={copy} />
          </li>
        ))}
      </ul>
    </details>
  );
}

function MapRow({
  rule,
  locale,
  copy,
}: {
  rule: MapRule;
  locale: SupportLocale | null;
  copy: RuleStrings;
}) {
  if (rule.state === "next" || rule.state === "ahead") {
    const next = rule.state === "next";
    return (
      <div className="flex items-center gap-4 px-0 py-2.5">
        <span
          className={cn(
            "min-w-0 flex-1 text-sm",
            next ? "text-foreground/80 font-medium" : "text-muted-foreground/70",
          )}
          dir="ltr"
        >
          {rule.title}
        </span>
        {next && (
          <span
            className="bg-brand-muted text-primary shrink-0 rounded-full px-3 py-1 text-xs font-medium"
            dir="auto"
          >
            {copy.statusNext}
          </span>
        )}
      </div>
    );
  }
  return (
    <RuleLink
      id={rule.id}
      title={rule.title}
      idea={rule.idea}
      tag={<StatusTag status={rule.state} dots={rule.dots} copy={copy} />}
      locale={locale}
    />
  );
}

/** A rule the learner has met: its name, its idea in their language and how it stands, opening the rule's page. */
function RuleLink({
  id,
  title,
  idea,
  levelLabel,
  tag,
  locale,
}: {
  id: string;
  title: string;
  idea: string;
  levelLabel?: string;
  tag: ReactNode;
  locale: SupportLocale | null;
}) {
  return (
    <Link
      href={`/learn/rules/${id}`}
      prefetch={false}
      className="hover:bg-muted/40 focus-visible:ring-ring -mx-3 flex items-center gap-4 rounded-xl px-3 py-3.5 transition-colors outline-none focus-visible:ring-2"
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="text-base font-medium" dir="ltr">
            {title}
          </span>
          {levelLabel && (
            <span className="text-muted-foreground text-xs" dir="ltr">
              {levelLabel}
            </span>
          )}
        </span>
        {idea && (
          <span
            className="text-muted-foreground mt-0.5 line-clamp-2 block text-sm leading-relaxed"
            dir={ruleTextDir(locale)}
          >
            <Say text={idea} locale={locale} />
          </span>
        )}
      </span>
      {tag}
    </Link>
  );
}

/** How a rule stands: «راجعها» for one that is due, otherwise its state and the three dots of the clean days. */
function StatusTag({
  status,
  dots,
  copy,
}: {
  status: "due" | "held" | "learning";
  dots: number;
  copy: RuleStrings;
}) {
  if (status === "due") {
    return (
      <span
        className="bg-brand-muted text-primary shrink-0 rounded-full px-3 py-1 text-xs font-medium"
        dir="auto"
      >
        {copy.statusDue}
      </span>
    );
  }
  return (
    <span className="text-muted-foreground flex shrink-0 items-center gap-2 text-xs">
      <span dir="auto">{status === "held" ? copy.statusHeld : copy.statusLearning}</span>
      <span className="flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={cn("size-1.5 rounded-full", index < dots ? "bg-primary" : "bg-border")}
          />
        ))}
      </span>
    </span>
  );
}
