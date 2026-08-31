import { BookOpen, SearchX } from "lucide-react";
import type { ReactNode } from "react";

/**
 * One reusable, intentionally-designed empty state for every "nothing here
 * yet" case the Library has: the whole library with zero books, a category
 * with none, and a search with no matches (Sections 7/11/17 of the spec).
 * No fake books, no fake covers, no lorem ipsum — just a calm icon + real
 * copy, matching the empty states already established elsewhere in the app
 * (e.g. NotConfiguredNotice's icon-in-a-tinted-box pattern).
 */
export function LibraryEmptyState({
  icon = "book",
  heading,
  body,
  className,
}: {
  icon?: "book" | "search";
  heading: string;
  body: string;
  className?: string;
}) {
  const Icon: ReactNode =
    icon === "search" ? (
      <SearchX className="size-5" aria-hidden="true" />
    ) : (
      <BookOpen className="size-5" aria-hidden="true" />
    );

  return (
    <div
      className={`border-border/80 flex flex-col items-center gap-2.5 rounded-2xl border border-dashed px-6 py-8 text-center ${className ?? ""}`}
    >
      <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-lg">
        {Icon}
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{heading}</p>
        <p className="text-muted-foreground max-w-sm text-sm">{body}</p>
      </div>
    </div>
  );
}
