import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getDictionary, fallbackDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/get-locale";

export default async function NotFound() {
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
