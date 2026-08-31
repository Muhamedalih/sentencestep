"use client";

import Link from "next/link";

import { ArchiveBookButton } from "@/components/admin/archive-book-button";
import { RestoreBookButton } from "@/components/admin/restore-book-button";
import { BulkActionBar } from "@/components/admin/bulk-action-bar";
import { Badge } from "@/components/ui/badge";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { bulkUpdateBookStatus } from "@/lib/admin/library-actions";
import type { AdminBookSummary } from "@/lib/admin/library-queries";
import { tierLabel, type Difficulty } from "@/lib/levels";

const DIFFICULTY_BY_LEVEL: Record<number, Difficulty> = {
  1: "beginner",
  2: "intermediate",
  3: "advanced",
};

const STATUS_VARIANT = {
  draft: "muted",
  published: "success",
  archived: "outline",
} as const;

/** The Library books list's table — same client/server split as ContentTable, see that component's doc comment. */
export function BookTable({
  books,
  hasActiveFilters,
}: {
  books: AdminBookSummary[];
  hasActiveFilters: boolean;
}) {
  const ids = books.map((book) => book.id);
  const { selected, isSelected, allSelected, toggle, toggleAll, clear } = useBulkSelection(ids);

  return (
    <div className="flex flex-col gap-3">
      <BulkActionBar
        ids={selected}
        onClear={clear}
        actions={[
          {
            label: "Archive selected",
            pendingLabel: "Archiving…",
            run: (bulkIds) => bulkUpdateBookStatus(bulkIds, "archived"),
          },
          {
            label: "Restore to draft",
            pendingLabel: "Restoring…",
            variant: "ghost",
            run: (bulkIds) => bulkUpdateBookStatus(bulkIds, "draft"),
          },
        ]}
      />

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-left text-xs font-medium tracking-wide uppercase">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="accent-primary size-4"
                />
              </th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Difficulty</th>
              <th className="px-4 py-3">Access</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {books.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-muted-foreground px-4 py-8 text-center">
                  {hasActiveFilters
                    ? "No books match these filters."
                    : "No books yet. This is expected in the foundation phase — add real books once content is ready."}
                </td>
              </tr>
            ) : (
              books.map((book) => (
                <tr key={book.id}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${book.title}`}
                      checked={isSelected(book.id)}
                      onChange={() => toggle(book.id)}
                      className="accent-primary size-4"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      {book.title}
                      {book.isFeatured && <Badge variant="secondary">Featured</Badge>}
                    </div>
                  </td>
                  <td className="text-muted-foreground px-4 py-3">{book.author}</td>
                  <td className="text-muted-foreground px-4 py-3">
                    {book.primaryCategoryName ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">
                      {tierLabel(DIFFICULTY_BY_LEVEL[book.difficultyLevel] as Difficulty).label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={book.isFree ? "outline" : "secondary"}>
                      {book.isFree ? "Free" : "Premium"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[book.status]}>{book.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/library/${book.id}/sections`}
                        className="hover:bg-muted rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                      >
                        Sections
                      </Link>
                      <Link
                        href={`/admin/library/${book.id}/edit`}
                        className="hover:bg-muted rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                      >
                        Edit
                      </Link>
                      {book.status === "archived" ? (
                        <RestoreBookButton id={book.id} />
                      ) : (
                        <ArchiveBookButton id={book.id} />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
