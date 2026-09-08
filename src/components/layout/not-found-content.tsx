import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getDictionary, fallbackDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/get-locale";

/**
 * Shared by every root layout's not-found.tsx (src/app/(app)/not-found.tsx,
 * src/app/(default)/not-found.tsx, src/app/[locale]/not-found.tsx) — each
 * root layout needs its OWN not-found.tsx (Next.js doesn't share a single
 * one across sibling root layouts; see root-html-shell.tsx's doc comment
 * for why there are three of them now), but the actual markup/behavior
 * stays byte-identical to what the single shared src/app/not-found.tsx
 * rendered before. Reads the locale straight from the cookie (not a route
 * param) exactly as before — this is only ever reached for a genuinely
 * unmatched path, which is always rendered on demand regardless, so a
 * cookies() call here doesn't affect any other route's static/dynamic
 * status.
 */
export async function NotFoundContent() {
  const locale = await getLocale();
  const t = locale ? getDictionary(locale) : fallbackDictionary;

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 py-24 text-center sm:py-32">
      <div className="bg-brand-muted text-primary flex size-14 items-center justify-center rounded-full">
        <Compass className="size-7" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{t.errors.notFoundHeading}</h1>
      <p className="text-muted-foreground max-w-sm">{t.errors.notFoundBody}</p>
      <Button asChild className="mt-2">
        <Link href="/">{t.errors.backHome}</Link>
      </Button>
    </div>
  );
}
