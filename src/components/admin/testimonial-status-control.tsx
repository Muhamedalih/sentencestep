"use client";

import { useState, useTransition } from "react";

import { updateTestimonialStatus } from "@/lib/admin/testimonials-actions";
import type { TestimonialStatus } from "@/lib/admin/testimonials-queries";

const STATUS_LABELS: Record<TestimonialStatus, string> = {
  pending: "Pending",
  published: "Published",
  dismissed: "Dismissed",
};

export function TestimonialStatusControl({
  id,
  status,
}: {
  id: string;
  status: TestimonialStatus;
}) {
  const [current, setCurrent] = useState(status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(next: TestimonialStatus) {
    const previous = current;
    setCurrent(next);
    setError(null);
    startTransition(async () => {
      const result = await updateTestimonialStatus(id, next);
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
        onChange={(event) => handleChange(event.target.value as TestimonialStatus)}
        className="border-border bg-background rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-60"
      >
        {(Object.keys(STATUS_LABELS) as TestimonialStatus[]).map((value) => (
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
