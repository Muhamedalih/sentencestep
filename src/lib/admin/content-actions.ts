"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { requireEditorOrAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import {
  validateLessonInput,
  validateLevelInput,
  validatePreviewSentences,
} from "@/lib/admin/validation";
import type { LessonInput, LevelInput, PreviewSentenceInput } from "@/lib/admin/validation";
import {
  upsertTranslation,
  upsertEsWordArrayTranslation,
  orphanedSentenceTranslationIds,
  markTranslationsStaleIfChanged,
} from "@/lib/admin/translations";
import { triggerAutomaticTranslation } from "@/lib/translation/auto-trigger";
import { triggerAutomaticVoiceGeneration } from "@/lib/voice/auto-trigger";
import { createClient } from "@/lib/supabase/server";
import type { LearningMode } from "@/types/content";

export interface ActionResult {
  error?: string;
  success?: string;
  id?: string;
}

const POSTGRES_UNIQUE_VIOLATION = "23505";
const POSTGRES_FOREIGN_KEY_VIOLATION = "23503";

/**
 * Updates a level's "Start Simple" preview sentences (see
 * src/lib/content.ts's getStartSimplePreviews) — the standalone example
 * sentences shown on the /learn homepage before any lesson. Kept separate
 * from createLevel/the level table's other fields since it's edited from a
 * different, smaller form (see level-preview-form.tsx) and doesn't touch
 * title/index.
 */
export async function updateLevelPreview(
  levelId: string,
  sentences: PreviewSentenceInput[],
): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const validation = validatePreviewSentences(sentences);
  if (!validation.valid) return { error: validation.errors.join(" ") };

  const supabase = await createClient();
  const { error } = await supabase
    .from("levels")
    .update({
      preview_sentences: sentences.map((s) => ({ en: s.en.trim(), ar: s.ar.trim() })),
    })
    .eq("id", levelId);
  if (error) return { error: "Couldn't save the preview sentences. Please try again." };

  await upsertEsWordArrayTranslation(
    "level",
    levelId,
    "preview_sentences",
    sentences.map((s) => ({ en: s.en.trim(), es: s.es?.trim() ?? "" })),
  );

  revalidatePath("/admin/levels");
  revalidatePath("/learn");
  return { success: "Preview sentences saved." };
}

export async function createLevel(input: LevelInput): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const validation = validateLevelInput(input);
  if (!validation.valid) return { error: validation.errors.join(" ") };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("levels")
    .insert({ mode: input.mode, index: input.index, title: input.title, title_ar: input.titleAr })
    .select("id")
    .single();

  if (error) {
    if (error.code === POSTGRES_UNIQUE_VIOLATION) {
      return { error: "That level number already exists for this mode." };
    }
    return { error: "Couldn't create the level. Please try again." };
  }

  await upsertTranslation("es", "level", data.id, "title", input.titleEs, input.title);

  void logAdminAction("level.created", "level", data.id, { mode: input.mode, index: input.index });
  revalidatePath("/admin/levels");
  return { success: "Level created.", id: data.id };
}

/**
 * `mode` is deliberately never written here even though LevelInput carries
 * it — lessons reference this level by level_id, not by (mode, index), so
 * changing which mode an existing level belongs to would silently strand
 * every lesson already assigned to it under the wrong mode's level list.
 * The edit form never offers a mode field for this reason; index/title are
 * safe to change freely (difficultyForLevel derives from index at read
 * time, so retitling or renumbering a level just changes its display, never
 * anything already stored on a lesson).
 */
export async function updateLevel(input: LevelInput & { id: string }): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const validation = validateLevelInput(input);
  if (!validation.valid) return { error: validation.errors.join(" ") };

  const supabase = await createClient();
  const { error } = await supabase
    .from("levels")
    .update({ index: input.index, title: input.title, title_ar: input.titleAr })
    .eq("id", input.id);

  if (error) {
    if (error.code === POSTGRES_UNIQUE_VIOLATION) {
      return { error: "That level number already exists for this mode." };
    }
    return { error: "Couldn't save the level. Please try again." };
  }

  await upsertTranslation("es", "level", input.id, "title", input.titleEs, input.title);

  void logAdminAction("level.updated", "level", input.id);
  revalidatePath("/admin/levels");
  return { success: "Level saved." };
}

