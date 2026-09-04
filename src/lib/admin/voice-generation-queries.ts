import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { createPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getBookVoiceStatus } from "@/lib/voice/book-voice-generation";
import { getLessonVoiceStatus, type SentenceVoiceStatus } from "@/lib/voice/story-voice-generation";

export interface VoiceDashboardRow {
  contentType: "story" | "conversation" | "normal" | "book";
  id: string;
  title: string;
  totalSentences: number;
  readyCount: number;
  failedCount: number;
  unresolvedCount: number;
  /** See 20250217000000_voice_generation_exclusion.sql — opted out of the bulk/cron sweep by an admin, without being unpublished. */
  excluded: boolean;
  /** This item's own narration voice override (lessons.voice_id / books.voice_id), or null when it falls back to the global default — the current selection for the dashboard's per-row voice picker. Never meaningful for "conversation" rows (see resolveTargetVoices' per-speaker branch). */
  voiceId: string | null;
}

/**
 * One row per published Stories lesson, published Conversation lesson,
 * published Normal lesson, and published Book, with its audio completeness
 * summary — mirrors listTranslationDashboardRows's shape. Uses the
 * service-role client (like the on-demand generation path itself) since
 * voice_audio_cache has no admin-session read policy of its own.
 *
 * Scoped to Stories + Conversation + Normal and to Books — the same scope
 * findLessonIdsNeedingVoiceGeneration/findBookIdsNeedingVoiceGeneration use
 * for the bulk/cron sweep, so this dashboard always shows exactly what
 * "Generate Missing Audio" would actually attempt.
 */
export async function listVoiceGenerationDashboardRows(): Promise<VoiceDashboardRow[]> {
  if (!isSupabaseConfigured()) return [];

  const publicClient = createPublicClient();
  const [{ data: lessons, error: lessonsError }, { data: books, error: booksError }] =
    await Promise.all([
      publicClient
        .from("lessons")
        .select("id, title, mode, voice_generation_excluded, voice_id")
        .in("mode", ["stories", "conversation", "normal"])
        .eq("status", "published")
        .order("title"),
      publicClient
        .from("books")
        .select("id, title, voice_generation_excluded, voice_id")
        .eq("status", "published")
        .order("title"),
    ]);
  // Isolated rather than one shared bail-out: Stories/Conversations and
  // Books are two independent queries against two independent tables, so
  // one failing (e.g. a pending migration not yet applied to this
  // environment) shouldn't blank out the other half of the dashboard too.
  const safeLessons = lessonsError ? [] : (lessons ?? []);
  const safeBooks = booksError ? [] : (books ?? []);

  // One item's status is several independent Supabase reads (settings,
  // sentences, voice resolution, cache lookup — see getLessonVoiceStatus/
  // getBookVoiceStatus) — fetching every item's status sequentially
  // multiplies that by the whole library's size, which measured as over 90
  // seconds (timed out) once a real default narration voice was configured
  // (before that, the "no voice configured" short-circuit made every
  // status resolve near-instantly, masking how slow the full per-item query
  // chain actually is). Bounded concurrency (not a single unbounded
  // Promise.all) keeps this fast without firing hundreds of simultaneous
  // requests at Supabase's connection pool on a large library.
  const serviceClient = createServiceRoleClient();

  const storyRows = mapWithConcurrency(safeLessons, VOICE_STATUS_CONCURRENCY, async (lesson) => {
    const { statuses } = await getLessonVoiceStatus(serviceClient, lesson.id);
    const contentType =
      lesson.mode === "conversation"
        ? "conversation"
        : lesson.mode === "normal"
          ? "normal"
          : "story";
    return summarize(
      contentType,
      lesson.id,
      lesson.title,
      lesson.voice_generation_excluded,
      lesson.voice_id,
      statuses,
    );
  });
  const bookRows = mapWithConcurrency(safeBooks, VOICE_STATUS_CONCURRENCY, async (book) => {
    const { statuses } = await getBookVoiceStatus(serviceClient, book.id);
    return summarize(
      "book",
      book.id,
      book.title,
      book.voice_generation_excluded,
      book.voice_id,
      statuses,
    );
  });

  return [...(await storyRows), ...(await bookRows)];
}

function summarize(
  contentType: "story" | "conversation" | "normal" | "book",
  id: string,
  title: string,
  excluded: boolean,
  voiceId: string | null,
  statuses: SentenceVoiceStatus[],
): VoiceDashboardRow {
  return {
    contentType,
    id,
    title,
    totalSentences: statuses.length,
    readyCount: statuses.filter((s) => s.status === "ready").length,
    failedCount: statuses.filter((s) => s.status === "failed").length,
    unresolvedCount: statuses.filter((s) => s.status === "unresolved").length,
    excluded,
    voiceId,
  };
}

const VOICE_STATUS_CONCURRENCY = 20;

/** Runs `fn` over every item in `items`, at most `limit` calls in flight at once, preserving input order in the result — a plain Promise.all() over a large content library risks firing hundreds of simultaneous Supabase requests at once. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await fn(items[index]!);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
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
