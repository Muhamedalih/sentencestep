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
}

export interface AdminWordGroupDetail extends AdminWordGroup {
  words: AdminVocabularyWord[];
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
    wordCount: words?.length ?? 0,
    words: (words ?? []).map((w) => ({
      id: w.id,
      groupId: w.group_id,
      orderIndex: w.order_index,
      targetWord: w.target_word,
      sentence: w.sentence,
      hintAr: w.hint_ar,
    })),
  };
}
