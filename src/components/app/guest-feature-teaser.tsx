"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Shown to a signed-out visitor when at least one account-only engagement
 * feature (quests, badges, streak calendar & freezes, daily session) is
 * switched on for them: those features need somewhere to store progress, so
 * the honest offer is an account, not a broken half-feature. Renders nothing
 * otherwise.
 */
export function GuestFeatureTeaser({ className }: { className?: string }) {
  const { guestTeaser } = useFeatures();
  const { t, dir } = useLocale();
  if (!guestTeaser) return null;
  return (
    <section
      className={cn(
        "border-primary/30 bg-primary/5 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Sparkles className="text-accent mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div dir={dir}>
          <h2 className="text-sm font-semibold">{t.quests.guestHeading}</h2>
          <p className="text-muted-foreground mt-1 text-sm">{t.quests.guestBody}</p>
        </div>
      </div>
      <Button asChild size="sm" className="shrink-0">
        <Link href="/register">{t.quests.guestCta}</Link>
      </Button>
    </section>
  );
}
