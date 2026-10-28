import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PassagesLibrary } from "@/components/passages/passages-library";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getEffectiveFeatures, getFeatureConfig } from "@/lib/features/queries";
import { isLearnerViewOn } from "@/lib/hybrid/learner-view";
import { viewerTaste } from "@/lib/hybrid/viewer";
import { getLocale } from "@/lib/i18n/get-locale";
import { canOpenPassage, openablePassages } from "@/lib/passages/access";
import { recommendedPassageId } from "@/lib/passages/progress";
import { fetchPassageProgress, fetchPassageSummaries } from "@/lib/passages/queries";
import { getCurrentUser } from "@/lib/supabase/auth";

// A learner's own progress (Continue / Done) and the live Passages switch decide
// what this page shows — neither may come from a build-time or shared cache.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Passages" };

export default async function PassagesPage() {
  // The one gate for the whole section: Off hides it from everyone, Admin preview
  // from everyone but admins, On opens it to all (see the "passages" feature).
  const features = await getEffectiveFeatures();
  if (!features.passages.enabled) notFound();

  const user = await getCurrentUser();
  const [passages, progress, isAdminUser, config] = await Promise.all([
    fetchPassageSummaries(),
    user ? fetchPassageProgress(user.id) : Promise.resolve([]),
    isAdmin(),
    getFeatureConfig(),
  ]);
  // A Premium passage opens for subscribers and admins only; "Up next" never points anyone at a
  // lock. The subscription is only looked up when some passage is Premium (none is, until an
  // admin makes one so), so a list of free passages costs nothing extra.
  const learnerView = await isLearnerViewOn();
  const canOpenPremium =
    (isAdminUser && !learnerView) ||
    !passages.some((passage) => !passage.isFree) ||
    (await hasPremiumAccess());

  // A free learner with the hybrid offers open sees today's taste of the day open in the list too.
  const tasteId =
    user && features.rollouts.hybridOffers && !canOpenPremium
      ? await viewerTaste({
          userId: user.id,
          locale: await getLocale(),
          withPassages: true,
          withStories: false,
        }).then(({ picks }) => (picks.passageIsTaste ? (picks.passage?.id ?? null) : null))
      : null;

  const switchState = config.features.passages.state;
  const adminState =
    isAdminUser && (switchState === "admin" || switchState === "on") ? switchState : null;

  const progressById = new Map(progress.map((entry) => [entry.passageId, entry]));

  return (
    <PassagesLibrary
      passages={passages}
      progress={progress}
      upNextId={recommendedPassageId(
        openablePassages(passages, canOpenPremium, tasteId),
        progressById,
      )}
      lockedIds={passages
        .filter((passage) => !canOpenPassage(passage, canOpenPremium, tasteId))
        .map((passage) => passage.id)}
      adminState={adminState}
    />
  );
}
