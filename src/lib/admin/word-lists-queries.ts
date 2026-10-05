import { WORD_IPA } from "@/data/word-lists/ipa";
import { createClient } from "@/lib/supabase/server";
import type { WordGroupStatus } from "@/lib/admin/word-lists-validation";

/**
 * Admin reads for Word Lists — the session-aware client, not the public one
 * src/lib/supabase/queries/word-lists.ts uses for the learner-facing app.
 * word_groups' and vocabulary_words' RLS policies both grant is_admin()
 * sessions unrestricted SELECT (see 20250119000000_word_lists.sql), so an
 * admin sees every group/word regardless of status or isFree — no
 * service-role client needed here.
 */

export interface AdminWordGroup {
  id: string;
  level: number;
  orderIndex: number;
  title: string;
  titleAr: string;
  description: string | null;
  descriptionAr: string | null;
  isFree: boolean;
  status: WordGroupStatus;
  /** Per-group Edge-TTS narration override — see word_groups.voice_id's own doc comment (src/types/database.ts). Null means "use the site-wide Word Lists default voice". */
  voiceId: string | null;
  wordCount: number;
}

export async function listWordGroupsAdmin(): Promise<AdminWordGroup[]> {
  const supabase = await createClient();
  const { data: groups, error } = await supabase
    .from("word_groups")
    .select("*")
    .order("order_index", { ascending: true });
  if (error) throw error;
  if (!groups || groups.length === 0) return [];

  const { data: words, error: wordsError } = await supabase
    .from("vocabulary_words")
    .select("group_id")
    .in(
      "group_id",
      groups.map((g) => g.id),
    );
  if (wordsError) throw wordsError;

  const countByGroup = new Map<string, number>();
  for (const word of words ?? []) {
    countByGroup.set(word.group_id, (countByGroup.get(word.group_id) ?? 0) + 1);
  }

  return groups.map((row) => ({
    id: row.id,
    level: row.level,
    orderIndex: row.order_index,
    title: row.title,
    titleAr: row.title_ar,
    description: row.description,
    descriptionAr: row.description_ar,
    isFree: row.is_free,
    status: row.status as WordGroupStatus,
    voiceId: row.voice_id,
    wordCount: countByGroup.get(row.id) ?? 0,
  }));
}

export interface AdminVocabularyWord {
  id: string;
  groupId: string;
  orderIndex: number;
  targetWord: string;
  sentence: string;
  hintAr: string;
  /** The IPA an admin set for this word, bare without slashes; null when none (the generated fallback applies). */
  ipa: string | null;
  /** The generated fallback for this word's target word (src/data/word-lists/ipa.ts), shown as the field's placeholder; null when there is none. */
  suggestedIpa: string | null;
  /** Extra answers this word accepts (British spellings, synonyms). null when the database has no accepted_answers column yet — the editor then does not offer the field. */
  alternates: string[] | null;
}

export interface AdminWordGroupDetail extends AdminWordGroup {
  words: AdminVocabularyWord[];
  /** The database has the accepted_answers column (20250324000000_word_accepted_answers.sql is applied), so the words editor can offer and save it. */
  alternatesSupported: boolean;
}

export async function getWordGroupByIdAdmin(id: string): Promise<AdminWordGroupDetail | null> {
  const supabase = await createClient();
  const { data: group, error } = await supabase
    .from("word_groups")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!group) return null;

  const { data: words, error: wordsError } = await supabase
    .from("vocabulary_words")
    .select("*")
    .eq("group_id", id)
    .order("order_index", { ascending: true });
  if (wordsError) throw wordsError;

  // A group that already has words answers the question by its own rows; an
  // empty one has to ask the table.
  let alternatesSupported: boolean;
  if ((words ?? []).length > 0) {
    alternatesSupported = (words ?? []).every((w) => Array.isArray(w.accepted_answers));
  } else {
    const { error: probeError } = await supabase
      .from("vocabulary_words")
      .select("accepted_answers")
      .limit(1);
    alternatesSupported = !probeError;
  }

  return {
    id: group.id,
    level: group.level,
    orderIndex: group.order_index,
    title: group.title,
    titleAr: group.title_ar,
    description: group.description,
    descriptionAr: group.description_ar,
    isFree: group.is_free,
    status: group.status as WordGroupStatus,
    voiceId: group.voice_id,
    wordCount: words?.length ?? 0,
    alternatesSupported,
    words: (words ?? []).map((w) => ({
      id: w.id,
      groupId: w.group_id,
      orderIndex: w.order_index,
      targetWord: w.target_word,
      sentence: w.sentence,
      hintAr: w.hint_ar,
      ipa: w.ipa,
      suggestedIpa: WORD_IPA[w.target_word.toLowerCase()] ?? null,
      alternates: Array.isArray(w.accepted_answers) ? w.accepted_answers : null,
    })),
  };
}
