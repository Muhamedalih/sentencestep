import { after } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { generateBookVoiceDraft } from "@/lib/voice/book-voice-generation";

/**
 * Fires best-effort narration generation for a book after one of its
 * sections is saved, deferred until after the triggering request's response
 * has already been sent — mirrors auto-trigger.ts's exact `after()` shape
 * and its "best-effort, not durable" contract (see that file's doc comment;
 * recovery for a lost/failed attempt is the scheduled sweep at
 * src/app/api/cron/voice-sweep/route.ts, not this function).
 */
export function triggerAutomaticBookVoiceGeneration(bookId: string): void {
  after(async () => {
    let supabase: ReturnType<typeof createServiceRoleClient>;
    try {
      supabase = createServiceRoleClient();
    } catch (err) {
      console.info("[voice] book auto-trigger skipped — service-role client unavailable", {
        bookId,
        reason: err instanceof Error ? err.message : String(err),
      });
      return;
    }

    try {
      const outcome = await generateBookVoiceDraft(supabase, bookId);
      if (outcome.error) {
        console.error("[voice] book auto-trigger generation issue", {
          bookId,
          error: outcome.error,
        });
      }
    } catch (err) {
      console.error("[voice] book auto-trigger threw", { bookId, err });
    }
  });
}
