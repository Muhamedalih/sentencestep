import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { createPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getLessonVoiceStatus, type SentenceVoiceStatus } from "@/lib/voice/story-voice-generation";

export interface VoiceDashboardRow {
  lessonId: string;
  title: string;
  mode: "stories" | "conversation";
  totalSentences: number;
  readyCount: number;
  failedCount: number;
  unresolvedCount: number;
}

/**
 * One row per published Stories/Conversation lesson with its audio
 * completeness summary — mirrors listTranslationDashboardRows's shape.
 * Uses the service-role client (like the on-demand generation path itself)
 * since voice_audio_cache has no admin-session read policy of its own.
 */
export async function listVoiceGenerationDashboardRows(): Promise<VoiceDashboardRow[]> {
  if (!isSupabaseConfigured()) return [];

  const publicClient = createPublicClient();
  const { data: lessons, error } = await publicClient
    .from("lessons")
    .select("id, title, mode")
    .in("mode", ["stories", "conversation"])
    .eq("status", "published")
    .order("title");
  if (error || !lessons) return [];

  const serviceClient = createServiceRoleClient();
  const rows: VoiceDashboardRow[] = [];
  for (const lesson of lessons) {
    const { statuses } = await getLessonVoiceStatus(serviceClient, lesson.id);
    rows.push({
      lessonId: lesson.id,
      title: lesson.title,
      mode: lesson.mode as "stories" | "conversation",
      totalSentences: statuses.length,
      readyCount: statuses.filter((s) => s.status === "ready").length,
      failedCount: statuses.filter((s) => s.status === "failed").length,
      unresolvedCount: statuses.filter((s) => s.status === "unresolved").length,
    });
  }
  return rows;
}

export interface LessonVoiceDetail {
  lessonId: string;
  title: string;
  statuses: SentenceVoiceStatus[];
  sentenceText: Record<string, string>;
}

export async function getLessonVoiceDetail(lessonId: string): Promise<LessonVoiceDetail | null> {
  if (!isSupabaseConfigured()) return null;

  const publicClient = createPublicClient();
  const [{ data: lesson }, { data: sentences }] = await Promise.all([
    publicClient.from("lessons").select("id, title").eq("id", lessonId).maybeSingle(),
    publicClient.from("sentences").select("id, en").eq("lesson_id", lessonId).order("order_index"),
  ]);
  if (!lesson) return null;

  const serviceClient = createServiceRoleClient();
  const { statuses } = await getLessonVoiceStatus(serviceClient, lessonId);

  return {
    lessonId: lesson.id,
    title: lesson.title,
    statuses,
    sentenceText: Object.fromEntries((sentences ?? []).map((s) => [s.id, s.en])),
  };
}
