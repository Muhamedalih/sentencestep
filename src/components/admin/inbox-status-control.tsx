"use client";

import { useState, useTransition } from "react";

import { updateInboundEmailStatus } from "@/lib/admin/inbox-actions";
import type { InboundEmailStatus } from "@/lib/admin/inbox-queries";

const STATUS_LABELS: Record<InboundEmailStatus, string> = {
  new: "New",
  read: "Read",
  replied: "Replied",
  archived: "Archived",
};

export function InboxStatusControl({ id, status }: { id: string; status: InboundEmailStatus }) {
  const [current, setCurrent] = useState(status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(next: InboundEmailStatus) {
    const previous = current;
    setCurrent(next);
    setError(null);
    startTransition(async () => {
      const result = await updateInboundEmailStatus(id, next);
      if (result.error) {
        setCurrent(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        value={current}
        disabled={isPending}
        onChange={(event) => handleChange(event.target.value as InboundEmailStatus)}
        aria-label="Message status"
        className="border-border bg-background rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-60"
      >
        {(Object.keys(STATUS_LABELS) as InboundEmailStatus[]).map((value) => (
          <option key={value} value={value}>
            {STATUS_LABELS[value]}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
