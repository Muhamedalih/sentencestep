import { LearnSidebar } from "@/components/app/learn-sidebar";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLearnLanguage, isGermanOpen } from "@/lib/learn-language-server";
import { getCurrentUser } from "@/lib/supabase/auth";

/**
 * The learning app's side menu as this viewer gets it (every read here is cached for the request),
 * for the pages that draw it: the dashboard layout, and the day's scene on a wide screen.
 */
export async function ViewerLearnSidebar() {
  const user = await getCurrentUser();
  const [isAdminUser, features] = await Promise.all([isAdmin(), getEffectiveFeatures()]);
  // German has no videos yet, so the menu locks «فيديو» for it.
  const learnLanguage = (await isGermanOpen()) ? await getLearnLanguage() : undefined;
  // The Library's menu item: admins always; a subscriber once the "libraryGift" permission is open for
  // them. The subscription is only looked up when that permission is open, so while it is closed this
  // costs nothing (the pages check the same rule: see canOpenLibrary).
  const libraryOpen = isAdminUser || (features.rollouts.libraryGift && (await hasPremiumAccess()));

  return (
    <LearnSidebar
      isAdminUser={isAdminUser}
      libraryOpen={libraryOpen}
      passagesEnabled={features.passages.enabled}
      mobilePath={features.rollouts.mobilePath}
      rulesEnabled={Boolean(user) && features.rollouts.dailyRule}
      videoEnabled={features.rollouts.videoDictation}
      videoLocked={learnLanguage === "de"}
      wordDropEnabled={features.rollouts.wordDrop}
      contactInstagram={features.rollouts.contactInstagram}
      wordBankEnabled={Boolean(user) && (features.rollouts.wordBank || features.personalCards.page)}
      wordsHub={features.rollouts.wordsPage}
      storiesFirst={features.rollouts.todayTidy}
    />
  );
}
