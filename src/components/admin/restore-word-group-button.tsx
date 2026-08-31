"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { restoreWordGroup } from "@/lib/admin/word-lists-actions";

/** Word Lists equivalent of RestoreBookButton — restores to draft, never straight back to published. */
export function RestoreWordGroupButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await restoreWordGroup(id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="ghost" size="sm" onClick={handleClick} disabled={isPending}>
        {isPending ? "Restoring…" : "Restore"}
      </Button>
      {error && (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
