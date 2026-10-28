"use server";

import { cookies } from "next/headers";
import { after } from "next/server";

import type { ReviewWord } from "@/components/learning/word-review-session";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { awardEventBadge } from "@/lib/features/badge-service";
import { completeDailySession } from "@/lib/features/daily-session-queries";
import { buildDailySessionWords } from "@/lib/features/daily-session-service";
import { TIMEZONE_COOKIE } from "@/lib/features/learner-date";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { recordQuestEventsAndBadges } from "@/lib/features/quest-service";
import { getLocale } from "@/lib/i18n/get-locale";
import { createClient } from "@/lib/supabase/server";
import { sessionLeftovers, sessionWords, withoutBank } from "@/lib/today/session-words";
import { loadLinkedWords } from "@/lib/today/session-words-load";
import { generateWordListVoiceAudio } from "@/lib/voice/word-list-word-audio";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

async function getSessionUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
}

export interface DailySessionSummary {
  /** Words ready to review (an estimate — see countDailySessionCandidates). */
  ready: number;
  minutes: number;
  xpReward: number;
  completedToday: boolean;
}

/**
 * How long the page will wait for the FIRST word's clip when it isn't cached
 * yet. Short on purpose: this backend is slow and bursty (see
 * word-list-word-audio.ts), and a learner who has to wait for speech
 * synthesis before seeing the session is worse off than one whose first word
 * briefly falls back — so this is a best-effort head start, never a gate.
 */
const FIRST_WORD_AUDIO_WAIT_MS = 3_500;

/** Resolves with `fallback` if `work` hasn't finished after `ms` (the work itself keeps running). */
function withTimeout<T>(work: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([work, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * Today's session speaks every word in the Word Lists voice. The session
 * already points each word at its cached clip (see buildDailySessionWords);
 * this gets the rest made without ever holding the learner up:
 *  - the first word gets a short, bounded head start so it can play at once;
 *  - everything still missing is generated AFTER the response is sent (see
 *    generateWordListVoiceAudio), in the order the words will be reached — each
 *    takes the learner ~20s to type, so they are usually ready by then — and
 *    stay cached for every later session.
 * Best-effort: a failure is logged and the word falls back as it always did.
 */
async function generateMissingSessionAudio(words: ReviewWord[]): Promise<ReviewWord[]> {
  const missing = words.filter((word) => !word.audioUrl).map((word) => word.targetWord);
  if (missing.length === 0) return words;

  let result = words;
  const first = words[0];
  if (first && !first.audioUrl) {
    const head = await withTimeout(
      generateWordListVoiceAudio([first.targetWord], {
        deadlineMs: FIRST_WORD_AUDIO_WAIT_MS,
        concurrency: 1,
      }).catch(() => null),
      FIRST_WORD_AUDIO_WAIT_MS,
      null,
    );
    const url = head?.urls.get(first.targetWord);
    if (url) result = [{ ...first, audioUrl: url }, ...words.slice(1)];
  }

  const stillMissing = result.filter((word) => !word.audioUrl).map((word) => word.targetWord);
  if (stillMissing.length > 0) {
    after(async () => {
      await generateWordListVoiceAudio(stillMissing);
    });
  }
  return result;
}

/** The session's words, for /learn/session. [] when the feature isn't open, nothing is due, or anything fails. */
export async function fetchDailySessionWordsAction(): Promise<ReviewWord[]> {
  try {
    const features = await getEffectiveFeatures();
    if (!features.dailySession.enabled) return [];
    const userId = await getSessionUserId();
    if (!userId) return [];
    const words = await buildDailySessionWords(userId, features, await getLocale());
    return await generateMissingSessionAudio(words);
  } catch (error) {
    console.error("[daily-session] fetchDailySessionWordsAction failed", error);
    return [];
  }
}

/**
 * Today's words step (permission "Today's session (new Home)"): `size` words, the target words of
 * today's story and today's passage and nothing else (see sessionWords) — the same whether the two
 * are read yet or not. Each word comes with the recorded clip it plays (see loadLinkedWords), so
 * nothing is synthesized here and none is left to the browser's own voice. `more` is "5 more words":
 * a further round of the day's own words that the first round left. [] when the permission isn't
 * open for this learner, nobody is signed in, there are no words of the day, or anything fails.
 */
export async function fetchTodayWordsAction(size: number, more = false): Promise<ReviewWord[]> {
  try {
    if (!Number.isInteger(size) || size < 1 || size > 10 || typeof more !== "boolean") return [];
    const [features, userId] = await Promise.all([getEffectiveFeatures(), getSessionUserId()]);
    if (!features.rollouts.todaySession || !userId) return [];
    const [premium, admin, locale] = await Promise.all([
      hasPremiumAccess(),
      isAdmin(),
      getLocale(),
    ]);
    const linked = await loadLinkedWords({
      userId,
      locale,
      timeZone: (await cookies()).get(TIMEZONE_COOKIE)?.value,
      isPremium: premium,
      admin,
      hybridOffers: features.rollouts.hybridOffers,
      passagesEnabled: features.passages.enabled,
    });
    const { story, passage } = more ? sessionLeftovers({ ...linked, size }) : linked;
    const words = sessionWords({ story, passage, size });
    // The words bank remembers these words only for a learner it is open to ("wordBank"): for anyone
    // else the words carry no bank context, so their screen records nothing and sends no extra call.
    return features.rollouts.wordBank ? words : words.map(withoutBank);
  } catch (error) {
    console.error("[today] fetchTodayWordsAction failed", error);
    return [];
  }
}

/**
 * Called once the learner reaches the end of the session. Pays the XP reward
 * at most once per local day (the database decides — see
 * complete_daily_session), and only then credits the "finish the session"
 * quest and the first-session badge. Best-effort: resolves with what it did
 * and never throws into the completion screen.
 */
export async function completeDailySessionAction(
  todayISO: string,
  reviewedCount: number,
): Promise<{ first: boolean; xp: number }> {
  const none = { first: false, xp: 0 };
  if (!ISO_DATE.test(todayISO) || !Number.isInteger(reviewedCount) || reviewedCount < 1) {
    return none;
  }
  try {
    const features = await getEffectiveFeatures();
    if (!features.dailySession.enabled) return none;
    const userId = await getSessionUserId();
    if (!userId) return none;

    const xp = features.dailySession.xpReward;
    const first = await completeDailySession(todayISO, xp);
    if (first) {
      after(async () => {
        await recordQuestEventsAndBadges(userId, [{ type: "dailySession", amount: 1 }], todayISO);
        await awardEventBadge("firstDailySession");
      });
    }
    return { first, xp: first ? xp : 0 };
  } catch (error) {
    console.error("[daily-session] completeDailySessionAction failed", error);
    return none;
  }
}
