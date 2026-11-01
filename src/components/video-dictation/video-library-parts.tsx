import type { ReactNode } from "react";

import type { VideoStrings } from "@/lib/video-dictation/strings";
import { cn } from "@/lib/utils";

/**
 * The pieces of the library that the learners' page and the Admin's page share, so the two can never
 * drift apart: the title block (with a place for the Admin's arrange button), a section with its name
 * and count, and the grid the cards stand in.
 */

export function LibraryHeader({ strings, action }: { strings: VideoStrings; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col-reverse gap-4 sm:mb-8 sm:flex-row sm:items-end sm:gap-6">
      {action}
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold" dir="auto">
          {strings.libraryTitle}
        </h1>
        <p className="text-muted-foreground mt-1" dir="auto">
          {strings.librarySubtitle}
        </p>
      </div>
    </div>
  );
}

/** A section of the library: its name and how many videos it holds, and what follows (the grid, or the Admin's rows). */
export function SectionBlock({
  title,
  count,
  actions,
  children,
}: {
  title: string;
  count: number;
  /** Extra controls beside the name (the Admin's section arrows). */
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className={cn("flex items-center justify-between gap-3", actions ? "mb-3" : "mb-4")}>
        <h2 className="flex items-baseline gap-2 text-lg font-semibold" dir="ltr">
          <span>{title}</span>
          <span className="text-muted-foreground text-sm font-medium tabular-nums">{count}</span>
        </h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

/** One column on a phone, two from sm:, three from xl:. */
export function VideoGrid({ children }: { children: ReactNode }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-6 xl:grid-cols-3">
      {children}
    </ul>
  );
}
