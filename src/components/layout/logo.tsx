import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = "default",
}: {
  className?: string;
  /** "sm" is for tight spaces like the lesson session's corner header — half the mark size and a smaller wordmark. */
  size?: "default" | "sm";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold tracking-tight",
        size === "sm" ? "gap-1 text-[11px]" : "gap-1.5 text-base",
        className,
      )}
    >
      <span
        className={cn(
          "bg-primary text-primary-foreground flex items-center justify-center rounded-md font-bold",
          size === "sm" ? "size-3.5 text-[9px]" : "size-6.5 text-sm",
        )}
      >
        S
      </span>
      <span>SentenceStep</span>
    </span>
  );
}
