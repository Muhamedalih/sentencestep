"use client";

import { useState, useTransition, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface BulkAction {
  label: string;
  pendingLabel: string;
  variant?: "outline" | "ghost" | "destructive";
  /** Runs the action for the given ids; return the same {error?, success?} shape every admin action already uses. */
  run: (ids: string[]) => Promise<{ error?: string; success?: string }>;
}

/**
 * A sticky bar that appears once at least one row is selected on an admin
 * list (Content, Library, Word Lists) — one shared component instead of a
 * bespoke bar per page, since every list needs the exact same shape: a
 * count, a set of bulk actions, and a way to clear the selection.
 */
export function BulkActionBar({
  ids,
  actions,
  onClear,
  extra,
}: {
  ids: string[];
  actions: BulkAction[];
  onClear: () => void;
  /** Anything list-specific to show alongside the count (rare — most callers won't need this). */
  extra?: ReactNode;
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (ids.length === 0) return null;

  function handleRun(action: BulkAction) {
    setMessage(null);
    setPendingLabel(action.pendingLabel);
    startTransition(async () => {
      const result = await action.run(ids);
      setPendingLabel(null);
      if (result.error) {
        setMessage({ text: result.error, isError: true });
        return;
      }
      setMessage({ text: result.success ?? "Done.", isError: false });
      onClear();
    });
  }

  return (
    <div className="border-border bg-card sticky top-[calc(4rem+1px)] z-30 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 shadow-sm">
      <span className="text-sm font-medium">{ids.length} selected</span>
      {extra}
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            type="button"
            variant={action.variant ?? "outline"}
            size="sm"
            disabled={isPending}
            onClick={() => handleRun(action)}
          >
            {isPending && pendingLabel === action.pendingLabel ? action.pendingLabel : action.label}
          </Button>
        ))}
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onClear} disabled={isPending}>
        Clear
      </Button>
      {message && (
        <span
          role="status"
          className={`text-xs ${message.isError ? "text-danger" : "text-muted-foreground"}`}
        >
          {message.text}
        </span>
      )}
    </div>
  );
}