/**
 * lessons.level_id references levels(id) `on delete restrict` (see
 * 20250101000000_init_schema.sql) — Postgres itself refuses this delete
 * while any lesson still points to the level, so a lesson can never be
 * silently orphaned. The count check below exists to give a clear,
 * specific message before that happens rather than surfacing a raw
 * database error; POSTGRES_FOREIGN_KEY_VIOLATION is still handled
 * afterward as a safety net for the rare race where a lesson is reassigned
 * to this level between the check and the delete.
 */
export async function deleteLevel(id: string): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("lessons")
    .select("*", { count: "exact", head: true })
    .eq("level_id", id);
  if (countError) return { error: "Couldn't check this level's lessons. Please try again." };
  if (count && count > 0) {
    return {
      error: `Can't delete — ${count} lesson${count === 1 ? "" : "s"} still use${count === 1 ? "s" : ""} this level. Move or delete ${count === 1 ? "it" : "them"} first.`,
    };
  }

  const { error } = await supabase.from("levels").delete().eq("id", id);
  if (error) {
    if (error.code === POSTGRES_FOREIGN_KEY_VIOLATION) {
      return { error: "Can't delete — lessons still use this level." };
    }
    return { error: "Couldn't delete the level. Please try again." };
  }

  void logAdminAction("level.deleted", "level", id);
  revalidatePath("/admin/levels");
  return { success: "Level deleted." };
}

/** `id` is already part of LessonInput (see its doc comment) — this is just a named alias for the type saveLesson accepts, kept distinct from LessonInput for readability at call sites. */
export type LessonMutationInput = LessonInput;

function generateLessonId(mode: string): string {
  return `${mode}-${randomUUID().slice(0, 8)}`;
}

/**
 * Creates or updates a lesson and fully replaces its sentences. Sentences
 * are always deleted and re-inserted rather than diffed — simpler and more
 * reliable to reason about than partial updates for a first CMS version
 * (see the Milestone 11 report for the small atomicity trade-off this
 * implies without a database transaction/RPC). Sentence ids stay
 * deterministic (`${lessonId}-s${index + 1}`) across this delete-and-
 * reinsert, which is what lets Arabic/Spanish content_translations rows
 * stay correctly associated with "the same" sentence across edits even
 * though the underlying row is a new one each time.
 *
 * Arabic, Spanish, and Turkish are all written into content_translations
 * here (in addition to Arabic's legacy title_ar/description_ar/sentences.ar
 * columns, still written above and not going away in this phase) — see
 * upsertTranslation's doc comment. For a brand-new lesson, validateLessonInput
 * has already required all three to be non-empty (see its isNewContent
 * handling), so none of the three ever hits upsertTranslation's delete-on-
 * empty branch on creation; editing an older lesson that predates Spanish/
 * Turkish coverage can still submit an empty value for either, which
 * correctly deletes nothing new (see getTranslations' doc comment for how
 * an already-approved value survives an edit instead of being wiped). If
 * the sentence count shrinks between saves, orphanedSentenceTranslationIds
 * finds and cleans up any translation rows left pointing at sentence ids
 * that no longer exist.
 */
