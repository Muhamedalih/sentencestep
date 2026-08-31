"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { requireEditorOrAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import { reconcileSectionSentences } from "@/lib/admin/library-section-reconcile";
import {
  splitSentenceLines,
  splitTranslationLines,
  validateBookInput,
  validateBookSectionInput,
  validateCategoryInput,
} from "@/lib/admin/library-validation";
import type { BookInput, BookSectionInput, CategoryInput } from "@/lib/admin/library-validation";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  error?: string;
  success?: string;
  id?: string;
}

const POSTGRES_UNIQUE_VIOLATION = "23505";

function generateId(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

/**
 * Writes a section's book_sentences to match a freshly-submitted English
 * sentence list, using reconcileSectionSentences (see its own doc comment
 * for the identity-preserving matching strategy) to decide which existing
 * rows to keep-and-update, which to leave alone, and which are genuinely
 * gone — rather than deleting every sentence in the section and reinserting
 * the new list, which is what this function replaces.
 *
 * That previous approach corrupted active readers' progress:
 * book_progress.current_sentence_id references book_sentences(id) on delete
 * set null, so deleting-and-reinserting — even when the reinserted row ends
 * up with the identical id and content — permanently nulls any reader's
 * pointer into that section (ON DELETE SET NULL fires at DELETE time and is
 * never "undone" by a later INSERT reusing the same id). Combined with
 * fetchBookProgressAction's old completion check, a null pointer read as
 * "the reader finished the book," even for a one-word title fix. The one
 * case where a pointer can still legitimately go null here is a sentence
 * reconcileSectionSentences reports as genuinely removed — see
 * fetchBookProgressAction's own doc comment for why even that case no
 * longer reads as false completion.
 *
 * Reassigning order_index is done in two passes (every kept/new row first
 * pushed to a unique negative placeholder, then set to its real final
 * value) because book_sentences has a real unique index on
 * (section_id, order_index): writing final positions directly can transiently
 * collide mid-reorder (e.g. swapping positions 0 and 2), and that unique
 * index is not deferrable.
 */
async function persistSectionSentences(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sectionId: string,
  newTexts: string[],
  nowIso: string,
): Promise<{ error?: string; rows?: { id: string; en: string }[] }> {
  const { data: existingRows, error: fetchError } = await supabase
    .from("book_sentences")
    .select("id, en, order_index")
    .eq("section_id", sectionId)
    .order("order_index", { ascending: true });
  if (fetchError) return { error: "Couldn't load the existing sentences. Please try again." };

  const { finalRows, idsToDelete } = reconcileSectionSentences(
    sectionId,
    (existingRows ?? []).map((row) => ({ id: row.id, en: row.en })),
    newTexts,
  );

  // Genuinely-removed sentences first, so their old order_index values can
  // never collide with a kept/new row's target position below.
  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("book_sentences")
      .delete()
      .in("id", idsToDelete);
    if (deleteError) return { error: "Couldn't update the sentences. Please try again." };
  }

  // Phase A: every kept/new row to a unique negative placeholder position —
  // guaranteed not to collide with any other row's current OR final position.
  const placeholderRows = finalRows.map((row, i) => ({
    id: row.id,
    section_id: sectionId,
    en: row.en,
    order_index: -(i + 1),
    updated_at: nowIso,
  }));
  const { error: placeholderError } = await supabase
    .from("book_sentences")
    .upsert(placeholderRows, { onConflict: "id" });
  if (placeholderError) return { error: "Couldn't save the sentences. Please try again." };

  // Phase B: every row to its real final position. Safe now — nothing is
  // sitting at any target position, since every row just moved to a
  // negative placeholder in Phase A.
  const finalPositionRows = finalRows.map((row, i) => ({
    id: row.id,
    section_id: sectionId,
    en: row.en,
    order_index: i,
    updated_at: nowIso,
  }));
  const { error: finalError } = await supabase
    .from("book_sentences")
    .upsert(finalPositionRows, { onConflict: "id" });
  if (finalError) return { error: "Couldn't save the sentences. Please try again." };

  return { rows: finalRows };
}

