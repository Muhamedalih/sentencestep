/**
 * App-level Library types — the shape components/queries actually pass
 * around, distinct from the raw Database["public"]["Tables"] row shapes
 * (camelCase, joined/derived fields resolved). Mirrors the existing split
 * between e.g. Database["public"]["Tables"]["lessons"]["Row"] and
 * types/content.ts's Lesson.
 */

export type BookDifficultyLevel = 1 | 2 | 3;
export type BookStatus = "draft" | "published" | "archived";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  orderIndex: number;
  isActive: boolean;
}

/** One category a book belongs to, with the book-specific `isPrimary` flag that lives on the book_categories join row rather than on Category itself. */
export interface BookCategoryLink {
  category: Category;
  isPrimary: boolean;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string | null;
  coverImageUrl: string | null;
  difficultyLevel: BookDifficultyLevel;
  isFeatured: boolean;
  isFree: boolean;
  freePreviewSentenceCount: number;
  status: BookStatus;
  orderIndex: number;
  /** Per-book narration voice override (books.voice_id) — null falls back to elevenlabs_settings.default_story_voice_id, exactly like a Story with no override. See getBookNarrationVoiceId's doc comment. */
  voiceId: string | null;
  /** Resolved category links — always present, possibly empty for a book with no categories assigned yet. */
  categories: BookCategoryLink[];
  /** Locale-resolved translation of `description` (content_translations, content_type "book") — same resolution rules as BookSection.supportDescription. Only populated when the fetch layer was given a locale; `title` has no counterpart since a book's title is a proper noun, never translated. */
  supportDescription?: string;
}

/** A book grouped under one of its categories for the homepage's category-section layout — `category` here is that section's category, not necessarily the book's primary one. */
export interface CategoryWithBooks {
  category: Category;
  books: Book[];
}

/** A book the current learner has actually started, for the homepage's Continue Reading section — derived from a real book_progress row, never a fabricated percentage (see fetchContinueReadingBooks). */
export interface ContinueReadingEntry {
  book: Book;
  progressPercent: number;
}

// --- Book Learning Engine: Sections/Sentences/Progress ---
//
// Book > Section > Sentence, mirroring the existing Lesson > Sentence
// hierarchy one level deeper — see supabase/migrations/20250128000000_book_learning_engine.sql
// for the schema this is read from.

export interface BookSection {
  id: string;
  bookId: string;
  orderIndex: number;
  title: string;
  description: string | null;
  /** Locale-resolved translation of `title`/`description` — same resolution rules as Sentence.supportText in types/content.ts (content_translations first, then an English fallback). Only populated when the fetch layer was given a locale. */
  supportTitle?: string;
  supportDescription?: string;
}

/** A single typing sentence within a book section — the Book Learning Engine's counterpart to types/content.ts's Sentence, deliberately narrower: no `ar`/`speaker` fields a book sentence has no use for (see the migration's header comment). */
export interface BookSentence {
  id: string;
  sectionId: string;
  orderIndex: number;
  en: string;
  audioUrl: string | null;
  /** Same resolution rules as Sentence.supportText. */
  supportText?: string;
  /** Word-by-word English→locale gloss for the Book Reading word-translation interaction — same shape and resolution rules as Sentence.supportWordTranslations, stored purely in content_translations (field "word_translations") since book sentences have no legacy `word_translations` column to fall back to. */
  supportWordTranslations?: { en: string; text: string }[];
}

export interface BookSectionWithSentences extends BookSection {
  sentences: BookSentence[];
}

/**
 * One learner's reading position in one book, always derived from the real
 * book_progress row (and a live count of that book's sentences) — never a
 * stored percentage. `currentSectionId`/`currentSentenceId` are the NEXT
 * section/sentence to read, both null once `isComplete`. A `completedCount`
 * of 0 with `currentSentenceId` already pointing at the book's first
 * sentence means "not started yet, but here's where to begin" — the same
 * shape a genuinely fresh reader and a not-yet-fetched book_progress row
 * both resolve to (see fetchBookProgress).
 */
export interface BookProgressSummary {
  completedSentenceCount: number;
  totalSentenceCount: number;
  currentSectionId: string | null;
  currentSentenceId: string | null;
  isComplete: boolean;
}
