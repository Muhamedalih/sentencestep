// Pure, no I/O — derives the Real Page Model (Phase 4 of the Book Reading
// Experience spec) from a section's existing sentences. Deliberately NOT a
// database concept: a page is nothing more than "these N consecutive
// sentences of this section, grouped together" — recomputed on every read
// from book_sentences.order_index, so it needs no migration, can never drift
// from the underlying content, and is byte-for-byte reproducible for the
// same section (same sentences in, same page boundaries out, every time).
//
// The learning engine (typing, completion, current_sentence_id, progress)
// keeps operating on sentence ids/indexes exactly as before — a page is a
// read-only VIEW over those sentences, never a replacement for them.

import type { BookSentence } from "@/types/library";

/**
 * Reading Experience Polish: a real book page shows exactly two sentences —
 * the one the learner just read for context, and the one they're actively
 * typing — never three or more crammed onto the same screen. Fixed at 2
 * rather than a word-count budget: with only two slots, the deterministic
 * rule is simplest as a flat sentence-count chunk.
 */
const SENTENCES_PER_PAGE = 2;

/**
 * Groups one section's sentences into pages of exactly `SENTENCES_PER_PAGE`,
 * in order, never crossing the section boundary the caller already scoped
 * `sentences` to. A section whose sentence count is odd ends in one final
 * page holding just its last sentence — never padded with a sentence from
 * nowhere, never merged into the previous page past the fixed size.
 */
export function paginateSentences(sentences: BookSentence[]): BookSentence[][] {
  const pages: BookSentence[][] = [];
  for (let i = 0; i < sentences.length; i += SENTENCES_PER_PAGE) {
    pages.push(sentences.slice(i, i + SENTENCES_PER_PAGE));
  }
  return pages;
}

/** Which page (index into `pages`) contains `sentenceId` — the derivation step Continue Reading and mid-session completion both rely on to keep the visible page in sync with the real, sentence-level reading position. Falls back to the first page if the id genuinely isn't found (defensive only; every sentence produced by paginateSentences(section.sentences) is accounted for in exactly one page). */
export function findPageIndexForSentenceId(pages: BookSentence[][], sentenceId: string): number {
  const index = pages.findIndex((page) => page.some((sentence) => sentence.id === sentenceId));
  return index === -1 ? 0 : index;
}
