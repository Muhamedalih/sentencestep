import { PASSAGE_LEVELS } from "@/lib/passages/types";
import type { PassageProgress, PassageSummary } from "@/lib/passages/types";
import { passageStartIndex, pickPassage, pickStory } from "@/lib/today/next";
import type { LessonUnit } from "@/types/content";

import { todayTaste } from "./taste";

/**
 * The passage and the story Today opens for one learner: the free ones while there are any, and then
 * (for a free learner in the taste, see taste.ts) each step's taste. Pure: the callers read the lists
 * and the learner's progress, this only picks. Used by Today's loader and by the two lock screens,
 * so a Premium item the taste opens is open in every place it appears.
 */

export interface TodayPicksInput {
  userId: string;
  todayISO: string;
  isPremium: boolean;
  /** Whether the taste applies to this viewer: the hybrid offers are open to them, and they are signed in. */
  taste: boolean;
  startingLevel: number | null;
  /** The passage side; a page that only needs the story leaves it out, and the passage pick is then null. */
  passages?: { summaries: readonly PassageSummary[]; progress: readonly PassageProgress[] };
  storiesUnits: readonly LessonUnit[];
  completedStoryIds: readonly string[];
}

export interface TodayPicks {
  passage: PassageSummary | null;
  story: LessonUnit | null;
  /** The passage (or story) is the taste of the day rather than free content. */
  passageIsTaste: boolean;
  storyIsTaste: boolean;
}

export function todayPicks(input: TodayPicksInput): TodayPicks {
  const summaries = input.passages?.summaries ?? [];
  const progressById = new Map(
    (input.passages?.progress ?? []).map((entry) => [entry.passageId, entry]),
  );
  const stories = [...input.storiesUnits];
  const completed = [...input.completedStoryIds];
  const freePassage = input.passages
    ? pickPassage(summaries, progressById, input.isPremium, input.startingLevel)
    : null;
  const freeStory = pickStory(stories, completed, input.isPremium, input.startingLevel);
  if (!input.taste || input.isPremium) {
    return { passage: freePassage, story: freeStory, passageIsTaste: false, storyIsTaste: false };
  }

  const taste = todayTaste({
    userId: input.userId,
    todayISO: input.todayISO,
    passages: {
      candidates: summaries
        .filter((passage) => !passage.isFree)
        .map((passage) => ({
          id: passage.id,
          level: PASSAGE_LEVELS.indexOf(passage.level),
          summary: passage,
        })),
      minLevel: passageStartIndex(input.startingLevel),
      freeLeft: freePassage !== null,
    },
    stories: {
      candidates: stories
        .filter((unit) => !unit.isFree)
        .map((unit) => ({ id: unit.id, level: unit.level, unit })),
      // Stories' levels start at 1; a learner with no level chosen (null or 0) starts at 1 too.
      minLevel: Math.max(1, input.startingLevel ?? 1),
      freeLeft: freeStory !== null,
    },
  });
  return {
    passage: freePassage ?? taste.passage?.summary ?? null,
    story: freeStory ?? taste.story?.unit ?? null,
    passageIsTaste: freePassage === null && taste.passage !== null,
    storyIsTaste: freeStory === null && taste.story !== null,
  };
}
