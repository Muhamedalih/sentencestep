import { createClient } from "@/lib/supabase/server";
import type { BookStatus } from "@/lib/admin/library-validation";
import type { BookSectionWithSentences } from "@/types/library";

/**
 * Admin-only Library reads — relies on the "admins see all" RLS policies
 * from 20250127000000_library_foundation.sql (inactive categories and
 * non-published books included), same pattern as
 * src/lib/admin/content-queries.ts. Callers are responsible for checking
 * isSupabaseConfigured() first, matching every other admin query module.
 */

export interface AdminCategory {
  id: string;
  name: string;
  description: string | null;
  orderIndex: number;
  isActive: boolean;
  /** How many books currently reference this category — shown in the admin list so deleting a heavily-used category is an informed choice, not a guess. */
  bookCount: number;
}

export async function listCategoriesAdmin(): Promise<AdminCategory[]> {
  const supabase = await createClient();
  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .order("order_index", { ascending: true });
  if (error) throw error;
  if (!categories || categories.length === 0) return [];

  const { data: links, error: linksError } = await supabase
    .from("book_categories")
    .select("category_id")
    .in(
      "category_id",
      categories.map((c) => c.id),
    );
  if (linksError) throw linksError;

  const countByCategory = new Map<string, number>();
  for (const link of links ?? []) {
    countByCategory.set(link.category_id, (countByCategory.get(link.category_id) ?? 0) + 1);
  }

  return categories.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    orderIndex: row.order_index,
    isActive: row.is_active,
    bookCount: countByCategory.get(row.id) ?? 0,
  }));
}

export async function getCategoryByIdAdmin(id: string): Promise<AdminCategory | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { count, error: countError } = await supabase
    .from("book_categories")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id);
  if (countError) throw countError;

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    orderIndex: data.order_index,
    isActive: data.is_active,
    bookCount: count ?? 0,
  };
}

export interface AdminBookSummary {
  id: string;
  title: string;
  author: string;
  difficultyLevel: number;
  isFeatured: boolean;
  isFree: boolean;
  status: BookStatus;
  orderIndex: number;
  createdAt: string;
  primaryCategoryId: string | null;
  primaryCategoryName: string | null;
}

export interface LibraryBookListFilters {
  /** Matches against title or author (case-insensitive), same ilike approach as listContentLessons's `search`. */
  search?: string;
  status?: BookStatus;
  access?: "free" | "premium";
  difficultyLevel?: number;
  categoryId?: string;
}

export interface LibraryBookListPage {
  books: AdminBookSummary[];
  totalCount: number;
}

/** Same reasoning as CONTENT_PAGE_SIZE in content-queries.ts. */
export const LIBRARY_PAGE_SIZE = 25;

export async function listBooksAdmin(
  filters: LibraryBookListFilters = {},
  page = 1,
): Promise<LibraryBookListPage> {
  const supabase = await createClient();

  // `categoryId` filters on a book's *primary* category, which lives on the
  // book_categories join table, not on `books` itself — resolved to a set
  // of book ids first (rather than fetching every matching book and
  // filtering by category in application code, the previous approach) for
  // the same reason listContentLessons resolves `level` to level_ids first:
  // real server-side pagination needs the filter applied before the page is
  // sliced and counted, not after.
  let bookIds: string[] | undefined;
  if (filters.categoryId) {
    const { data: linkRows, error: linkError } = await supabase
      .from("book_categories")
      .select("book_id")
      .eq("category_id", filters.categoryId)
      .eq("is_primary", true);
    if (linkError) throw linkError;
    bookIds = (linkRows ?? []).map((row) => row.book_id);
    if (bookIds.length === 0) return { books: [], totalCount: 0 };
  }

  let query = supabase
    .from("books")
    .select("*", { count: "exact" })
    .order("order_index", { ascending: true });
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.access === "free") query = query.eq("is_free", true);
  if (filters.access === "premium") query = query.eq("is_free", false);
  if (filters.difficultyLevel) query = query.eq("difficulty_level", filters.difficultyLevel);
  if (filters.search)
    query = query.or(`title.ilike.%${filters.search}%,author.ilike.%${filters.search}%`);
  if (bookIds) query = query.in("id", bookIds);

  const offset = (Math.max(1, page) - 1) * LIBRARY_PAGE_SIZE;
  query = query.range(offset, offset + LIBRARY_PAGE_SIZE - 1);

  const { data: books, error, count } = await query;
  if (error) throw error;
  if (!books || books.length === 0) return { books: [], totalCount: count ?? 0 };

  const { data: links, error: linksError } = await supabase
    .from("book_categories")
    .select("book_id, is_primary, categories(id, name)")
    .in(
      "book_id",
      books.map((b) => b.id),
    )
    .eq("is_primary", true);
  if (linksError) throw linksError;

  const primaryCategoryByBook = new Map<string, { id: string; name: string }>();
  for (const link of links ?? []) {
    const category = link.categories as unknown as { id: string; name: string } | null;
    if (category) primaryCategoryByBook.set(link.book_id, category);
  }

  const rows: AdminBookSummary[] = books.map((row) => ({
    id: row.id,
    title: row.title,
    author: row.author,
    difficultyLevel: row.difficulty_level,
    isFeatured: row.is_featured,
    isFree: row.is_free,
    status: row.status,
    orderIndex: row.order_index,
    createdAt: row.created_at,
    primaryCategoryId: primaryCategoryByBook.get(row.id)?.id ?? null,
    primaryCategoryName: primaryCategoryByBook.get(row.id)?.name ?? null,
  }));

  return { books: rows, totalCount: count ?? 0 };
}

