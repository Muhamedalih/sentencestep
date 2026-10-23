import { getLessonById } from "@/lib/content";
import { localISODateInTimeZone } from "@/lib/features/learner-date";
import type { SupportLocale } from "@/lib/i18n/locales";
import { fetchPassage, fetchPassageProgress } from "@/lib/passages/queries";
import { todayLocalISODate } from "@/lib/progress/streak";
import { loadTodayStoryDone } from "@/lib/today/load";
import { passageWordCandidates, storyWordCandidates } from "@/lib/today/session-words";
import type { PositionedWord } from "@/lib/today/session-words";

/** The candidate words that tie Today's words step to the same session's story and passage. */
export interface LinkedWords {
  /** Target words of the story finished today. */
  story: PositionedWord[];
  /** Target words of the passage finished today. */
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
 * The target words of the story and of the passage the learner finished TODAY (their own calendar
 * day; the latest of each), as candidate review words for the words step. Nothing finished today, or
 * anything that fails, gives an empty list for that part; when both are empty the step falls back to
 * its usual sources, so a learner who starts with the words is never left without any.
 */
export async function loadLinkedWords(args: {
  userId: string;
  locale: SupportLocale | null;
  timeZone: string | undefined;
}): Promise<LinkedWords> {
  const { userId, locale, timeZone } = args;
  const todayISO = localISODateInTimeZone(timeZone) ?? todayLocalISODate();
  const [story, passage] = await Promise.all([
    quiet(
      "story words",
      async () => {
        const storyId = await loadTodayStoryDone({ timeZone });
        if (!storyId) return [];
        const lesson = await getLessonById("stories", storyId, locale ?? undefined);
        return lesson ? storyWordCandidates(lesson) : [];
      },
      [] as PositionedWord[],
    ),
    quiet(
      "passage words",
      async () => {
        const latest = (await fetchPassageProgress(userId))
          .filter(
            (entry) =>
              entry.completedAt &&
              (localISODateInTimeZone(timeZone, new Date(entry.completedAt)) ??
                entry.completedAt.slice(0, 10)) === todayISO,
          )
          .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))[0];
        if (!latest) return [];
        const passage = await fetchPassage(latest.passageId);
        return passage ? passageWordCandidates(passage) : [];
      },
      [] as PositionedWord[],
    ),
  ]);
  return { story, passage };
}
