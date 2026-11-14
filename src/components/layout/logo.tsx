import { cn } from "@/lib/utils";

/**
 * The mark: three word-shaped bars climbing like stairs — a sentence built
 * one word, one step at a time. Same geometry as public/favicon.svg and the
 * public/icon-*.png app icons (there it sits light on an ink tile).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true" className={className}>
      <rect x="5" y="33" width="17" height="7.5" rx="3.75" />
      <rect x="15.5" y="20.25" width="17" height="7.5" rx="3.75" />
      <rect x="26" y="7.5" width="17" height="7.5" rx="3.75" />
    </svg>
  );
}

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
      <LogoMark
        className={cn(
          // Fixed to the app icon's own ink (#2F2A7A, light #ECEAFB on dark
          // themes) rather than the theme-driven --primary token, so the
          // in-app mark reads as the same brand color as the installed icon.
          "shrink-0 text-[#2F2A7A] dark:text-[#ECEAFB]",
          size === "sm" ? "size-[22px]" : "size-6.5",
        )}
      />
      <span>SentenceStep</span>
    </span>
  );
}
