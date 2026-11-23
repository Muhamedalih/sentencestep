import { unstable_cache } from "next/cache";

import { getLessonSummaries } from "@/lib/content";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public-client";

import { sentenceForDrop, type DropWord } from "./engine";

/**
 * The short sentences of sentences mode: the sentences of the FREE lessons and stories (3 to 6 plain
 * words, see sentenceForDrop), so any learner can be asked them and nothing paid is shown. Word Lists
 * sentences are 7 to 12 words long and do not fit; the free lessons and stories hold about forty that
 * do. One read of public rows, kept for an hour for everyone (the free lessons rarely change), so a
 * visit to Word Drop adds no database work for it. The meaning line is the sentence's Arabic for an
 * Arabic learner and empty for the other languages (no translation is read for them).
 */
async function loadUncached(arabic: boolean): Promise<DropWord[]> {
  if (!isSupabaseConfigured()) return [];
  const [normal, stories] = await Promise.all([
    getLessonSummaries("normal"),
    getLessonSummaries("stories"),
  ]);
  const ids = [...normal, ...stories].filter((lesson) => lesson.isFree).map((lesson) => lesson.id);
  if (ids.length === 0) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("sentences")
    .select("id, lesson_id, order_index, en, ar")
    .in("lesson_id", ids)
    .order("lesson_id")
    .order("order_index");
  if (error) throw error;
  const seen = new Set<string>();
  const pool: DropWord[] = [];
  for (const row of data ?? []) {
    const en = sentenceForDrop(row.en);
    if (en === null || seen.has(en)) continue;
    seen.add(en);
    pool.push({
      id: `s:${row.id}`,
      en,
      meaning: arabic ? row.ar.replace(/\s+/g, " ").trim() : "",
      sentence: null,
      audioUrl: null,
    });
  }
  return pool;
}

const loadCached = unstable_cache(loadUncached, ["word-drop-sentences"], { revalidate: 3600 });

/** The short sentences for sentences mode; an empty list on any failure (the mode then stays closed). */
export async function loadDropSentences(locale: string | null): Promise<DropWord[]> {
  try {
    return await loadCached(locale === null || locale === "ar");
  } catch (error) {
    console.error("[word-drop] reading the short sentences failed", error);
    return [];
  }
}
