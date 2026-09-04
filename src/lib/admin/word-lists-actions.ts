"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { requireEditorOrAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import { validateWordGroupInput, validateWordGroupWords } from "@/lib/admin/word-lists-validation";
import type { VocabularyWordInput, WordGroupInput } from "@/lib/admin/word-lists-validation";
import { createClient } from "@/lib/supabase/server";
import { triggerAutomaticWordGroupVoiceGeneration } from "@/lib/voice/auto-trigger";

export interface ActionResult {
  error?: string;
  success?: string;
  id?: string;
}

const POSTGRES_UNIQUE_VIOLATION = "23505";

function generateGroupId(): string {
  return `group-${randomUUID().slice(0, 8)}`;
}

function generateWordId(groupId: string): string {
  return `${groupId}-${randomUUID().slice(0, 8)}`;
}

export async function createWordGroup(input: WordGroupInput): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const validation = validateWordGroupInput(input);
  if (!validation.valid) return { error: validation.errors.join(" ") };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("word_groups")
    .insert({
      id: generateGroupId(),
      level: input.level,
      order_index: input.orderIndex,
      title: input.title.trim(),
      title_ar: input.titleAr.trim(),
      description: input.description?.trim() || null,
      description_ar: input.descriptionAr?.trim() || null,
      is_free: input.isFree,
      status: input.status,
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === POSTGRES_UNIQUE_VIOLATION) {
      return { error: "That order number is already used by another group." };
    }
    return { error: "Couldn't create the word group. Please try again." };
  }

  void logAdminAction("word_group.created", "word_group", data.id, { title: input.title });
  revalidatePath("/admin/word-lists");
  revalidatePath("/learn/word-lists");
  return { success: "Word group created.", id: data.id };
}

export async function updateWordGroup(
  input: Required<Pick<WordGroupInput, "id">> & WordGroupInput,
): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const validation = validateWordGroupInput(input);
  if (!validation.valid) return { error: validation.errors.join(" ") };

  const supabase = await createClient();
  const { error } = await supabase
    .from("word_groups")
    .update({
      level: input.level,
      order_index: input.orderIndex,
      title: input.title.trim(),
      title_ar: input.titleAr.trim(),
      description: input.description?.trim() || null,
      description_ar: input.descriptionAr?.trim() || null,
      is_free: input.isFree,
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);
  if (error) {
    if (error.code === POSTGRES_UNIQUE_VIOLATION) {
      return { error: "That order number is already used by another group." };
    }
    return { error: "Couldn't save the word group. Please try again." };
  }

  void logAdminAction("word_group.updated", "word_group", input.id);
  revalidatePath("/admin/word-lists");
  revalidatePath(`/admin/word-lists/${input.id}/edit`);
  revalidatePath("/learn/word-lists");
  return { success: "Word group saved." };
}

/**
 * Soft delete only, same reasoning as archiveBook/archiveLesson: word_groups
 * already has a status column with 'archived' as a valid state (see
 * 20250119000000_word_lists.sql), and vocabulary_words/word_progress both
 * cascade-delete from word_groups — a real DELETE here would silently wipe
 * every learner's progress on this group's words. Archiving instead just
 * drops the group out of "Published word groups are public" (its RLS
 * policy), hiding it from learners while admins keep full visibility.
 */
export async function archiveWordGroup(id: string): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();
  const { error } = await supabase
    .from("word_groups")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Couldn't archive the word group. Please try again." };

  void logAdminAction("word_group.archived", "word_group", id);
  revalidatePath("/admin/word-lists");
  revalidatePath("/learn/word-lists");
  return { success: "Word group archived." };
}

/** Restores to draft, never straight back to published — same convention as restoreBook/restoreLesson. */
export async function restoreWordGroup(id: string): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();
  const { error } = await supabase
    .from("word_groups")
    .update({ status: "draft", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Couldn't restore the word group. Please try again." };

  void logAdminAction("word_group.restored", "word_group", id);
  revalidatePath("/admin/word-lists");
  return { success: "Word group restored to draft." };
}

/** Bulk counterpart of archiveWordGroup/restoreWordGroup — same shape as bulkUpdateLessonStatus in content-actions.ts. */
export async function bulkUpdateWordGroupStatus(
  ids: string[],
  status: "archived" | "draft",
): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };
  if (ids.length === 0) return { error: "No word groups selected." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("word_groups")
    .update({ status, updated_at: new Date().toISOString() })
    .in("id", ids);
  if (error) {
    return {
      error:
        status === "archived"
          ? "Couldn't archive the selected word groups. Please try again."
          : "Couldn't restore the selected word groups. Please try again.",
    };
  }

  void logAdminAction(
    status === "archived" ? "word_group.bulk_archived" : "word_group.bulk_restored",
    "word_group",
    null,
    { ids },
  );
  revalidatePath("/admin/word-lists");
  revalidatePath("/learn/word-lists");
  return {
    success:
      status === "archived"
        ? `${ids.length} group${ids.length === 1 ? "" : "s"} archived.`
        : `${ids.length} group${ids.length === 1 ? "" : "s"} restored to draft.`,
  };
}

