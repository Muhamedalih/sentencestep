import { createPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { fetchBookContentCounts } from "@/lib/supabase/queries/book-content";
import { fetchCompletedBookIds, fetchInProgressBooks } from "@/lib/supabase/queries/book-progress";
import { getContentTranslations, resolveScalarField } from "@/lib/i18n/content-translations";
import type { SupportLocale } from "@/lib/i18n/locales";
import type { Database } from "@/types/database";
import type {
  Book,
  BookDifficultyLevel,
  Category,
  CategoryWithBooks,
  ContinueReadingEntry,
} from "@/types/library";

/**
 * Learner-facing Library reads. Anonymous public client (RLS-scoped, no
 * session needed) — same pattern as fetchLevelNames in
 * src/lib/supabase/queries/content.ts. No local-seed fallback exists for
 * Library (unlike src/lib/content.ts's dispatcher): there is no meaningful
 * static book data to fall back to, so every function here degrades to an
 * empty result — never a thrown error — when Supabase isn't configured,
 * which is exactly the "polished empty state" the Library UI already needs
 * for the real "zero books yet" case.
 */

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type BookRow = Database["public"]["Tables"]["books"]["Row"];
/** A pre-created createPublicClient() instance, threaded through by callers (e.g. the Library homepage) that issue several of these queries in one request — see fetchCategories's own doc comment for why. */
type PublicClient = ReturnType<typeof createPublicClient>;

function toCategory(row: CategoryRow, translatedName?: string): Category {
  return {
    id: row.id,
    name: translatedName ?? row.name,
    description: row.description,
    orderIndex: row.order_index,
    isActive: row.is_active,
  };
}

/**
 * Resolves each category's display name against content_translations
 * (content_type "category", field "name") for the current locale, falling
 * back to the English `name` column — same fallback chain
 * resolveScalarField already applies for every other translated field (see
 * fetchBookSections in book-content.ts). Categories have no legacy `_ar`
 * column (unlike lessons/sentences), so there's nothing to pass as
 * resolveScalarField's legacyArValue.
 */
async function resolveCategoryNames(
  rows: CategoryRow[],
  locale: SupportLocale | null,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!locale || rows.length === 0) return map;

  const translations = await getContentTranslations(
    "category",
    rows.map((row) => row.id),
    locale,
  );
  for (const row of rows) {
    const translated = resolveScalarField(translations, row.id, "name", undefined, locale);
    if (translated) map.set(row.id, translated);
  }
  return map;
}

function toBook(
  row: BookRow,
  categoryLinks: Map<string, { category: Category; isPrimary: boolean }[]>,
): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    difficultyLevel: row.difficulty_level as BookDifficultyLevel,
    isFeatured: row.is_featured,
    isFree: row.is_free,
    freePreviewSentenceCount: row.free_preview_sentence_count,
    status: row.status,
    orderIndex: row.order_index,
    voiceId: row.voice_id,
    categories: categoryLinks.get(row.id) ?? [],
  };
}

/**
 * Every active category, in display order — the Library homepage's section
 * list. Accepts an already-created client so a caller issuing several of
 * these queries in one request (e.g. the Library homepage, via
 * fetchCategoriesWithBooks) can share a single createPublicClient()
 * instance — creating more than one within the same request has been
 * observed to hang that request's streamed response client-side. Callers
 * that only ever make one query (e.g. an isolated fetchCategories call)
 * don't need to pass one; a fresh client is created as before.
 */
export async function fetchCategories(
  client?: PublicClient,
  locale: SupportLocale | null = null,
): Promise<Category[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = client ?? createPublicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true });
  if (error) throw error;

  const rows = data ?? [];
  const translatedNames = await resolveCategoryNames(rows, locale);
  return rows.map((row) => toCategory(row, translatedNames.get(row.id)));
}

/**
 * Resolves book_categories -> categories for a set of book ids in one
 * batched read, keyed by book_id — shared by every function below that
 * returns Book[] so a book's category chips/primary category are always
 * populated, never a separate per-book round trip.
 */
async function fetchCategoryLinksForBooks(
  bookIds: string[],
  client?: PublicClient,
  locale: SupportLocale | null = null,
): Promise<Map<string, { category: Category; isPrimary: boolean }[]>> {
  const map = new Map<string, { category: Category; isPrimary: boolean }[]>();
  if (bookIds.length === 0) return map;

  const supabase = client ?? createPublicClient();
  const { data, error } = await supabase
    .from("book_categories")
    .select("book_id, is_primary, categories(*)")
    .in("book_id", bookIds);
  if (error) throw error;

  const rows = data ?? [];
  const activeCategoryRows = rows
    .map((row) => row.categories as unknown as CategoryRow | null)
    .filter((row): row is CategoryRow => Boolean(row?.is_active));
  const translatedNames = await resolveCategoryNames(activeCategoryRows, locale);

  for (const row of rows) {
    const categoryRow = row.categories as unknown as CategoryRow | null;
    if (!categoryRow || !categoryRow.is_active) continue;
    const existing = map.get(row.book_id) ?? [];
    existing.push({
      category: toCategory(categoryRow, translatedNames.get(categoryRow.id)),
      isPrimary: row.is_primary,
    });
    map.set(row.book_id, existing);
  }
  return map;
}

