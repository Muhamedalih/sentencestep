import { storedClipsFor } from "@/lib/sentence-bank/lesson-clips";
import type { SupportLocale } from "@/lib/i18n/locales";
import { fetchProgressCached } from "@/lib/progress/cached";
import { fetchLessonById } from "@/lib/supabase/queries/content";
import {
  fetchLearnerRuleStates,
  fetchLevelOneSentences,
  isMissingRulesSchema,
} from "@/lib/supabase/queries/learner-rules";

import { isEmptyVisit, planRuleVisit, type RuleVisit, type SourceSentence } from "./visit";

/**
 * Server side of the rule of the day: gathers what the planner needs (the story just read, with the
 * recording of each sentence; the learner's rules; the A1 sentences of what they finished) and asks
 * the pure planner for the visit. Every read that can fail degrades to "nothing" rather than breaking
 * the page: a learner is never shown an empty card.
 */

/** Only stories at level 1 (A1) carry the A1 ladder; a story at another level has no rule of the day. */
const A1_LEVEL = 1;

/**
 * The visit for one learner on one day. `storyId` is the story just finished (the new rule comes from
 * it); without one, the visit only asks earlier rules. Null when there is nothing to show.
 */
export async function loadRuleVisit(args: {
  userId: string;
  todayISO: string;
  storyId: string | null;
  locale: SupportLocale | null;
}): Promise<RuleVisit | null> {
  let source: SourceSentence[] = [];
  if (args.storyId) {
    const story = await fetchLessonById("stories", args.storyId, args.locale ?? undefined);
    if (!story || story.level !== A1_LEVEL) return null;
    source = await withRecordings(
      story.sentences.map((sentence) => ({ id: sentence.id, lessonId: story.id, en: sentence.en })),
    );
  }

  const states = await fetchLearnerRuleStates(args.userId).catch((error: unknown) => {
    if (!isMissingRulesSchema(error)) console.error("[daily-rule] could not read the learner's rules", error);
    return [];
  });

  // The earlier-rule questions come from the learner's own finished A1 texts, never from anyone else's.
  const progress = await fetchProgressCached(args.todayISO).catch(() => null);
  const lessonIds = [
    ...new Set(
      (progress?.completions ?? [])
        .filter((done) => done.mode === "stories" || done.mode === "normal")
        .map((done) => done.lessonId),
    ),
  ];
  const finished = await fetchLevelOneSentences(lessonIds)
    .then((sentences) => withRecordings(sentences.map((sentence) => ({ id: sentence.id, lessonId: sentence.lessonId, en: sentence.en }))))
    .catch((error: unknown) => {
      console.error("[daily-rule] could not read the finished texts", error);
      return [] as SourceSentence[];
    });

  const visit = planRuleVisit({
    today: args.todayISO,
    states,
    source,
    recallPool: finished,
    seed: args.userId,
  });
  return isEmptyVisit(visit) ? null : visit;
}

/** Whether a rule is due and nothing has been asked today yet: the Today carry-on sends the learner here first. */
export async function hasRuleDueToday(userId: string, todayISO: string): Promise<boolean> {
  const states = await fetchLearnerRuleStates(userId).catch(() => []);
  const due = states.some((row) => row.dueOn <= todayISO);
  const askedToday = states.some((row) => row.lastReviewedOn === todayISO);
  return due && !askedToday;
}

/** Keeps the sentences that have a stored recording, with its address: a sentence without one is never asked. */
async function withRecordings(
  sentences: readonly { id: string; lessonId: string; en: string }[],
): Promise<SourceSentence[]> {
  const clips = await storedClipsFor(sentences);
  const out: SourceSentence[] = [];
  for (const sentence of sentences) {
    const audioUrl = clips.get(sentence.id);
    if (audioUrl) out.push({ id: sentence.id, text: sentence.en, audioUrl });
  }
  return out;
}
