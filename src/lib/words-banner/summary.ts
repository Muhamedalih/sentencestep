import type { WordGroupSummary } from "@/types/word-lists";

/**
 * What the banner at the top of the Words page says about the learner (see
 * src/components/words/words-banner.tsx): how many words they have learned, how many topics are
 * going, and which topics stand on the shelf. Pure, so the page and the tests share it.
 *
 * "Learned" is every word of a published topic the learner has finished. A topic is "going" once it
 * has a finished word and until all of them are. The shelf holds the topics that have a finished
 * word, in the library's own order, and the one the learner studied last is moved to the end: it is
 * the leaning book.
 */

/** The most books the shelf holds. */
export const MAX_SPINES = 9;

export interface BannerTopic {
  id: string;
  /** The topic's English title, written on the spine. */
  title: string;
  level: number;
  /** The title in the learner's language, for the spine's tooltip. */
  supportTitle: string;
  done: number;
  total: number;
  /** done / total, from 0 to 1; the book's height. */
  ratio: number;
}

export interface BannerSummary {
  learned: number;
  /** Topics with a finished word and an unfinished one. */
  going: number;
  /** The books, the leaning one (if any) last. */
  shelf: BannerTopic[];
  /** The topic the learner studied last, or null. */
  leanId: string | null;
  /** The first topic the learner can open and has not begun, for a button that starts them. */
  startId: string | null;
}

/** The library's order: level, then the topic's own order. */
function inLibraryOrder(groups: readonly WordGroupSummary[]): WordGroupSummary[] {
  return [...groups].sort((a, b) => a.level - b.level || a.order - b.order);
}

export function summarizeBanner(
  groups: readonly WordGroupSummary[],
  /** Finished word ids, oldest first (the last one is the word typed most recently). */
  completedWordIds: readonly string[],
  isPremiumUser: boolean,
): BannerSummary {
  const ordered = inLibraryOrder(groups);
  const finished = new Set(completedWordIds);

  const groupOfWord = new Map<string, string>();
  const topics = new Map<string, BannerTopic>();
  let learned = 0;
  let going = 0;
  for (const group of ordered) {
    for (const wordId of group.wordIds) groupOfWord.set(wordId, group.id);
    const done = group.wordIds.reduce((n, id) => n + (finished.has(id) ? 1 : 0), 0);
    learned += done;
    if (done > 0 && done < group.wordCount) going += 1;
    topics.set(group.id, {
      id: group.id,
      title: group.title,
      level: group.level,
      supportTitle: group.supportTitle ?? group.titleAr,
      done,
      total: group.wordCount,
      ratio: group.wordCount > 0 ? Math.min(1, done / group.wordCount) : 0,
    });
  }

  let leanId: string | null = null;
  for (let i = completedWordIds.length - 1; i >= 0; i -= 1) {
    const groupId = groupOfWord.get(completedWordIds[i]!);
    if (groupId && (topics.get(groupId)?.done ?? 0) > 0) {
      leanId = groupId;
      break;
    }
  }

  const started = ordered.map((group) => topics.get(group.id)!).filter((topic) => topic.done > 0);
  const others = started.filter((topic) => topic.id !== leanId);
  const lean = started.find((topic) => topic.id === leanId);
  // The leaning book always stays on the shelf; the others give way to it when the shelf is full.
  const shelf = [...others.slice(0, lean ? MAX_SPINES - 1 : MAX_SPINES), ...(lean ? [lean] : [])];

  const start = ordered.find(
    (group) => (group.isFree || isPremiumUser) && (topics.get(group.id)?.done ?? 0) === 0,
  );

  return { learned, going, shelf, leanId, startId: start?.id ?? null };
}
