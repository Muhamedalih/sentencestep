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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="german-level-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="animate-in fade-in zoom-in-95 relative w-full max-w-[440px] rounded-[26px] border border-[#2a2c37] bg-[#16171d] p-5 text-white shadow-2xl duration-200 sm:p-6"
        dir={dir}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="german-level-title" className="text-xl font-medium">
            {s.popupTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-[#2f313d] bg-[#1b1c23] text-[#d6d7e0] transition-colors outline-none hover:bg-[#23252e] focus-visible:ring-2 focus-visible:ring-white"
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
                "rounded-[14px] border px-4 py-3 text-start transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white",
                choice === option.id
                  ? "border-[#d9d6cb] bg-[#262832]"
                  : "border-[#2a2c37] bg-[#1b1c23] hover:bg-[#21232c]",
              )}
            >
              <span className="block text-[15px] font-semibold">{option.name}</span>
              <span className="block text-xs text-[#a9acc0]">{option.body}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-[#a9acc0]">{s.popupNote}</p>
        <button
          type="button"
          onClick={() => onPick(choice)}
          className="mt-3 h-12 w-full rounded-xl bg-[#f3efe3] text-base font-bold text-[#17261e] shadow-[0_2px_0_rgba(0,0,0,0.18)] outline-none hover:bg-[#ebe7d8] focus-visible:ring-2 focus-visible:ring-white"
        >
          {s.popupStart}
        </button>
      </div>
    </div>
  );
}
