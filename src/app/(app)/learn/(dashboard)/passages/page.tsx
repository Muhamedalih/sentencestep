import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PassagesLibrary } from "@/components/passages/passages-library";
import { isAdmin } from "@/lib/admin/access";
import { getEffectiveFeatures, getFeatureConfig } from "@/lib/features/queries";
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

  const switchState = config.features.passages.state;
  const adminState =
    isAdminUser && (switchState === "admin" || switchState === "on") ? switchState : null;

  const progressById = new Map(progress.map((entry) => [entry.passageId, entry]));

  return (
    <PassagesLibrary
      passages={passages}
      progress={progress}
      upNextId={recommendedPassageId(passages, progressById)}
      adminState={adminState}
    />
  );
}
