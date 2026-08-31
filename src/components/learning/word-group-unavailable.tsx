"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";

/** Word Lists' equivalent of ContentUnavailable — shown if a group somehow resolves with zero words (a content gap, not an access problem), rather than a broken "0 / 0" practice screen. */
export function WordGroupUnavailable({ title }: { title: string }) {
  const { t } = useLocale();

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
      <p className="text-muted-foreground max-w-sm text-sm">{t.wordLists.unavailableBody}</p>
      <Button asChild variant="outline" className="mt-2">
        <Link href="/learn/word-lists">{t.wordLists.backToWordLists}</Link>
      </Button>
    </div>
  );
}
