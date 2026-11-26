"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { rememberLearnChoice } from "@/lib/learn-choice";
import type { TargetLanguage } from "@/lib/learn-language";

/**
 * The first-time "what do you want to learn?" card (permission germanTrack, Admins only for now): shown
 * once, whatever is chosen. English keeps everything as it is; German switches the site to the German track.
 */
export function LearnLanguagePicker() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState(false);

  async function choose(language: TargetLanguage) {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/learn-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, asked: true }),
      });
      rememberLearnChoice(language);
    } finally {
      setBusy(false);
      setOpen(false);
      router.refresh();
    }
  }

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="learn-language-title"
    >
      <div
        className="bg-card border-border w-full max-w-sm rounded-2xl border p-5 shadow-xl"
        dir="ltr"
      >
        <h2 id="learn-language-title" className="text-lg font-semibold">
          What do you want to learn?
        </h2>
        <p className="text-muted-foreground mt-1 text-sm" dir="rtl">
          ما اللغة التي تريد تعلّمها؟
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {(
            [
              ["en", "English", "الإنجليزية"],
              ["de", "Deutsch", "الألمانية"],
            ] as const
          ).map(([language, name, note]) => (
            <button
              key={language}
              type="button"
              disabled={busy}
              onClick={() => choose(language)}
              className="border-border hover:bg-muted/50 focus-visible:ring-ring flex items-center justify-between rounded-xl border px-4 py-3 text-start focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="font-medium">{name}</span>
              <span className="text-muted-foreground text-xs" dir="rtl">
                {note}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
