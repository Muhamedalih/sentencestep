import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PassagesLibrary } from "@/components/passages/passages-library";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getEffectiveFeatures, getFeatureConfig } from "@/lib/features/queries";
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
  const canOpenPremium =
    isAdminUser || !passages.some((passage) => !passage.isFree) || (await hasPremiumAccess());

  const switchState = config.features.passages.state;
  const adminState =
    isAdminUser && (switchState === "admin" || switchState === "on") ? switchState : null;

  const progressById = new Map(progress.map((entry) => [entry.passageId, entry]));

  return (
    <PassagesLibrary
      passages={passages}
      progress={progress}
      upNextId={recommendedPassageId(openablePassages(passages, canOpenPremium), progressById)}
      lockedIds={passages
        .filter((passage) => !canOpenPassage(passage, canOpenPremium))
        .map((passage) => passage.id)}
      adminState={adminState}
    />
  );
}
