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
          // Fixed to the PWA/favicon icon's own colors (public/favicon.svg,
          // public/icon-*.png: #4F3FE0 on #F5F4FF) rather than the
          // theme-driven --primary token, so the in-app mark reads as the
          // exact same brand color as the installed app icon in both light
          // and dark mode instead of two different shades of it.
          "flex items-center justify-center rounded-md bg-[#4F3FE0] font-bold text-[#F5F4FF]",
          size === "sm" ? "size-[22px] text-[14px]" : "size-6.5 text-sm",
        )}
      >
        S
      </span>
      <span>SentenceStep</span>
    </span>
  );
}
