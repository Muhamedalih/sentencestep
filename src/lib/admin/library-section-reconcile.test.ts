// Regression tests for A1: saving a book section must never null out an
// active reader's progress pointer for anything short of a genuine content
// removal. These test the real failure mode directly — the id each new
// sentence line resolves to, and which existing ids are reported as
// genuinely removed — not just "the UI doesn't show completion," which
// could pass even if the underlying pointer were silently corrupted.
//
// Run with `npm run test:admin` (or `npm test`, which runs every *.test.ts).

import { test } from "node:test";
import assert from "node:assert/strict";

import { reconcileSectionSentences } from "./library-section-reconcile";
import type { ExistingSentenceRow } from "./library-section-reconcile";

const SECTION_ID = "book-x-section-1";

function existing(...texts: string[]): ExistingSentenceRow[] {
  return texts.map((en, i) => ({ id: `${SECTION_ID}-s${i + 1}`, en }));
}

// --- TEST 1 — section title only (no sentence text change at all) ---
// A section-title-only edit still resubmits the same sentencesText, so from
// the reconciler's point of view this is "identical list in, identical list
// out." Every id must be preserved exactly, nothing deleted.
test("TEST 1 — resubmitting an unchanged sentence list preserves every id and deletes nothing", () => {
  const rows = existing("Sentence A.", "Sentence B.", "Sentence C.");
  const result = reconcileSectionSentences(
    SECTION_ID,
    rows,
    rows.map((r) => r.en),
  );
  assert.deepEqual(
    result.finalRows.map((r) => r.id),
    rows.map((r) => r.id),
  );
  assert.deepEqual(result.idsToDelete, []);
});

// --- TEST 2 — sentence text edit ---
// Editing one sentence's wording must keep that sentence's own id (an
// UPDATE in place), not delete-and-recreate it — a reader whose pointer is
// on that exact sentence must remain validly positioned on it.
test("TEST 2 — editing one sentence's text keeps its id, only its content changes", () => {
  const rows = existing("Sentence A.", "Sentence B.", "Sentence C.");
  const bIdBefore = rows[1]!.id;

  const result = reconcileSectionSentences(SECTION_ID, rows, [
    "Sentence A.",
    "Sentence B, revised.",
    "Sentence C.",
  ]);

  assert.equal(
    result.finalRows[1]!.id,
    bIdBefore,
    "the edited sentence must keep sentence B's own id",
  );
  assert.equal(result.finalRows[1]!.en, "Sentence B, revised.");
  assert.equal(result.finalRows[0]!.id, rows[0]!.id, "an untouched sentence must also keep its id");
  assert.equal(result.finalRows[2]!.id, rows[2]!.id, "an untouched sentence must also keep its id");
  assert.deepEqual(result.idsToDelete, []);
});

// --- TEST 3 — translation edit ---
// A translation-only edit resubmits the same English sentencesText (the
// admin form's translation textareas are separate fields entirely — see
// saveBookSection), so this reduces to the same "identical list" case as
// TEST 1: the reconciler never even sees a text difference to react to.
test("TEST 3 — a translation-only edit (unchanged English text) preserves every sentence id", () => {
  const rows = existing("Sentence A.", "Sentence B.", "Sentence C.");
  const result = reconcileSectionSentences(
    SECTION_ID,
    rows,
    rows.map((r) => r.en),
  );
  assert.deepEqual(
    result.finalRows.map((r) => r.id),
    rows.map((r) => r.id),
  );
});

// --- TEST 4 — sentence reorder ---
// The book's own worked example: A, B, C reordered to C, A, B. The user is
// on Sentence B. After the reorder, sentence B's row must still be sentence
// B's row (same id, same content), now at a new position — not some other
// sentence silently occupying the id the reader's pointer references.
test("TEST 4 — reordering sentences preserves each sentence's own identity, not its old position", () => {
  const rows = existing("Sentence A.", "Sentence B.", "Sentence C.");
  const [idA, idB, idC] = rows.map((r) => r.id);

  const result = reconcileSectionSentences(SECTION_ID, rows, [
    "Sentence C.",
    "Sentence A.",
    "Sentence B.",
  ]);

  assert.deepEqual(result.finalRows, [
    { id: idC, en: "Sentence C." },
    { id: idA, en: "Sentence A." },
    { id: idB, en: "Sentence B." },
  ]);
  assert.deepEqual(result.idsToDelete, []);

  // The reader's pointer was `idB` (wherever it sits). Confirm it's still
  // attached to "Sentence B." content, not whatever now occupies its old
  // position (index 1, which is "Sentence A." after the reorder).
  const readersRow = result.finalRows.find((r) => r.id === idB);
  assert.equal(
    readersRow?.en,
    "Sentence B.",
    "the reader's own sentence must still be Sentence B, not whatever moved into its old slot",
  );
});

