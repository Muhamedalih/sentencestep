import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { StoryRibbon } from "@/components/app/story-cover-marks";
import { Say } from "@/components/today/rule-text";
import type { MapRule } from "@/lib/daily-rule/library";
import { ruleTextDir, type RuleStrings } from "@/lib/daily-rule/strings";
import type { SupportLocale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

/** What a tile of the rule library shows of one rule. */
export type TileRule = Pick<MapRule, "id" | "title" | "order" | "state" | "dots" | "idea">;

/**
 * One rule of the library as a card, built like a Stories card: the rule's number as a faint outline in the
 * corner, a green ribbon on every rule the learner has met (taught in Today's session or opened here), the
 * rule's name, its idea in the learner's language, and under them how it stands (the three dots of the clean
 * days, or «راجعها» / «التالية» as a tag) with an arrow. The whole card is the link: it lifts when the pointer
 * is over it, and sinks a little when pressed. A rule that is not openable (a learner's rule not met yet) is
 * the same card without the link and without its idea: a rule is taught when its day comes, not read ahead.
 * On a phone the card becomes a row, as the Stories cards do.
 */
export function RuleTile({
  rule,
  locale,
  copy,
  openable,
  levelLabel,
}: {
  rule: TileRule;
  locale: SupportLocale | null;
  copy: RuleStrings;
  /** The card opens the rule's page (a rule the learner has met, or any rule for an admin). */
  openable: boolean;
  /** The level's name, for a card shown outside its level (today's reviews, with more than one level on the map). */
  levelLabel?: string | undefined;
}) {
  const met = rule.state === "due" || rule.state === "held" || rule.state === "learning";
  const next = rule.state === "next";
  const ahead = rule.state === "ahead";
  const card = (
    <div
      className={cn(
        "border-border/60 bg-card relative flex h-full min-h-52 w-full flex-col justify-end overflow-hidden rounded-2xl border p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
        "max-sm:min-h-0 max-sm:flex-row max-sm:items-center max-sm:justify-start max-sm:gap-3 max-sm:p-3",
        next && "border-primary/55 bg-[color-mix(in_srgb,var(--brand-muted)_22%,var(--card))]",
        ahead && (openable ? "opacity-60" : "opacity-45"),
        openable &&
          cn(
            "transition-[translate,border-color,scale] [transition-duration:300ms,300ms,150ms]",
            "hover:border-foreground/20 motion-safe:group-hover:-translate-y-1",
            "motion-safe:group-active:-translate-y-px motion-safe:group-active:scale-[0.985]",
            next && "hover:border-primary/55",
          ),
      )}
    >
      <span
        aria-hidden="true"
        className="font-quote pointer-events-none absolute end-2.5 -top-2.5 text-[7rem] leading-none text-transparent select-none [-webkit-text-stroke:1px_color-mix(in_srgb,var(--primary)_34%,transparent)] max-sm:hidden"
      >
        {rule.order}
      </span>
      {met && (
        <StoryRibbon
          difficulty="beginner"
          status="completed"
          className="absolute start-3.5 top-0 h-11 w-[22px] pt-2 max-sm:hidden"
        />
      )}

      <span
        aria-hidden="true"
        className="bg-primary/10 relative hidden h-[52px] w-11 shrink-0 items-end justify-center rounded-[10px] pb-2.5 max-sm:flex"
      >
        <span className="font-quote text-primary text-[1.4rem] leading-none">{rule.order}</span>
        {met && <StoryRibbon difficulty="beginner" className="absolute start-1.5 top-0 h-5 w-3" />}
      </span>

      <div className="relative flex min-w-0 flex-col max-sm:flex-1">
        {levelLabel && (
          <span className="text-muted-foreground mb-1 text-xs" dir="ltr">
            {levelLabel}
          </span>
        )}
        <h3
          className="line-clamp-2 text-xl leading-tight font-semibold max-sm:text-[15px] max-sm:leading-snug"
          dir="ltr"
        >
          {rule.title}
        </h3>
        {rule.idea && (
          <p
            className="text-muted-foreground mt-1.5 line-clamp-2 text-[13px] leading-[1.4] max-sm:mt-0.5 max-sm:line-clamp-1 max-sm:text-xs"
            dir={ruleTextDir(locale)}
          >
            <Say text={rule.idea} locale={locale} />
          </p>
        )}
      </div>

      <div className="relative mt-3.5 flex items-center justify-between max-sm:mt-0 max-sm:shrink-0 max-sm:justify-end">
        <Standing rule={rule} copy={copy} />
        {openable && (
          <span
            aria-hidden="true"
            className={cn(
              "text-muted-foreground border-border flex size-7 shrink-0 items-center justify-center rounded-full border max-sm:hidden",
              "transition-[translate,background-color,border-color,color] duration-200",
              "group-hover:border-primary/50 group-hover:bg-primary/[0.18] group-hover:text-primary motion-safe:group-hover:translate-x-[3px]",
            )}
          >
            <ArrowRight className="size-3.5" />
          </span>
        )}
      </div>
    </div>
  );

  if (!openable) return <div className="h-full">{card}</div>;
  return (
    <div className="group h-full">
      <Link
        href={`/learn/rules/${rule.id}`}
        prefetch={false}
        className="focus-visible:ring-ring focus-visible:ring-offset-background block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        {card}
      </Link>
    </div>
  );
}

/** How a rule stands: a tag for the one due today and the one that opens next, the three dots of the clean days with their name for a rule met, «قادمة» for the rest. */
function Standing({ rule, copy }: { rule: TileRule; copy: RuleStrings }) {
  if (rule.state === "due" || rule.state === "next") {
    return (
      <span
        className="bg-brand-muted text-primary shrink-0 rounded-full px-3 py-[3px] text-xs font-medium"
        dir="auto"
      >
        {rule.state === "due" ? copy.statusDue : copy.statusNext}
      </span>
    );
  }
  if (rule.state === "ahead") {
    return (
      <span className="text-muted-foreground text-xs" dir="auto">
        {copy.statusAhead}
      </span>
    );
  }
  return (
    <span className="text-muted-foreground flex items-center gap-2 text-xs">
      <span className="flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={cn("size-1.5 rounded-full", index < rule.dots ? "bg-primary" : "bg-border")}
          />
        ))}
      </span>
      <span className="max-sm:sr-only" dir="auto">
        {rule.state === "held" ? copy.statusHeld : copy.statusLearning}
      </span>
    </span>
  );
}
