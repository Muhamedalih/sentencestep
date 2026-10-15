import { unstable_cache } from "next/cache";
import { cache } from "react";

import { getDefaultPronunciationVoiceId } from "@/lib/admin/voices-queries";
import { estimatePassageMinutes } from "@/lib/passages/progress";
import { containsWholeWord } from "@/lib/passages/text";
import { parseQuestions } from "@/lib/passages/parse";
import { PASSAGES_CACHE_TAG } from "@/lib/passages/types";
import type {
  Passage,
  PassageProgress,
  PassageSection,
  PassageSentence,
  PassageSummary,
  PassageWord,
} from "@/lib/passages/types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { hashText, normalizeTextForVoice } from "@/lib/voice/resolution";
import type { Database } from "@/types/database";

/**
 * Passages content reads.
 *
 * Content (the passages, their parts, lines, questions and the word lesson
 * made from each) is identical for every viewer, so it is read with the
 * service-role client — the tables are closed to learners by RLS on purpose
 * (see 20250335000000_passages.sql) and every caller has ALREADY passed the
 * "passages" feature switch (Off / Admin preview / On) before it gets here.
 * That makes publishing one switch instead of a policy per table, and means a
 * learner can never read a passage straight from the browser while the switch
 * has not reached them.
 *
 * Because the result is the same for everyone it is also share-cached across
 * requests (unstable_cache, tag "passages"): opening the list or a passage
 * costs the database nothing once it is warm. Publishing, and the audio script
 * finishing, are picked up within CACHE_SECONDS; the publish action revalidates
 * the tag so a change an admin makes shows at once. Throws on a read error so
 * a failure is never cached.
 *
 * A learner's own progress is the opposite: per user, read through the
 * session-aware client so RLS keeps it to their own rows, never cached across
 * requests.
 */

const CACHE_SECONDS = 120;

type PassageRow = Database["public"]["Tables"]["passages"]["Row"];

/** A PostgREST `in (...)` list rides in the URL — keep each request's list short however many parts there are. */
export const IN_CHUNK_SIZE = 40;

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function toSummary(
  row: PassageRow,
  sectionCount: number,
  sentenceCount: number,
  questionCount: number,
): PassageSummary {
  return {
    id: row.id,
    order: row.order_index,
    level: row.level,
    tone: row.tone,
    icon: row.icon,
    title: row.title,
    titleAr: row.title_ar,
    summary: row.summary,
    summaryAr: row.summary_ar,
    isFree: row.is_free,
    sectionCount,
    sentenceCount,
    estimatedMinutes: estimatePassageMinutes(sentenceCount, questionCount),
    wordGroupId: row.word_group_id,
  };
}

// --- The list -------------------------------------------------------------

async function loadSummaries(): Promise<PassageSummary[]> {
  const supabase = createServiceRoleClient();

  const { data: passages, error } = await supabase
    .from("passages")
    .select("*")
    .eq("status", "published")
    .order("level")
    .order("order_index");
  if (error) throw error;
  if (!passages || passages.length === 0) return [];

  const { data: sections, error: sectionsError } = await supabase
    .from("passage_sections")
    .select("id, passage_id, questions")
    .in(
      "passage_id",
      passages.map((passage) => passage.id),
    );
  if (sectionsError) throw sectionsError;

  const sectionIds = (sections ?? []).map((section) => section.id);
  const sentenceRows = await Promise.all(
    chunk(sectionIds, IN_CHUNK_SIZE).map(async (ids) => {
      const { data, error: sentencesError } = await supabase
        .from("passage_sentences")
        .select("section_id")
        .in("section_id", ids);
      if (sentencesError) throw sentencesError;
      return data ?? [];
    }),
  );

  const sentencesBySection = new Map<string, number>();
  for (const row of sentenceRows.flat()) {
    sentencesBySection.set(row.section_id, (sentencesBySection.get(row.section_id) ?? 0) + 1);
  }

  return passages.map((row) => {
    const own = (sections ?? []).filter((section) => section.passage_id === row.id);
    const sentenceCount = own.reduce((sum, s) => sum + (sentencesBySection.get(s.id) ?? 0), 0);
    const questionCount = own.reduce((sum, s) => sum + parseQuestions(s.questions).length, 0);
    return toSummary(row, own.length, sentenceCount, questionCount);
  });
}

const readSummaries = unstable_cache(loadSummaries, ["passage-summaries"], {
  tags: [PASSAGES_CACHE_TAG],
  revalidate: CACHE_SECONDS,
});

/**
 * Every published passage as a card (no parts, no lines), in list order. Empty
 * when Supabase is not configured or the passages migration has not been
 * applied to this environment yet — the Passages page then shows its "nothing
 * here yet" state instead of an error.
 */
export const fetchPassageSummaries = cache(async (): Promise<PassageSummary[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    return await readSummaries();
  } catch (error) {
    console.error("[passages] fetchPassageSummaries failed", error);
    return [];
  }
});

// --- One passage ----------------------------------------------------------

