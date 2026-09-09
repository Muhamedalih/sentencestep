import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

const DEFAULT_MAX_VOICE_GENERATIONS_PER_DAY = 300;

function startOfTodayUtcIso(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

/**
 * Shared spend guard for every entry point into paid-provider voice
 * generation (the cron sweep in src/app/api/cron/voice-sweep/route.ts and
 * the admin "Generate Missing Audio" bulk action in
 * src/lib/admin/voice-generation-actions.ts) — see voice-sweep/route.ts's
 * doc comment for the September 2026 incident this guards against. Counts
 * actual successful generations already done today (voice_audio_cache rows
 * that turned 'ready' since midnight UTC) against MAX_VOICE_GENERATIONS_PER_DAY
 * (default 300), independent of which entry point is asking — a cap that
 * only watched one caller could still be blown through by another.
 */
export async function isDailyVoiceGenerationCapReached(
  supabase: DbClient,
): Promise<{ capped: boolean; generatedToday: number; dailyCap: number }> {
  const dailyCap = Number(
    process.env.MAX_VOICE_GENERATIONS_PER_DAY ?? DEFAULT_MAX_VOICE_GENERATIONS_PER_DAY,
  );
  const { count, error } = await supabase
    .from("voice_audio_cache")
    .select("id", { count: "exact", head: true })
    .eq("status", "ready")
    .gte("updated_at", startOfTodayUtcIso());
  if (error) throw error;

  const generatedToday = count ?? 0;
  return { capped: generatedToday >= dailyCap, generatedToday, dailyCap };
}