export interface AdminBookDetail {
  id: string;
  title: string;
  author: string;
  description: string | null;
  coverImageUrl: string | null;
  difficultyLevel: number;
  isFeatured: boolean;
  isFree: boolean;
  freePreviewSentenceCount: number;
  status: BookStatus;
  orderIndex: number;
  /** Per-book narration voice override (books.voice_id) — see the learner-facing Book type's identical field for why the reading/preview pages must resolve through this, not just the global default. */
  voiceId: string | null;
  categories: { categoryId: string; isPrimary: boolean }[];
}

export async function getBookByIdAdmin(id: string): Promise<AdminBookDetail | null> {
  const supabase = await createClient();
  const { data: book, error } = await supabase.from("books").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!book) return null;

  const { data: links, error: linksError } = await supabase
    .from("book_categories")
    .select("category_id, is_primary")
    .eq("book_id", id);
  if (linksError) throw linksError;

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    description: book.description,
    coverImageUrl: book.cover_image_url,
    difficultyLevel: book.difficulty_level,
    isFeatured: book.is_featured,
    isFree: book.is_free,
    freePreviewSentenceCount: book.free_preview_sentence_count,
    status: book.status,
    orderIndex: book.order_index,
    voiceId: book.voice_id,
    categories: (links ?? []).map((row) => ({
      categoryId: row.category_id,
      isPrimary: row.is_primary,
    })),
  };
}

// --- Book Sections / Sentences (admin) ---

export interface AdminBookSection {
  id: string;
  bookId: string;
  orderIndex: number;
  title: string;
  description: string | null;
  sentenceCount: number;
}

export async function listBookSectionsAdmin(bookId: string): Promise<AdminBookSection[]> {
  const supabase = await createClient();
  const { data: sections, error } = await supabase
    .from("book_sections")
    .select("*")
    .eq("book_id", bookId)
    .order("order_index", { ascending: true });
  if (error) throw error;
  if (!sections || sections.length === 0) return [];

  const { data: sentences, error: sentencesError } = await supabase
    .from("book_sentences")
    .select("section_id")
    .in(
      "section_id",
      sections.map((s) => s.id),
    );
  if (sentencesError) throw sentencesError;

  const countBySection = new Map<string, number>();
  for (const row of sentences ?? []) {
    countBySection.set(row.section_id, (countBySection.get(row.section_id) ?? 0) + 1);
  }

  return sections.map((row) => ({
    id: row.id,
    bookId: row.book_id,
    orderIndex: row.order_index,
    title: row.title,
    description: row.description,
    sentenceCount: countBySection.get(row.id) ?? 0,
  }));
}

export interface AdminBookSectionDetail {
  id: string;
  bookId: string;
  orderIndex: number;
  title: string;
  description: string | null;
  /** The section's sentences, joined one-per-line — the exact inverse of splitSentenceLines, so the edit form's textarea round-trips what's actually stored. */
  sentencesText: string;
  /** Same one-per-line join as sentencesText, in the same sentence order — empty string when no translation exists yet for that locale (see splitTranslationLines' "" -> [] rule, so an empty field round-trips as "nothing supplied" rather than a false mismatch). */
  arabicText: string;
  turkishText: string;
  spanishText: string;
  /** The section title's own translation, one locale each — independent of the sentence translations above (content_type='book_section', field='title'). Empty string when none exists yet for that locale. */
  titleAr: string;
  titleTr: string;
  titleEs: string;
}

