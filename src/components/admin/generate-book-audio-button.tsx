"use client";

import { useState, useTransition } from "react";
import { Loader2, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { generateBookVoice } from "@/lib/admin/voice-generation-actions";
import { cn } from "@/lib/utils";

/**
 * Manual "Generate book audio" trigger for the Book Preview page — a book's
 * narration otherwise generates automatically (see
 * triggerAutomaticBookVoiceGeneration, fired after every section save, and
 * the voice-sweep cron's recovery pass), so this exists purely so an admin
 * can force an immediate attempt (e.g. right after configuring a default
 * narration voice for the first time) instead of waiting for the next
 * trigger.
 */
export function GenerateBookAudioButton({ bookId }: { bookId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      const result = await generateBookVoice(bookId);
      setMessage(
        result.error
          ? { kind: "error", text: result.error }
          : { kind: "success", text: result.success ?? "Done." },
      );
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Volume2 className="size-4" aria-hidden="true" />
        )}
        Generate book audio
      </Button>
      {message && (
        <p
          className={cn(
            "text-xs",
            message.kind === "error" ? "text-danger" : "text-muted-foreground",
          )}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
