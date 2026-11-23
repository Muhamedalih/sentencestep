import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WordDropGame } from "@/components/word-drop/word-drop-game";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { fetchProgressCached } from "@/lib/progress/cached";
import { todayLocalISODate } from "@/lib/progress/streak";
import { getCurrentUser } from "@/lib/supabase/auth";
import { lookupWordListVoiceAudio } from "@/lib/voice/word-list-word-audio";
import { getWordGroupById, getWordGroupSummaries } from "@/lib/word-lists";
import { buildPool, shuffled } from "@/lib/word-drop/engine";
import { dailySeed, parseSeed, utcDay } from "@/lib/word-drop/seed";
import { loadDailyBoard, type DailyBoard } from "@/lib/word-drop/store";

// The pool is dealt fresh on every visit (random groups of the learner's level, or the seeded one of a
// challenge), so it is never cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Word Drop" };

/** How many Word Lists groups one visit draws its words from (about 60 words), and the most words kept. */
const GROUPS_PER_VISIT = 3;
const MAX_POOL = 70;
/** Fewer words than this read from the first groups and the page reads three more groups. */
const MIN_WORDS = 20;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Word Drop, the falling-words typing game, full screen like the lesson player (no header or sidebar).
 * The "wordDrop" permission decides who can open it. It reads three Word Lists groups of the learner's
 * own level (the free ones, or any once they have access) and one cached batch of word clips for Hard
 * mode, then the round runs entirely in the browser.
 *
 * A round can also be named by a seed in the link (?seed=): the daily challenge (the same words in the
 * same order for everyone at a level that day) or a friend's challenge. A seeded round deals only from
 * the level's FREE groups, in their own order, so every player can read the same words whatever their
 * plan; it is played in Easy or Medium (Hard needs a clip for every word, which is not the same set for
 * everyone), and `beat` carries the friend's score to beat.
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
  const [summaries, premium, admin, progress] = await Promise.all([
    getWordGroupSummaries(locale ?? undefined),
    hasPremiumAccess(),
    isAdmin(),
    user ? fetchProgressCached(todayLocalISODate()) : Promise.resolve(null),
  ]);

  const ownLevel = Math.min(3, Math.max(1, progress?.startingLevel ?? 1)) as 1 | 2 | 3;
  const level = seed ? seed.level : ownLevel;
  const day = utcDay();

  let pool;
  if (seed) {
    // The same words, in the same order, for everyone: the level's free groups only, by their own order.
    const free = summaries.filter((group) => group.level === level && group.isFree);
    free.sort((a, b) => a.order - b.order);
    const groups = await Promise.all(
      free
        .slice(0, GROUPS_PER_VISIT)
        .map((group) => getWordGroupById(group.id, locale ?? undefined)),
    );
    const words = groups.flatMap((group) => group?.words ?? []);
    pool = buildPool(words, new Map()).slice(0, MAX_POOL);
  } else {
    const canOpenAll = premium || admin;
    const open = summaries.filter((group) => canOpenAll || group.isFree);
    // The learner's own level first; the level below only fills the gap when it has too few groups.
    const own = open.filter((group) => group.level === level);
    const below = open.filter((group) => group.level < level);
    const candidates = shuffled(
      own.length >= GROUPS_PER_VISIT ? own : [...own, ...shuffled(below)],
    );

    const readGroups = async (from: number) =>
      (
        await Promise.all(
          candidates
            .slice(from, from + GROUPS_PER_VISIT)
            .map((group) => getWordGroupById(group.id, locale ?? undefined)),
        )
      ).flatMap((group) => group?.words ?? []);
    let all = await readGroups(0);
    // A group whose words are not readable for this visitor comes back empty: read three more rather than start a thin round.
    if (all.length < MIN_WORDS) all = [...all, ...(await readGroups(GROUPS_PER_VISIT))];
    const words = shuffled(all).slice(0, MAX_POOL * 2);
    const clips = await lookupWordListVoiceAudio(words.map((word) => word.targetWord));
    pool = buildPool(words, clips).slice(0, MAX_POOL);
  }

  // The day's ranking for the start page, only for a signed-in learner and only when they are not already in a challenge.
  let board: DailyBoard | null = null;
  if (user && !seed) board = await loadDailyBoard(day).catch(() => null);

  return (
    <WordDropGame
      pool={pool}
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
