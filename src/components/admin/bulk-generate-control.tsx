"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { generateMissingTranslationsForLocale } from "@/lib/admin/translation-actions";

/** The Phase 6 bulk-generation control on the /admin/translations dashboard — bounded, locale-scoped, reuses the same generation pipeline as the single-lesson action. See generateMissingTranslationsForLocale's doc comment for exactly what "bounded" means. */
export function BulkGenerateControl({ locale }: { locale: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      const result = await generateMissingTranslationsForLocale(locale);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setMessage(
        `Processed ${result.lessonsProcessed} lesson(s): ${result.generated} generated, ${result.skipped} skipped, ${result.failed} failed.`,
      );
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={handleClick}>
        {isPending ? "Generating…" : "Generate missing translations"}
      </Button>
      {message && <p className="text-muted-foreground max-w-xs text-right text-xs">{message}</p>}
    </div>
  );
}
