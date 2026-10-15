"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { setPassageAccess, setPassageStatus } from "@/lib/admin/passages-actions";
import type { ActionResult } from "@/lib/admin/passages-actions";
import { cn } from "@/lib/utils";

const SELECT_CLASS =
  "border-input bg-background h-9 rounded-lg border px-2.5 text-sm disabled:opacity-60";

/**
 * A select that saves the moment it changes — the Passages table and a passage's own
 * page both use it. The shown value follows the choice at once and goes back if the
 * save is refused (with the reason under it), so what the admin sees is what is saved.
 */
function SaveOnChangeSelect<T extends string>({
  label,
  value,
  options,
  save,
  tone,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  save: (next: T) => Promise<ActionResult>;
  /** Colours the closed select so a state reads at a glance without opening it. */
  tone?: (value: T) => string;
}) {
  const router = useRouter();
  const [shown, setShown] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // A refresh brings the saved value back in.
  useEffect(() => setShown(value), [value]);

  function change(next: T) {
    setError(null);
    setShown(next);
    startTransition(async () => {
      const result = await save(next);
      if (result.error) {
        setShown(value);
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        aria-label={label}
        value={shown}
        disabled={isPending}
        onChange={(event) => change(event.target.value as T)}
        className={cn(SELECT_CLASS, tone?.(shown))}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="text-danger max-w-56 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

/** Draft (only an admin opens it, as a preview) or Published (open to everyone the section is open to). */
export function PassageStatusSelect({
  passageId,
  status,
}: {
  passageId: string;
  status: "draft" | "published";
}) {
  return (
    <SaveOnChangeSelect
      label="Status"
      value={status}
      options={[
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
      ]}
      save={(next) => setPassageStatus(passageId, next)}
      tone={(value) => (value === "published" ? "text-success" : "text-muted-foreground")}
    />
  );
}

/** Free (everyone) or Premium (subscribers and admins). */
export function PassageAccessSelect({ passageId, isFree }: { passageId: string; isFree: boolean }) {
  return (
    <SaveOnChangeSelect
      label="Access"
      value={isFree ? "free" : "premium"}
      options={[
        { value: "free", label: "Free" },
        { value: "premium", label: "Premium" },
      ]}
      save={(next) => setPassageAccess(passageId, next === "free")}
    />
  );
}
