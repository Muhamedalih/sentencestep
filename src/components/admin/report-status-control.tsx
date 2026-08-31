"use client";

import { useState, useTransition } from "react";

import { updateProblemReportStatus } from "@/lib/admin/reports-actions";
import type { ProblemReportStatus } from "@/lib/admin/reports-queries";

const STATUS_LABELS: Record<ProblemReportStatus, string> = {
  new: "New",
  in_progress: "In progress",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

export function ReportStatusControl({ id, status }: { id: string; status: ProblemReportStatus }) {
  const [current, setCurrent] = useState(status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(next: ProblemReportStatus) {
    const previous = current;
    setCurrent(next);
    setError(null);
    startTransition(async () => {
      const result = await updateProblemReportStatus(id, next);
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
        onChange={(event) => handleChange(event.target.value as ProblemReportStatus)}
        className="border-border bg-background rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-60"
      >
        {(Object.keys(STATUS_LABELS) as ProblemReportStatus[]).map((value) => (
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