export async function createCategory(input: CategoryInput): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const validation = validateCategoryInput(input);
  if (!validation.valid) return { error: validation.errors.join(" ") };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      id: generateId("category"),
      name: input.name.trim(),
      description: input.description?.trim() || null,
      order_index: input.orderIndex,
    })
    .select("id")
    .single();
  if (error) return { error: "Couldn't create the category. Please try again." };

  revalidatePath("/admin/library/categories");
  revalidatePath("/learn/library");
  return { success: "Category created.", id: data.id };
}

export async function updateCategory(
  input: Required<Pick<CategoryInput, "id">> & CategoryInput,
): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const validation = validateCategoryInput(input);
  if (!validation.valid) return { error: validation.errors.join(" ") };

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      order_index: input.orderIndex,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);
  if (error) return { error: "Couldn't save the category. Please try again." };

  revalidatePath("/admin/library/categories");
  revalidatePath("/learn/library");
  return { success: "Category saved." };
}

/**
 * Soft delete only — see the `is_active` column's doc comment in
 * 20250127000000_library_foundation.sql. Existing book_categories rows are
 * left completely untouched: a book that had this category keeps the
 * association (it just stops being offered for NEW assignments and drops
 * out of the learner-facing category-section list, via the "active
 * categories are public" RLS policy), so deleting a category can never
 * silently break a book. Reversible by flipping is_active back on directly
 * if ever needed — no dedicated "restore" UI in this foundation phase since
 * there's no real content yet for it to matter for.
 */
export async function deleteCategory(id: string): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Couldn't delete the category. Please try again." };

  revalidatePath("/admin/library/categories");
  revalidatePath("/learn/library");
  return { success: "Category deleted." };
}

export type BookMutationInput = BookInput;

/**
 * Creates or updates a book's own row, then fully replaces its
 * book_categories links (delete-and-reinsert, same pattern saveLesson uses
 * for sentences in src/lib/admin/content-actions.ts — simpler and more
 * reliable to reason about than diffing for a first version). Never touches
 * book_sections/book_sentences (they don't exist yet — see this migration's
 * "not created" note) and never writes content_translations rows (Section
 * 18 of the spec: book translations are a later phase).
 */
export async function saveBook(input: BookMutationInput): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const validation = validateBookInput(input);
  if (!validation.valid) return { error: validation.errors.join(" ") };

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const bookPayload = {
    title: input.title.trim(),
    author: input.author.trim(),
    description: input.description?.trim() || null,
    difficulty_level: input.difficultyLevel,
    is_featured: input.isFeatured,
    is_free: input.isFree,
    free_preview_sentence_count: input.freePreviewSentenceCount,
    status: input.status,
    order_index: input.orderIndex,
    updated_at: nowIso,
  };

  let bookId = input.id;
  const isCreate = !bookId;

  if (bookId) {
    const { error } = await supabase.from("books").update(bookPayload).eq("id", bookId);
    if (error) return { error: "Couldn't save the book. Please try again." };

    const { error: deleteError } = await supabase
      .from("book_categories")
      .delete()
      .eq("book_id", bookId);
    if (deleteError) return { error: "Couldn't update the book's categories. Please try again." };
  } else {
    bookId = generateId("book");
    const { error } = await supabase.from("books").insert({ id: bookId, ...bookPayload });
    if (error) {
      if (error.code === POSTGRES_UNIQUE_VIOLATION) {
        return { error: "That book already exists — please try again." };
      }
      return { error: "Couldn't create the book. Please try again." };
    }
  }

  const categoryRows = input.categories.map((c) => ({
    book_id: bookId as string,
    category_id: c.categoryId,
    is_primary: c.isPrimary,
  }));
  const { error: insertError } = await supabase.from("book_categories").insert(categoryRows);
  if (insertError) {
    if (isCreate) {
      // Same rollback reasoning as saveLesson's identical branch in
      // content-actions.ts: this book row didn't exist before this call, the
      // New Book form has no id to resume with, and leaving an empty,
      // zero-category orphan behind would be invisible and unrecoverable
      // from the admin UI — a retry from the same form just creates a
      // second row instead of fixing this one.
      await supabase.from("books").delete().eq("id", bookId);
    }
    return { error: "Couldn't save the book's categories. Please try again." };
  }

  void logAdminAction(isCreate ? "book.created" : "book.updated", "book", bookId, {
    title: input.title,
    status: input.status,
  });
  revalidatePath("/admin/library");
  revalidatePath(`/admin/library/${bookId}/edit`);
  revalidatePath("/learn/library");
  return { success: "Book saved.", id: bookId };
}

