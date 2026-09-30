import { HomeEngagement } from "@/components/app/home-engagement";
import type { HomeEngagementData } from "@/lib/features/home-engagement";

/**
 * Server half of Home's engagement cards: waits for the data the page started
 * loading alongside its own queries (see startHomeEngagement) and hands it to
 * the client cards. Rendered inside a <Suspense> so a slow read here can never
 * hold back the greeting, stats and "up next" hero — the cards simply stream in
 * when ready, in the same response.
 */
export async function HomeEngagementSection({
  data,
  className,
}: {
  data: Promise<HomeEngagementData | null>;
  className?: string;
}) {
  return <HomeEngagement initial={await data} className={className} />;
}
