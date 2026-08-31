"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  approveTranslationField,
  regenerateTranslationField,
} from "@/lib/admin/translation-actions";
import type { TranslationFieldDetail } from "@/lib/admin/translation-dashboard-queries";

const STATUS_BADGE: Record<
  TranslationFieldDetail["status"],
  {
    label: string;
    variant: "default" | "secondary" | "success" | "muted" | "outline";
    className?: string;
  }
> = {
  missing: { label: "Missing", variant: "muted" },
  ai_generated: { label: "AI draft", variant: "default" },
  approved: { label: "Approved", variant: "success" },
  failed: {
    label: "Failed",
    variant: "outline",
    className: "text-danger border-danger/40 bg-danger/10",
  },
};

/**
 * One translatable field's full review row: English source alongside the
 * current translation, its lifecycle metadata, and the actions available
 * for its current state. A single editable textarea + one "Approve" button
 * serves both plain Approve and Edit & Approve — if the admin didn't
 * change the text it's a plain approval, if they did it's an edit
 * approved in the same action, which is exactly what Edit & Approve means.
 * Regenerate only appears for an already-approved field (see
 * regenerateTranslationField's doc comment for why every other status
 * doesn't need it — those are handled by the page-level lesson-wide
 * Generate/Retry control instead).
 */
export function TranslationFieldReview({
  lessonId,
  locale,
  field,
}: {
  lessonId: string;
  locale: string;
  field: TranslationFieldDetail;
}) {
  const [value, setValue] = useState(field.translatedValue ?? "");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const badge = STATUS_BADGE[field.status];

  function handleApprove() {
    setMessage(null);
    startTransition(async () => {
      const result = await approveTranslationField(
        lessonId,
        field.contentType,
        field.contentId,
        field.field,
        locale,
        value,
      );
      setMessage(result.error ?? "Approved.");
    });
  }

  function handleRegenerate() {
    setMessage(null);
    startTransition(async () => {
      const result = await regenerateTranslationField(
        lessonId,
        locale,
        field.contentType,
        field.contentId,
        field.field,
      );
      if (result.error) {
        setMessage(result.error);
        return;
      }
      const outcome = result.outcome;
      setMessage(
        outcome && outcome.generated > 0
          ? "New draft generated — review and approve it below."
          : (outcome?.error ?? "Nothing changed."),
      );
    });
  }

  return (
    <div className="border-border rounded-xl border p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold">{field.label}</span>
        <div className="flex items-center gap-2">
          {field.isStale && (
            <Badge variant="secondary" className="text-accent-foreground">
              Stale
            </Badge>
          )}
          <Badge variant={badge.variant} className={badge.className}>
            {badge.label}
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-xs font-medium">English source</span>
          <p dir="ltr" className="border-input bg-muted/40 rounded-lg border px-3 py-2 text-sm">
            {field.englishSource}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-xs font-medium">Translation</span>
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            rows={2}
            disabled={isPending}
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full min-w-0 rounded-lg border px-3.5 py-2 text-sm shadow-sm transition-[color,box-shadow] outline-none focus-visible:ring-2"
          />
        </div>
      </div>

      {field.status === "failed" && field.lastAttemptError && (
        <p className="text-danger mt-2 text-xs">Last error: {field.lastAttemptError}</p>
      )}

      <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {field.provider && <span>Provider: {field.provider}</span>}
        {field.generatedAt && (
          <span>Generated: {new Date(field.generatedAt).toLocaleString()}</span>
        )}
        {field.reviewedAt && <span>Reviewed: {new Date(field.reviewedAt).toLocaleString()}</span>}
        {field.attempts > 0 && <span>Attempts: {field.attempts}</span>}
      </div>

      {field.previousValue && (
        <p className="text-muted-foreground mt-1 text-xs">
          Previously approved value: <span dir="ltr">{field.previousValue}</span>
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={isPending || !value.trim()}
          onClick={handleApprove}
        >
          {isPending ? "Saving…" : "Approve"}
        </Button>
        {field.status === "approved" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleRegenerate}
          >
            Regenerate
          </Button>
        )}
        {message && <span className="text-muted-foreground text-xs">{message}</span>}
      </div>
    </div>
  );
}
