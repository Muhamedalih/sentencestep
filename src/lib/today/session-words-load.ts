import { getLessonById } from "@/lib/content";
import type { SupportLocale } from "@/lib/i18n/locales";
import { fetchPassage } from "@/lib/passages/queries";
import { loadTodayLessonIds } from "@/lib/today/load";
import { WORDS_PER_ROUND } from "@/lib/today/plan";
import {
  passageWordCandidates,
  sessionLeftovers,
  storyWordCandidates,
} from "@/lib/today/session-words";
import type { PositionedWord } from "@/lib/today/session-words";

/** The candidate words that tie Today's words step to the same day's story and passage. */
export interface LinkedWords {
  /** Target words of today's story. */
  story: PositionedWord[];
  /** Target words of today's passage. */
  passage: PositionedWord[];
}

async function quiet<T>(label: string, read: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await read();
  } catch (error) {
    console.error(`[today] ${label} failed`, error);
    return fallback;
  }
}

/**
 * The target words of today's story and of today's passage — the two Home's tasks box shows for the
 * day, the ones finished today or, before they are, the ones open next (see loadTodayLessonIds) — as
 * candidate review words for the words step. The words belong to the day, not to how far the learner
 * has got: they are the same whether the story and the passage are read yet or not. Anything that
 * fails gives an empty list for that part; there is no other source to fall back on.
 */
export async function loadLinkedWords(args: {
  userId: string;
  locale: SupportLocale | null;
  timeZone: string | undefined;
  isPremium: boolean;
  passagesEnabled: boolean;
}): Promise<LinkedWords> {
  const { locale } = args;
  const ids = await quiet("today's lessons", () => loadTodayLessonIds(args), {
    passageId: null,
    storyId: null,
  });
  const [story, passage] = await Promise.all([
    quiet(
      "story words",
      async () => {
        if (!ids.storyId) return [];
        const lesson = await getLessonById("stories", ids.storyId, locale ?? undefined);
        return lesson ? storyWordCandidates(lesson) : [];
      },
      [] as PositionedWord[],
    ),
    quiet(
      "passage words",
      async () => {
        if (!ids.passageId) return [];
        const passage = await fetchPassage(ids.passageId);
        return passage ? passageWordCandidates(passage) : [];
      },
      [] as PositionedWord[],
    ),
  ]);
  return { story, passage };
}

/** Whether today's story and passage have words the first round left, for the finish screen's "5 more words" (false when nothing can be read). */
export async function hasMoreTodayWords(
  args: Parameters<typeof loadLinkedWords>[0],
): Promise<boolean> {
  const left = sessionLeftovers({ ...(await loadLinkedWords(args)), size: WORDS_PER_ROUND });
  return left.story.length + left.passage.length > 0;
}