/** Soft-delete: archived books drop out of every learner-facing read (status = 'published' RLS gate) but the row and its category links stay intact — same convention as archiveLesson in content-actions.ts. */
export async function archiveBook(id: string): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();
  const { error } = await supabase
    .from("books")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Couldn't archive the book. Please try again." };

  void logAdminAction("book.archived", "book", id);
  revalidatePath("/admin/library");
  revalidatePath("/learn/library");
  return { success: "Book archived." };
}

export async function restoreBook(id: string): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();
  const { error } = await supabase
    .from("books")
    .update({ status: "draft", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Couldn't restore the book. Please try again." };

  void logAdminAction("book.restored", "book", id);
  revalidatePath("/admin/library");
  return { success: "Book restored to draft." };
}

/** Bulk counterpart of archiveBook/restoreBook — same shape as bulkUpdateLessonStatus in content-actions.ts. */
export async function bulkUpdateBookStatus(
  ids: string[],
  status: "archived" | "draft",
): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };
  if (ids.length === 0) return { error: "No books selected." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("books")
    .update({ status, updated_at: new Date().toISOString() })
    .in("id", ids);
  if (error) {
    return {
      error:
        status === "archived"
          ? "Couldn't archive the selected books. Please try again."
          : "Couldn't restore the selected books. Please try again.",
    };
  }

  void logAdminAction(
    status === "archived" ? "book.bulk_archived" : "book.bulk_restored",
    "book",
    null,
    { ids },
  );
  revalidatePath("/admin/library");
  revalidatePath("/learn/library");
  return {
    success:
      status === "archived"
        ? `${ids.length} book${ids.length === 1 ? "" : "s"} archived.`
        : `${ids.length} book${ids.length === 1 ? "" : "s"} restored to draft.`,
  };
}

// --- Book Sections / Sentences — see validateBookSectionInput's doc
// comment in library-validation.ts for why this is one section = one form,
// sentences as plain one-per-line text, delete-and-reinsert on save (same
// pattern saveLesson uses for lesson sentences).

export type BookSectionMutationInput = BookSectionInput;