export async function getBookSectionByIdAdmin(id: string): Promise<AdminBookSectionDetail | null> {
  const supabase = await createClient();
  const { data: section, error } = await supabase
    .from("book_sections")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!section) return null;

  const { data: sentences, error: sentencesError } = await supabase
    .from("book_sentences")
    .select("id, en")
    .eq("section_id", id)
    .order("order_index", { ascending: true });
  if (sentencesError) throw sentencesError;

  const sentenceRows = sentences ?? [];
  const sentenceIds = sentenceRows.map((row) => row.id);

  const { data: translations, error: translationsError } =
    sentenceIds.length > 0
      ? await supabase
          .from("content_translations")
          .select("content_id, locale, value")
          .eq("content_type", "book_sentence")
          .eq("field", "text")
          .in("content_id", sentenceIds)
          .eq("status", "approved")
      : { data: [], error: null };
  if (translationsError) throw translationsError;

  const { data: titleTranslations, error: titleTranslationsError } = await supabase
    .from("content_translations")
    .select("locale, value")
    .eq("content_type", "book_section")
    .eq("field", "title")
    .eq("content_id", id)
    .eq("status", "approved");
  if (titleTranslationsError) throw titleTranslationsError;

  const titleByLocale = new Map<string, string>();
  for (const row of titleTranslations ?? []) {
    if (typeof row.value === "string") titleByLocale.set(row.locale, row.value);
  }

  const valueByIdAndLocale = new Map<string, string>();
  for (const row of translations ?? []) {
    if (typeof row.value === "string")
      valueByIdAndLocale.set(`${row.content_id}:${row.locale}`, row.value);
  }

  /** Joins one locale's translations in sentence order — "" the moment any sentence is missing that locale, since a partial translation isn't safely round-trippable through the one-line-per-sentence textarea. */
  function joinLocale(locale: "ar" | "tr" | "es"): string {
    const values = sentenceRows.map((row) => valueByIdAndLocale.get(`${row.id}:${locale}`));
    if (values.some((value) => value === undefined)) return "";
    return values.join("\n");
  }

  return {
    id: section.id,
    bookId: section.book_id,
    orderIndex: section.order_index,
    title: section.title,
    description: section.description,
    sentencesText: sentenceRows.map((row) => row.en).join("\n"),
    arabicText: joinLocale("ar"),
    turkishText: joinLocale("tr"),
    spanishText: joinLocale("es"),
    titleAr: titleByLocale.get("ar") ?? "",
    titleTr: titleByLocale.get("tr") ?? "",
    titleEs: titleByLocale.get("es") ?? "",
  };
}

/**
 * Admin's "Preview" action — the real BookReadingSession needs actual
 * BookSentence rows (id/order/text), not the flattened one-line-per-sentence
 * shape getBookSectionByIdAdmin returns for the edit form's textarea. Deliberately
 * English-only (no content_translations resolution, unlike the learner-facing
 * fetchBookSectionWithSentences): an admin previewing wants to see exactly the
 * source content they're about to publish, not a translation that may not be
 * approved yet. Session-aware client, same "admins see all" RLS bypass as every
 * other function in this file — this is what lets a draft/unpublished section
 * be previewed at all, unlike the learner-facing fetch (anonymous client, gated
 * to published books only).
 */
export async function getBookSectionWithSentencesAdmin(
  sectionId: string,
): Promise<BookSectionWithSentences | null> {
  const supabase = await createClient();
  const { data: section, error } = await supabase
    .from("book_sections")
    .select("*")
    .eq("id", sectionId)
    .maybeSingle();
  if (error) throw error;
  if (!section) return null;

  const { data: sentences, error: sentencesError } = await supabase
    .from("book_sentences")
    .select("*")
    .eq("section_id", sectionId)
    .order("order_index", { ascending: true });
  if (sentencesError) throw sentencesError;

  return {
    id: section.id,
    bookId: section.book_id,
    orderIndex: section.order_index,
    title: section.title,
    description: section.description,
    sentences: (sentences ?? []).map((row) => ({
      id: row.id,
      sectionId: row.section_id,
      orderIndex: row.order_index,
      en: row.en,
      audioUrl: row.audio_url,
    })),
  };
}
