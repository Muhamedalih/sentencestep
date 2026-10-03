import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/billing/pricing";
import type { Dictionary } from "@/lib/i18n/dictionary/types";

export function PremiumSection({ t }: { t: Dictionary }) {
  return (
    <section id="premium" className="mx-auto max-w-6xl px-6 py-20">
      <Card className="grid gap-10 rounded-2xl p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
        <div className="min-w-0">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.marketing.premiumHeading}
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg text-lg text-balance" dir="auto">
            {t.marketing.premiumSubtitle.replace("{price}", formatPrice())}
          </p>
          <div className="mt-6">
            <Button
              size="lg"
              asChild
              className="h-auto min-h-13 py-2 text-center whitespace-normal"
            >
              <Link href="/upgrade">{t.marketing.unlockPremiumCta}</Link>
            </Button>
          </div>
        </div>

        <ul className="flex flex-col gap-3">
          {t.premium.benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2.5 text-sm">
              <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
