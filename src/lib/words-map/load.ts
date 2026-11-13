import { createClient } from "@/lib/supabase/server";
import { readAllPages } from "@/lib/supabase/read-all-pages";
import { fetchBankStates, isMissingBankSchema } from "@/lib/supabase/queries/learner-words";
import { fetchWordProgress } from "@/lib/supabase/queries/word-progress";
import { getContentTranslations, resolveScalarField } from "@/lib/i18n/content-translations";
import type { SupportLocale } from "@/lib/i18n/locales";
import { loadLessonWords } from "@/lib/word-bank/lesson-words";
import { shelfByWord, shelveBank } from "@/lib/word-bank/shelves";
import { termOf } from "@/lib/word-ladder/options";
import { getDraftWordGroupSummaries, getWordGroupSummaries } from "@/lib/word-lists";
import { lessonCounts, pickSession } from "@/lib/words-map/pick";
import type { PickedWord, PickGroup, PickWord } from "@/lib/words-map/pick";
import type { BankShelfMap, MapWord } from "@/lib/words-map/state";

/**
 * What the Map tab and today's session read (the wordsMap permission), server side. Everything is
 * read, nothing is written. The words come from the learner's own session (so a topic that is locked
 * for them gives no words, the same row-level rule as the topic pages), the topics from the public
 * summaries (their true counts), the learner's progress from word_progress and, when the words bank
 * is open, from their bank shelves.
 */

export interface MapTopic {
  id: string;
  level: number;
  order: number;
  title: string;
  supportTitle?: string;
  isFree: boolean;
  coverUrl: string | null;
  draft: boolean;
  /** The topic's true word count (a locked topic's words are not readable, its count is). */
  total: number;
}

interface WordRow {
  id: string;
  group_id: string;
  target_word: string;
  hint_ar: string;
  order_index: number;
}

async function readTopics(isAdminUser: boolean, locale: SupportLocale | null): Promise<MapTopic[]> {
  const [published, drafts] = await Promise.all([
    getWordGroupSummaries(locale ?? undefined),
    // Topics still in draft: an admin's map only.
    isAdminUser ? getDraftWordGroupSummaries(locale ?? undefined) : Promise.resolve([]),
  ]);
  return [...published, ...drafts]
    .map((group) => ({
      id: group.id,
      level: group.level,
      order: group.order,
      title: group.title,
      supportTitle: group.supportTitle,
      isFree: group.isFree,
      coverUrl: group.coverUrl ?? null,
      draft: Boolean(group.draft),
      total: group.wordCount,
    }))
    .sort((a, b) => a.level - b.level || a.order - b.order);
}

async function readWordRows(topicIds: ReadonlySet<string>): Promise<WordRow[]> {
  const supabase = await createClient();
  const rows = await readAllPages((from, to) =>
    supabase
      .from("vocabulary_words")
      .select("id, group_id, target_word, hint_ar, order_index")
      .order("id")
      .range(from, to),
  );
  // The hidden passage lists and anything not in a shown topic stay out.
  return (rows as WordRow[]).filter((row) => topicIds.has(row.group_id));
}

/** The learner's own words: finished in Word Lists, and where the words bank holds each. */
async function readLearnerWords(
  userId: string,
  bankOpen: boolean,
): Promise<{ completed: string[]; shelf: Record<string, "stable" | "active" | "waiting"> }> {
  const [completed, shelf] = await Promise.all([
    fetchWordProgress(userId).catch((error: unknown) => {
      console.error("[words-map] reading word progress failed", error);
      return [] as string[];
    }),
    bankOpen
      ? fetchBankStates(userId)
          .then((states) => Object.fromEntries(shelfByWord(shelveBank(states))))
          .catch((error: unknown) => {
            if (!isMissingBankSchema(error))
              console.error("[words-map] reading the bank failed", error);
            return {};
          })
      : Promise.resolve({}),
  ]);
  return { completed, shelf: shelf as Record<string, "stable" | "active" | "waiting"> };
}

