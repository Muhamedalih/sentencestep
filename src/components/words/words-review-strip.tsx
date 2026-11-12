import Link from "next/link";

import type { Dictionary } from "@/lib/i18n/dictionary";
import type { SupportLocale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";
import type { BankOverview } from "@/lib/word-bank/shelves";
import type { BankStrings } from "@/lib/word-bank/strings";
import { firstMetLabel } from "@/lib/word-bank/when-label";

/** The balance bar's three tones: the brand colour let down into the card (as on the «كلماتي» page). */
const SEGMENT = {
  stable: "var(--primary)",
  active: "color-mix(in oklch, var(--primary) 60%, var(--card))",
  waiting: "color-mix(in oklch, var(--primary) 32%, var(--card))",
} as const;

/**
 * The words waiting for review, as ONE strip at the top of the Words page: today's number and when
 * the words were last reviewed, how many words the learner knows (with the bar of where they stand),
 * and the one button. It exists only on a day the bank has words to ask (today's round is five at
 * most, so it never shows a pile), and never for a learner without the bank; on a phone the middle
 * part gives way and the button fills the width. A server component: nothing on it changes without a
 * new page load.
 */
export function WordsReviewStrip({
  overview,
  todayISO,
  locale,
  t,
  s,
  className,
}: {
  overview: BankOverview;
  todayISO: string;
  locale: SupportLocale | null;
  t: Dictionary;
  s: BankStrings;
  className?: string;
}) {
  const count = overview.today.length;
  if (count === 0) return null;
  const lastReview = overview.lastReviewedOn
    ? s.lastReview.replace(
        "{when}",
        firstMetLabel(overview.lastReviewedOn, todayISO, locale, t.myWords),
      )
    : null;

  return (
    <section
      className={cn(
        "bg-card border-border grid gap-4 rounded-2xl border p-[18px] md:grid-cols-[1.3fr_1fr_auto] md:items-center md:gap-0 md:p-0",
        className,
      )}
    >
      <div className="md:px-[26px] md:py-5">
        <p
          className="text-muted-foreground mb-1.5 text-left text-[12.5px] font-semibold"
          dir="auto"
        >
          {s.today}
        </p>
        <p className="flex items-baseline gap-3">
          <span className="text-[56px] leading-none font-semibold tracking-[-0.02em] tabular-nums md:text-[44px]">
            {count}
          </span>
          <span className="text-xl font-semibold" dir="auto">
            {s.todayLabel(count)}
          </span>
        </p>
        <p className="text-muted-foreground mt-1.5 text-left text-[13px]" dir="auto">
          {lastReview ? `${s.minutes(count)} · ${lastReview}` : s.minutes(count)}
        </p>
      </div>

      <div className="border-border px-[26px] py-5 max-md:hidden md:border-s">
        <p className="flex flex-col">
          <span className="text-[32px] leading-[1.1] font-semibold tracking-[-0.02em] tabular-nums">
            {overview.stable}
          </span>
          <span className="text-muted-foreground mt-0.5 text-left text-sm" dir="auto">
            {s.stableLabel(overview.stable)}
          </span>
        </p>
        <div className="mt-2.5 flex h-2 gap-[3px]" aria-hidden="true">
          {(["stable", "active", "waiting"] as const).map((shelf) =>
            overview[shelf] > 0 ? (
              <i
                key={shelf}
                className="block rounded-full"
                style={{ flexGrow: overview[shelf], background: SEGMENT[shelf] }}
              />
            ) : null,
          )}
        </div>
      </div>

      <div className="md:px-[26px]">
        <Link
          href="/learn/words/review"
          prefetch={false}
          className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-12 w-full items-center justify-center rounded-[10px] px-6 text-[15px] font-semibold whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2 md:h-11 md:w-auto"
        >
          <span dir="auto">{s.start}</span>
        </Link>
      </div>
    </section>
  );
}