/** Published books flagged Featured, in display order. Empty while no book is both published and featured — the normal state until the next phase adds real books. Accepts an already-created client — see fetchCategories's doc comment. */
export async function fetchFeaturedBooks(client?: PublicClient): Promise<Book[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = client ?? createPublicClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("status", "published")
    .eq("is_featured", true)
    .order("order_index", { ascending: true });
  if (error) throw error;
  if (!data || data.length === 0) return [];

  const links = await fetchCategoryLinksForBooks(
    data.map((row) => row.id),
    supabase,
  );
  return data.map((row) => toBook(row, links));
}

/**
 * The single cheapest published book, by order_index — Home's last-resort
 * book recommendation when no book is marked Featured yet (see
 * fetchFeaturedBooks's own doc comment: an empty result there is the normal
 * state until an admin marks one, not an edge case). Deliberately not
 * `fetchCategoriesWithBooks(...)[0].books[0]` — that function exists to
 * render the Library homepage's full category-by-category layout, so
 * satisfying it means fetching every active category (plus their translated
 * names) and every published book's category links: real work Home's
 * recommendation card never uses (HomeBookCard renders title/author/
 * description/counts/progress only, never book.categories). Using it here
 * just to reach `books[0]` was turning "no featured book yet" — the common
 * case — into 3-4 sequential extra round-trips on every single Home load.
 * This is the one query that actually answers "give me any published book."
 */
export async function fetchFirstPublishedBook(client?: PublicClient): Promise<Book | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = client ?? createPublicClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("status", "published")
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return toBook(data, new Map());
}

/**
 * Every active category paired with its published books, in category
 * display order — the Library homepage's category-sections layout (Section
 * 7 of the spec). A category with zero published books is still included
 * (its `books` array is empty) so the UI can render the intentional empty
 * state rather than the category silently disappearing.
 */
export async function fetchCategoriesWithBooks(
  client?: PublicClient,
  locale: SupportLocale | null = null,
): Promise<CategoryWithBooks[]> {
  const categories = await fetchCategories(client, locale);
  if (categories.length === 0) return [];
  if (!isSupabaseConfigured()) return categories.map((category) => ({ category, books: [] }));

  const supabase = client ?? createPublicClient();
  const { data, error } = await supabase.from("books").select("*").eq("status", "published");
  if (error) throw error;

  const links =
    data && data.length > 0
      ? await fetchCategoryLinksForBooks(
          data.map((row) => row.id),
          supabase,
          locale,
        )
      : new Map();
  const books = (data ?? []).map((row) => toBook(row, links));

  return categories.map((category) => ({
    category,
    books: books
      .filter((book) => book.categories.some((link) => link.category.id === category.id))
      .sort((a, b) => a.orderIndex - b.orderIndex),
  }));
}

/**
 * Title/author/category search across published books — a simple `ilike`
 * on title/author plus a category-name match, not a separate search engine
 * (Section 11 of the spec explicitly asks for this, not something new).
 * Empty query returns every published book, same ordering as the rest of
 * the library.
 */
export async function searchBooks(query: string): Promise<Book[]> {
  if (!isSupabaseConfigured()) return [];
  const trimmed = query.trim();

  const supabase = createPublicClient();
  let bookRows: BookRow[] = [];

  if (!trimmed) {
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("status", "published")
      .order("order_index", { ascending: true });
    if (error) throw error;
    bookRows = data ?? [];
  } else {
    const [titleAuthorResult, categoryMatchResult] = await Promise.all([
      supabase
        .from("books")
        .select("*")
        .eq("status", "published")
        .or(`title.ilike.%${trimmed}%,author.ilike.%${trimmed}%`),
      supabase.from("categories").select("id").eq("is_active", true).ilike("name", `%${trimmed}%`),
    ]);
    if (titleAuthorResult.error) throw titleAuthorResult.error;
    if (categoryMatchResult.error) throw categoryMatchResult.error;

    const byId = new Map<string, BookRow>();
    for (const row of titleAuthorResult.data ?? []) byId.set(row.id, row);

    const matchingCategoryIds = (categoryMatchResult.data ?? []).map((row) => row.id);
    if (matchingCategoryIds.length > 0) {
      const { data: bookCategoryRows, error: bookCategoryError } = await supabase
        .from("book_categories")
        .select("book_id")
        .in("category_id", matchingCategoryIds);
      if (bookCategoryError) throw bookCategoryError;

      const bookIdsByCategory = [...new Set((bookCategoryRows ?? []).map((row) => row.book_id))];
      if (bookIdsByCategory.length > 0) {
        const { data: extraBooks, error: extraBooksError } = await supabase
          .from("books")
          .select("*")
          .eq("status", "published")
          .in("id", bookIdsByCategory);
        if (extraBooksError) throw extraBooksError;
        for (const row of extraBooks ?? []) byId.set(row.id, row);
      }
    }

    bookRows = [...byId.values()].sort((a, b) => a.order_index - b.order_index);
  }

  if (bookRows.length === 0) return [];
  const links = await fetchCategoryLinksForBooks(bookRows.map((row) => row.id));
  return bookRows.map((row) => toBook(row, links));
}