export async function saveLesson(input: LessonMutationInput): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const validation = validateLessonInput(input);
  if (!validation.valid) return { error: validation.errors.join(" ") };

  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const isCreate = !input.id;

  const lessonPayload = {
    mode: input.mode,
    level_id: input.levelId,
    order_index: input.orderIndex,
    title: input.title.trim(),
    title_ar: input.titleAr.trim(),
    description: input.description?.trim() || null,
    description_ar: input.descriptionAr?.trim() || null,
    is_free: input.isFree,
    status: input.status,
    voice_id: input.voiceId ?? null,
    updated_at: nowIso,
  };

  let lessonId = input.id;
  /** Populated only when editing — the sentence ids that existed before this save's delete-and-reinsert, used below to find any content_translations rows a shrinking sentence count leaves behind. */
  let previousSentenceIds: string[] = [];

  if (lessonId) {
    const { error } = await supabase.from("lessons").update(lessonPayload).eq("id", lessonId);
    if (error) {
      if (error.code === POSTGRES_UNIQUE_VIOLATION) {
        return { error: "That order number is already used in this mode — pick another." };
      }
      return { error: "Couldn't save the lesson. Please try again." };
    }

    const { data: existingSentences, error: fetchError } = await supabase
      .from("sentences")
      .select("id")
      .eq("lesson_id", lessonId);
    if (fetchError) return { error: "Couldn't update the sentences. Please try again." };
    previousSentenceIds = (existingSentences ?? []).map((row) => row.id);

    const { error: deleteError } = await supabase
      .from("sentences")
      .delete()
      .eq("lesson_id", lessonId);
    if (deleteError) return { error: "Couldn't update the sentences. Please try again." };
  } else {
    lessonId = generateLessonId(input.mode);
    const { error } = await supabase.from("lessons").insert({ id: lessonId, ...lessonPayload });
    if (error) {
      if (error.code === POSTGRES_UNIQUE_VIOLATION) {
        return { error: "That order number is already used in this mode — pick another." };
      }
      return { error: "Couldn't create the lesson. Please try again." };
    }
  }

  const sentenceId = (index: number) => `${lessonId}-s${index + 1}`;

  const sentenceRows = input.sentences.map((sentence, index) => ({
    id: sentenceId(index),
    lesson_id: lessonId as string,
    order_index: index,
    en: sentence.en.trim(),
    ar: sentence.ar.trim(),
    speaker: input.mode === "conversation" ? (sentence.speaker?.trim() ?? null) : null,
    audio_url: sentence.audioUrl?.trim() || null,
    updated_at: nowIso,
  }));

  const { error: insertError } = await supabase.from("sentences").insert(sentenceRows);
  if (!insertError) {
    // Arabic is written here in addition to (not instead of) the legacy
    // title_ar/description_ar/sentences.ar columns set above — this is what
    // keeps content_translations synchronized going forward, closing the
    // staleness gap the lifecycle-foundation migration fixed as a one-time
    // resync (see this file's saveLesson doc comment and that migration's
    // comment for the full history). Arabic values are never empty here —
    // validateLessonInput requires every one of them — so these always take
    // upsertTranslation's write branch, never its delete-on-empty branch.
    // Spanish and Turkish are equally guaranteed non-empty for a brand-new
    // lesson (validateLessonInput's isNewContent requirement); on an edit of
    // an older lesson they may still be empty, which correctly no-ops or
    // deletes rather than writing a blank approved value.
    await Promise.all([
      upsertTranslation("es", "lesson", lessonId, "title", input.titleEs, input.title),
      upsertTranslation("ar", "lesson", lessonId, "title", input.titleAr, input.title),
      upsertTranslation("tr", "lesson", lessonId, "title", input.titleTr, input.title),
      upsertTranslation(
        "es",
        "lesson",
        lessonId,
        "description",
        input.descriptionEs,
        input.description,
      ),
      upsertTranslation(
        "ar",
        "lesson",
        lessonId,
        "description",
        input.descriptionAr,
        input.description,
      ),
      upsertTranslation(
        "tr",
        "lesson",
        lessonId,
        "description",
        input.descriptionTr,
        input.description,
      ),
      ...input.sentences.flatMap((sentence, index) => {
        const id = sentenceId(index);
        return [
          upsertTranslation("es", "sentence", id, "text", sentence.es, sentence.en),
          upsertTranslation("ar", "sentence", id, "text", sentence.ar, sentence.en),
          upsertTranslation("tr", "sentence", id, "text", sentence.tr, sentence.en),
        ];
      }),
    ]);

    // Cleanup only, not data-integrity-critical — the lesson and its
    // sentences already saved successfully above regardless of whether this
    // succeeds, so a failure here is swallowed rather than turning a
    // successful save into a reported failure. See
    // orphanedSentenceTranslationIds' doc comment for why this is needed at
    // all (no FK/cascade exists from sentences into content_translations).
    const orphanedIds = orphanedSentenceTranslationIds(
      previousSentenceIds,
      sentenceRows.map((row) => row.id),
    );
    if (orphanedIds.length > 0) {
      await supabase
        .from("content_translations")
        .delete()
        .eq("content_type", "sentence")
        .in("content_id", orphanedIds);
    }

    // Staleness pass — deliberately sequential, after the upserts above,
    // not merged into that Promise.all: it depends on Arabic/Spanish/
    // Turkish's own source_snapshot already being refreshed to the new
    // English text by the time it runs, which is what lets it correctly
    // leave those three locales alone without special-casing them (see
    // markTranslationsStaleIfChanged's doc comment). Any other enabled
    // locale added in the future gets flagged here instead, without this
    // file needing to know it exists.
    await Promise.all([
      markTranslationsStaleIfChanged("lesson", lessonId, "title", input.title),
      ...(input.description
        ? [markTranslationsStaleIfChanged("lesson", lessonId, "description", input.description)]
        : []),
      ...sentenceRows.map((row) =>
        markTranslationsStaleIfChanged("sentence", row.id, "text", row.en),
      ),
      // word_translations' source_snapshot is the sentence's own English
      // text (see generate.ts's TranslatableField doc comment) — the same
      // English edit that stales "text" must stale "word_translations" too,
      // for exactly the same reason and via the same generic function; a
      // no-op update when no such row exists yet, same as the "text" call.
      ...sentenceRows.map((row) =>
        markTranslationsStaleIfChanged("sentence", row.id, "word_translations", row.en),
      ),
    ]);

    // Best-effort, non-blocking: draft translations for any enabled locale
    // beyond what the admin just typed directly (Arabic/Spanish). Never
    // delays this action's response — see triggerAutomaticTranslation's own
    // doc comment for exactly what "best effort" means here and why.
    triggerAutomaticTranslation(lessonId);

    // Same best-effort, non-blocking shape as translation above — see
    // triggerAutomaticVoiceGeneration's own doc comment. Covers Normal
    // lessons exactly like Stories/Conversation.
    triggerAutomaticVoiceGeneration(lessonId, input.mode);
  }
  if (insertError) {
    if (isCreate) {
      // This lesson row didn't exist before this call — the New Lesson form
      // has no id to resume with, so leaving it behind would silently
      // occupy this (mode, order_index) slot forever: a retry from the same
      // form calls saveLesson again with no id, generates a DIFFERENT new
      // id, and immediately collides on "That order number is already used"
      // against the orphan it can't see or reach. Full rollback instead —
      // safe because nothing referencing this lesson (progress, analytics)
      // can exist yet for a row that was never successfully saved.
      await supabase.from("lessons").delete().eq("id", lessonId);
    } else if (lessonPayload.status === "published") {
      // Editing an existing lesson: the old sentences are already gone at
      // this point — there's no database transaction wrapping the
      // delete-then-insert sequence above (see this function's doc
      // comment). Left alone, a lesson whose status was "published" would
      // stay published with zero sentences, which is exactly the broken,
      // silently-empty lesson experience this app must never show a real
      // learner. Best-effort pull it back to draft so it's hidden again
      // instead — the admin still sees the save failed and can retry via
      // the same edit form, but nothing live is ever left content-less in
      // the meantime.
      await supabase
        .from("lessons")
        .update({ status: "draft", updated_at: new Date().toISOString() })
        .eq("id", lessonId);
    }
    return { error: "Couldn't save the sentences. Please try again." };
  }

  void logAdminAction(isCreate ? "lesson.created" : "lesson.updated", "lesson", lessonId, {
    title: input.title,
    mode: input.mode,
    status: input.status,
  });
  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${lessonId}/edit`);
  return { success: "Lesson saved.", id: lessonId };
}

/** Soft-delete: archived content is hidden from learners (same RLS gate as drafts) but never removed, so historical progress/analytics referencing it stay intact — see the Milestone 11 report for why hard delete isn't offered at all. */
export async function archiveLesson(id: string): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();
  const { error } = await supabase
    .from("lessons")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Couldn't archive the lesson. Please try again." };

  void logAdminAction("lesson.archived", "lesson", id);
  revalidatePath("/admin/content");
  return { success: "Lesson archived." };
}

export async function restoreLesson(id: string): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();
  const { error } = await supabase
    .from("lessons")
    .update({ status: "draft", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Couldn't restore the lesson. Please try again." };

  void logAdminAction("lesson.restored", "lesson", id);
  revalidatePath("/admin/content");
  return { success: "Lesson restored to draft." };
}

/** Bulk counterpart of archiveLesson/restoreLesson — the Content list's "select rows, act on all of them at once" control. Same single UPDATE ... WHERE id = ANY(...) either way; `.in()` is what generates that. */
export async function bulkUpdateLessonStatus(
  ids: string[],
  status: "archived" | "draft",
): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };
  if (ids.length === 0) return { error: "No content selected." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("lessons")
    .update({ status, updated_at: new Date().toISOString() })
    .in("id", ids);
  if (error) {
    return {
      error:
        status === "archived"
          ? "Couldn't archive the selected content. Please try again."
          : "Couldn't restore the selected content. Please try again.",
    };
  }

  void logAdminAction(
    status === "archived" ? "lesson.bulk_archived" : "lesson.bulk_restored",
    "lesson",
    null,
    {
      ids,
    },
  );
  revalidatePath("/admin/content");
  return {
    success:
      status === "archived"
        ? `${ids.length} item${ids.length === 1 ? "" : "s"} archived.`
        : `${ids.length} item${ids.length === 1 ? "" : "s"} restored to draft.`,
  };
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Recovers the bucket-relative Storage path from a lesson-illustrations
 * public URL (".../object/public/lesson-illustrations/normal-1/abc.png" ->
 * "normal-1/abc.png"). Returns null for anything that doesn't match, so
 * callers never issue a remove() with a bogus path.
 *
 * Used instead of Storage's own `.list()` to find "the file(s) currently
 * there" — `.list()` needs its own SELECT policy on storage.objects, which
 * this bucket was never given (the Milestone 14 migration only granted
 * INSERT/UPDATE/DELETE for admins; public reads were meant to go through
 * the public URL, which doesn't need a policy, not the authenticated list
 * API, which does). Without that policy `.list()` silently returns zero
 * rows to every caller, admin included — not an error, just RLS filtering
 * everything out — so a `.list()`-then-remove() flow always no-ops. The
 * lesson's own illustration_url is already known and already readable
 * (the ordinary "admins see all lessons" policy), so deriving the path
 * from it sidesteps the missing policy entirely instead of requiring one.
 */
function illustrationPathFromUrl(url: string): string | null {
  const marker = "/object/public/lesson-illustrations/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

/**
 * Deliberately not folded into saveLesson's payload/validation — uploading
 * an image shouldn't require re-submitting/re-validating the whole sentence
 * list, and it needs an existing lesson id up front (Storage paths are keyed
 * by lesson id), so it's only ever offered from the edit form, never create.
 * Uses the same session-scoped client as every other mutation here, not the
 * service-role client (see src/lib/supabase/service-role.ts's doc comment) —
 * the Storage RLS policies from the Milestone 14 migration are the real
 * authorization boundary, exactly like every other admin write in this file.
 */
export async function uploadLessonImage(
  lessonId: string,
  mode: LearningMode,
  formData: FormData,
): Promise<ActionResult & { url?: string }> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file provided." };
  if (!file.type.startsWith("image/")) return { error: "File must be an image." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Image must be smaller than 5MB." };

  const supabase = await createClient();

  // Recorded before uploading the replacement — deleted only after the new
  // image is fully live (uploaded + saved to the lesson), so a failure
  // partway through never leaves the lesson with no image at all. See
  // illustrationPathFromUrl's doc comment for why this reads the lesson row
  // instead of listing the Storage folder.
  const { data: previousLesson } = await supabase
    .from("lessons")
    .select("illustration_url")
    .eq("id", lessonId)
    .maybeSingle();
  const previousPath = previousLesson?.illustration_url
    ? illustrationPathFromUrl(previousLesson.illustration_url)
    : null;

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${lessonId}/${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("lesson-illustrations")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error("[admin] uploadLessonImage: Storage upload failed", {
      bucket: "lesson-illustrations",
      path,
      code: uploadError.name,
      message: uploadError.message,
    });
    return { error: "Couldn't upload the image. Please try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("lesson-illustrations").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("lessons")
    .update({ illustration_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", lessonId);
  if (updateError) {
    console.error("[admin] uploadLessonImage: lessons update failed", {
      table: "lessons",
      lessonId,
      code: updateError.code,
      message: updateError.message,
    });
    return { error: "Image uploaded but couldn't be saved to the lesson. Please try again." };
  }

  // Best-effort cleanup of whatever was there before this replace — the DB
  // is already the source of truth for the live image at this point, so a
  // failure here just leaves an unreferenced file in Storage rather than
  // any user-visible problem.
  if (previousPath) {
    const { error: removeError } = await supabase.storage
      .from("lesson-illustrations")
      .remove([previousPath]);
    if (removeError) {
      console.error("[admin] uploadLessonImage: cleanup of previous image failed", {
        bucket: "lesson-illustrations",
        path: previousPath,
        message: removeError.message,
      });
    }
  }

  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${lessonId}/edit`);
  revalidatePath(`/learn/${mode}/${lessonId}`);
  return { success: "Image updated.", url: publicUrl };
}

