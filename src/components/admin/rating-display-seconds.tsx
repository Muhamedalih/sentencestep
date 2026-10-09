"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { setAppRatingDisplaySeconds } from "@/lib/admin/ratings-actions";
import {
  MAX_DISPLAY_SECONDS,
  MIN_DISPLAY_SECONDS,
  autoDisplaySeconds,
} from "@/lib/feedback/reviews-display";

/** How long an approved rating stays on screen in the public rotating box. Empty means automatic (short comment 1 second, longer 2). */
export function RatingDisplaySeconds({
  id,
  comment,
  initialSeconds,
}: {
  id: string;
  comment: string;
  initialSeconds: number | null;
}) {
  const [saved, setSaved] = useState(initialSeconds === null ? "" : String(initialSeconds));
  const [value, setValue] = useState(saved);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const changed = value.trim() !== saved;

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await setAppRatingDisplaySeconds(id, value);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(value.trim());
      setValue(value.trim());
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <label htmlFor={`seconds-${id}`} className="text-muted-foreground text-xs font-medium">
          Seconds on screen
        </label>
        <input
          id={`seconds-${id}`}
          type="number"
          inputMode="numeric"
          min={MIN_DISPLAY_SECONDS}
          max={MAX_DISPLAY_SECONDS}
          step={1}
          value={value}
          disabled={isPending}
          placeholder={`Auto (${autoDisplaySeconds(comment)})`}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && changed) save();
          }}
          className="border-border bg-background w-24 rounded-md border px-2 py-1 text-sm disabled:opacity-60"
        />
        {changed && (
          <Button type="button" size="sm" disabled={isPending} onClick={save}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
