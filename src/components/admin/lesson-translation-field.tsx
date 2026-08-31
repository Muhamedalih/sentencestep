"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { generateLessonTranslations } from "@/lib/admin/translation-actions";
import type { EnabledLocaleOption } from "@/lib/admin/translation-queries";
import type { GenerationOutcome } from "@/lib/translation/generate";

/**
 * The Phase 3 pilot control: one lesson, one target locale, one manual
 * generation at a time — no bulk mode yet (see the architecture proposal).
 * Only meaningful once a lesson has a real id (same reasoning as
 * LessonImageField: generation reads the lesson's current saved English
 * content, so there's nothing to translate before the first save), and
 * only rendered at all when at least one locale is enabled to generate
 * for.
 */
export function LessonTranslationField({
  lessonId,
  locales,
}: {
  lessonId?: string;
  locales: EnabledLocaleOption[];
}) {
  const [locale, setLocale] = useState(locales[0]?.code ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<GenerationOutcome | null>(null);

  if (locales.length === 0) return null;

  function handleGenerate() {
    if (!lessonId || !locale) return;
    setError(null);
    setOutcome(null);

    startTransition(async () => {
      const result = await generateLessonTranslations(lessonId, locale);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOutcome(result.outcome ?? null);
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <span className="text-sm font-medium">AI translation draft</span>
      {lessonId ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={locale}
              onChange={(event) => setLocale(event.target.value)}
              disabled={isPending}
              className="border-input bg-background h-9 rounded-lg border px-3 text-sm disabled:opacity-60"
            >
              {locales.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.displayName} ({option.nativeName})
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleGenerate}
            >
              {isPending ? "Generating…" : "Generate translation"}
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Creates AI drafts for missing or unapproved fields only — an already-approved
            translation is never touched. Drafts still need human review and approval before they
            count as final.
          </p>
          {error && (
            <p role="alert" className="text-danger text-xs">
              {error}
            </p>
          )}
          {outcome && !error && (
            <p role="status" className="text-xs">
              {(() => {
                const counts = [
                  outcome.generated > 0 ? `${outcome.generated} generated` : null,
                  outcome.skipped > 0 ? `${outcome.skipped} skipped` : null,
                  outcome.failed > 0 ? `${outcome.failed} failed` : null,
                ].filter(Boolean);
                // The "everything is already approved" fallback only applies
                // when there's truly nothing to report — if outcome.error is
                // set (e.g. no provider configured), the zero counts mean
                // "never attempted," not "already approved," so the error
                // alone is the accurate message.
                const summary =
                  counts.length > 0
                    ? counts.join(", ")
                    : outcome.error
                      ? null
                      : "Nothing to generate — everything is already approved.";
                return [summary, outcome.error].filter(Boolean).join(" — ");
              })()}
            </p>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">
          Save the lesson first, then come back to generate translations.
        </p>
      )}
    </div>
  );
}
