"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";

/**
 * Shared by every root layout's error.tsx (src/app/(app)/error.tsx,
 * src/app/(default)/error.tsx, src/app/[locale]/error.tsx) — each root
 * layout needs its OWN error.tsx (Next.js doesn't share a single one across
 * sibling root layouts; see root-html-shell.tsx's doc comment for why there
 * are three of them now), but the actual markup/behavior stays
 * byte-identical to what the single shared src/app/error.tsx rendered
 * before. Relies on useLocale() — safe here because error.tsx replaces only
 * the failing `{children}` slot, not the layout around it, so the same
 * root layout's LocaleProvider is still mounted above it.
 */
export function RouteErrorContent({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 py-24 text-center sm:py-32">
      <div className="bg-brand-muted text-primary flex size-14 items-center justify-center rounded-full">
        <TriangleAlert className="size-7" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{t.errors.globalHeading}</h1>
      <p className="text-muted-foreground max-w-sm">{t.errors.globalBody}</p>
      <Button className="mt-2" onClick={reset}>
        {t.common.tryAgain}
      </Button>
    </div>
  );
}
