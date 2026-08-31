"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { revokeUserRole } from "@/lib/admin/users-actions";

/** Same native-confirm pattern as ArchiveButton — reversible (a role can always be granted again), but worth one confirmation since it immediately cuts off admin/editor access. */
export function RevokeRoleButton({ userId, email }: { userId: string; email: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!window.confirm(`Remove admin/editor access for ${email}?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await revokeUserRole(userId);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="ghost" size="sm" onClick={handleClick} disabled={isPending}>
        {isPending ? "Removing…" : "Remove"}
      </Button>
      {error && (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
