import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SceneLines } from "@/components/today/scene/scene-lines";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getCurrentUser } from "@/lib/supabase/auth";
import { loadTodayScene } from "@/lib/today/scene-load";

// Which passage is today's is read live, per learner.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Today's scene" };

/**
 * The second step of the day's scene (permission "dailyScene"): today's passage with some of its
 * lines to type from the ear (see SceneLines). The lesson shell, full screen with no side menu: the
 * screen is a stage for the one line being typed. A day with no scene goes on to the words.
 */
export default async function TodayScenePage() {
  const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
  if (!features.rollouts.dailyScene || !user) redirect("/learn");

  const today = await loadTodayScene(user.id, features);
  if (!today) redirect("/learn/today/go?step=words");

  return (
    <div className="lesson-shell bg-background text-foreground min-h-svh w-full">
      <SceneLines
        key={today.passage.id}
        passageId={today.passage.id}
        scene={today.scene}
        title={today.passage.title}
      />
    </div>
  );
}
