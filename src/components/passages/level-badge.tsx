import { LEVEL_LOOKS } from "@/lib/passages/art";
import type { PassageLevel } from "@/lib/passages/types";
import { cn } from "@/lib/utils";

/**
 * A level's code in a chip of its own colour, with four small bars lit one more for each step
 * up: A1 lights one, B2 all four. The list's four levels used to be the same violet letters;
 * now each can be told apart (and read as easier or harder) without a word.
 */
export function LevelBadge({ level }: { level: PassageLevel }) {
  const look = LEVEL_LOOKS[level];
  return (
    <span
      dir="ltr"
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ring-1 ring-inset",
        look.chip,
      )}
    >
      {level}
      <span aria-hidden="true" className="flex h-3 items-end gap-[2px]">
        {[1, 2, 3, 4].map((step) => (
          <i
            key={step}
            className={cn("w-[3px] rounded-full bg-current", step > look.steps && "opacity-25")}
            style={{ height: `${4 + step * 2}px` }}
          />
        ))}
      </span>
    </span>
  );
}
