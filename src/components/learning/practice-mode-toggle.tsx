"use client";

import { Ear, Brain } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";
import type { PracticeMode } from "@/lib/word-mastery/smart";

/**
 * The two ways to practice a word: recall (the word stays silent until you have
 * answered, so you are really remembering it) or listen-and-type (it is spoken
 * first and you type what you hear — spelling practice). A small segmented
 * switch in the practice header; the choice applies from the next word on.
 *
 * Mouse presses never take focus from the typing input (the same approach every
 * control beside the sentence uses), so switching never costs the learner a
 * click back into the answer.
 */
export function PracticeModeToggle({
  mode,
  onChange,
}: {
  mode: PracticeMode;
  onChange: (mode: PracticeMode) => void;
}) {
  const { t, dir } = useLocale();
  const copy = t.wordLists.smart;
  const options: { value: PracticeMode; label: string; Icon: typeof Ear }[] = [
    { value: "recall", label: copy.modeRecall, Icon: Brain },
    { value: "listen", label: copy.modeListen, Icon: Ear },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={copy.modeAria}
      dir={dir}
      className="border-border/60 bg-muted/40 inline-flex items-center rounded-full border p-0.5"
    >
      {options.map(({ value, label, Icon }) => {
        const selected = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onChange(value)}
            className={cn(
              "focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors outline-none focus-visible:ring-2",
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
