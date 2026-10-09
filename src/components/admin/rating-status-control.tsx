"use client";

import { useState, useTransition } from "react";

import { updateAppRatingStatus } from "@/lib/admin/ratings-actions";
import { APP_RATING_STATUSES, type AppRatingStatus } from "@/lib/admin/ratings-domain";

const STATUS_LABELS: Record<AppRatingStatus, string> = {
  new: "New",
  read: "Read",
  replied: "Replied",
  archived: "Archived",
};

export function RatingStatusControl({ id, status }: { id: string; status: AppRatingStatus }) {
  const [current, setCurrent] = useState(status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(next: AppRatingStatus) {
    const previous = current;
    setCurrent(next);
    setError(null);
    startTransition(async () => {
      const result = await updateAppRatingStatus(id, next);
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
        onChange={(event) => handleChange(event.target.value as AppRatingStatus)}
        className="border-border bg-background rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-60"
      >
        {APP_RATING_STATUSES.map((value) => (
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
