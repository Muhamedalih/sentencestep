import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MarkVideoNewsSeen } from "@/components/video-dictation/mark-news-seen";
import { VideoLibrary } from "@/components/video-dictation/video-library";
import { VideoLibraryAdmin } from "@/components/video-dictation/video-library-admin";
import { isAdmin } from "@/lib/admin/access";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { getVideoArrangement } from "@/lib/video-dictation/arrangement-store";
import { arrangeVideoLessons, getVideoLessons, videoCard } from "@/lib/video-dictation/content";

export const metadata: Metadata = { title: "Video" };

/**
 * The library of Video dictation: the videos prepared for it, in sections by kind (comedy first until an
 * Admin arranges them), behind the "videoDictation" permission (open to everyone).
 * Anyone it is closed for goes back to Home. Every prepared video is open to every viewer, in the same
 * order; an Admin also gets the arrange mode; the saved arrangement is one
 * cached read shared by every visitor. Opening the library is what "seen" means for the «جديد» line on
 * Home (see MarkVideoNewsSeen).
 */
export default async function VideoLibraryPage() {
  const [features, locale] = await Promise.all([getEffectiveFeatures(), getLocale()]);
  if (!features.rollouts.videoDictation) redirect("/learn");
  // The dashboard layout already resolved who is looking for this request, so this costs nothing.
  const [admin, saved] = await Promise.all([isAdmin(), getVideoArrangement()]);
  const lessons = getVideoLessons();
  const sections = arrangeVideoLessons(lessons, saved);
  // Slim card data only: a card needs none of the sentences, and an Admin's page runs in the browser.
  const cards = Object.fromEntries(lessons.map((lesson) => [lesson.id, videoCard(lesson)]));

  return (
    <>
      <MarkVideoNewsSeen />
      {admin ? (
        <VideoLibraryAdmin
          sections={sections}
          defaultSections={arrangeVideoLessons(lessons, null)}
          cards={cards}
          locale={locale}
        />
      ) : (
        <VideoLibrary sections={sections} cards={cards} locale={locale} />
      )}
    </>
  );
}
