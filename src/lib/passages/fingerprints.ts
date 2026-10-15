import type { SupabaseClient } from "@supabase/supabase-js";

import type { PassageSeed } from "@/data/passages/types";
import type { ContentFingerprint } from "@/lib/passages/duplicates";
import { parseQuestions } from "@/lib/passages/parse";
import type { Database } from "@/types/database";

/**
 * What the no-repeat check compares (see duplicates.ts): a passage's own text, whether it
 * is still in the data files or already in the database, and everything else in the
 * library it must not repeat — the Daily Lessons, the Stories, the Conversations and the
 * Library's books.
 */

type Db = SupabaseClient<Database>;

/** An authored passage as the check sees it. */
export function seedFingerprint(seed: PassageSeed): ContentFingerprint {
  return {
    label: `Passage “${seed.title}” (${seed.slug})`,
    title: seed.title,
    summary: seed.summary,
    lines: seed.sections.flatMap((section) => section.lines.map((line) => line.en)),
    questions: [...seed.sections.map((section) => section.question.en), seed.closing.en],
  };
}

/** PostgREST returns at most a thousand rows a request: read them page by page. */
async function allRows<T>(
  read: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await read(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
  }
  return rows;
}

export interface LibraryFingerprints {
  /** Every passage in the database, drafts included — with its id, so a caller can leave out the one it is about to write. */
  passages: (ContentFingerprint & { id: string })[];
  /** Every Daily Lesson, Story and Conversation (title, premise, lines) and every Library book (title). */
  others: ContentFingerprint[];
}

/** Reads everything a new passage must not repeat. Throws when the database can't be read. */
export async function loadLibraryFingerprints(supabase: Db): Promise<LibraryFingerprints> {
  const [lessons, sentences, books, passageRows, sectionRows, passageSentences] = await Promise.all(
    [
      allRows((from, to) =>
        supabase.from("lessons").select("id, title, mode, description").order("id").range(from, to),
      ),
      allRows((from, to) =>
        supabase
          .from("sentences")
          .select("lesson_id, order_index, en")
          .order("lesson_id")
          .order("order_index")
          .range(from, to),
      ),
      allRows((from, to) => supabase.from("books").select("id, title").order("id").range(from, to)),
      allRows((from, to) =>
        supabase.from("passages").select("id, title, summary").order("id").range(from, to),
      ),
      allRows((from, to) =>
        supabase
          .from("passage_sections")
          .select("id, passage_id, order_index, questions")
          .order("id")
          .range(from, to),
      ),
      allRows((from, to) =>
        supabase
          .from("passage_sentences")
          .select("section_id, order_index, en")
          .order("section_id")
          .order("order_index")
          .range(from, to),
      ),
    ],
  );

  const lessonLines = new Map<string, string[]>();
  for (const sentence of sentences) {
    const list = lessonLines.get(sentence.lesson_id) ?? [];
    list.push(sentence.en);
    lessonLines.set(sentence.lesson_id, list);
  }

  const linesBySection = new Map<string, string[]>();
  for (const sentence of passageSentences) {
    const list = linesBySection.get(sentence.section_id) ?? [];
    list.push(sentence.en);
    linesBySection.set(sentence.section_id, list);
  }
  sectionRows.sort((a, b) => a.order_index - b.order_index);

  return {
    passages: passageRows.map((passage) => {
      const own = sectionRows.filter((section) => section.passage_id === passage.id);
      return {
        id: passage.id,
        label: `Passage “${passage.title}” (${passage.id})`,
        title: passage.title,
        summary: passage.summary,
        lines: own.flatMap((section) => linesBySection.get(section.id) ?? []),
        questions: own.flatMap((section) =>
          parseQuestions(section.questions).map((question) => question.prompt),
        ),
      };
    }),
    others: [
      ...lessons.map((lesson) => ({
        label: `${lesson.mode === "stories" ? "Story" : lesson.mode === "conversation" ? "Conversation" : "Daily Lesson"} “${lesson.title}”`,
        title: lesson.title,
        summary: lesson.description ?? "",
        lines: lessonLines.get(lesson.id) ?? [],
        questions: [],
      })),
      ...books.map((book) => ({
        label: `Book “${book.title}”`,
        title: book.title,
        summary: "",
        lines: [],
        questions: [],
      })),
    ],
  };
}
