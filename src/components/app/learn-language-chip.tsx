"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { GermanLevelPopup, type GermanLevelChoice } from "@/components/german/german-level-popup";
import { useLocale } from "@/components/providers/locale-provider";
import { useGermanNew } from "@/hooks/use-video-new";
import { GERMAN_LETTERS_PATH } from "@/lib/german-letters";
import {
  markGermanLevelPopupAnswered,
  readGermanLevelPopupAnswered,
  setGermanZeroPick,
} from "@/lib/german-letters-state";
import { rememberLearnChoice } from "@/lib/learn-choice";
import { TARGET_LANGUAGES, type TargetLanguage } from "@/lib/learn-language";
import { learnLanguageStrings } from "@/lib/learn-language-strings";
import { cn } from "@/lib/utils";

const NAMES: Record<TargetLanguage, string> = { en: "English", de: "Deutsch" };

/**
 * The learning-language chip in the top bar (permission germanTrack, Admins only for now): one tap
 * opens a small list, the choice is kept on this browser and the page reloads in that language.
 */
export function LearnLanguageChip({ current }: { current: TargetLanguage }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  // The level pop-up (permission germanZero), shown once to a learner of English who adds German.
  const [levelPopup, setLevelPopup] = useState(false);
  const { locale, dir } = useLocale();
  const s = learnLanguageStrings(locale);
  // True until German has been chosen once on this device: a dot on the chip and «new» beside Deutsch.
  const germanIsNew = useGermanNew(current === "de");

  async function switchTo(language: TargetLanguage, afterSwitch?: () => void) {
    setBusy(true);
    try {
      const response = await fetch("/api/learn-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      });
      if (response.ok) {
        rememberLearnChoice(language);
        if (afterSwitch) afterSwitch();
        else router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function choose(language: TargetLanguage) {
    setOpen(false);
    if (language === current || busy) return;
    // English -> German, first time on this browser, permission germanZero open: ask the level first.
    if (language === "de" && !readGermanLevelPopupAnswered()) {
      const zeroOpen = await fetch("/api/learn-language", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : { zero: false }))
        .then((body: { zero?: boolean }) => body.zero === true)
        .catch(() => false);
      if (zeroOpen) {
        setLevelPopup(true);
        return;
      }
    }
    await switchTo(language);
  }

  async function pickLevel(choice: GermanLevelChoice) {
    setLevelPopup(false);
    markGermanLevelPopupAnswered();
    setGermanZeroPick(choice === "zero");
    await switchTo("de", () => {
      if (choice === "zero") router.push(GERMAN_LETTERS_PATH);
      else router.refresh();
    });
  }

  return (
    <div className="relative" dir="ltr">
      {levelPopup && <GermanLevelPopup onPick={pickLevel} onClose={() => setLevelPopup(false)} />}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={busy}
        className={cn(
          "relative inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors",
          current === "de"
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-card hover:bg-muted/50",
        )}
      >
        {NAMES[current]}
        <ChevronDown className="size-3.5" aria-hidden="true" />
        {germanIsNew && (
          <span
            aria-hidden="true"
            className="bg-primary ring-background absolute -end-0.5 -top-0.5 size-2.5 rounded-full ring-[3px]"
          />
        )}
      </button>
      {open && (
        <ul
          role="listbox"
          className="border-border bg-card absolute end-0 top-full z-50 mt-2 w-72 rounded-xl border p-1.5 shadow-lg"
        >
          {TARGET_LANGUAGES.map((language) => (
            <li key={language} role="option" aria-selected={language === current}>
              <button
                type="button"
                onClick={() => choose(language)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2.5 text-start text-sm",
                  language === current ? "bg-primary/10" : "hover:bg-muted/50",
                )}
              >
                <span className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-2 font-semibold">
                    {NAMES[language]}
                    {language === "de" && germanIsNew && (
                      <span
                        className="bg-primary text-primary-foreground rounded-full px-2 py-px text-[11px] leading-4 font-bold"
                        dir={dir}
                      >
                        {s.newWord}
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground text-xs" dir={dir}>
                    {language === "de" ? s.germanNote : s.englishNote}
                  </span>
                </span>
                {language === current && (
                  <span className="text-primary" aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
