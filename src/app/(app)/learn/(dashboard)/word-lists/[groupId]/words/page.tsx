import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WordGroupLocked } from "@/components/learning/word-group-locked";
import { WordGroupUnavailable } from "@/components/learning/word-group-unavailable";
import { WordGroupWall } from "@/components/words/word-group-wall";
import { getFromMonthlyPrice } from "@/lib/billing/from-price";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getLocale } from "@/lib/i18n/get-locale";
import { getWordGroupById } from "@/lib/word-lists";
import {
  getLearnerToday,
  getSmartWordsAccess,
  getWordsRedesignEnabled,
} from "@/lib/word-mastery/access";
import { readMasteryStates } from "@/lib/word-mastery/queue";

/**
 * The redesigned topic page ("word wall"): every word of one Word Lists topic
 * with how strong it is, and the ways into Learn and practice. It exists only
 * while the admin-controlled "Word Lists redesign" feature is open to the
 * visitor (Admin preview, or On for everyone) — otherwise this URL is a 404, so
 * a learner who has not been given the redesign can never land on half of it.
 * force-dynamic for the same stale-premium-cache reason as the other word-list
 * routes.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ groupId: string }>;
}): Promise<Metadata> {
  const { groupId } = await params;
  const group = await getWordGroupById(groupId);
  return { title: group ? `${group.title} · Word Lists` : "Word Lists" };
}

export default async function WordGroupWallPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  if (!(await getWordsRedesignEnabled())) notFound();

  const { groupId } = await params;
  const locale = await getLocale();
  const group = await getWordGroupById(groupId, locale ?? undefined);
  if (!group) notFound();

  const canAccess =
    group.isFree || (await Promise.all([hasPremiumAccess(), isAdmin()])).some(Boolean);
  if (!canAccess) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <WordGroupLocked
          title={group.title}
          supportTitle={group.supportTitle}
          fromPrice={await getFromMonthlyPrice()}
        />
      </div>
    );
  }

  if (group.words.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <WordGroupUnavailable title={group.title} />
      </div>
    );
  }

  // The schedule is optional decoration (see readMasteryStates): a guest, Smart
  // word practice off, or a read failure gives the wall local progress instead.
  const [access, today] = await Promise.all([getSmartWordsAccess(), getLearnerToday()]);
  let states: Record<string, { strength: number; dueOn: string }> | null = null;
  if (access.spaced && access.userId) {
    const all = await readMasteryStates(access.userId);
    states = {};
    for (const word of group.words) {
      const state = all.get(word.id);
      if (state) states[word.id] = state;
    }
  }

  return <WordGroupWall group={group} states={states} today={today} />;
}
