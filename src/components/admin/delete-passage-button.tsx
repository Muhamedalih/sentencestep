"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deletePassage } from "@/lib/admin/passages-actions";

/** Deletes a draft passage for good (see deletePassage for what goes with it). A native confirm() first, like the other destructive admin buttons. */
export function DeletePassageButton({ passageId, title }: { passageId: string; title: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (
      !window.confirm(
        `Delete “${title}” for good? Its parts, lines, questions, narrated audio, its word lesson in Word Lists and every learner's progress on it are removed. This can't be undone.`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deletePassage(passageId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/admin/passages");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
      >
        <Trash2 aria-hidden="true" />
        {isPending ? "Deleting…" : "Delete passage"}
      </Button>
      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
