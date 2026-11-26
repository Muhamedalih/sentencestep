"use client";

import Link from "next/link";
import { Check, RefreshCw, Type } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { GERMAN_LETTERS_PATH, germanLettersStrings } from "@/lib/german-letters";
import { useGermanLettersDone } from "@/lib/german-letters-state";

/**
 * The first row of the German Words page (permission germanZero): the letters lesson, started or repeated
 * from here. Once it was finished or skipped the row says so and the button reads «Repeat lesson».
 */
export function GermanLettersCard({ className }: { className?: string }) {
  const { locale } = useLocale();
  const s = germanLettersStrings(locale);
  const done = useGermanLettersDone();
  return (
    <div
      className={`border-border bg-card flex items-center gap-3 rounded-2xl border p-3.5 ${className ?? ""}`}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
        {done ? (
          <Check className="size-5" aria-hidden="true" />
        ) : (
          <Type className="size-5" aria-hidden="true" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{s.cardTitle}</span>
        <span className="text-muted-foreground block text-xs">{s.cardBody}</span>
      </span>
      <Link
        href={`${GERMAN_LETTERS_PATH}?from=words`}
        className="border-border hover:bg-accent inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium"
      >
        {done && <RefreshCw className="size-4" aria-hidden="true" />}
        {done ? s.repeat : s.cardStart}
      </Link>
    </div>
  );
}
