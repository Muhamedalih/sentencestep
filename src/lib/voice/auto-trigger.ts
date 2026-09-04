import { after } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { generateStoryVoiceDraft } from "@/lib/voice/story-voice-generation";
import { generateWordGroupVoiceDraft } from "@/lib/voice/word-list-voice-generation";

/**
 * Fires best-effort narration voice generation for a Story/Conversation/
 * Normal lesson, deferred until after the triggering request's response has
 * already been sent — mirrors src/lib/translation/auto-trigger.ts's exact
 * `after()` shape and its explicit "best-effort, not durable" contract (see
 * that file's doc comment for the full reasoning: no queue behind this,
 * recovery for a lost/failed attempt is the scheduled sweep at
 * src/app/api/cron/voice-sweep/route.ts, not this function).
 *
 * A Normal lesson uses a flat, neutral delivery instead of the Voice
 * Director's expressive direction (see generateStoryVoiceDraft's own doc
 * comment) — it still produces real, cached audio through this exact same
 * call, no separate on-demand path needed.
 */
export function triggerAutomaticVoiceGeneration(lessonId: string, mode: string): void {
  if (mode !== "stories" && mode !== "conversation" && mode !== "normal") return;

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

/**
 * The Word Lists counterpart to triggerAutomaticVoiceGeneration — same
 * best-effort, deferred, `after()`-based shape; recovery for a lost/failed
 * attempt is the same scheduled voice-sweep cron (see
 * findWordGroupIdsNeedingVoiceGeneration in candidates.ts).
 */
export function triggerAutomaticWordGroupVoiceGeneration(groupId: string): void {
  after(async () => {
    let supabase: ReturnType<typeof createServiceRoleClient>;
    try {
      supabase = createServiceRoleClient();
    } catch (err) {
      console.info("[voice] word-group auto-trigger skipped — service-role client unavailable", {
        groupId,
        reason: err instanceof Error ? err.message : String(err),
      });
      return;
    }

    try {
      const outcome = await generateWordGroupVoiceDraft(supabase, groupId);
      if (outcome.error) {
        console.error("[voice] word-group auto-trigger generation issue", {
          groupId,
          error: outcome.error,
        });
      }
    } catch (err) {
      console.error("[voice] word-group auto-trigger threw", { groupId, err });
    }
  });
}