function toPick(topics: readonly MapTopic[], rows: readonly WordRow[]) {
  const readable = new Set(rows.map((row) => row.id));
  const idsByTopic = new Map<string, string[]>();
  for (const row of rows) {
    const list = idsByTopic.get(row.group_id) ?? [];
    list.push(row.id);
    idsByTopic.set(row.group_id, list);
  }
  // Drafts are tried by an admin like any topic; a topic whose words cannot be read is not pickable.
  const groups: PickGroup[] = topics
    .filter((topic) => (idsByTopic.get(topic.id)?.length ?? 0) > 0)
    .map((topic) => ({
      id: topic.id,
      level: topic.level,
      order: topic.order,
      wordIds: idsByTopic.get(topic.id)!.filter((id) => readable.has(id)),
    }));
  const words: PickWord[] = rows.map((row) => ({
    id: row.id,
    groupId: row.group_id,
    word: row.target_word.toLowerCase(),
    order: row.order_index,
  }));
  return { groups, words };
}

function metIds(
  completed: readonly string[],
  shelf: BankShelfMap,
  rows: readonly WordRow[],
): Set<string> {
  const met = new Set(completed);
  for (const row of rows) if (shelf[row.target_word.toLowerCase()]) met.add(row.id);
  return met;
}

export interface WordsMapData {
  topics: MapTopic[];
  words: MapWord[];
  shelf: BankShelfMap;
  completed: string[];
  session: PickedWord[];
}

/** The whole Map tab: topics, every word, the learner's states and today's four. */
export async function loadWordsMap(args: {
  userId: string;
  locale: SupportLocale | null;
  isAdminUser: boolean;
  bankOpen: boolean;
}): Promise<WordsMapData> {
  const topics = await readTopics(args.isAdminUser, args.locale);
  const topicIds = new Set(topics.map((topic) => topic.id));
  const [rows, learner, lessons] = await Promise.all([
    readWordRows(topicIds),
    readLearnerWords(args.userId, args.bankOpen),
    loadLessonWords().catch(() => ({}) as Record<string, string[]>),
  ]);

  const translations = args.locale
    ? await getContentTranslations(
        "vocabulary_word",
        rows.map((row) => row.id),
        args.locale,
      )
    : null;
  const words: MapWord[] = rows
    .map((row) => {
      const hint =
        (translations && args.locale
          ? resolveScalarField(translations, row.id, "hint", row.hint_ar, args.locale)
          : undefined) ?? row.hint_ar;
      return {
        id: row.id,
        g: row.group_id,
        w: row.target_word.toLowerCase(),
        m: termOf(hint ?? ""),
        o: row.order_index,
      };
    })
    .sort((a, b) => a.o - b.o)
    .map(({ o: _order, ...word }) => word);

  const { groups, words: pickWords } = toPick(topics, rows);
  const met = metIds(learner.completed, learner.shelf, rows);
  const session = pickSession({
    groups,
    words: pickWords,
    met,
    lessonCount: lessonCounts(lessons),
  });
  return { topics, words, shelf: learner.shelf, completed: learner.completed, session };
}

/** Only today's four (the session route), without the meanings and their translations. */
export async function loadSessionPick(args: {
  userId: string;
  isAdminUser: boolean;
  locale: SupportLocale | null;
  bankOpen: boolean;
}): Promise<{ picked: PickedWord[]; topics: MapTopic[] }> {
  const topics = await readTopics(args.isAdminUser, args.locale);
  const [rows, learner, lessons] = await Promise.all([
    readWordRows(new Set(topics.map((topic) => topic.id))),
    readLearnerWords(args.userId, args.bankOpen),
    loadLessonWords().catch(() => ({}) as Record<string, string[]>),
  ]);
  const { groups, words } = toPick(topics, rows);
  const met = metIds(learner.completed, learner.shelf, rows);
  return {
    picked: pickSession({ groups, words, met, lessonCount: lessonCounts(lessons) }),
    topics,
  };
}
