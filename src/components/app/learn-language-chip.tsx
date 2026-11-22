"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { TARGET_LANGUAGES, type TargetLanguage } from "@/lib/learn-language";
import { cn } from "@/lib/utils";

const NAMES: Record<TargetLanguage, { name: string; note: string }> = {
  en: { name: "English", note: "الإنجليزية" },
  de: { name: "Deutsch", note: "الألمانية" },
};

/**
 * The learning-language chip in the top bar (permission germanTrack, Admins only for now): one tap
 * opens a small list, the choice is kept on this browser and the page reloads in that language.
 */
export function LearnLanguageChip({ current }: { current: TargetLanguage }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function choose(language: TargetLanguage) {
    setOpen(false);
    if (language === current || busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/learn-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      });
      if (response.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative" dir="ltr">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={busy}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors",
          current === "de"
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-card hover:bg-muted/50",
        )}
      >
        {NAMES[current].name}
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </button>
      {open && (
        <ul
          role="listbox"
          className="border-border bg-card absolute end-0 top-full z-50 mt-2 w-52 rounded-xl border p-1.5 shadow-lg"
        >
          {TARGET_LANGUAGES.map((language) => (
            <li key={language} role="option" aria-selected={language === current}>
              <button
                type="button"
                onClick={() => choose(language)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm",
                  language === current ? "bg-primary/10" : "hover:bg-muted/50",
                )}
              >
                <span>{NAMES[language].name}</span>
                <span className="text-muted-foreground text-xs" dir="rtl">
                  {NAMES[language].note}
                  {language === current ? " ✓" : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
