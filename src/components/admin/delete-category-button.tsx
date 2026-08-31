"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { deleteCategory } from "@/lib/admin/library-actions";

/** Soft delete only (is_active -> false) — see deleteCategory's doc comment for why this can never break a book's existing category association. Same window.confirm guard as ArchiveButton, for the same reason (reversible action, no dialog dependency in this project). */
export function DeleteCategoryButton({ id, bookCount }: { id: string; bookCount: number }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    const message =
      bookCount > 0
        ? `Delete this category? ${bookCount} book${bookCount === 1 ? "" : "s"} currently use it — they'll keep the association, but this category will stop being offered for new books and disappear from the Library.`
        : "Delete this category? It will disappear from the Library and stop being offered for new books.";
    if (!window.confirm(message)) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="ghost" size="sm" onClick={handleClick} disabled={isPending}>
        {isPending ? "Deleting…" : "Delete"}
      </Button>
      {error && (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
