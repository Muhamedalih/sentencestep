import Image from "next/image";

import {
  ConversationModeDefaultScene,
  DailyRoutineScene,
  DoctorsOfficeScene,
  FamilyAndHomeScene,
  FoodAndRestaurantsScene,
  HotelCheckInScene,
  IntroducingYourselfScene,
  JobInterviewScene,
  MakingPlansScene,
  NewNeighborScene,
  NormalModeDefaultScene,
  ShoppingScene,
  StoriesModeDefaultScene,
  TravelScene,
  WorkAndColleaguesScene,
} from "./illustrations/scenes";

import { useLocale } from "@/components/providers/locale-provider";
import { cn, stableIndex } from "@/lib/utils";
import type { LearningMode } from "@/types/content";
import type { ComponentType } from "react";

/**
 * A small, static, keyword-based map from lesson id/title to a topic — no
 * database field for this exists (lessons/levels only carry mode, level,
 * title — see supabase/migrations/20250101000000_init_schema.sql), and
 * adding one would be a schema change for something this can already do
 * safely without one. Matched by lesson id first (exact, stable even if a
 * title is ever edited via the admin CMS), falling back to a title-keyword
 * match for any lesson this map doesn't already know about, and finally to
 * a generic per-mode scene so every lesson always renders something
 * intentional rather than nothing.
 */
const SCENE_BY_LESSON_ID: Record<string, ComponentType> = {
  "normal-1": IntroducingYourselfScene,
  "normal-2": DailyRoutineScene,
  "normal-3": FamilyAndHomeScene,
  "normal-4": ShoppingScene,
  "normal-5": FoodAndRestaurantsScene,
  "normal-6": MakingPlansScene,
  "normal-7": WorkAndColleaguesScene,
  "normal-8": TravelScene,
  "story-1": NewNeighborScene,
  "story-2": JobInterviewScene,
  "conversation-1": HotelCheckInScene,
  "conversation-2": DoctorsOfficeScene,
};

const SCENE_BY_KEYWORD: [pattern: RegExp, scene: ComponentType][] = [
  [/introduc/i, IntroducingYourselfScene],
  [/routine|morning|schedule/i, DailyRoutineScene],
  [/famil|home|neighbor/i, FamilyAndHomeScene],
  [/shop/i, ShoppingScene],
  [/food|restaurant|dinner|lunch/i, FoodAndRestaurantsScene],
  [/plan|weekend|movie/i, MakingPlansScene],
  [/work|colleague|job|interview|office/i, WorkAndColleaguesScene],
  [/travel|trip|flight|airport|hotel/i, TravelScene],
  [/doctor|health|clinic/i, DoctorsOfficeScene],
];

/**
 * Every scene, including the three that used to be one fixed per-mode
 * default — used as a shared fallback pool below rather than always
 * rendering the same single scene for every lesson with no id/keyword
 * match. Stories is where that mattered most in practice: SCENE_BY_KEYWORD's
 * patterns were written with Normal/Conversation titles in mind ("routine,"
 * "shop," "doctor"...), which a 60-lesson Stories catalog full of narrative
 * titles ("The Strange Package," "The Wrong Coffee") almost never matches,
 * so nearly the whole library was quietly collapsing onto one identical
 * illustration.
 */
const FALLBACK_SCENE_POOL: ComponentType[] = [
  IntroducingYourselfScene,
  DailyRoutineScene,
  FamilyAndHomeScene,
  ShoppingScene,
  FoodAndRestaurantsScene,
  MakingPlansScene,
  WorkAndColleaguesScene,
  TravelScene,
  NewNeighborScene,
  JobInterviewScene,
  HotelCheckInScene,
  DoctorsOfficeScene,
  NormalModeDefaultScene,
  StoriesModeDefaultScene,
  ConversationModeDefaultScene,
];

function sceneForLesson(mode: LearningMode, lessonId: string, title: string): ComponentType {
  if (SCENE_BY_LESSON_ID[lessonId]) return SCENE_BY_LESSON_ID[lessonId];
  const keywordMatch = SCENE_BY_KEYWORD.find(([pattern]) => pattern.test(title));
  if (keywordMatch) return keywordMatch[1];
  // No specific match: still varied (see FALLBACK_SCENE_POOL) rather than
  // one generic scene repeated across the whole mode, but seeded with
  // `mode` alongside the id so the same lesson never collides with a
  // same-named lesson in a different mode.
  // The `?? IntroducingYourselfScene` branch is unreachable in practice
  // (stableIndex's modulo always lands inside FALLBACK_SCENE_POOL's real
  // length) — it exists only to satisfy noUncheckedIndexedAccess with a
  // real component reference rather than a second array index, which
  // would have the exact same never-actually-undefined caveat.
  return (
    FALLBACK_SCENE_POOL[stableIndex(`${mode}:${lessonId}`, FALLBACK_SCENE_POOL.length)] ??
    IntroducingYourselfScene
  );
}

