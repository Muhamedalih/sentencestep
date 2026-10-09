"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { setAppRatingPublic } from "@/lib/admin/ratings-actions";

/** "Show on site" / "Hide from site" — approves a rating and its comment for public display (see listPublicAppRatings). */
export function RatingPublicToggle({ id, isPublic }: { id: string; isPublic: boolean }) {
  const [current, setCurrent] = useState(isPublic);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    const previous = current;
    setCurrent(!previous);
    setError(null);
    startTransition(async () => {
      const result = await setAppRatingPublic(id, !previous);
      if (result.error) {
        setCurrent(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant={current ? "secondary" : "outline"}
        size="sm"
        disabled={isPending}
        aria-pressed={current}
        onClick={handleClick}
      >
        {current ? "Shown on site — hide" : "Show on site"}
      </Button>
      {error && (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
