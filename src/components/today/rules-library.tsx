import Link from "next/link";
import { Lightbulb } from "lucide-react";

import { RuleLevelTabs, type RuleLevelTab } from "@/components/today/rule-level-tabs";
import { RuleTile } from "@/components/today/rule-tile";
import { buttonVariants } from "@/components/ui/button";
import type { Library, LibraryLevel, LibraryUnit } from "@/lib/daily-rule/library";
import { fill, ruleStrings, ruleTextDir, type RuleStrings } from "@/lib/daily-rule/strings";
import type { SupportLocale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

/** The cards of a unit: one column on a phone, up to four on a wide screen (the Stories grid has fewer, narrower ones). */
const TILE_GRID = "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4";

/**
 * The rule library («قواعدي»): the whole course as a page of cards, like the Stories section. The rules that are
 * due today come first (they are asked again at the end of Today, and here they can be read and practised now).
 * Under them one tab per level (the level the course is on, and any other level the learner has met a rule of),
 * each with how far the learner is on it and its units, every rule a card. A rule the learner has met has a green
 * ribbon and opens the rule's own pages; the rule that opens next is marked; the others are cards without an idea
 * or a link, in the order they will open: a rule is taught when its day comes, not read ahead. For an admin
 * (`preview`) every level has a tab and every card opens, so the whole course can be read before the learners
 * reach it.
 */
export function RulesLibrary({
  library,
  locale,
  preview = false,
}: {
  library: Library;
  locale: SupportLocale | null;
  /** The viewer is an admin: the rules not met yet open their pages too. */
  preview?: boolean;
}) {
  const copy = ruleStrings(locale);
  const tabs: RuleLevelTab[] = library.levels.map((level) => ({
    label: level.label,
    tier: level.tier,
    count: `${level.met}/${level.total}`,
    panel: <LevelPanel level={level} locale={locale} copy={copy} preview={preview} />,
  }));
  const initial = (library.levels.find((level) => level.current) ?? library.levels[0])?.label;
  return (
    <div className="mx-auto max-w-7xl px-6 py-8 sm:py-10">
      <header className="mb-5 flex items-center gap-4">
        <div
          aria-hidden="true"
          className="border-border text-primary flex size-12 shrink-0 items-center justify-center rounded-2xl border bg-[color-mix(in_srgb,var(--primary)_14%,var(--card))] sm:size-14"
        >
          <Lightbulb className="size-6 sm:size-[26px]" />
        </div>
        <div>
          <h1
            className="text-[22px] leading-snug font-semibold tracking-tight sm:text-[26px]"
            dir="auto"
          >
            {copy.libraryTitle}
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm" dir="auto">
            {copy.librarySubtitle}
          </p>
        </div>
      </header>

      {library.met === 0 && (
        <div className="mb-8 flex flex-col items-center gap-3 py-6 text-center">
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
        <section className="mb-8">
          <SectionHead title={copy.dueSection} count={String(library.due.length)} locale={locale} />
          <div className={cn(TILE_GRID, "mt-3")}>
            {library.due.map((rule) => (
              <RuleTile
                key={rule.id}
                rule={{
                  id: rule.id,
                  title: rule.title,
                  order: rule.order,
                  state: "due",
                  dots: rule.dots,
                  idea: rule.idea,
                }}
                locale={locale}
                copy={copy}
                openable
                levelLabel={library.levels.length > 1 ? rule.levelLabel : undefined}
              />
            ))}
          </div>
        </section>
      )}

      {initial && <RuleLevelTabs tabs={tabs} initial={initial} ariaLabel={copy.levelTabsLabel} />}
    </div>
  );
}

/** A heading with a count at the other end: the unit's name and how many of its rules are met. */
function SectionHead({
  title,
  count,
  locale,
}: {
  title: string;
  count: string;
  locale: SupportLocale | null;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4" dir={ruleTextDir(locale)}>
      <h2 className="text-lg font-semibold" dir="auto">
        {title}
      </h2>
      <span className="text-muted-foreground text-[13px]" dir="ltr">
        {count}
      </span>
    </div>
  );
}

/** A thin bar for how far the learner is: on a level (taller) or on a unit. */
function Bar({ percent, className }: { percent: number; className: string }) {
  return (
    <div className={cn("bg-border overflow-hidden rounded-full", className)} aria-hidden="true">
      <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }} />
    </div>
  );
}

/** One level, under its tab: how far the learner is on it, and its units. */
function LevelPanel({
  level,
  locale,
  copy,
  preview,
}: {
  level: LibraryLevel;
  locale: SupportLocale | null;
  copy: RuleStrings;
  preview: boolean;
}) {
  const percent = level.total > 0 ? (level.met / level.total) * 100 : 0;
  return (
    <div>
      <div
        className="text-muted-foreground mt-3 mb-1.5 flex items-center justify-between gap-4 text-[13px]"
        dir={ruleTextDir(locale)}
      >
        {level.current ? (
          <span dir="auto">{fill(copy.youAreIn, { level: level.label })}</span>
        ) : (
          <span />
        )}
        <span dir="ltr">
          {level.met} / {level.total}
        </span>
      </div>
      <Bar percent={percent} className="h-1.5" />
      <div>
        {level.units.map((unit) => (
          <UnitSection key={unit.id} unit={unit} locale={locale} copy={copy} preview={preview} />
        ))}
      </div>
    </div>
  );
}

/** One unit: its name, how many of its rules are met, and its rules as cards in the order they open. */
function UnitSection({
  unit,
  locale,
  copy,
  preview,
}: {
  unit: LibraryUnit;
  locale: SupportLocale | null;
  copy: RuleStrings;
  preview: boolean;
}) {
  const percent = unit.total > 0 ? (unit.met / unit.total) * 100 : 0;
  return (
    <section className="mt-8 first:mt-5">
      <SectionHead title={unit.title} count={`${unit.met} / ${unit.total}`} locale={locale} />
      <Bar percent={percent} className="mt-1.5 mb-3 h-[3px]" />
      <div className={TILE_GRID}>
        {unit.rules.map((rule) => (
          <RuleTile
            key={rule.id}
            rule={rule}
            locale={locale}
            copy={copy}
            openable={preview || (rule.state !== "next" && rule.state !== "ahead")}
          />
        ))}
      </div>
    </section>
  );
}
