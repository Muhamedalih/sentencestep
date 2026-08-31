"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { restoreLesson } from "@/lib/admin/content-actions";

/**
 * The other half of ArchiveButton — restoreLesson() already existed
 * (content-actions.ts) and sets a lesson back to "draft" so an admin can
 * review before re-publishing, but had no UI path to actually call it,
 * leaving "Archive this content? ... not deleted" a promise the CMS
 * couldn't keep. Restores to draft rather than straight back to published,
 * matching what saveLesson does after a failed sentence save — an admin
 * always gets a chance to review before content goes live again.
 */
export function RestoreButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await restoreLesson(id);
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
