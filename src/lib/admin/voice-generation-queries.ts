import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { createPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getBookVoiceStatus } from "@/lib/voice/book-voice-generation";
import {
  getLessonVoiceStatus,
  type ExistingCacheRow,
  type PreloadedVoiceWorkContext,
  type SentenceRow,
  type SentenceVoiceStatus,
} from "@/lib/voice/story-voice-generation";
import { getDefaultNormalLessonVoiceId } from "@/lib/admin/voices-queries";

export interface VoiceDashboardRow {
  contentType: "story" | "conversation" | "normal" | "book";
  id: string;
  title: string;
  totalSentences: number;
  readyCount: number;
  failedCount: number;
  unresolvedCount: number;
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
        .select("id, title, mode, voice_id")
        .in("mode", ["stories", "conversation", "normal"])
        .eq("status", "published")
        .order("title"),
      publicClient
        .from("books")
        .select("id, title, voice_id")
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

  // elevenlabs_settings and the Normal-lesson default voice first — the
  // referencedVoiceIds set right below can't be finalized until both are
  // known (a lesson/book with no per-item override resolves straight to one
  // of these two defaults, so the `voices`/cache preloads below must include
  // them too, not just per-item overrides).
  const [{ data: settingsRow, error: settingsError }, defaultNormalLessonVoiceId] =
    await Promise.all([
      serviceClient
        .from("elevenlabs_settings")
        .select(
          "model, default_story_voice_id, stability, similarity_boost, style, speed, use_speaker_boost",
        )
        .eq("id", 1)
        .maybeSingle(),
      getDefaultNormalLessonVoiceId(),
    ]);

  const referencedVoiceIds = [
    ...new Set(
      [
        ...[...safeLessons, ...safeBooks].map((item) => item.voice_id),
        settingsRow?.default_story_voice_id ?? null,
        defaultNormalLessonVoiceId,
      ].filter((id): id is string => Boolean(id)),
    ),
  ];
  const lessonIds = safeLessons.map((l) => l.id);
  const bookIds = safeBooks.map((b) => b.id);

  // Every `voices` row this library could reference, every lesson's
  // sentences, every book's sections, and every relevant voice_audio_cache
  // row — each batched into exactly one query across the *whole* library
  // instead of running once per lesson/book (see PreloadedVoiceWorkContext's
  // own doc comment) — without this, loadLessonForVoiceWork/
  // loadBookForVoiceWork re-ran a `sentences` (or `book_sections` +
  // `book_sentences`) and `voice_audio_cache` query *per lesson and per
  // book*, which is what actually timed this dashboard out (measured at a
  // consistent 11-12s once the library grew to ~160 published lessons + 26
  // books — comfortably within Netlify's own real ~25s ceiling most of the
  // time, but not always, hence "sometimes it opens and sometimes it
  // doesn't") even after the elevenlabs_settings/voices preload alone had
  // already fixed the *other* per-item queries.
  const [{ data: voiceRows }, { data: sentenceRows }, { data: bookSections }, { data: cacheRows }] =
    await Promise.all([
      referencedVoiceIds.length
        ? serviceClient
            .from("voices")
            .select("id, source, provider_voice_id")
            .in("id", referencedVoiceIds)
        : Promise.resolve({
            data: [] as { id: string; source: string; provider_voice_id: string }[],
          }),
      lessonIds.length
        ? serviceClient
            .from("sentences")
            .select("id, en, speaker, order_index, lesson_id")
            .in("lesson_id", lessonIds)
            .order("order_index")
        : Promise.resolve({ data: [] as (SentenceRow & { lesson_id: string })[] }),
      bookIds.length
        ? serviceClient
            .from("book_sections")
            .select("id, book_id, order_index")
            .in("book_id", bookIds)
            .order("order_index")
        : Promise.resolve({ data: [] as { id: string; book_id: string; order_index: number }[] }),
      referencedVoiceIds.length
        ? serviceClient
            .from("voice_audio_cache")
            .select(
              "id, voice_id, text_hash, generation_version, status, attempts, audio_url, updated_at",
            )
            .in("voice_id", referencedVoiceIds)
        : Promise.resolve({ data: [] as ExistingCacheRow[] }),
    ]);

