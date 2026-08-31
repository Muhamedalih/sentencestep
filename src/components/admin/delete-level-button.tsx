"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { deleteLevel } from "@/lib/admin/content-actions";

/**
 * A real hard delete — unlike content/books/word groups, a level has no
 * "archived" state (it's pure organizational metadata, never shown to
 * learners on its own), and lessons.level_id references it `on delete
 * restrict`, so the database itself refuses this while any lesson still
 * points to it. deleteLevel checks that first and returns a specific
 * "N lessons still use this" message rather than a raw database error.
 */
export function DeleteLevelButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!window.confirm("Delete this level? This can't be undone.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteLevel(id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="ghost" size="sm" onClick={handleClick} disabled={isPending}>
        {isPending ? "Deleting…" : "Delete"}
      </Button>
      {error && (
        <p role="alert" className="text-danger w-48 text-right text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
