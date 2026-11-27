import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ViewerLearnSidebar } from "@/components/app/viewer-learn-sidebar";
import { SceneLines } from "@/components/today/scene/scene-lines";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getCurrentUser } from "@/lib/supabase/auth";
import { loadTodayScene } from "@/lib/today/scene-load";

// Which passage is today's is read live, per learner.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Today's scene" };

/**
 * The second step of the day's scene (permission "dailyScene"): today's passage with some of its
 * lines to type from the ear (see SceneLines). The lesson shell, full screen on a phone; on a wide
 * screen the side menu stays beside it. A day with no scene goes on to the words.
 */
export default async function TodayScenePage() {
  const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
  if (!features.rollouts.dailyScene || !user) redirect("/learn");

  const today = await loadTodayScene(user.id, features);
  if (!today) redirect("/learn/today/go?step=words");

  return (
    <div className="lesson-shell bg-background text-foreground flex min-h-svh w-full">
      <div className="hidden md:block">
        <ViewerLearnSidebar />
      </div>
      <div className="min-w-0 flex-1">
        <SceneLines key={today.passage.id} scene={today.scene} title={today.passage.title} />
      </div>
    </div>
  );
}
