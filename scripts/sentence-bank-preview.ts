/**
 * Read-only preview of the sentence bank for ONE account: which sentences would come back today,
 * in which form each would be asked, and how many of the sentences the account has typed already
 * have a stored audio clip (the two sound-based forms only ever play a clip that exists).
 *
 * Reads the live database through the service role and writes nothing. Until the sentence_mastery
 * table (migration 20250347000000) is applied it behaves as if the account had never reviewed a
 * sentence. With --days it also plays the next few days forward in memory, answering every batch
 * clean, with the real selector and the real schedule: a picture of what a week would feel like.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/sentence-bank-preview.ts
 * Options:
 *   --user <uuid>          the account (default: the first admin's)
 *   --tz <IANA zone>       the learner's time zone (default Asia/Baghdad): "today" and the day a
 *                          lesson was finished follow it
 *   --today <YYYY-MM-DD>   pretend it is that day
 *   --days <n>             also print the batches of the next n days (simulation, nothing is saved)
 */
import { localISODateInTimeZone } from "../src/lib/features/learner-date";
import { reviewFormFor } from "../src/lib/sentence-bank/review";
import {
  MIN_REVIEW_WORDS,
  reviewWordCount,
  selectSentenceReview,
} from "../src/lib/sentence-bank/select";
import type { SentenceCandidate } from "../src/lib/sentence-bank/select";
import { hashText, normalizeTextForVoice } from "../src/lib/voice/resolution";
import { isWeakWord } from "../src/lib/weak-words/types";
import { addDaysISO, applyOutcome } from "../src/lib/word-mastery/schedule";
import type { MasteryState } from "../src/lib/word-mastery/schedule";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (use --env-file=.env.local).",
  );
  process.exit(1);
}

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

type Row = Record<string, unknown>;

