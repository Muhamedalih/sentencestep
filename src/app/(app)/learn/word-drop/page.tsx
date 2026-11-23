import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WordDropGame } from "@/components/word-drop/word-drop-game";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { fetchProgressCached } from "@/lib/progress/cached";
import { todayLocalISODate } from "@/lib/progress/streak";
import { getCurrentUser } from "@/lib/supabase/auth";
import { fetchWeakestBankWords } from "@/lib/supabase/queries/learner-words";
import { lookupWordListVoiceAudio } from "@/lib/voice/word-list-word-audio";
import { getWordGroupById, getWordGroupSummaries } from "@/lib/word-lists";
import {
  MAX_POOL,
  SENTENCE_MIN_LEVEL,
  WANTED_WORDS,
  buildPersonalPool,
  buildPool,
  orderGroupsForLevel,
} from "@/lib/word-drop/engine";
import { dailySeed, parseSeed, utcDay } from "@/lib/word-drop/seed";
import { loadDropSentences } from "@/lib/word-drop/sentences";
import { loadDailyBoard, type DailyBoard } from "@/lib/word-drop/store";
import type { VocabularyWord } from "@/types/word-lists";

// A visit reads the learner's own words and the day's board, so it is never cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Word Drop" };

/** How many Word Lists groups are read at a time, and the most batches (6 groups) before a thin pool is accepted. */
const GROUPS_PER_BATCH = 3;
const MAX_BATCHES = 2;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Word Drop, the falling-words typing game, full screen like the lesson player (no header or sidebar).
 * The "wordDrop" permission decides who can open it.
 *
 * Every round deals from the level's FREE Word Lists groups, in a fixed order: the level's own groups,
 * then the levels below, then the ones above, until about 50 words are found (a learner on the free
 * plan has one free group a level, about 20 words, so the neighbours fill the gap). The order is the
 * same for everyone, so the browser can seed a round (a friend's challenge link names the seed the
 * sender actually played) and the daily challenge deals the same words to all players of a level. The
 * learner's own words (their weakest «كلماتي» rows) come as a separate list the start page can put in
 * front of a free round. Sentences mode (level 2 and 3) takes its short sentences from the same groups.
 * Hard mode needs one batch of word clips, read only for a free round (a seeded round is Easy or Medium).
 */
export default async function WordDropPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const features = await getEffectiveFeatures();
  if (!features.rollouts.wordDrop) redirect("/learn");

  const query = await searchParams;
  const seed = parseSeed(firstParam(query.seed));
  const beatRaw = Number.parseInt(firstParam(query.beat) ?? "", 10);
  const beat = seed && Number.isFinite(beatRaw) && beatRaw > 0 && beatRaw <= 5000 ? beatRaw : null;

  const locale = await getLocale();
  const user = await getCurrentUser();
  const [summaries, progress, weakest] = await Promise.all([
    getWordGroupSummaries(locale ?? undefined),
    user ? fetchProgressCached(todayLocalISODate()) : Promise.resolve(null),
    // One small read of the learner's own rows; a free round only, and any failure just means none.
    user && !seed ? fetchWeakestBankWords(user.id).catch(() => []) : Promise.resolve([]),
  ]);

  const ownLevel = Math.min(3, Math.max(1, progress?.startingLevel ?? 1)) as 1 | 2 | 3;
  const level = seed ? seed.level : ownLevel;
  const day = utcDay();

  const ordered = orderGroupsForLevel(
    summaries.filter((group) => group.isFree),
    level,
  );
  const words: VocabularyWord[] = [];
  for (let batch = 0; batch < MAX_BATCHES; batch += 1) {
    const from = batch * GROUPS_PER_BATCH;
    const groups = await Promise.all(
      ordered
        .slice(from, from + GROUPS_PER_BATCH)
        .map((group) => getWordGroupById(group.id, locale ?? undefined)),
    );
    words.push(...groups.flatMap((group) => group?.words ?? []));
    if (buildPool(words, new Map()).length >= WANTED_WORDS) break;
  }

  // Clips are only for Hard mode, which a seeded round does not offer.
  const clips = seed
    ? new Map<string, string>()
    : await lookupWordListVoiceAudio([
        ...words.map((word) => word.targetWord),
        ...weakest.map((row) => row.word),
      ]);
  const pool = buildPool(words, clips).slice(0, MAX_POOL);
  const personal = seed
    ? []
    : buildPersonalPool(
        weakest.map((row) => ({ word: row.word, ar: row.ar, homeSentence: row.homeSentence })),
        clips,
      );
  const sentencePool =
    !seed && ownLevel >= SENTENCE_MIN_LEVEL
      ? (await loadDropSentences(locale)).slice(0, MAX_POOL)
      : [];

  // The day's ranking for the start page, only for a signed-in learner and only when they are not already in a challenge.
  let board: DailyBoard | null = null;
  if (user && !seed) board = await loadDailyBoard(day).catch(() => null);

  return (
    <WordDropGame
      pool={pool}
      personal={personal}
      sentencePool={sentencePool}
      bankOpen={Boolean(user) && features.rollouts.wordBank}
      signedIn={Boolean(user)}
      level={level}
      seed={seed}
      beat={beat}
      dailyHref={`/learn/word-drop?seed=${dailySeed(day, ownLevel)}`}
      board={board}
    />
  );
}
