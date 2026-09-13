import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = "default",
}: {
  className?: string;
  /** "sm" is for the lesson session's corner header — a bit smaller than the default (site nav) size, not a tiny badge. */
  size?: "default" | "sm";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold tracking-tight",
        size === "sm" ? "gap-1.5 text-[18px]" : "gap-1.5 text-base",
        className,
      )}
    >
      <span
        className={cn(
          "bg-primary text-primary-foreground flex items-center justify-center rounded-md font-bold",
          size === "sm" ? "size-[22px] text-[14px]" : "size-6.5 text-sm",
        )}
      >
        S
      </span>
      <span>SentenceStep</span>
    </span>
  );
}
