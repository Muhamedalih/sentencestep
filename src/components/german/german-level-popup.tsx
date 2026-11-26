"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { germanLettersStrings } from "@/lib/german-letters";
import { tierSupportLabel } from "@/lib/levels";
import type { PlacementTier } from "@/lib/progress/starting-level";
import { cn } from "@/lib/utils";

export type GermanLevelChoice = "zero" | PlacementTier;

const TIER_BODY_KEY_DE = {
  beginner: "beginnerBodyDe",
  intermediate: "intermediateBodyDe",
  advanced: "advancedBodyDe",
} as const;

/**
 * The small «Choose your German level» pop-up (permission germanZero): shown once to a learner who is
 * on English and adds German from the top bar. The four levels, «From zero» first, and the note that it
 * can be changed any time. It only reports the choice; the chip does the switching.
 */
export function GermanLevelPopup({
  onPick,
  onClose,
}: {
  onPick: (choice: GermanLevelChoice) => void;
  onClose: () => void;
}) {
  const { locale, t, dir } = useLocale();
  const s = germanLettersStrings(locale);
  const [choice, setChoice] = useState<GermanLevelChoice>("zero");
  const options: { id: GermanLevelChoice; name: string; body: string }[] = [
    { id: "zero", name: s.zeroName, body: s.zeroBody },
    ...(["beginner", "intermediate", "advanced"] as const).map((tier) => ({
      id: tier,
      name: locale ? tierSupportLabel(tier, locale) : tier,
      body: t.onboarding[TIER_BODY_KEY_DE[tier]],
    })),
  ];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="german-level-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="bg-card border-border w-full max-w-sm rounded-2xl border p-5 shadow-xl"
        dir={dir}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="german-level-title" className="text-lg font-semibold">
            {s.popupTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground -m-1 p-1"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div
          className="mt-4 flex flex-col gap-2"
          role="radiogroup"
          aria-labelledby="german-level-title"
        >
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={choice === option.id}
              onClick={() => setChoice(option.id)}
              className={cn(
                "rounded-xl border px-4 py-3 text-start transition-colors focus-visible:ring-2 focus-visible:outline-none",
                choice === option.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <span className="block text-[15px] font-semibold">{option.name}</span>
              <span className="text-muted-foreground block text-xs">{option.body}</span>
            </button>
          ))}
        </div>
        <p className="text-muted-foreground mt-3 text-xs">{s.popupNote}</p>
        <button
          type="button"
          onClick={() => onPick(choice)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-3 h-11 w-full rounded-full text-sm font-medium"
        >
          {s.popupStart}
        </button>
      </div>
    </div>
  );
}
