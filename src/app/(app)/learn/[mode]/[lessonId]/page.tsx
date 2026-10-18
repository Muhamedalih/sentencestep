import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { preload } from "react-dom";

import { ContentUnavailable } from "@/components/learning/content-unavailable";
import { FreePathComplete } from "@/components/learning/free-path-complete";
import { LessonSession } from "@/components/learning/lesson-session";
import { LockedLessonNotice } from "@/components/learning/locked-lesson-notice";
import { LockedPreview } from "@/components/learning/locked-preview";
import { PremiumLocked } from "@/components/learning/premium-locked";
import { ReportProblemButton } from "@/components/app/report-problem-button";
import { trackFreePathRedirected, trackPaywallViewed } from "@/lib/analytics/paywall";
import { getFromMonthlyPrice } from "@/lib/billing/from-price";
import { getGateFigures } from "@/lib/stats/gate-figures";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { findNextLesson, getLessonById, getLessonNav } from "@/lib/content";
import { buildStoryWordQuiz } from "@/lib/content/story-word-quiz";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { isLearningMode, modeMeta } from "@/lib/learning-modes";
import { freePathForLevel, lockedLessonOutcome, pathChips } from "@/lib/progress/free-path";
import type { FreePath } from "@/lib/progress/free-path";
import { getFreePathSummary } from "@/lib/progress/free-path-summary";
import { isFromThisSite } from "@/lib/request-origin";
import { fetchLessonPreview } from "@/lib/supabase/queries/locked-preview";
import { fetchCompletedLessonIds } from "@/lib/supabase/queries/progress";
import { getDefaultNormalLessonVoiceId, getDefaultVoiceId } from "@/lib/admin/voices-queries";
import { createPublicClient } from "@/lib/supabase/public-client";
import { getCurrentUser } from "@/lib/supabase/auth";
import { resolveVoiceId } from "@/lib/voice/resolution";
import { resolveStoryNarratorVoice } from "@/lib/voice/story-voice-generation";
import { resolveWordAudioForText } from "@/lib/voice/isolated-word-audio";
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
  searchParams,
}: {
  params: Promise<{ mode: string; lessonId: string }>;
  /** `notice=locked` is added by the redirect below, so the lesson it lands on can say why the learner is there. */
  searchParams: Promise<{ notice?: string }>;
}) {
  const { mode, lessonId } = await params;
  if (!isLearningMode(mode)) notFound();
  const { notice } = await searchParams;

  const locale = await getLocale();
  // getLessonNav, not getLessons: finding the next lesson only needs every
  // published lesson's id/level/order, never their full sentence bodies —
  // see fetchLessonNav's doc comment for why the previous full-list fetch
  // here was the single most expensive call on this page after
  // fetchLessonById's own.
  const [lessonNav, unit, user] = await Promise.all([
    getLessonNav(mode),
    getLessonById(mode, lessonId, locale ?? undefined),
    getCurrentUser(),
  ]);
  if (!unit) notFound();

  // This route sits outside the (dashboard) layout (see this file's own
  // doc comment) on purpose, so it never gets that layout's default-size
  // floating pill — reused across every return below instead of repeating
  // the user?.email guest check (same one that layout applies) three times.
  // size="compact" is what makes it safe to keep on mobile here, unlike
  // that default pill — see ReportProblemButton's own doc comment.
  const reportProblemButton = user?.email ? (
    <ReportProblemButton variant="floating" size="compact" />
  ) : null;

  // Admins can open any lesson regardless of the normal subscription gate
  // (see the Phase 2 redesign) — this only ever adds isAdmin() as an
  // alternative "yes", never removes the isFree/hasPremiumAccess checks a
  // real subscriber or free learner is still held to. Run in parallel
  // (matching every other hasPremiumAccess()+isAdmin() call site) rather
  // than a sequential `||` await chain — the sequential form left the
  // client stuck on the route's loading fallback forever for any non-free
  // unit, since the response's streaming reveal never completed. Stories
  // lessons go through this same isFree/premium check as every other mode
  // now that Stories is open to every learner, not just admins.
  // Asked at most once per request, and still as one parallel pair (see above):
  // the finish screen also needs it, to say when the next lesson is Premium.
  let viewerAccess: Promise<boolean> | undefined;
  const viewerHasAccess = () =>
    (viewerAccess ??= Promise.all([hasPremiumAccess(), isAdmin()]).then((answers) =>
      answers.some(Boolean),
    ));
  const canAccess = unit.isFree || (await viewerHasAccess());
  if (!canAccess) {
    // What a Premium lesson shows depends on who opened it and how (see lockedLessonOutcome):
    // the screen after the free path once its lessons are all done, their next free lesson for
    // someone who arrived from outside the app with free lessons still ahead of them, and
    // otherwise a short look at the lesson itself. The full lock stays the fallback for when
    // that look can't be read. Only Daily Lessons have a free path to measure.
    let path: FreePath | null = null;
    let finishedIds: string[] = [];
    if (mode === "normal" && user) {
      try {
        finishedIds = await fetchCompletedLessonIds(user.id, mode);
        path = freePathForLevel(lessonNav, unit.level, finishedIds);
      } catch (error) {
        // Not knowing their progress only means the short look instead of a smarter answer.
        console.error("[lesson page] free path unavailable", error);
      }
    }
    const outcome = lockedLessonOutcome(path, {
      signedIn: Boolean(user),
      fromInApp: isFromThisSite(await headers()),
    });
    if (outcome.kind === "redirect") {
      await trackFreePathRedirected({
        mode,
        fromLessonId: unit.id,
        toLessonId: outcome.lessonId,
      });
      redirect(`/learn/${mode}/${outcome.lessonId}?notice=locked`);
    }

    if (outcome.kind === "milestone" && path && user) {
      const [fromPrice, summary] = await Promise.all([
        getFromMonthlyPrice(),
        getFreePathSummary({
          userId: user.id,
          lessonId: unit.id,
          finishedIds: path.ids.filter((id) => finishedIds.includes(id)),
        }),
        trackPaywallViewed({ kind: "lesson", mode, lessonId: unit.id, shape: "milestone" }),
      ]);
      const { labels, nextNumber } = pathChips(path.ids);
      const firstPremiumInLevel = lessonNav
        .filter((entry) => entry.level === unit.level && !entry.isFree)
        .sort((a, b) => a.order - b.order)[0];
      return (
        <div className="lesson-shell bg-background text-foreground min-h-svh">
          <div className="mx-auto flex min-h-svh max-w-5xl flex-col justify-center px-4 pt-8 pb-28 sm:px-6 sm:py-14">
            <FreePathComplete
              mode={mode}
              lessonId={unit.id}
              title={unit.title}
              supportTitle={unit.supportTitle ?? (locale === "ar" ? unit.titleAr : undefined)}
              isNextLesson={firstPremiumInLevel?.id === unit.id}
              chips={labels}
              nextNumber={nextNumber}
              unitTitle={summary.unitTitle}
              stats={{ sentences: summary.sentences, words: summary.words, days: summary.days }}
              fromPrice={fromPrice}
            />
          </div>
          {reportProblemButton}
        </div>
      );
    }

    const preview = await fetchLessonPreview(unit.id, locale ?? undefined);
    if (preview) {
      await trackPaywallViewed({ kind: "lesson", mode, lessonId: unit.id, shape: "preview" });
      return (
        <div className="lesson-shell bg-background text-foreground min-h-svh">
          <div className="mx-auto flex min-h-svh max-w-5xl flex-col justify-center px-4 pt-8 pb-28 sm:px-6 sm:py-14">
            <LockedPreview
              kind={mode === "stories" ? "story" : "lesson"}
              title={unit.title}
              supportTitle={unit.supportTitle ?? (locale === "ar" ? unit.titleAr : undefined)}
              lines={preview.lines}
              ctaHref={`/upgrade?next=${encodeURIComponent(`/learn/${mode}/${unit.id}`)}`}
              backHref={`/learn/${mode}`}
            />
          </div>
          {reportProblemButton}
        </div>
      );
    }

    // The view is counted in the same parallel batch as the lock's price and
    // figures, so recording it costs no extra wait.
    const [fromPrice, figures] = await Promise.all([
      getFromMonthlyPrice(),
      getGateFigures(locale),
      trackPaywallViewed({ kind: "lesson", mode, lessonId: unit.id, shape: "gate" }),
    ]);
    return (
      <div className="lesson-shell bg-background text-foreground min-h-svh">
        <div className="mx-auto flex min-h-svh max-w-5xl flex-col justify-center px-4 pt-8 pb-28 sm:px-6 sm:py-14">
          <PremiumLocked
            mode={mode}
            lessonId={unit.id}
            title={unit.title}
            titleAr={unit.titleAr}
            supportTitle={unit.supportTitle}
            description={unit.description}
            supportDescription={unit.supportDescription}
            illustrationUrl={unit.illustrationUrl}
            fromPrice={fromPrice}
            figures={figures}
          />
        </div>
        {reportProblemButton}
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
        {reportProblemButton}
      </div>
    );
  }

  const nextLesson = findNextLesson(lessonNav, unit.id);
  // Only when the next lesson is Premium is the viewer's access worth asking
  // about: then the finish screen says so on its button instead of leading to
  // a lock page by surprise.
  const nextLessonLocked =
    nextLesson !== undefined && nextLesson.isFree === false ? !(await viewerHasAccess()) : false;
  // Daily Lessons on the free plan carry the catalog down to the finish screen, so it can say when
  // one free lesson is left (see LessonSession's freePath). Just the four fields it reads.
  const freePathUnits =
    mode === "normal" && unit.isFree && !(await viewerHasAccess())
      ? lessonNav.map(({ id, level, order, isFree }) => ({ id, level, order, isFree }))
      : undefined;
  // Normal lessons fall back to their own admin-configurable default
  // (tts_settings.default_normal_lesson_voice_id) — never the shared
  // tts_settings.default_voice_id, which is Stories/Conversation's own
  // setting and must stay completely unaffected by Normal lessons'
  // resolution.
  const [defaultVoiceId, speakerVoiceMap, storyNarratorVoice] = await Promise.all([
    mode === "normal" ? getDefaultNormalLessonVoiceId() : getDefaultVoiceId(),
    // Only Conversation lessons have per-speaker voices at all — every
    // other mode gets an empty map, which correctly falls through to
    // resolvedVoiceId everywhere it's consulted (see TypingSentence).
    mode === "conversation" ? getSpeakerVoiceMap(unit.id) : Promise.resolve({}),
    // StoryWordsPanel's own Replay button needs the story's *actual*
    // ElevenLabs narrator voice — deliberately resolveStoryNarratorVoice,
    // never resolveVoiceId(unit.voiceId, defaultVoiceId) below: that one
    // reads tts_settings.default_voice_id, an older, separate setting that
    // can drift from elevenlabs_settings.default_story_voice_id (the
    // setting sentence narration actually resolves through — see
    // resolveStoryNarratorVoice's own doc comment), which would make a
    // story's vocabulary words sound like a different narrator than its
    // sentences. Skipped entirely outside Stories, and when this lesson has
    // no target vocabulary at all, to avoid two extra queries for nothing.
    mode === "stories" && unit.vocabulary && unit.vocabulary.length > 0
      ? resolveStoryNarratorVoice(createPublicClient(), unit.voiceId ?? null)
      : Promise.resolve(null),
  ]);
  const resolvedVoiceId = resolveVoiceId(unit.voiceId, defaultVoiceId);
  const storyNarratorVoiceId = storyNarratorVoice?.voiceId ?? null;

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
  //
  // The first sentence's individual WORDS get the same head start (the
  // measured root cause of "the first sentence's word clicks take 10-20+
  // seconds, every lesson"): no earlier sentence exists to have loaded them
  // while the learner typed, so they must already be known when the page
  // arrives. They were being looked up under the narrator's own voice id —
  // but an isolated word never lives there (a Cartesia/ElevenLabs narrator
  // never pays for a single word; its clips sit under a free gender-matched
  // Edge-TTS voice), so for every paid-narrator lesson that lookup missed
  // every single time, leaving the very first words to be fetched cold. The
  // same fix Books already has: resolveWordAudioForText looks under the voice
  // the words really live under, and under both spellings a word may be
  // cached as. Word click only exists in Normal/Stories (see TypingSentence's
  // own enableWordClick scope), so Conversation skips it. Both lookups are
  // cache-only (never generate) and run side by side rather than one after
  // the other, so together they add one round trip to the page instead of two;
  // a failed word lookup just leaves those words to load on the client.
  const firstSentence = unit.sentences[0];
  const wordAudioWanted = mode === "normal" || mode === "stories";
  const [firstSentenceAudioUrl, firstSentenceWordAudio] = await Promise.all([
    firstSentence && !firstSentence.audioUrl && resolvedVoiceId
      ? lookupCachedAudioUrl(firstSentence.en, resolvedVoiceId).catch((error: unknown) => {
          // A head start that failed must never take the lesson down with it.
          console.error("[lesson page] first-sentence audio lookup failed", error);
          return null;
        })
      : Promise.resolve(firstSentence?.audioUrl ?? null),
    firstSentence && resolvedVoiceId && wordAudioWanted
      ? resolveWordAudioForText({
          sentenceId: firstSentence.id,
          text: firstSentence.en,
          voiceId: resolvedVoiceId,
        })
          .then((result) => result?.urls)
          .catch((error: unknown) => {
            console.error("[lesson page] first-sentence word audio lookup failed", error);
            return undefined;
          })
      : Promise.resolve(undefined),
  ]);
  const sentences =
    firstSentence && !firstSentence.audioUrl && resolvedVoiceId
      ? [{ ...firstSentence, audioUrl: firstSentenceAudioUrl }, ...unit.sentences.slice(1)]
      : unit.sentences;

  // Starts downloading those word clips with the HTML itself (a <link
  // rel="preload"> in the head), before the page's JavaScript has even
  // loaded — the word-audio preloader then finds them already on their way.
  // crossOrigin matches the preloader's own fetch() (credentials omitted for a
  // cross-origin request) so the browser reuses the response instead of
  // downloading it twice.
  for (const url of new Set(Object.values(firstSentenceWordAudio ?? {}))) {
    preload(url, { as: "fetch", crossOrigin: "anonymous" });
  }

  // The Stories word quiz — asked only when the admin "Word quiz" switch (Admin -> Features) is open
  // for this visitor (Off: nobody, Admin preview: admins, On: everyone), so a closed feature ships
  // nothing to the browser. Arabic only: the answers are the target words' Arabic glosses, and there
  // are no Spanish/Turkish ones yet, so those learners get no quiz rather than an English one.
  // getEffectiveFeatures is already cached for this request by the /learn layout.
  const wordQuiz =
    mode === "stories" &&
    (locale === null || locale === "ar") &&
    (await getEffectiveFeatures()).wordQuiz.enabled
      ? buildStoryWordQuiz(unit)
      : undefined;

  return (
    <div
      className={cn(
        "lesson-shell bg-background text-foreground h-app w-full",
        mode === "stories" && "lesson-shell-stories",
      )}
    >
      {notice === "locked" && <LockedLessonNotice />}
      <LessonSession
        unit={{ ...unit, sentences }}
        nextLesson={nextLesson}
        nextLessonLocked={nextLessonLocked}
        freePathUnits={freePathUnits}
        resolvedVoiceId={resolvedVoiceId}
        defaultVoiceId={defaultVoiceId}
        storyNarratorVoiceId={storyNarratorVoiceId}
        speakerVoiceMap={speakerVoiceMap}
        firstSentenceWordAudio={firstSentenceWordAudio}
        wordQuiz={wordQuiz}
      />
      {reportProblemButton}
    </div>
  );
}