export async function saveBookSection(input: BookSectionMutationInput): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const validation = validateBookSectionInput(input);
  if (!validation.valid) return { error: validation.errors.join(" ") };

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const sectionPayload = {
    book_id: input.bookId,
    order_index: input.orderIndex,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    updated_at: nowIso,
  };

  let sectionId = input.id;

  if (sectionId) {
    const { error } = await supabase
      .from("book_sections")
      .update(sectionPayload)
      .eq("id", sectionId);
    if (error) {
      if (error.code === POSTGRES_UNIQUE_VIOLATION) {
        return { error: "That order number is already used in this book — pick another." };
      }
      return { error: "Couldn't save the section. Please try again." };
    }
  } else {
    sectionId = generateId("section");
    const { error } = await supabase
      .from("book_sections")
      .insert({ id: sectionId, ...sectionPayload });
    if (error) {
      if (error.code === POSTGRES_UNIQUE_VIOLATION) {
        return { error: "That order number is already used in this book — pick another." };
      }
      return { error: "Couldn't create the section. Please try again." };
    }
  }

  // See persistSectionSentences's own doc comment for why this reconciles
  // against the existing rows (preserving ids, and therefore any reader's
  // progress pointer, wherever a defensible match exists) instead of
  // deleting and reinserting the whole section's sentences on every save.
  const persisted = await persistSectionSentences(
    supabase,
    sectionId,
    splitSentenceLines(input.sentencesText),
    nowIso,
  );
  if (persisted.error) return { error: persisted.error };
  const sentenceRows = persisted.rows!;

  // Sentence ids are now stable across saves whenever a defensible match
  // exists (see persistSectionSentences), so a translation attached to a
  // given id generally still belongs to it. The one case that still needs
  // cleanup is a sentence that was genuinely removed this save — its old
  // translations would otherwise dangle (content_translations has no FK to
  // book_sentences — see 20250122000000_locale_foundation.sql — so nothing
  // else would ever remove them). Scoped to exactly the ids no longer
  // present, not a blanket clear of the whole section.
  const survivingIds = new Set(sentenceRows.map((row) => row.id));
  const { data: existingTranslationIds } = await supabase
    .from("content_translations")
    .select("content_id")
    .eq("content_type", "book_sentence")
    .like("content_id", `${sectionId}-s%`);
  const idsToPrune = [
    ...new Set((existingTranslationIds ?? []).map((row) => row.content_id)),
  ].filter((id) => !survivingIds.has(id));
  if (idsToPrune.length > 0) {
    const { error: pruneError } = await supabase
      .from("content_translations")
      .delete()
      .eq("content_type", "book_sentence")
      .in("content_id", idsToPrune);
    if (pruneError) return { error: "Couldn't update the sentences. Please try again." };
  }

  const translationRows: {
    content_type: "book_sentence";
    content_id: string;
    field: "text";
    locale: "ar" | "es" | "tr";
    value: string;
    status: "approved";
  }[] = [];
  for (const [locale, text] of [
    ["ar", input.arabicText],
    ["tr", input.turkishText],
    ["es", input.spanishText],
  ] as const) {
    const lines = splitTranslationLines(text ?? "");
    if (lines.length !== sentenceRows.length) continue; // validated already; a mismatch here just means "not supplied"
    lines.forEach((value, index) => {
      const row = sentenceRows[index];
      if (!row) return;
      translationRows.push({
        content_type: "book_sentence",
        content_id: row.id,
        field: "text",
        locale,
        value,
        status: "approved",
      });
    });
  }

  if (translationRows.length > 0) {
    const { error: translationError } = await supabase
      .from("content_translations")
      .upsert(translationRows, { onConflict: "content_type,content_id,field,locale" });
    if (translationError) return { error: "Couldn't save the translations. Please try again." };
  }

  // Section title translations live at a fixed content_id (the section
  // itself, unlike per-sentence translations, which never changes across
  // saves), so upsert-when-supplied / delete-when-blanked is enough — no
  // delete-and-reinsert risk here.
  const titleTranslationRows: {
    content_type: "book_section";
    content_id: string;
    field: "title";
    locale: "ar" | "es" | "tr";
    value: string;
    status: "approved";
  }[] = [];
  const blankedTitleLocales: ("ar" | "es" | "tr")[] = [];
  for (const [locale, text] of [
    ["ar", input.titleAr],
    ["tr", input.titleTr],
    ["es", input.titleEs],
  ] as const) {
    const value = (text ?? "").trim();
    if (value) {
      titleTranslationRows.push({
        content_type: "book_section",
        content_id: sectionId,
        field: "title",
        locale,
        value,
        status: "approved",
      });
    } else {
      blankedTitleLocales.push(locale);
    }
  }

  if (titleTranslationRows.length > 0) {
    const { error: titleTranslationError } = await supabase
      .from("content_translations")
      .upsert(titleTranslationRows, { onConflict: "content_type,content_id,field,locale" });
    if (titleTranslationError)
      return { error: "Couldn't save the title translations. Please try again." };
  }
  if (blankedTitleLocales.length > 0) {
    const { error: clearTitleError } = await supabase
      .from("content_translations")
      .delete()
      .eq("content_type", "book_section")
      .eq("field", "title")
      .eq("content_id", sectionId)
      .in("locale", blankedTitleLocales);
    if (clearTitleError)
      return { error: "Couldn't update the title translations. Please try again." };
  }

  revalidatePath(`/admin/library/${input.bookId}/sections`);
  revalidatePath(`/admin/library/${input.bookId}/sections/${sectionId}/edit`);
  revalidatePath(`/learn/library/${input.bookId}`);
  revalidatePath(`/learn/library/${input.bookId}/read`);
  return { success: "Section saved.", id: sectionId };
}

/**
 * Hard delete, unlike categories/books — a section has no independent
 * publishing lifecycle of its own (see this migration's schema: no `status`
 * column, visibility comes entirely from the parent book's). A reader with
 * progress pointing at a deleted section/sentence isn't left broken —
 * book_progress's FKs are `on delete set null` (see
 * 20250128000000_book_learning_engine.sql) — but their resume position is
 * lost, same acceptable-for-a-foundation-phase tradeoff as editing any
 * other content out from under a learner mid-book.
 */