// --- TEST 5 — middle section, general save ---
// Saving a middle section with a small, realistic mix of one wording edit
// and no reordering must still preserve every other sentence's identity.
test("TEST 5 — saving a middle section with one edited line leaves the rest of the section's ids untouched", () => {
  const rows = existing("One.", "Two.", "Three.", "Four.", "Five.");
  const result = reconcileSectionSentences(SECTION_ID, rows, [
    "One.",
    "Two.",
    "Three, revised.",
    "Four.",
    "Five.",
  ]);

  assert.equal(result.finalRows[0]!.id, rows[0]!.id);
  assert.equal(result.finalRows[1]!.id, rows[1]!.id);
  assert.equal(result.finalRows[2]!.id, rows[2]!.id, "the edited line keeps its own row's id");
  assert.equal(result.finalRows[3]!.id, rows[3]!.id);
  assert.equal(result.finalRows[4]!.id, rows[4]!.id);
  assert.deepEqual(result.idsToDelete, []);
});

// --- Genuine removal: the one case a pointer CAN legitimately go null ---
test("removing a sentence reports only that sentence's id as deletable, keeping every other id", () => {
  const rows = existing("One.", "Two.", "Three.");
  const result = reconcileSectionSentences(SECTION_ID, rows, ["One.", "Three."]);

  assert.deepEqual(result.idsToDelete, [rows[1]!.id]);
  assert.deepEqual(
    result.finalRows.map((r) => r.id),
    [rows[0]!.id, rows[2]!.id],
  );
});

test("adding a sentence keeps every existing id and assigns a fresh, never-before-used id to the new one", () => {
  const rows = existing("One.", "Two.");
  const result = reconcileSectionSentences(SECTION_ID, rows, ["One.", "One and a half.", "Two."]);

  assert.equal(result.finalRows[0]!.id, rows[0]!.id);
  assert.equal(result.finalRows[2]!.id, rows[1]!.id);
  assert.ok(
    !rows.some((r) => r.id === result.finalRows[1]!.id),
    "the new sentence must get an id that never existed before",
  );
  assert.deepEqual(result.idsToDelete, []);
});

// --- TEST 9 — multi-book / multi-section independence ---
// Two sections (standing in for two different books' content) reconciled
// independently must never influence each other's id assignment, since the
// function is pure and takes no shared state.
test("TEST 9 — reconciling two independent sections never cross-contaminates ids", () => {
  const sectionARows: ExistingSentenceRow[] = [{ id: "book-a-section-1-s1", en: "Shared text." }];
  const sectionBRows: ExistingSentenceRow[] = [{ id: "book-b-section-1-s1", en: "Shared text." }];

  const resultA = reconcileSectionSentences("book-a-section-1", sectionARows, [
    "Shared text.",
    "New in book A.",
  ]);
  const resultB = reconcileSectionSentences("book-b-section-1", sectionBRows, ["Shared text."]);

  assert.equal(resultA.finalRows[0]!.id, "book-a-section-1-s1");
  assert.ok(
    resultA.finalRows[1]!.id.startsWith("book-a-section-1-"),
    "book A's fresh id must be namespaced to book A's section",
  );
  assert.equal(resultB.finalRows[0]!.id, "book-b-section-1-s1");
  assert.deepEqual(
    resultB.idsToDelete,
    [],
    "book B's reconciliation must be unaffected by book A's new sentence",
  );
});

// --- Explicit old-vs-new regression demonstration ---
// Simulates exactly what the previous implementation did (always assign a
// fresh id by position, discarding whatever was there before) side by side
// with the new algorithm, on the book's own reorder example, to make the
// regression this suite protects against concrete.
test("regression: the old position-only id scheme loses sentence identity on reorder; the new one does not", () => {
  const rows = existing("Sentence A.", "Sentence B.", "Sentence C.");
  const idB = rows[1]!.id;
  const newTexts = ["Sentence C.", "Sentence A.", "Sentence B."];

  // OLD behavior: every save assigned `${sectionId}-s${index+1}` purely by
  // position, regardless of content — exactly what saveBookSection used to
  // do before this fix.
  const oldIds = newTexts.map((_, index) => `${SECTION_ID}-s${index + 1}`);
  const oldRowForIdB = oldIds.includes(idB) ? newTexts[oldIds.indexOf(idB)] : undefined;
  assert.notEqual(
    oldRowForIdB,
    "Sentence B.",
    "OLD behavior: the reader's id now points at the wrong content after a reorder",
  );

  // NEW behavior.
  const result = reconcileSectionSentences(SECTION_ID, rows, newTexts);
  const newRowForIdB = result.finalRows.find((r) => r.id === idB);
  assert.equal(
    newRowForIdB?.en,
    "Sentence B.",
    "NEW behavior: the reader's id still points at Sentence B after the reorder",
  );
});
