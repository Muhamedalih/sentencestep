import { Play } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { VideoCardData } from "@/lib/video-dictation/content";
import { formatClipLength } from "@/lib/video-dictation/format";
import { cn } from "@/lib/utils";

/**
 * The classic Home's Video box (from xl up, beside the Stories card): the next video of the «فيديو»
 * library drawn like the Stories card — a cover in the site's own grey with a play ring, the clip's
 * length and two quiet lines that stand for the typing, then the heading, the video's title and a
 * button. No picture from YouTube is drawn on Home. The link is a full page load, like the menu item,
 * because only the section's own pages are served with YouTube in the Content-Security-Policy.
 */
export function HomeVideoCard({
  card,
  heading,
  tag,
  cta,
  className,
}: {
  card: VideoCardData;
  heading: string;
  tag: string;
  cta: string;
  className?: string;
}) {
  return (
    <a
      href={`/learn/video/${card.id}`}
      className={cn(
        "group border-border bg-card focus-visible:ring-ring focus-visible:ring-offset-background flex flex-1 flex-col overflow-hidden rounded-2xl border transition-[scale,translate,box-shadow] duration-[380ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] outline-none hover:shadow-[0_22px_40px_-12px_rgba(0,0,0,0.5)] focus-visible:ring-2 focus-visible:ring-offset-2 motion-safe:hover:-translate-y-2 motion-safe:hover:scale-[1.05]",
        className,
      )}
    >
      <div className="relative min-h-24 flex-1 overflow-hidden bg-[linear-gradient(180deg,var(--muted),var(--card))]">
        <span className="absolute top-3 left-3 rounded-[6px] bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white tabular-nums">
          {formatClipLength(card.clipSeconds)}
        </span>
        <span className="text-primary absolute top-3 right-3.5 text-xs font-semibold" dir="auto">
          {tag}
        </span>
        <span className="absolute inset-0 flex items-center justify-center pb-8">
          <span className="flex size-14 items-center justify-center rounded-full border border-white/30 transition-colors group-hover:border-white/60">
            <Play className="ms-0.5 size-5 fill-white text-white" aria-hidden="true" />
          </span>
        </span>
        <span className="absolute inset-x-5 bottom-4 flex flex-col gap-2" aria-hidden="true">
          <span className="bg-border/80 h-2 rounded-full">
            <span className="bg-primary block h-full w-[46%] rounded-full" />
          </span>
          <span className="bg-border/80 h-2 w-[72%] rounded-full" />
        </span>
      </div>
      <div className="flex shrink-0 flex-col gap-0.5 p-4">
        <h3 className="truncate text-sm font-semibold" dir="auto">
          {heading}
        </h3>
        <p className="text-muted-foreground truncate text-xs" dir="ltr">
          {card.title}
        </p>
        <span className={cn(buttonVariants({ size: "sm", variant: "outline" }), "mt-2 w-fit")}>
          <span dir="auto">{cta}</span>
        </span>
      </div>
    </a>
  );
}