/** The clips that already exist for these words under one voice, keyed by word — read-only, never generates. A word with no clip is simply absent (its card then uses the browser voice). */
async function lookupWordClipUrls(
  words: readonly string[],
  voiceId: string,
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (words.length === 0) return result;

  const wordsByHash = new Map<string, string[]>();
  for (const word of words) {
    const hash = hashText(normalizeTextForVoice(word));
    const list = wordsByHash.get(hash) ?? [];
    list.push(word);
    wordsByHash.set(hash, list);
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("voice_audio_cache")
    .select("text_hash, audio_url, updated_at")
    .eq("voice_id", voiceId)
    .in("text_hash", [...wordsByHash.keys()])
    .eq("status", "ready")
    .not("audio_url", "is", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;

  // Newest first, so the first row seen for a word is the freshest clip.
  for (const row of data ?? []) {
    if (!row.audio_url) continue;
    for (const word of wordsByHash.get(row.text_hash) ?? []) {
      if (!result.has(word)) result.set(word, row.audio_url);
    }
  }
  return result;
}

async function loadPassage(id: string): Promise<Passage | null> {
  const supabase = createServiceRoleClient();

  const { data: row, error } = await supabase
    .from("passages")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const groupId = row.word_group_id;
  const [sectionsResult, groupResult, wordsResult] = await Promise.all([
    supabase.from("passage_sections").select("*").eq("passage_id", id).order("order_index"),
    groupId
      ? supabase.from("word_groups").select("id, status").eq("id", groupId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    groupId
      ? supabase
          .from("vocabulary_words")
          .select("id, target_word, hint_ar")
          .eq("group_id", groupId)
          .order("order_index")
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (sectionsResult.error) throw sectionsResult.error;
  if (groupResult.error) throw groupResult.error;
  if (wordsResult.error) throw wordsResult.error;

  const sectionRows = sectionsResult.data ?? [];
  const { data: sentenceRows, error: sentencesError } = await supabase
    .from("passage_sentences")
    .select("*")
    .in(
      "section_id",
      sectionRows.map((section) => section.id),
    )
    .order("order_index");
  if (sentencesError) throw sentencesError;

  const sentencesBySection = new Map<string, PassageSentence[]>();
  for (const sentence of sentenceRows ?? []) {
    const list = sentencesBySection.get(sentence.section_id) ?? [];
    list.push({
      id: sentence.id,
      order: sentence.order_index,
      speaker: sentence.speaker,
      en: sentence.en,
      ar: sentence.ar,
      audioUrl: sentence.audio_url,
    });
    sentencesBySection.set(sentence.section_id, list);
  }

  const sections: PassageSection[] = sectionRows.map((section) => ({
    id: section.id,
    order: section.order_index,
    title: section.title,
    titleAr: section.title_ar,
    sentences: sentencesBySection.get(section.id) ?? [],
    questions: parseQuestions(section.questions),
  }));

  const wordRows = wordsResult.data ?? [];
  const allSentences = sections.flatMap((section) => section.sentences);
  let clipUrls = new Map<string, string>();
  if (wordRows.length > 0) {
    try {
      clipUrls = await lookupWordClipUrls(
        wordRows.map((word) => word.target_word),
        await getDefaultPronunciationVoiceId(),
      );
    } catch (clipError) {
      // The words screen works without clips (browser voice) — never fail the passage over them.
      console.error("[passages] word clip lookup failed", clipError);
    }
  }

  const words: PassageWord[] = wordRows.map((word) => {
    const context = allSentences.find((sentence) =>
      containsWholeWord(sentence.en, word.target_word),
    );
    return {
      id: word.id,
      word: word.target_word,
      hintAr: word.hint_ar,
      contextEn: context?.en ?? null,
      contextAr: context?.ar ?? null,
      audioUrl: clipUrls.get(word.target_word) ?? null,
    };
  });

  const questionCount = sections.reduce((sum, section) => sum + section.questions.length, 0);
  const sentenceCount = allSentences.length;

  return {
    ...toSummary(row, sections.length, sentenceCount, questionCount),
    status: row.status,
    sections,
    words,
    wordGroupStatus: groupResult.data?.status ?? null,
  };
}

/**
 * One passage with its parts, lines, questions and words, or null when it does
 * not exist. A draft is returned too, carrying its `status`: whether the viewer may
 * see it (an admin, as a preview) is the page's call, never this read's. Share-cached
 * per passage id; see the file's doc comment.
 */
export const fetchPassage = cache(async (id: string): Promise<Passage | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    return await unstable_cache(() => loadPassage(id), ["passage", id], {
      tags: [PASSAGES_CACHE_TAG],
      revalidate: CACHE_SECONDS,
    })();
  } catch (error) {
    console.error("[passages] fetchPassage failed", error);
    return null;
  }
});

// --- A learner's own progress ----------------------------------------------

/** All of one learner's passage progress, through the session-aware client (RLS keeps it to their own rows). Empty for a guest, and when the table is not there yet. */
export const fetchPassageProgress = cache(async (userId: string): Promise<PassageProgress[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("passage_progress")
      .select("passage_id, sections_done, correct_answers, total_questions, completed_at")
      .eq("user_id", userId);
    if (error) throw error;
    return (data ?? []).map((row) => ({
      passageId: row.passage_id,
      sectionsDone: row.sections_done,
      correctAnswers: row.correct_answers,
      totalQuestions: row.total_questions,
      completedAt: row.completed_at,
    }));
  } catch (error) {
    console.error("[passages] fetchPassageProgress failed", error);
    return [];
  }
});
