import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { VideoLibrary } from "@/components/video-dictation/video-library";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { getVideoLessons } from "@/lib/video-dictation/content";

export const metadata: Metadata = { title: "Video" };

/**
 * The library of Video dictation: the videos prepared for it, behind the "videoDictation" permission
 * (Admins only until the owner opens it). Anyone else goes back to Home, where nothing about the section shows.
 */
export default async function VideoLibraryPage() {
  const [features, locale] = await Promise.all([getEffectiveFeatures(), getLocale()]);
  if (!features.rollouts.videoDictation) redirect("/learn");
  return <VideoLibrary lessons={getVideoLessons()} locale={locale} />;
}