  const sentencesByLessonId = new Map<string, SentenceRow[]>();
  for (const row of sentenceRows ?? []) {
    const list = sentencesByLessonId.get(row.lesson_id) ?? [];
    list.push(row);
    sentencesByLessonId.set(row.lesson_id, list);
  }
  for (const list of sentencesByLessonId.values()) {
    list.sort((a, b) => a.order_index - b.order_index);
  }

  // book_sentences depends on the section ids just fetched above, so this
  // one query can't join the Promise.all above — still one query for every
  // book's sentences at once rather than one per book.
  const sectionIds = (bookSections ?? []).map((s) => s.id);
  const { data: bookSentenceRows } = sectionIds.length
    ? await serviceClient
        .from("book_sentences")
        .select("id, en, order_index, section_id")
        .in("section_id", sectionIds)
    : { data: [] as { id: string; en: string; order_index: number; section_id: string }[] };

  const sentencesBySectionId = new Map<
    string,
    { id: string; en: string; order_index: number; section_id: string }[]
  >();
  for (const row of bookSentenceRows ?? []) {
    const list = sentencesBySectionId.get(row.section_id) ?? [];
    list.push(row);
    sentencesBySectionId.set(row.section_id, list);
  }
  const sectionIdsByBookId = new Map<string, string[]>();
  for (const section of bookSections ?? []) {
    const list = sectionIdsByBookId.get(section.book_id) ?? [];
    list.push(section.id);
    sectionIdsByBookId.set(section.book_id, list);
  }
  const bookSentencesByBookId = new Map(
    [...sectionIdsByBookId].map(([bookId, secIds]) => [
      bookId,
      secIds.flatMap(
        (id) =>
          sentencesBySectionId
            .get(id)
            ?.slice()
            .sort((a, b) => a.order_index - b.order_index) ?? [],
      ),
    ]),
  );

  const cacheRowsByKey = new Map<string, ExistingCacheRow>(
    (cacheRows ?? []).map((row) => [
      `${row.voice_id}:${row.text_hash}:${row.generation_version}`,
      row as ExistingCacheRow,
    ]),
  );

  // A missing/errored settings row can't be preloaded — fall back to letting
  // each item fetch (and fail) it individually, exactly as before this
  // optimization existed, rather than silently hiding every item behind one
  // dashboard-wide error.
  const preloaded: PreloadedVoiceWorkContext | undefined =
    settingsError || !settingsRow
      ? undefined
      : {
          settingsRow,
          defaultNormalLessonVoiceId,
          voicesById: new Map((voiceRows ?? []).map((v) => [v.id, v])),
          // Both queries above already selected mode/voice_id (lessons) and
          // voice_id (books) for every item — reusing them here means
          // loadLessonForVoiceWork/loadBookForVoiceWork skip their own
          // per-item `lessons`/`books` re-fetch entirely (see
          // PreloadedVoiceWorkContext's own doc comment).
          lessonsById: new Map(
            safeLessons.map((l) => [l.id, { mode: l.mode, voice_id: l.voice_id }]),
          ),
          booksById: new Map(safeBooks.map((b) => [b.id, { voice_id: b.voice_id }])),
          sentencesByLessonId,
          bookSentencesByBookId,
          cacheRowsByKey,
        };

  const storyRows = mapWithConcurrency(safeLessons, VOICE_STATUS_CONCURRENCY, async (lesson) => {
    const { statuses } = await getLessonVoiceStatus(serviceClient, lesson.id, preloaded);
    const contentType =
      lesson.mode === "conversation"
        ? "conversation"
        : lesson.mode === "normal"
          ? "normal"
          : "story";
    return summarize(contentType, lesson.id, lesson.title, lesson.voice_id, statuses);
  });
  const bookRows = mapWithConcurrency(safeBooks, VOICE_STATUS_CONCURRENCY, async (book) => {
    const { statuses } = await getBookVoiceStatus(serviceClient, book.id, preloaded);
    return summarize("book", book.id, book.title, book.voice_id, statuses);
  });

  return [...(await storyRows), ...(await bookRows)];
}

function summarize(
  contentType: "story" | "conversation" | "normal" | "book",
  id: string,
  title: string,
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