/**
 * Saves a group's word list: existing rows (carrying a real `id`) are
 * updated in place, rows with no `id` yet are inserted as new — deliberately
 * never a delete-and-reinsert of the whole set (the pattern saveLesson uses
 * for sentences), because word_progress.word_id references vocabulary_words
 * with ON DELETE CASCADE: reinserting even an unchanged word under a fresh
 * id would silently wipe every learner's progress on it. Removing a word
 * entirely is its own explicit action (deleteVocabularyWord) with its own
 * confirmation, never an implicit side effect of saving this form.
 *
 * order_index is reassigned to match the submitted array order for every
 * row, existing or new, in two passes — the same collision-avoidance
 * two-phase approach persistSectionSentences uses in library-actions.ts —
 * since vocabulary_words has a real unique index on (group_id, order_index)
 * that a direct reorder (e.g. swapping two rows) can transiently violate.
 */
export async function saveWordGroupWords(
  groupId: string,
  words: VocabularyWordInput[],
): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const validation = validateWordGroupWords(words);
  if (!validation.valid) return { error: validation.errors.join(" ") };

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const existing = words
    .map((word, index) => ({ word, index }))
    .filter(
      (
        entry,
      ): entry is {
        word: Required<Pick<VocabularyWordInput, "id">> & VocabularyWordInput;
        index: number;
      } => Boolean(entry.word.id),
    );

  // Phase A: every existing row to a unique negative placeholder position.
  if (existing.length > 0) {
    const placeholderRows = existing.map(({ word, index }) => ({
      id: word.id,
      group_id: groupId,
      order_index: -(index + 1),
      target_word: word.targetWord.trim().toLowerCase(),
      sentence: word.sentence.trim(),
      hint_ar: word.hintAr.trim(),
      updated_at: nowIso,
    }));
    const { error } = await supabase
      .from("vocabulary_words")
      .upsert(placeholderRows, { onConflict: "id" });
    if (error) return { error: "Couldn't save the words. Please try again." };
  }

  // Phase B: every row to its real final position — existing rows updated,
  // new rows (no id yet) inserted.
  const finalRows = words.map((word, index) => ({
    id: word.id ?? generateWordId(groupId),
    group_id: groupId,
    order_index: index,
    target_word: word.targetWord.trim().toLowerCase(),
    sentence: word.sentence.trim(),
    hint_ar: word.hintAr.trim(),
    updated_at: nowIso,
  }));
  const { error: finalError } = await supabase
    .from("vocabulary_words")
    .upsert(finalRows, { onConflict: "id" });
  if (finalError) return { error: "Couldn't save the words. Please try again." };

  // Best-effort, non-blocking: pre-generates this group's word pronunciation
  // audio ahead of any learner opening it — see
  // triggerAutomaticWordGroupVoiceGeneration's own doc comment.
  triggerAutomaticWordGroupVoiceGeneration(groupId);

  revalidatePath(`/admin/word-lists/${groupId}/edit`);
  revalidatePath("/admin/word-lists");
  revalidatePath("/learn/word-lists");
  return { success: "Words saved." };
}

/**
 * A real, hard DELETE — unlike a group, an individual word has no
 * "archived" state in this schema (learner visibility is controlled at the
 * group level only), so removing one really does mean removing it. The
 * ON DELETE CASCADE on word_progress.word_id means any learner's progress
 * specific to this one word goes with it, which is the confirmation dialog
 * this action's caller shows before calling it.
 */
export async function deleteVocabularyWord(id: string, groupId: string): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();
  const { error } = await supabase.from("vocabulary_words").delete().eq("id", id);
  if (error) return { error: "Couldn't delete the word. Please try again." };

  revalidatePath(`/admin/word-lists/${groupId}/edit`);
  revalidatePath("/admin/word-lists");
  revalidatePath("/learn/word-lists");
  return { success: "Word deleted." };
}