/**
 * Clears a lesson's illustration entirely — the learner UI already treats
 * a null illustration_url as "no admin image yet" and falls back to the
 * built-in SVG scene system (see LessonIllustration), so removal needs no
 * separate fallback logic of its own, just this column going back to null.
 * Deletes the underlying Storage object too rather than leaving it orphaned
 * (see illustrationPathFromUrl for how the path is found); a failure to
 * delete from Storage is logged-and-ignored rather than blocking the
 * removal — an unreferenced file sitting in Storage is a harmless cleanup
 * miss, but a lesson stuck with a broken illustration reference is not.
 */
export async function removeLessonImage(
  lessonId: string,
  mode: LearningMode,
): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("illustration_url")
    .eq("id", lessonId)
    .maybeSingle();
  const path = lesson?.illustration_url ? illustrationPathFromUrl(lesson.illustration_url) : null;

  if (path) {
    const { error: removeError } = await supabase.storage
      .from("lesson-illustrations")
      .remove([path]);
    if (removeError) {
      console.error("[admin] removeLessonImage: Storage remove failed", {
        bucket: "lesson-illustrations",
        path,
        message: removeError.message,
      });
    }
  }

  const { error: updateError } = await supabase
    .from("lessons")
    .update({ illustration_url: null, updated_at: new Date().toISOString() })
    .eq("id", lessonId);
  if (updateError) {
    console.error("[admin] removeLessonImage: lessons update failed", {
      table: "lessons",
      lessonId,
      code: updateError.code,
      message: updateError.message,
    });
    return { error: "Couldn't remove the image. Please try again." };
  }

  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${lessonId}/edit`);
  revalidatePath(`/learn/${mode}/${lessonId}`);
  return { success: "Image removed." };
}