/** Every row of a REST read, a page of 1000 at a time; null when the table does not exist (yet). */
async function rows<R = Row>(path: string): Promise<R[] | null> {
  const found: R[] = [];
  for (let from = 0; ; from += 1000) {
    const response = await fetch(`${url}/rest/v1/${path}`, {
      headers: {
        apikey: serviceRoleKey!,
        Authorization: `Bearer ${serviceRoleKey}`,
        Range: `${from}-${from + 999}`,
        "Range-Unit": "items",
      },
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(
        `${path.split("?")[0]}: ${response.status} ${(await response.text()).slice(0, 160)}`,
      );
    }
    const page = (await response.json()) as R[];
    found.push(...page);
    if (page.length < 1000) return found;
  }
}

async function inChunks<R>(
  ids: readonly string[],
  size: number,
  path: (chunk: string) => string,
): Promise<R[]> {
  const all: R[] = [];
  for (let at = 0; at < ids.length; at += size) {
    all.push(...((await rows<R>(path(ids.slice(at, at + size).join(",")))) ?? []));
  }
  return all;
}

async function main() {
  const tz = arg("--tz") ?? "Asia/Baghdad";
  const todayISO =
    arg("--today") ?? localISODateInTimeZone(tz) ?? new Date().toISOString().slice(0, 10);

  const userId =
    arg("--user") ??
    (await rows<{ id: string }>("profiles?role=eq.admin&select=id&limit=1"))?.[0]?.id;
  if (!userId) throw new Error("No account: pass --user <uuid>.");
  console.log(`Account ${userId.slice(0, 8)}…, time zone ${tz}, today ${todayISO}\n`);

  // What the account finished (normal lessons and stories; a conversation's lines are not sentences to type back).
  const progress = (
    (await rows<{ lesson_id: string; mode: string; completed_at: string }>(
      `user_progress?user_id=eq.${userId}&completed_at=not.is.null&select=lesson_id,mode,completed_at`,
    )) ?? []
  ).filter((entry) => entry.mode === "normal" || entry.mode === "stories");
  const completedOn = new Map<string, string>();
  for (const entry of progress) {
    completedOn.set(
      entry.lesson_id,
      localISODateInTimeZone(tz, new Date(entry.completed_at)) ?? entry.completed_at.slice(0, 10),
    );
  }
  const lessonIds = [...completedOn.keys()];
  const byMode = (mode: string) => progress.filter((entry) => entry.mode === mode).length;
  console.log(
    `Finished: ${lessonIds.length} lessons (${byMode("normal")} daily lessons, ${byMode("stories")} stories)`,
  );

  const sentences = await inChunks<{
    id: string;
    lesson_id: string;
    order_index: number;
    en: string;
  }>(
    lessonIds,
    60,
    (chunk) => `sentences?lesson_id=in.(${chunk})&select=id,lesson_id,order_index,en`,
  );
  const candidates: SentenceCandidate[] = sentences.map((sentence) => ({
    id: sentence.id,
    lessonId: sentence.lesson_id,
    orderIndex: sentence.order_index,
    en: sentence.en,
    completedOn: completedOn.get(sentence.lesson_id)!,
  }));
  console.log(`Sentences in those lessons: ${candidates.length}`);

  const masteryRows = await rows<{ sentence_id: string; strength: number; due_on: string }>(
    `sentence_mastery?user_id=eq.${userId}&select=sentence_id,strength,due_on`,
  );
  console.log(
    masteryRows === null
      ? "sentence_mastery: table not created yet (everything counts as new)"
      : `sentence_mastery: ${masteryRows.length} reviewed sentences`,
  );
  const states = new Map<string, MasteryState>(
    (masteryRows ?? []).map((row) => [
      row.sentence_id,
      { strength: row.strength, dueOn: row.due_on },
    ]),
  );

  const mistakes =
    (await rows<{
      word: string;
      status: "active" | "corrected";
      review_stage: number;
      next_review_at: string | null;
    }>(`mistakes?user_id=eq.${userId}&select=word,status,review_stage,next_review_at`)) ?? [];
  const weakWords = new Set(
    mistakes
      .filter((mistake) =>
        isWeakWord({
          status: mistake.status,
          reviewStage: mistake.review_stage,
          nextReviewAt: mistake.next_review_at,
        }),
      )
      .map((mistake) => mistake.word),
  );
  console.log(`Weak words: ${weakWords.size}\n`);

  // Which stored clip would each sentence play: the lesson's own voice, else the section's default.
  const lessons = await inChunks<{ id: string; mode: string; voice_id: string | null }>(
    lessonIds,
    60,
    (chunk) => `lessons?id=in.(${chunk})&select=id,mode,voice_id`,
  );
  const normalDefault = (
    await rows<{ default_normal_lesson_voice_id: string | null }>(
      "tts_settings?select=default_normal_lesson_voice_id&limit=1",
    )
  )?.[0]?.default_normal_lesson_voice_id;
  const storyDefault = (
    await rows<{ default_story_voice_id: string | null }>(
      "elevenlabs_settings?select=default_story_voice_id&limit=1",
    )
  )?.[0]?.default_story_voice_id;
  const voiceOfLesson = new Map(
    lessons.map((lesson) => [
      lesson.id,
      lesson.voice_id ?? (lesson.mode === "stories" ? storyDefault : normalDefault) ?? null,
    ]),
  );
  const hashOf = (en: string) => hashText(normalizeTextForVoice(en));
  const long = candidates.filter((sentence) => reviewWordCount(sentence.en) >= MIN_REVIEW_WORDS);
  const clips = await inChunks<{ voice_id: string; text_hash: string }>(
    [...new Set(long.map((sentence) => hashOf(sentence.en)))],
    60,
    (chunk) =>
      `voice_audio_cache?text_hash=in.(${chunk})&status=eq.ready&audio_url=not.is.null&select=voice_id,text_hash`,
  );
  const clipExists = new Set(clips.map((clip) => `${clip.voice_id}|${clip.text_hash}`));
  const hasClip = (sentence: SentenceCandidate) => {
    const voice = voiceOfLesson.get(sentence.lessonId);
    return voice ? clipExists.has(`${voice}|${hashOf(sentence.en)}`) : false;
  };
  const withClip = long.filter(hasClip).length;
  console.log(
    `Sentences of 4+ words: ${long.length}, of which with a stored clip under their own voice: ${withClip} (${long.length ? Math.round((100 * withClip) / long.length) : 0}%)\n`,
  );

  const byId = new Map(candidates.map((sentence) => [sentence.id, sentence]));
  const days = Math.max(0, Number(arg("--days") ?? 0) || 0);
  const live = new Map(states);
  for (let day = 0; day <= days; day++) {
    const date = addDaysISO(todayISO, day);
    const picked = selectSentenceReview(candidates, live, { todayISO: date, weakWords });
    console.log(
      `${day === 0 ? "TODAY" : "day +" + day} ${date}: ${picked.items.length} sentence(s)${picked.more ? " (more waiting)" : ""}`,
    );
    for (const item of picked.items) {
      const sentence = byId.get(item.sentence.id)!;
      console.log(
        `  [${item.reason}, strength ${item.strength}, ${reviewFormFor(item.strength, { audio: hasClip(sentence), prompt: true })}] ${sentence.lessonId} #${sentence.orderIndex}: ${sentence.en}`,
      );
      if (days > 0) {
        live.set(item.sentence.id, applyOutcome(live.get(item.sentence.id), "clean", date).state);
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
