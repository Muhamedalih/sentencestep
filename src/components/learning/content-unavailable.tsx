import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getDictionary, fallbackDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import type { LearningMode } from "@/types/content";

/**
 * Shown instead of a broken "Sentence 1 of 0" typing session when a lesson
 * resolves with no sentences — whether from a content-integrity gap (an
 * admin-authored lesson with no sentences yet) or an access-check mismatch
 * (the page-level premium check passed, but the database's own row-level
 * security on `sentences` still didn't return any, as it correctly does for
 * an account with no active subscription — see fetchLessonById's doc
 * comment in src/lib/supabase/queries/content.ts). Deliberately not the
 * PremiumLocked copy: telling an already-granted-access learner to
 * "upgrade" would be actively misleading.
 */
export async function ContentUnavailable({ mode, title }: { mode: LearningMode; title: string }) {
  const locale = await getLocale();
  const t = locale ? getDictionary(locale) : fallbackDictionary;

  return (
    <div className="border-border bg-card flex flex-col items-center gap-4 rounded-2xl border p-10 text-center shadow-sm sm:p-12">
      <div className="bg-brand-muted text-primary flex size-14 items-center justify-center rounded-full">
        <AlertCircle className="size-7" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" dir="ltr">
          {title}
        </h1>
      </div>
      <p className="text-muted-foreground max-w-sm text-sm">{t.premium.contentUnavailableBody}</p>
      <Button asChild variant="outline" className="mt-2">
        <Link href={`/learn/${mode}`}>{t.premium.backToLessons}</Link>
      </Button>
    </div>
  );
}
