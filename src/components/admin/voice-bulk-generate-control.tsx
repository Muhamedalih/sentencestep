"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { generateMissingVoiceForContent } from "@/lib/admin/voice-generation-actions";
import { cn } from "@/lib/utils";

export function VoiceBulkGenerateControl() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      const result = await generateMissingVoiceForContent();
      setMessage(
        result.error
          ? { kind: "error", text: result.error }
          : { kind: "success", text: result.success ?? "Done." },
      );
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Button type="button" onClick={handleClick} disabled={isPending}>
        {isPending ? "Generating…" : "Generate Missing Audio"}
      </Button>
      {message && (
        <p
          role={message.kind === "error" ? "alert" : undefined}
          className={cn(
            "text-sm",
            message.kind === "error" ? "text-danger" : "text-muted-foreground",
          )}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
