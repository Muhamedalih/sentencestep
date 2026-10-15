import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PassageReader } from "@/components/passages/passage-reader";
import { isAdmin } from "@/lib/admin/access";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { pauseMarksFor } from "@/lib/passages/admin-pauses";
import { resumeSectionIndex } from "@/lib/passages/progress";
import { fetchPassage, fetchPassageProgress, fetchPassageSummaries } from "@/lib/passages/queries";
import { getCurrentUser } from "@/lib/supabase/auth";

/**
 * The full-screen passage reader — outside the "(dashboard)" route group, same
 * convention as /learn/[mode]/[lessonId] and the Book reader: no header or
 * sidebar competing with the text. force-dynamic because where a signed-in
 * learner resumes, and whether the section is open to this visitor at all, must
 * never come from a stale cache.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ passageId: string }>;
}): Promise<Metadata> {
  // A title is content: never hand it to a visitor the section is not open to.
  if (!(await getEffectiveFeatures()).passages.enabled) return { title: "Passages" };
  const { passageId } = await params;
  const passage = await fetchPassage(passageId);
  return { title: passage ? `${passage.title} · Passages` : "Passages" };
}

export default async function PassageReaderPage({
  params,
}: {
  params: Promise<{ passageId: string }>;
}) {
  const features = await getEffectiveFeatures();
  if (!features.passages.enabled) notFound();

  const { passageId } = await params;
  const [passage, summaries, user, locale, isAdminUser] = await Promise.all([
    fetchPassage(passageId),
    fetchPassageSummaries(),
    getCurrentUser(),
    getLocale(),
    isAdmin(),
  ]);
  if (!passage || passage.sections.length === 0) notFound();

  const progress = user
    ? (await fetchPassageProgress(user.id)).find((entry) => entry.passageId === passage.id)
    : undefined;

  // The next passage in list order — a suggestion on the end screen, never a requirement.
  const position = summaries.findIndex((summary) => summary.id === passage.id);
  const next = position >= 0 ? summaries[position + 1] : undefined;

  // "Practice these words": the real Word Lists page once the lesson is published (the
  // Passages switch is On); until then only an admin gets a way in, the admin preview of
  // that same lesson — a learner is never sent to a page that would 404 for them.
  const wordsLink = passage.wordGroupId
    ? passage.wordGroupStatus === "published"
      ? { href: `/learn/word-lists/${passage.wordGroupId}`, adminPreview: false }
      : isAdminUser
        ? { href: `/admin/word-lists/${passage.wordGroupId}/preview`, adminPreview: true }
        : null
    : null;

  // Where the narrator will pause: shown to an admin as small dots between the words, to nobody else —
  // it is computed here, from the authored data, and never sent to a learner's browser.
  const pauseMarks = isAdminUser ? pauseMarksFor(passage.id) : undefined;

  return (
    <div className="lesson-shell bg-background text-foreground min-h-svh w-full">
      <PassageReader
        passage={passage}
        pauseMarks={pauseMarks}
        initialSectionIndex={resumeSectionIndex(progress, passage.sections.length)}
        // Only Arabic translations are written so far (see PassageSentence.ar).
        translationAvailable={locale === "ar"}
        nextPassage={next ? { id: next.id, title: next.title } : null}
        wordsLink={wordsLink}
      />
    </div>
  );
}