/**
 * Books the given learner has actually started but not finished, most-
 * recently-read first — the Library homepage's Continue Reading section,
 * now backed by the Book Learning Engine's book_progress table. Guests
 * (userId null) always get an empty list — Continue Reading was designed
 * signed-in-only from the start (nowhere to persist a guest's reading
 * position across visits), so this is the same empty state it always was
 * for a guest. progressPercent is always computed from real content
 * (completed / total sentences), never stored — see fetchInProgressBooks.
 */
export async function fetchContinueReadingBooks(
  userId: string | null,
  client?: PublicClient,
): Promise<ContinueReadingEntry[]> {
  if (!userId || !isSupabaseConfigured()) return [];

  const inProgress = await fetchInProgressBooks(userId);
  if (inProgress.length === 0) return [];

  const supabase = client ?? createPublicClient();
  const { data: bookRows, error } = await supabase
    .from("books")
    .select("*")
    .eq("status", "published")
    .in(
      "id",
      inProgress.map((entry) => entry.bookId),
    );
  if (error) throw error;
  if (!bookRows || bookRows.length === 0) return [];

  const [links, countEntries] = await Promise.all([
    fetchCategoryLinksForBooks(
      bookRows.map((row) => row.id),
      supabase,
    ),
    Promise.all(
      bookRows.map((row) =>
        fetchBookContentCounts(row.id, supabase).then((c) => [row.id, c.sentenceCount] as const),
      ),
    ),
  ]);
  const totalByBook = new Map(countEntries);
  const completedByBook = new Map(
    inProgress.map((entry) => [entry.bookId, entry.completedSentenceCount]),
  );
  const orderByBook = new Map(inProgress.map((entry, index) => [entry.bookId, index]));

  return bookRows
    .map((row) => {
      const total = totalByBook.get(row.id) ?? 0;
      const completed = completedByBook.get(row.id) ?? 0;
      const progressPercent = total > 0 ? Math.min(100, (completed / total) * 100) : 0;
      return { book: toBook(row, links), progressPercent };
    })
    .filter((entry) => entry.progressPercent > 0)
    .sort((a, b) => (orderByBook.get(a.book.id) ?? 0) - (orderByBook.get(b.book.id) ?? 0));
}

/**
 * Books the given learner has fully finished, most-recently-completed
 * first — the Library homepage's Completed Books shelf. Guests (userId
 * null) always get an empty list, same reasoning as
 * fetchContinueReadingBooks (book_progress is signed-in-only). Unlike that
 * function this needs no per-book sentence-count fetch: a completed book
 * has nothing to show a percentage of, just the fact that it's done.
 */
export async function fetchCompletedBooks(
  userId: string | null,
  client?: PublicClient,
): Promise<Book[]> {
  if (!userId || !isSupabaseConfigured()) return [];

  const completedIds = await fetchCompletedBookIds(userId);
  if (completedIds.length === 0) return [];

  const supabase = client ?? createPublicClient();
  const { data: bookRows, error } = await supabase
    .from("books")
    .select("*")
    .eq("status", "published")
    .in("id", completedIds);
  if (error) throw error;
  if (!bookRows || bookRows.length === 0) return [];

  const links = await fetchCategoryLinksForBooks(
    bookRows.map((row) => row.id),
    supabase,
  );
  const orderById = new Map(completedIds.map((id, index) => [id, index]));
  return bookRows
    .map((row) => toBook(row, links))
    .sort((a, b) => (orderById.get(a.id) ?? 0) - (orderById.get(b.id) ?? 0));
}

/** One published book by id, with its resolved categories — for the Book Overview page. Null for a missing/unpublished id (never throws for "not found"). Accepts an already-created client — see fetchCategories's doc comment. */
export async function fetchBookById(
  id: string,
  client?: PublicClient,
  locale: SupportLocale | null = null,
): Promise<Book | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = client ?? createPublicClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const links = await fetchCategoryLinksForBooks([data.id], supabase, locale);
  return toBook(data, links);
}
