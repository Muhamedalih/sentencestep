import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Dictionary } from "@/lib/i18n/dictionary";

/**
 * A plain <details>/<summary> accordion rather than a new disclosure
 * primitive — this codebase already prefers a native/hand-built control over
 * introducing a Radix component for a one-off need (see AccountMenu's doc
 * comment on its own click-outside popover), and <details> gets keyboard
 * support and screen-reader semantics for free.
 */
export function PremiumFaq({ t }: { t: Dictionary }) {
  const items: { q: string; a: string }[] = [
    { q: t.premium.faqIncludedQ, a: t.premium.faqIncludedA },
    { q: t.premium.faqCancelQ, a: t.premium.faqCancelA },
    { q: t.premium.faqProgressQ, a: t.premium.faqProgressA },
    { q: t.premium.faqTrialQ, a: t.premium.faqTrialA },
    { q: t.premium.faqSwitchQ, a: t.premium.faqSwitchA },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t.premium.faqHeading}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {items.map((item) => (
          <details key={item.q} className="group border-border/60 border-b py-3 last:border-0">
            <summary className="focus-visible:ring-ring flex cursor-pointer list-none items-center justify-between gap-3 rounded-md text-sm font-medium outline-none focus-visible:ring-2">
              {item.q}
              <span
                aria-hidden="true"
                className="text-muted-foreground shrink-0 transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="text-muted-foreground mt-2 text-sm">{item.a}</p>
          </details>
        ))}
      </CardContent>
    </Card>
  );
}
