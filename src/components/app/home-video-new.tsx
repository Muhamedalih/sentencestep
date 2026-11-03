"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { useVideoNew } from "@/hooks/use-video-new";
import { videoNewLabel } from "@/lib/video-dictation/strings";

/**
 * The small «new» word on the Home Video box: the same pill, and the same mark, as the Video button in
 * the menu (useVideoNew), so both are drawn until the learner has opened Video once and both are gone
 * for good afterwards. Draws nothing on the server and until hydration.
 */
export function HomeVideoNew() {
  const { dir, locale } = useLocale();
  const isNew = useVideoNew(false);
  if (!isNew) return null;
  return (
    <span
      dir={dir}
      className="bg-brand-muted text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] leading-none font-semibold"
    >
      <span
        aria-hidden="true"
        className="bg-primary size-1.5 rounded-full motion-safe:animate-pulse"
      />
      {videoNewLabel(locale)}
    </span>
  );
}
