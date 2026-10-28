import { getLessonById } from "@/lib/content";
import type { SupportLocale } from "@/lib/i18n/locales";
import { fetchPassage } from "@/lib/passages/queries";
import { loadTodayLessonIds } from "@/lib/today/load";
import { WORDS_PER_ROUND } from "@/lib/today/plan";
import {
  passageWordCandidates,
  playableOnly,
  sessionLeftovers,
  storyWordCandidates,
  withClips,
} from "@/lib/today/session-words";
import type { PositionedWord } from "@/lib/today/session-words";
import { lookupAnyWordClips, lookupStoryWordClips } from "@/lib/voice/recorded-word-clips";
import { lookupWordListVoiceAudio } from "@/lib/voice/word-list-word-audio";

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
 *
 * Every candidate comes with the recorded clip it plays (`audioUrl`), and a word with no clip at all
 * is left out, so the step never speaks with the browser's own voice. Best clip first: a story's word
 * plays the clip its own Stories words screen plays (its ElevenLabs narrator voice) and a passage's
 * word the Word Lists voice's; a word that cannot be voiced that way gets the Word Lists voice's,
 * and then any other voice's recording of the same word. All of it is read from what is already
 * stored; nothing is synthesized while the page is built.
 */
export async function loadLinkedWords(args: {
  userId: string;
  locale: SupportLocale | null;
  timeZone: string | undefined;
  isPremium: boolean;
  admin: boolean;
  hybridOffers: boolean;
  passagesEnabled: boolean;
}): Promise<LinkedWords> {
  const { locale } = args;
  const ids = await quiet("today's lessons", () => loadTodayLessonIds(args), {
    passageId: null,
    storyId: null,
  });
  let [story, passage] = await Promise.all([
    quiet(
      "story words",
      async () => {
        if (!ids.storyId) return [];
        const lesson = await getLessonById("stories", ids.storyId, locale ?? undefined);
        if (!lesson) return [];
        const candidates = storyWordCandidates(lesson);
        const clips = await lookupStoryWordClips({
          lessonVoiceId: lesson.voiceId ?? null,
          words: candidates.map(({ word }) => word.targetWord),
        });
        return withClips(candidates, (word) => clips.get(word.targetWord));
      },
      [] as PositionedWord[],
    ),
    quiet(
      "passage words",
      async () => {
        if (!ids.passageId) return [];
        const passage = await fetchPassage(ids.passageId);
        // Each passage word already carries the Word Lists voice's clip when it has one.
        return passage ? passageWordCandidates(passage) : [];
      },
      [] as PositionedWord[],
    ),
  ]);

  // What is still without a clip (a story word its story's voice never recorded, a passage word whose
  // clip was made after its page was cached or never made) gets the Word Lists voice's, and failing
  // that any other voice's recording of the word — one read each, and only while something is missing.
  for (const lookup of [lookupWordListVoiceAudio, lookupAnyWordClips]) {
    const missing = [...story, ...passage]
      .filter(({ word }) => !word.audioUrl)
      .map(({ word }) => word.targetWord);
    if (missing.length === 0) break;
    const clips = await lookup(missing);
    story = withClips(story, (word) => clips.get(word.targetWord));
    passage = withClips(passage, (word) => clips.get(word.targetWord));
  }
  return { story: playableOnly(story), passage: playableOnly(passage) };
}

/** Whether today's story and passage have words the first round left, for the finish screen's "5 more words" (false when nothing can be read). */
export async function hasMoreTodayWords(
  args: Parameters<typeof loadLinkedWords>[0],
): Promise<boolean> {
  const left = sessionLeftovers({ ...(await loadLinkedWords(args)), size: WORDS_PER_ROUND });
  return left.story.length + left.passage.length > 0;
}
