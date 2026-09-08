import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { GenerateBookAudioButton } from "@/components/admin/generate-book-audio-button";
import { BookReadingSession } from "@/components/learning/book-reading-session";
import { Button } from "@/components/ui/button";
import {
  getBookByIdAdmin,
  getBookSectionWithSentencesAdmin,
  listBookSectionsAdmin,
} from "@/lib/admin/library-queries";
import { getBookNarrationVoiceId } from "@/lib/admin/elevenlabs-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resolveVoiceId } from "@/lib/voice/resolution";
import type { Book } from "@/types/library";

export const metadata: Metadata = {
  title: "Preview",
};

/**
 * Renders the exact learner-facing BookReadingSession — no second
 * implementation — in previewMode (see that component's own doc comment),
 * which never persists XP/streak/daily-progress/book_progress to the
 * admin's own signed-in account. Reachable for a draft (unpublished)
 * section, unlike the real reading route: getBookSectionWithSentencesAdmin
 * uses the session-aware admin client, not the anonymous published-only one.
 */
export default async function AdminBookSectionPreviewPage({
  params,
}: {
  params: Promise<{ bookId: string; sectionId: string }>;
}) {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const { bookId, sectionId } = await params;
  const [book, section, sections, globalDefaultVoiceId] = await Promise.all([
    getBookByIdAdmin(bookId),
    getBookSectionWithSentencesAdmin(sectionId),
    listBookSectionsAdmin(bookId),
    getBookNarrationVoiceId(),
  ]);
  if (!book || !section || section.bookId !== bookId) notFound();
  // This book's own narration override always wins over the global default
  // — see the same fix in the learner-facing read/page.tsx, so a preview
  // actually previews the voice this book will really be read with.
  const resolvedVoiceId = resolveVoiceId(book.voiceId, globalDefaultVoiceId);

  if (section.sentences.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href={`/admin/library/${bookId}/sections/${sectionId}/edit`}>← Back to editor</Link>
        </Button>
        <p className="text-muted-foreground">
          This section has no sentences yet — nothing to preview.
        </p>
      </div>
    );
  }

  return (
    <div className="lesson-shell bg-background text-foreground flex h-svh w-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-4 px-6 pt-4 lg:px-16">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href={`/admin/library/${bookId}/sections/${sectionId}/edit`}>← Back to editor</Link>
        </Button>
        <GenerateBookAudioButton bookId={bookId} />
      </div>
      <div className="min-h-0 flex-1">
        <BookReadingSession
          book={{
            ...book,
            difficultyLevel: book.difficultyLevel as Book["difficultyLevel"],
            // Not read by BookReadingSession/BookCompletion — category links
            // are a library-browsing concept, unrelated to the active
            // reading/typing experience being previewed here.
            categories: [],
          }}
          initialSection={section}
          initialSentenceId={section.sentences[0]!.id}
          initialCompletedSentenceCount={0}
          totalSentenceCount={section.sentences.length}
          totalSectionCount={sections.length}
          resolvedVoiceId={resolvedVoiceId}
          previewMode
        />
      </div>
    </div>
  );
}
