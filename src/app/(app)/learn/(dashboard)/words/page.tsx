import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MyWordsList, MyWordsOverview, isBankListView } from "@/components/words/my-words-page";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { fallbackDictionary, getDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { getCurrentUser } from "@/lib/supabase/auth";
import { fetchBankStates, isMissingBankSchema } from "@/lib/supabase/queries/learner-words";
import { bankOverview, shelveBank } from "@/lib/word-bank/shelves";
import { bankStrings } from "@/lib/word-bank/strings";
import { getLearnerToday } from "@/lib/word-mastery/access";

// The page is the learner's own words on the day it is opened: never cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My Words" };

/**
 * The words bank's own section («كلماتي»): today's words (five at most), where the learner's words
 * stand, and with `?show=` the list of every word under its lesson's name. Behind the "wordBank"
 * permission (Admins only until the owner opens it) and for a signed-in learner only: anyone else
 * goes back to Home. One read (the learner's own rows); a project without the table, or a failed
 * read, shows an empty bank instead of an error.
 */
export default async function MyWordsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string | string[] }>;
}) {
  const [features, user, locale] = await Promise.all([
    getEffectiveFeatures(),
    getCurrentUser(),
    getLocale(),
  ]);
  if (!features.rollouts.wordBank || !user) redirect("/learn");

  const [todayISO, states, params] = await Promise.all([
    getLearnerToday(),
    fetchBankStates(user.id).catch((error: unknown) => {
      if (!isMissingBankSchema(error)) console.error("[word-bank] reading the bank failed", error);
      return [];
    }),
    searchParams,
  ]);
  const t = locale ? getDictionary(locale) : fallbackDictionary;
  const s = bankStrings(locale);

  if (isBankListView(params.show)) {
    return (
      <MyWordsList
        shelves={shelveBank(states)}
        view={params.show}
        todayISO={todayISO}
        t={t}
        s={s}
      />
    );
  }
  return (
    <MyWordsOverview
      overview={bankOverview(states, todayISO)}
      todayISO={todayISO}
      locale={locale}
      t={t}
      s={s}
    />
  );
}
