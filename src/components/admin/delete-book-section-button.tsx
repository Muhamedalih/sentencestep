"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { deleteBookSection } from "@/lib/admin/library-actions";

/** Hard delete (see deleteBookSection's doc comment for why sections have no soft-delete lifecycle of their own) — same window.confirm guard as every other admin delete action in this project. */
export function DeleteBookSectionButton({ id, bookId }: { id: string; bookId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!window.confirm("Delete this section and all of its sentences? This can't be undone."))
      return;

    setError(null);
    startTransition(async () => {
      const result = await deleteBookSection(id, bookId);
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
