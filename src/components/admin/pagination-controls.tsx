import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Prev/Next paging for an admin list page — shared by Content and Library
 * rather than each hand-rolling its own, since the actual pagination logic
 * (server-side range query + total count) already lives per-domain in each
 * query module; this is purely the link-building/display part, which has no
 * domain-specific reasoning worth duplicating. Plain prev/next + a page
 * count, not numbered page links — admin content volumes here don't yet
 * justify jumping to an arbitrary page.
 */
export function PaginationControls({
  page,
  pageSize,
  totalCount,
  basePath,
  searchParams,
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  basePath: string;
  /** Existing filter/search query params to preserve when changing pages. */
  searchParams: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalPages <= 1) return null;

  function hrefForPage(target: number): string {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) query.set(key, value);
    }
    if (target > 1) query.set("page", String(target));
    const qs = query.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-muted-foreground text-sm">
        Page {page} of {totalPages} — {totalCount} item{totalCount === 1 ? "" : "s"}
      </p>
      <div className="flex gap-2">
        {page <= 1 ? (
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href={hrefForPage(page - 1)}>Previous</Link>
          </Button>
        )}
        {page >= totalPages ? (
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href={hrefForPage(page + 1)}>Next</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
