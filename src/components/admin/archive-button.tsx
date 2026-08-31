"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { archiveLesson } from "@/lib/admin/content-actions";

/**
 * Archive is the only destructive action offered in the admin panel — no
 * hard delete (see the Milestone 11 report for why). A native confirm()
 * is enough of a guard for a reversible, non-destructive action; it avoids
 * pulling in a dialog component/dependency that doesn't otherwise exist in
 * this project.
 */
export function ArchiveButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!window.confirm("Archive this content? It will be hidden from learners, not deleted.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await archiveLesson(id);
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
