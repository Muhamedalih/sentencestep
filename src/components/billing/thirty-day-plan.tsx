import Link from "next/link";
import { CalendarDays, Layers, PenLine } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionary/types";
import { thirtyDayPlan } from "@/lib/progress/thirty-day-plan";

type PremiumCopy = Dictionary["premium"];

function fill(template: string, values: Record<string, number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

function PlanRow({ icon, children, sub }: { icon: ReactNode; children: ReactNode; sub?: string }) {
  return (
    <li dir="auto" className="border-border flex items-start gap-3 border-t py-2.5">
      <span className="text-primary mt-0.5 shrink-0" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0 flex-1 text-start text-sm">
        <p>{children}</p>
        {sub && <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>}
      </div>
    </li>
  );
}

/**
 * "Your first 30 days", shown once under the payment confirmation: what thirty of Today's sessions
 * make available, in units and counts only (see thirtyDayPlan) and with the line that says this is
 * what the sessions offer, not a promise of any level.
 */
export function ThirtyDayPlan({ copy }: { copy: PremiumCopy }) {
  const plan = thirtyDayPlan();
  return (
    <section aria-label={fill(copy.planHeading, { days: plan.days })} className="w-full text-start">
      <h2 dir="auto" className="mb-1 text-sm font-semibold">
        {fill(copy.planHeading, { days: plan.days })}
      </h2>
      <ul>
        <PlanRow
          icon={<CalendarDays className="size-[18px]" strokeWidth={1.8} />}
          sub={fill(copy.planMinutes, { n: plan.minutesPerSession })}
        >
          {copy.planDaily}
        </PlanRow>
        <PlanRow icon={<Layers className="size-[18px]" strokeWidth={1.8} />}>
          {fill(copy.planTotals, {
            days: plan.days,
            passages: plan.passages,
            stories: plan.stories,
            words: plan.words,
          })}
        </PlanRow>
        <PlanRow icon={<PenLine className="size-[18px]" strokeWidth={1.8} />} sub={copy.planNote}>
          {fill(copy.planSentences, { n: plan.sentences })}
        </PlanRow>
      </ul>
    </section>
  );
}

/**
 * What sits under a confirmed payment: the plan (for a first payment only), the button back to
 * the lesson the learner was stopped at when there is one, and the way to Today's first session.
 */
export function PaymentConfirmedActions({
  copy,
  common,
  afterPaymentPath,
  showPlan,
}: {
  copy: PremiumCopy;
  common: Dictionary["common"];
  afterPaymentPath: string | null;
  showPlan: boolean;
}) {
  return (
    <>
      {showPlan && <ThirtyDayPlan copy={copy} />}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {afterPaymentPath ? (
          <>
            <Button asChild size="lg">
              <Link href={afterPaymentPath}>{copy.continueLesson}</Link>
            </Button>
            {showPlan && (
              <Button asChild variant="ghost">
                <Link href="/learn">{copy.planStart}</Link>
              </Button>
            )}
          </>
        ) : (
          <Button asChild size="lg">
            <Link href="/learn">{showPlan ? copy.planStart : common.startLearning}</Link>
          </Button>
        )}
      </div>
    </>
  );
}
