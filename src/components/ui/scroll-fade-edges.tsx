import { cn } from "@/lib/utils";

/**
 * Two edge-fade overlays for a horizontally-scrollable strip (the mobile tab
 * bars in LearnSidebar and LibraryCategoryNav): a soft gradient into the
 * surrounding background that only appears on the side(s) where content is
 * actually scrolled out of view, from useScrollEdgeFade. Without this, a
 * strip that overflows past the viewport gives no visual hint it's
 * scrollable at all — items past the fold just look like the row ends
 * there. Purely decorative (aria-hidden, pointer-events-none) — the strip
 * underneath is still reachable by scroll/swipe with or without it.
 */
export function ScrollFadeEdges({
  showStartFade,
  showEndFade,
  className,
}: {
  showStartFade: boolean;
  showEndFade: boolean;
  className?: string;
}) {
  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          "from-background pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r to-transparent transition-opacity duration-150",
          showStartFade ? "opacity-100" : "opacity-0",
          className,
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "from-background pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l to-transparent transition-opacity duration-150",
          showEndFade ? "opacity-100" : "opacity-0",
          className,
        )}
      />
    </>
  );
}
