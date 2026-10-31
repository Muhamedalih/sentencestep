import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { VideoLibrary } from "@/components/video-dictation/video-library";
import { isAdmin } from "@/lib/admin/access";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { getVideoLessons, isTrialVideo, visibleVideoLessons } from "@/lib/video-dictation/content";

export const metadata: Metadata = { title: "Video" };

/**
 * The library of Video dictation: the videos prepared for it, behind the "videoDictation" permission
 * (Admins only until the owner opens it). Anyone else goes back to Home, where nothing about the section shows.
 */
export default async function VideoLibraryPage() {
  const [features, locale] = await Promise.all([getEffectiveFeatures(), getLocale()]);
  if (!features.rollouts.videoDictation) redirect("/learn");
  // A trial video (a creator's text with no permission) is for an Admin only; ask who is looking only when one exists.
  const admin = getVideoLessons().some(isTrialVideo) ? await isAdmin() : false;
  return <VideoLibrary lessons={visibleVideoLessons(admin)} locale={locale} />;
}
