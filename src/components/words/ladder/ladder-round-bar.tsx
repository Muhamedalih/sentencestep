import { cn } from "@/lib/utils";

/**
 * One segment per round of a topic: the finished rounds in the brand colour, the one being played a
 * paler tint, the rest empty. No numbers: the line under it says which round it is.
 */
export function LadderRoundBar({
  count,
  done,
  current,
  className,
}: {
  count: number;
  /** Rounds finished (the first `done` segments). */
  done: number;
  /** The segment of the round in play, or null when none is. */
  current: number | null;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full gap-1.5", className)} dir="ltr" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-2 flex-1 rounded-full",
            index < done ? "bg-primary" : index === current ? "bg-primary/45" : "bg-muted",
          )}
        />
      ))}
    </div>
  );
}
