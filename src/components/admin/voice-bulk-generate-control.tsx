"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { generateMissingVoiceForContent } from "@/lib/admin/voice-generation-actions";
import { cn } from "@/lib/utils";

/**
 * Safety valve, not a real limit on the backlog: each round is one small,
 * fast, synchronous request (see MAX_BULK_LESSONS_PER_RUN's own doc
 * comment), so this just bounds how long one click can keep looping before
 * handing control back to the admin — who can simply click again. Without
 * this, two lessons with a permanently broken voice selection (real
 * example: a stale voice_id pointing at a provider the assigned content
 * type doesn't use) would report "failed" forever and keep this loop
 * running indefinitely, since a round with real failures looks identical
 * to a round making real progress.
 */
const MAX_ROUNDS_PER_CLICK = 12;

export function VoiceBulkGenerateControl() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      let generated = 0;
      let skipped = 0;
      let failed = 0;
      let lessonsWorked = 0;
      let booksWorked = 0;
      let rounds = 0;

      try {
        for (; rounds < MAX_ROUNDS_PER_CLICK; rounds++) {
          const round = await generateMissingVoiceForContent();
          if (round.error) {
            setMessage({
              kind: "error",
              text:
                rounds > 0
                  ? `${round.error} (after ${generated} generated, ${failed} failed so far)`
                  : round.error,
            });
            return;
          }
          generated += round.generated;
          skipped += round.skipped;
          failed += round.failed;
          lessonsWorked += round.lessonsWorked;
          booksWorked += round.booksWorked;
          if (round.exhausted) break;
        }
      } catch {
        setMessage({
          kind: "error",
          text: `Couldn't reach the server. ${generated} generated, ${failed} failed before this happened — safe to try again.`,
        });
        return;
      }

      setMessage({
        kind: "success",
        text: `Processed ${lessonsWorked} lesson(s) and ${booksWorked} book(s): ${generated} generated, ${skipped} skipped, ${failed} failed.`,
      });
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
