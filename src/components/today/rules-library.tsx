import Link from "next/link";

import { Say } from "@/components/today/rule-text";
import { buttonVariants } from "@/components/ui/button";
import type { Library, LibraryRule } from "@/lib/daily-rule/library";
import { fill, ruleStrings, ruleTextDir, type RuleStrings } from "@/lib/daily-rule/strings";
import type { SupportLocale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

/**
 * The rule library («قواعدي»): every rule the learner has met, on one calm page. The rules that are due
 * today come first (they are asked again at the end of Today, and here they can be read and practised
 * now), then the others in the order of the ladder; each row is the rule's name, its idea in the learner's
 * language and how it stands, and opens the rule's own pages. The rules of the learner's level that are
 * still ahead are folded under the list by name only: a rule is taught from the learner's own story when it
 * comes, not read ahead.
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

      {library.met === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
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
      ) : (
        <>
          {library.due.length > 0 && (
            <RuleGroup
              title={copy.dueSection}
              rules={library.due}
              showLevel={library.levels.length > 1}
              locale={locale}
              copy={copy}
            />
          )}
          {library.kept.length > 0 && (
            <RuleGroup
              title={copy.keptSection}
              rules={library.kept}
              showLevel={library.levels.length > 1}
              locale={locale}
              copy={copy}
            />
          )}
        </>
      )}

      {library.met > 0 && current && current.upcoming.length > 0 && (
        <details className="mt-8">
          <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm">
            <span dir="auto">{fill(copy.upcoming, { n: current.upcoming.length })}</span>
          </summary>
          <ul
            className="text-muted-foreground/80 mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2"
            dir="ltr"
          >
            {current.upcoming.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function RuleGroup({
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
            <Link
              href={`/learn/rules/${rule.id}`}
              prefetch={false}
              className="hover:bg-muted/40 focus-visible:ring-ring -mx-3 flex items-center gap-4 rounded-xl px-3 py-3.5 transition-colors outline-none focus-visible:ring-2"
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="text-base font-medium" dir="ltr">
                    {rule.title}
                  </span>
                  {showLevel && (
                    <span className="text-muted-foreground text-xs" dir="ltr">
                      {rule.levelLabel}
                    </span>
                  )}
                </span>
                {rule.idea && (
                  <span
                    className="text-muted-foreground mt-0.5 line-clamp-2 block text-sm leading-relaxed"
                    dir={ruleTextDir(locale)}
                  >
                    <Say text={rule.idea} locale={locale} />
                  </span>
                )}
              </span>
              <StatusTag rule={rule} copy={copy} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** How a rule stands: «راجعها» for one that is due, otherwise its state and the three dots of the clean days. */
function StatusTag({ rule, copy }: { rule: LibraryRule; copy: RuleStrings }) {
  if (rule.status === "due") {
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
      <span dir="auto">{rule.status === "held" ? copy.statusHeld : copy.statusLearning}</span>
      <span className="flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={cn("size-1.5 rounded-full", index < rule.dots ? "bg-primary" : "bg-border")}
          />
        ))}
      </span>
    </span>
  );
}
