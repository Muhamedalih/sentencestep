import { after } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { generateStoryVoiceDraft } from "@/lib/voice/story-voice-generation";

/**
 * Fires best-effort ElevenLabs voice generation for a Story/Conversation
 * lesson, deferred until after the triggering request's response has
 * already been sent — mirrors src/lib/translation/auto-trigger.ts's exact
 * `after()` shape and its explicit "best-effort, not durable" contract (see
 * that file's doc comment for the full reasoning: no queue behind this,
 * recovery for a lost/failed attempt is the scheduled sweep at
 * src/app/api/cron/voice-sweep/route.ts, not this function).
 *
 * Deliberately a no-op for `mode === "normal"` — Kokoro's on-demand path
 * (voice-audio.ts) already handles Normal lessons and never needs this
 * background pipeline at all.
 */
export function triggerAutomaticVoiceGeneration(lessonId: string, mode: string): void {
  if (mode !== "stories" && mode !== "conversation") return;

  after(async () => {
    let supabase: ReturnType<typeof createServiceRoleClient>;
    try {
      supabase = createServiceRoleClient();
    } catch (err) {
      console.info("[voice] auto-trigger skipped — service-role client unavailable", {
        lessonId,
        reason: err instanceof Error ? err.message : String(err),
      });
      return;
    }

    try {
      const outcome = await generateStoryVoiceDraft(supabase, lessonId);
      if (outcome.error) {
        console.error("[voice] auto-trigger generation issue", { lessonId, error: outcome.error });
      }
    } catch (err) {
      console.error("[voice] auto-trigger threw", { lessonId, err });
    }
  });
}
