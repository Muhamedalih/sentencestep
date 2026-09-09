import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentUnavailable } from "@/components/learning/content-unavailable";
import { LessonSession } from "@/components/learning/lesson-session";
import { PremiumLocked } from "@/components/learning/premium-locked";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { findNextLesson, getLessonById, getLessonNav } from "@/lib/content";
import { getLocale } from "@/lib/i18n/get-locale";
import { isLearningMode, modeMeta } from "@/lib/learning-modes";
import { getDefaultNormalLessonVoiceId, getDefaultVoiceId } from "@/lib/admin/voices-queries";
import { resolveVoiceId } from "@/lib/voice/resolution";
import { lookupCachedAudioUrl } from "@/lib/voice/voice-audio";
import { getSpeakerVoiceMap } from "@/lib/voice/speaker-voices";
import { cn } from "@/lib/utils";

/**
 * This route is force-dynamic (see below) — the route that decides premium
 * content access must never be statically cached. generateStaticParams was
 * removed deliberately, not just left unused: a route combining
 * generateStaticParams (covering only free units) with force-dynamic left
 * every non-free lessonId — one not in that static list — falling back to
 * Next's dynamic-params render path, where the streamed response's
 * Suspense-reveal script never ran and the client hung on the loading
 * fallback forever. Same fix applied to /learn/word-lists/[groupId] for the
 * identical bug.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mode: string; lessonId: string }>;
}): Promise<Metadata> {
  const { mode, lessonId } = await params;
  if (!isLearningMode(mode)) return {};
  // Fetches this one lesson directly rather than the whole mode's list (as
  // this used to) — getLessonById is React-cache()'d (see src/lib/content.ts),
  // so when this resolves to the exact same arguments the page component
  // below calls it with (no locale set), the two share one fetch instead of
  // issuing it twice for the same request.
  const unit = await getLessonById(mode, lessonId);
  return { title: unit?.title ?? modeMeta[mode].title };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ mode: string; lessonId: string }>;
}) {
  const { mode, lessonId } = await params;
  if (!isLearningMode(mode)) notFound();

  const locale = await getLocale();
  // getLessonNav, not getLessons: finding the next lesson only needs every
  // published lesson's id/level/order, never their full sentence bodies —
  // see fetchLessonNav's doc comment for why the previous full-list fetch
  // here was the single most expensive call on this page after
  // fetchLessonById's own.
  const [lessonNav, unit] = await Promise.all([
    getLessonNav(mode),
    getLessonById(mode, lessonId, locale ?? undefined),
  ]);
  if (!unit) notFound();

  // Admins can open any lesson regardless of the normal subscription gate
  // (see the Phase 2 redesign) — this only ever adds isAdmin() as an
  // alternative "yes", never removes the isFree/hasPremiumAccess checks a
  // real subscriber or free learner is still held to. Run in parallel
  // (matching every other hasPremiumAccess()+isAdmin() call site) rather
  // than a sequential `||` await chain — the sequential form left the
  // client stuck on the route's loading fallback forever for any non-free
  // unit, since the response's streaming reveal never completed.
  const canAccess =
    unit.isFree || (await Promise.all([hasPremiumAccess(), isAdmin()])).some(Boolean);
  if (!canAccess) {
    return (
      <div className="lesson-shell bg-background text-foreground mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <PremiumLocked
          mode={mode}
          title={unit.title}
          titleAr={unit.titleAr}
          supportTitle={unit.supportTitle}
        />
      </div>
    );
  }

  // canAccess only confirms the page-level gate; the sentences themselves
  // are separately protected by the database's own row-level security (see
  // fetchLessonById's doc comment in src/lib/supabase/queries/content.ts),
  // which can come back empty even when canAccess is true. Render that
  // honestly instead of a broken "Sentence 1 of 0" typing session.
  if (unit.sentences.length === 0) {
    return (
      <div className="lesson-shell bg-background text-foreground mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <ContentUnavailable mode={mode} title={unit.title} />
      </div>
    );
  }

  const nextLesson = findNextLesson(lessonNav, unit.id);
  // Normal lessons fall back to their own admin-configurable default
  // (tts_settings.default_normal_lesson_voice_id) — never the shared
  // tts_settings.default_voice_id, which is Stories/Conversation's own
  // setting and must stay completely unaffected by Normal lessons'
  // resolution.
  const [defaultVoiceId, speakerVoiceMap] = await Promise.all([
    mode === "normal" ? getDefaultNormalLessonVoiceId() : getDefaultVoiceId(),
    // Only Conversation lessons have per-speaker voices at all — every
    // other mode gets an empty map, which correctly falls through to
    // resolvedVoiceId everywhere it's consulted (see TypingSentence).
    mode === "conversation" ? getSpeakerVoiceMap(unit.id) : Promise.resolve({}),
  ]);
  const resolvedVoiceId = resolveVoiceId(unit.voiceId, defaultVoiceId);

  // Pre-resolves the first sentence's pronunciation URL here, server-side,
  // if it's already been generated for this voice before — the measured
  // root cause of "every sentence has a noticeable pronunciation delay,
  // even ones already generated" was that PronunciationButton's on-demand
  // resolve, while correctly cache-hitting, still cost a full client→server
  // round trip plus two sequential Supabase queries before the audio URL
  // was even known, on every single sentence mount. Handing the result in
  // as the sentence's ordinary `audioUrl` reuses PronunciationButton's
  // existing "already have a URL, play it directly" path unchanged — see
  // its own priority-order doc comment — so only this one call site
  // changes. Cache-only: never triggers Kokoro generation, so a miss here
  // just leaves the sentence to resolve on demand exactly as before. Only
  // the first sentence, not the whole lesson — deliberately not bulk
  // pre-resolving every sentence's audio up front.
  const firstSentence = unit.sentences[0];
  const sentences =
    firstSentence && !firstSentence.audioUrl && resolvedVoiceId
      ? [
          {
            ...firstSentence,
            audioUrl: await lookupCachedAudioUrl(firstSentence.en, resolvedVoiceId),
          },
          ...unit.sentences.slice(1),
        ]
      : unit.sentences;

  return (
    <div
      className={cn(
        "lesson-shell bg-background text-foreground h-svh w-full",
        mode === "stories" && "lesson-shell-stories",
      )}
    >
      <LessonSession
        unit={{ ...unit, sentences }}
        nextLesson={nextLesson}
        resolvedVoiceId={resolvedVoiceId}
        defaultVoiceId={defaultVoiceId}
        speakerVoiceMap={speakerVoiceMap}
      />
    </div>
  );
}
