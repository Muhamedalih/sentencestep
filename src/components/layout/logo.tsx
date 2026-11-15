import { cn } from "@/lib/utils";

/**
 * The mark: the installed app icon itself — three word-shaped bars climbing like
 * stairs, light on an ink tile — identical to public/favicon.svg and the
 * public/icon-*.png files, so the in-app logo and the tab/app icon match.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <rect width="64" height="64" rx="16" fill="#2F2A7A" />
      <g transform="translate(8 8)" fill="#F4F3FB">
        <rect x="5" y="33" width="17" height="7.5" rx="3.75" />
        <rect x="15.5" y="20.25" width="17" height="7.5" rx="3.75" />
        <rect x="26" y="7.5" width="17" height="7.5" rx="3.75" />
      </g>
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
      <LogoMark className={cn("shrink-0", size === "sm" ? "size-[24px]" : "size-7")} />
      <span>SentenceStep</span>
    </span>
  );
}