/**
 * The lesson's topic illustration — a hand-authored line-figure scene (see
 * illustrations/scenes.tsx and parts.tsx), not a photo or AI-generated
 * artwork. That's a deliberate scope decision, made explicit to the user
 * rather than assumed: reaching photographic/cinematic illustration quality
 * would require either a paid external image-generation service (a new
 * external dependency this project doesn't have) or licensed stock art
 * (which risks exactly the generic "stock illustration" look this was
 * meant to move away from). What's here instead is an in-repo, zero-
 * dependency, dark-mode-native illustration family: every scene shares one
 * rounded-stroke figure style and a two-color palette (the app's own brand
 * and accent tokens) so 12+ independently-posed scenes still read as one
 * consistent product rather than mismatched clip-art.
 *
 * Rendered once per lesson session (see LessonSession), not once per
 * sentence, so it never re-mounts or flickers as the learner advances
 * through a lesson's sentences.
 */
export function LessonIllustration({
  mode,
  lessonId,
  title,
  illustrationUrl,
  className,
  showScene = true,
}: {
  mode: LearningMode;
  lessonId: string;
  title: string;
  /** Admin-set photo/illustration (see src/lib/admin/content-actions.ts's uploadLessonImage). When absent, falls back to the hand-authored SVG scene below. */
  illustrationUrl?: string | null;
  className?: string;
  /**
   * Skips the hand-authored line-figure scene, leaving just the gradient/
   * blur-blob background — the scene's small, borrowed-from-Normal-mode
   * figure reads as a meaningless dark blob at library-thumbnail size (see
   * StoryCard, the one caller that sets this false), where the full lesson
   * screen has enough room for it to actually read as an illustration.
   * True everywhere else, unchanged from before this prop existed.
   */
  showScene?: boolean;
}) {
  const SceneComponent = sceneForLesson(mode, lessonId, title);
  const { t } = useLocale();
  const illustrationAlt = t.lesson.illustrationAlt.replace("{title}", title);

  if (illustrationUrl) {
    return (
      <div
        role="img"
        aria-label={illustrationAlt}
        className={cn(
          // Short and wide on mobile (a banner above the sentence, not a
          // competing focal point) — fills the panel exactly once the
          // split layout kicks in at lg: — see LessonSession.
          "relative aspect-[16/9] w-full overflow-hidden lg:aspect-auto lg:h-full",
          className,
        )}
      >
        <Image
          src={illustrationUrl}
          alt=""
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover"
          priority
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={illustrationAlt}
      className={cn(
        // items-center (not lg:items-start) below lg: is fine — that
        // breakpoint's own aspect-[16/9] already makes this container's
        // height track its content, so there's no extra height to center
        // within. At lg:+ this container switches to lg:h-full and gets
        // whatever height the row (illustration + sentence, stretched
        // together — see LessonSession's lg:items-stretch) ends up being,
        // which is routinely taller than this capped-size scene — centering
        // it inside that leftover height is what visibly pushed the scene
        // (and, matching this same pattern in the sentence panel, the
        // sentence itself) down from the top of the row. Top-aligning here
        // instead means the scene always starts right under the lesson
        // counter, with any leftover height simply becoming empty space
        // below it rather than being split above and below.
        "relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden lg:aspect-auto lg:h-full lg:items-start",
        className,
      )}
      style={{
        // Same --lesson-* fallback rationale as FIGURE_STROKE/PROP_ACCENT in
        // illustrations/parts.tsx — these are .lesson-shell-scoped, and this
        // component also renders outside it (HomeHero, StoryCard), where an
        // undefined custom property in a radial-gradient stop just drops that
        // color stop, silently flattening the whole background to plain
        // --surface-muted with no gradient at all. Fallbacks reproduce
        // .lesson-shell's own default look (--lesson-secondary -> --brand-muted,
        // --lesson-illustration-accent -> --accent) instead.
        background:
          "radial-gradient(120% 100% at 20% 15%, var(--lesson-secondary, var(--brand-muted)) 0%, transparent 60%)," +
          "radial-gradient(100% 100% at 85% 90%, var(--lesson-illustration-accent, var(--accent)) 0%, transparent 45%)," +
          "var(--surface-muted)",
      }}
    >
      <div
        aria-hidden="true"
        className="absolute -top-10 -left-10 size-40 rounded-full bg-[var(--lesson-illustration-stroke,var(--brand))]/10 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-8 -bottom-8 size-48 rounded-full bg-[var(--lesson-illustration-accent,var(--accent))]/20 blur-2xl"
      />
      {showScene && (
        <div
          className={cn(
            // Width-only sizing here (no explicit height) matches this
            // wrapper's own aspect-[16/9]-capped container below lg:, where
            // height already tracks width 1:1. At lg:+ the container switches
            // to lg:h-full and gets whatever height the (independently sized)
            // sentence panel needs — often much taller than a width-only cap
            // would use, leaving dead space above/below a small centered
            // scene. Setting height too there lets the scene grow with
            // whichever dimension the panel is shorter on; the SVG's own
            // viewBox + default preserveAspectRatio ("meet", see parts.tsx)
            // then contain-fits inside that box automatically, so it always
            // scales up to fill the available space without ever cropping or
            // overflowing it. The 36rem cap was already the binding
            // constraint (not the 90% figure) on a typical laptop-height
            // panel, so raising it to 44rem is what actually lets the scene
            // grow further on anything taller than that, rather than
            // plateauing well below the space the panel already has. 90%→95%
            // closes most of the remaining gap on typical viewports too,
            // where the cap doesn't bind at all.
            "relative w-[80%] max-w-72 sm:w-[85%] lg:h-[95%] lg:max-h-[44rem] lg:w-[95%] lg:max-w-[44rem]",
          )}
        >
          <SceneComponent />
        </div>
      )}
    </div>
  );
}
