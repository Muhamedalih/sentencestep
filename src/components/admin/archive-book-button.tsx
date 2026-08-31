"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { archiveBook } from "@/lib/admin/library-actions";

/** Book equivalent of ArchiveButton (content-actions.ts) — same reversible, no-hard-delete convention. */
export function ArchiveBookButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!window.confirm("Archive this book? It will be hidden from learners, not deleted.")) return;
    setError(null);
    startTransition(async () => {
      const result = await archiveBook(id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="ghost" size="sm" onClick={handleClick} disabled={isPending}>
        {isPending ? "Archiving…" : "Archive"}
      </Button>
      {error && (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