export async function deleteBookSection(id: string, bookId: string): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();
  const { error } = await supabase.from("book_sections").delete().eq("id", id);
  if (error) return { error: "Couldn't delete the section. Please try again." };

  revalidatePath(`/admin/library/${bookId}/sections`);
  revalidatePath(`/learn/library/${bookId}`);
  return { success: "Section deleted." };
}

// --- Book cover image — same upload/storage convention as
// uploadLessonImage/removeLessonImage in content-actions.ts, adapted to the
// books table and its own 'book-covers' bucket (see
// 20250130000000_book_cover_images.sql). Deliberately not folded into
// saveBook's payload/validation, same reasoning as lessons: it needs an
// existing book id up front (Storage paths are keyed by book id), so it's
// only ever offered from the edit form.

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Recovers the bucket-relative Storage path from a book-covers public URL — see illustrationPathFromUrl in content-actions.ts for why this reads the book row instead of listing the Storage folder. */
function coverPathFromUrl(url: string): string | null {
  const marker = "/object/public/book-covers/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

export async function uploadBookCoverImage(
  bookId: string,
  formData: FormData,
): Promise<ActionResult & { url?: string }> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file provided." };
  if (!file.type.startsWith("image/")) return { error: "File must be an image." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Image must be smaller than 5MB." };

  const supabase = await createClient();

  const { data: previousBook } = await supabase
    .from("books")
    .select("cover_image_url")
    .eq("id", bookId)
    .maybeSingle();
  const previousPath = previousBook?.cover_image_url
    ? coverPathFromUrl(previousBook.cover_image_url)
    : null;

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${bookId}/${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("book-covers")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error("[admin] uploadBookCoverImage: Storage upload failed", {
      bucket: "book-covers",
      path,
      code: uploadError.name,
      message: uploadError.message,
    });
    return { error: "Couldn't upload the image. Please try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("book-covers").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("books")
    .update({ cover_image_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", bookId);
  if (updateError) {
    console.error("[admin] uploadBookCoverImage: books update failed", {
      table: "books",
      bookId,
      code: updateError.code,
      message: updateError.message,
    });
    return { error: "Image uploaded but couldn't be saved to the book. Please try again." };
  }

  if (previousPath) {
    const { error: removeError } = await supabase.storage
      .from("book-covers")
      .remove([previousPath]);
    if (removeError) {
      console.error("[admin] uploadBookCoverImage: cleanup of previous image failed", {
        bucket: "book-covers",
        path: previousPath,
        message: removeError.message,
      });
    }
  }

  revalidatePath("/admin/library");
  revalidatePath(`/admin/library/${bookId}/edit`);
  revalidatePath("/learn/library");
  revalidatePath(`/learn/library/${bookId}`);
  return { success: "Image updated.", url: publicUrl };
}

export async function removeBookCoverImage(bookId: string): Promise<ActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();

  const { data: book } = await supabase
    .from("books")
    .select("cover_image_url")
    .eq("id", bookId)
    .maybeSingle();
  const path = book?.cover_image_url ? coverPathFromUrl(book.cover_image_url) : null;

  if (path) {
    const { error: removeError } = await supabase.storage.from("book-covers").remove([path]);
    if (removeError) {
      console.error("[admin] removeBookCoverImage: Storage remove failed", {
        bucket: "book-covers",
        path,
        message: removeError.message,
      });
    }
  }

  const { error: updateError } = await supabase
    .from("books")
    .update({ cover_image_url: null, updated_at: new Date().toISOString() })
    .eq("id", bookId);
  if (updateError) {
    console.error("[admin] removeBookCoverImage: books update failed", {
      table: "books",
      bookId,
      code: updateError.code,
      message: updateError.message,
    });
    return { error: "Couldn't remove the image. Please try again." };
  }

  revalidatePath("/admin/library");
  revalidatePath(`/admin/library/${bookId}/edit`);
  revalidatePath("/learn/library");
  revalidatePath(`/learn/library/${bookId}`);
  return { success: "Image removed." };
}
