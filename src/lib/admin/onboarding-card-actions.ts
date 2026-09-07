"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import { ONBOARDING_CARD_TITLE_MAX_LENGTH } from "@/lib/admin/onboarding-card-settings";
import { generateLessonVoice, setContentVoiceOverride } from "@/lib/admin/voice-generation-actions";
import { createClient } from "@/lib/supabase/server";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Same recovery-from-public-URL approach as content-actions.ts's illustrationPathFromUrl, for the same reason: the onboarding-card bucket has no list/select policy, only insert/update/delete, so the current row's own image_url is the only reliable way to find the file to clean up. */
function onboardingCardPathFromUrl(url: string): string | null {
  const marker = "/object/public/onboarding-card/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

/**
 * The three placement-tier lessons every first-time learner's opening
 * lesson actually is (see OPENING_LESSON_ID in starting-level.ts) — they
 * carry the same "First Steps" title and, since the sentence-content
 * update, the exact same 5 sentences, so their illustration is managed here
 * as one shared image rather than three separate per-lesson uploads on the
 * ordinary content editor.
 */
const OPENING_LESSON_IDS = [
  "onboarding-beginner",
  "onboarding-intermediate",
  "onboarding-advanced",
] as const;

/** Same recovery approach as onboardingCardPathFromUrl, for the shared lesson-illustrations bucket (see content-actions.ts's illustrationPathFromUrl doc comment for why: no list/select policy on that bucket, only insert/update/delete). */
function lessonIllustrationPathFromUrl(url: string): string | null {
  const marker = "/object/public/lesson-illustrations/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

/**
 * Saves the admin-authored headline shown on the get-started flow's third
 * step (see OnboardingIntroCard) — a plain global setting, gated on full
 * admin like typing sound / color settings / fonts, not the narrower
 * editor-or-admin content-authoring tier.
 */
export async function saveOnboardingCardTitle(title: string): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const trimmed = title.trim();
  if (!trimmed) return { error: "Title can't be empty." };
  if (trimmed.length > ONBOARDING_CARD_TITLE_MAX_LENGTH) {
    return { error: `Title must be ${ONBOARDING_CARD_TITLE_MAX_LENGTH} characters or fewer.` };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("onboarding_intro_card")
    .update({ title: trimmed, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return { error: "Couldn't save the title. Please try again." };

  void logAdminAction("onboarding_intro_card.title_updated", "onboarding_intro_card", null);
  revalidatePath("/admin/onboarding-card");
  return { success: "Title saved." };
}

/** Uploads the card's cover image — same shape as uploadLessonImage in content-actions.ts, just keyed to the one singleton row instead of a lesson id. */
export async function uploadOnboardingCardImage(
  formData: FormData,
): Promise<ActionResult & { url?: string }> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file provided." };
  if (!file.type.startsWith("image/")) return { error: "File must be an image." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Image must be smaller than 5MB." };

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("onboarding_intro_card")
    .select("image_url")
    .eq("id", 1)
    .maybeSingle();
  const previousPath = current?.image_url ? onboardingCardPathFromUrl(current.image_url) : null;

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("onboarding-card")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error("[admin] uploadOnboardingCardImage: Storage upload failed", {
      path,
      code: uploadError.name,
      message: uploadError.message,
    });
    return { error: "Couldn't upload the image. Please try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("onboarding-card").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("onboarding_intro_card")
    .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (updateError) {
    console.error("[admin] uploadOnboardingCardImage: row update failed", {
      code: updateError.code,
      message: updateError.message,
    });
    return { error: "Image uploaded but couldn't be saved. Please try again." };
  }

  if (previousPath) {
    const { error: removeError } = await supabase.storage
      .from("onboarding-card")
      .remove([previousPath]);
    if (removeError) {
      console.error("[admin] uploadOnboardingCardImage: cleanup of previous image failed", {
        path: previousPath,
        message: removeError.message,
      });
    }
  }

  void logAdminAction("onboarding_intro_card.image_updated", "onboarding_intro_card", null);
  revalidatePath("/admin/onboarding-card");
  return { success: "Image updated.", url: publicUrl };
}

/** Clears the card's image back to null — the learner-facing step falls back to a plain icon in that case (see OnboardingIntroCard), so removal needs no separate fallback logic. */
export async function removeOnboardingCardImage(): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("onboarding_intro_card")
    .select("image_url")
    .eq("id", 1)
    .maybeSingle();
  const path = current?.image_url ? onboardingCardPathFromUrl(current.image_url) : null;

  if (path) {
    const { error: removeError } = await supabase.storage.from("onboarding-card").remove([path]);
    if (removeError) {
      console.error("[admin] removeOnboardingCardImage: Storage remove failed", {
        path,
        message: removeError.message,
      });
    }
  }

  const { error: updateError } = await supabase
    .from("onboarding_intro_card")
    .update({ image_url: null, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (updateError) return { error: "Couldn't remove the image. Please try again." };

  void logAdminAction("onboarding_intro_card.image_removed", "onboarding_intro_card", null);
  revalidatePath("/admin/onboarding-card");
  return { success: "Image removed." };
}

/**
 * Uploads the illustration shown ON the opening lesson itself (the framed
 * photo/scene beside the sentence, from LessonIllustration) — distinct from
 * uploadOnboardingCardImage above, which is the picture on the get-started
 * flow's third-step cover, before the lesson even starts. One upload here
 * writes the same lesson-illustrations URL to all three OPENING_LESSON_IDS
 * at once, reusing the exact bucket/RLS policies uploadLessonImage in
 * content-actions.ts already has (Milestone 14 migration) — no separate
 * per-difficulty upload needed since the three lessons are one shared
 * opening experience.
 */
export async function uploadOpeningLessonImage(
  formData: FormData,
): Promise<ActionResult & { url?: string }> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file provided." };
  if (!file.type.startsWith("image/")) return { error: "File must be an image." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Image must be smaller than 5MB." };

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("lessons")
    .select("illustration_url")
    .eq("id", OPENING_LESSON_IDS[0])
    .maybeSingle();
  const previousPath = current?.illustration_url
    ? lessonIllustrationPathFromUrl(current.illustration_url)
    : null;

  const ext = file.name.split(".").pop() || "jpg";
  const path = `onboarding/${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("lesson-illustrations")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error("[admin] uploadOpeningLessonImage: Storage upload failed", {
      path,
      code: uploadError.name,
      message: uploadError.message,
    });
    return { error: "Couldn't upload the image. Please try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("lesson-illustrations").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("lessons")
    .update({ illustration_url: publicUrl, updated_at: new Date().toISOString() })
    .in("id", OPENING_LESSON_IDS);
  if (updateError) {
    console.error("[admin] uploadOpeningLessonImage: lessons update failed", {
      code: updateError.code,
      message: updateError.message,
    });
    return { error: "Image uploaded but couldn't be saved. Please try again." };
  }

  if (previousPath) {
    const { error: removeError } = await supabase.storage
      .from("lesson-illustrations")
      .remove([previousPath]);
    if (removeError) {
      console.error("[admin] uploadOpeningLessonImage: cleanup of previous image failed", {
        path: previousPath,
        message: removeError.message,
      });
    }
  }

  void logAdminAction("onboarding_intro_card.lesson_image_updated", "lessons", null, {
    lessonIds: OPENING_LESSON_IDS,
  });
  revalidatePath("/admin/onboarding-card");
  revalidatePath("/admin/content");
  for (const lessonId of OPENING_LESSON_IDS) revalidatePath(`/learn/normal/${lessonId}`);
  return { success: "Image updated.", url: publicUrl };
}

/** Clears the opening lesson's shared illustration back to null on all three OPENING_LESSON_IDS — the learner UI falls back to the built-in SVG scene in that case (see LessonIllustration), so removal needs no separate fallback logic. */
export async function removeOpeningLessonImage(): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("lessons")
    .select("illustration_url")
    .eq("id", OPENING_LESSON_IDS[0])
    .maybeSingle();
  const path = current?.illustration_url
    ? lessonIllustrationPathFromUrl(current.illustration_url)
    : null;

  if (path) {
    const { error: removeError } = await supabase.storage
      .from("lesson-illustrations")
      .remove([path]);
    if (removeError) {
      console.error("[admin] removeOpeningLessonImage: Storage remove failed", {
        path,
        message: removeError.message,
      });
    }
  }

  const { error: updateError } = await supabase
    .from("lessons")
    .update({ illustration_url: null, updated_at: new Date().toISOString() })
    .in("id", OPENING_LESSON_IDS);
  if (updateError) return { error: "Couldn't remove the image. Please try again." };

  void logAdminAction("onboarding_intro_card.lesson_image_removed", "lessons", null, {
    lessonIds: OPENING_LESSON_IDS,
  });
  revalidatePath("/admin/onboarding-card");
  revalidatePath("/admin/content");
  for (const lessonId of OPENING_LESSON_IDS) revalidatePath(`/learn/normal/${lessonId}`);
  return { success: "Image removed." };
}

/**
 * Sets the narration voice for all three OPENING_LESSON_IDS lessons at
 * once, one picker instead of three separate trips to the Story audio
 * status dashboard's per-row pickers. Reuses setContentVoiceOverride
 * (voice-generation-actions.ts) rather than writing lessons.voice_id
 * directly, so this goes through the exact same write every other narration
 * override in the app already does. Picking a voice here does not by
 * itself regenerate any already-cached audio — see generateOpeningLessonVoice
 * below for that, mirroring the dashboard's own "pick, then Generate"
 * two-step shape (VoiceDashboardRow's doc comment explains why: a picked
 * voice with no generation yet must never silently claim existing audio was
 * re-narrated).
 */
export async function setOpeningLessonVoice(voiceId: string | null): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const results = await Promise.all(
    OPENING_LESSON_IDS.map((id) => setContentVoiceOverride("normal", id, voiceId)),
  );
  const failed = results.find((result) => result.error);
  if (failed) return { error: failed.error };

  void logAdminAction("onboarding_intro_card.lesson_voice_updated", "lessons", null, {
    lessonIds: OPENING_LESSON_IDS,
    voiceId,
  });
  revalidatePath("/admin/onboarding-card");
  return { success: voiceId ? "Voice saved." : "Reset to the default voice." };
}

/**
 * Generates (or regenerates) narration audio for all three
 * OPENING_LESSON_IDS lessons using whatever voice_id they currently carry —
 * the second step after setOpeningLessonVoice, same two-step shape as the
 * Story audio status dashboard's own per-row picker + Generate button.
 * Reuses generateLessonVoice, so this is exactly what clicking "Generate"
 * three times on that dashboard would do, just from the one shared control
 * here.
 */
export async function generateOpeningLessonVoice(): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const results = await Promise.all(OPENING_LESSON_IDS.map((id) => generateLessonVoice(id)));
  const failed = results.find((result) => result.error);
  if (failed) return { error: failed.error };

  revalidatePath("/admin/onboarding-card");
  return { success: "Audio generated for all three starting levels." };
}

/**
 * Hand-authored per-word gloss for each of the 5 opening-lesson sentences,
 * one {en, ar} pair per whitespace-separated token of the English text
 * (punctuation stays attached to its word, e.g. "simple" not "simple.") —
 * same shape/convention as the original hand-authored word lists in
 * 20250113000000_word_translations.sql and scripts/insert-new-normal-lessons.ts.
 * This is the ONLY path that ever populates sentences.word_translations
 * (see CurrentWordCard, the typing-time "current word" gloss) — the admin
 * CMS has no editor field for it and the AI translation pipeline only
 * translates an already-populated list into other locales, never invents
 * one — so, like every other lesson's word list before it, this has to be
 * hand-typed rather than collected through a form. Indexed 0-4 to match
 * each lesson's sentence order_index (all three OPENING_LESSON_IDS share
 * the exact same 5 sentences, so one list applies to all three).
 */
const OPENING_LESSON_WORD_TRANSLATIONS: { en: string; ar: string }[][] = [
  [
    { en: "Learning", ar: "تعلّم" },
    { en: "English", ar: "الإنجليزية" },
    { en: "can", ar: "يمكن" },
    { en: "be", ar: "أن يكون" },
    { en: "simple", ar: "بسيطاً" },
  ],
  [
    { en: "You", ar: "أنتَ" },
    { en: "listen,", ar: "تستمع" },
    { en: "you", ar: "أنتَ" },
    { en: "type,", ar: "تكتب" },
    { en: "and", ar: "و" },
    { en: "you", ar: "أنتَ" },
    { en: "learn", ar: "تتعلّم" },
    { en: "one", ar: "واحدة" },
    { en: "sentence", ar: "جملة" },
    { en: "at", ar: "في" },
    { en: "a", ar: "كل" },
    { en: "time", ar: "مرة" },
  ],
  [
    { en: "Make", ar: "ارتكب" },
    { en: "a", ar: "واحد" },
    { en: "mistake,", ar: "خطأ" },
    { en: "try", ar: "حاول" },
    { en: "again,", ar: "مجدداً" },
    { en: "and", ar: "و" },
    { en: "keep", ar: "استمر" },
    { en: "going", ar: "مستمراً" },
  ],
  [
    { en: "With", ar: "مع" },
    { en: "every", ar: "كل" },
    { en: "sentence,", ar: "جملة" },
    { en: "English", ar: "الإنجليزية" },
    { en: "starts", ar: "تبدأ" },
    { en: "to", ar: "أن" },
    { en: "feel", ar: "تشعر" },
    { en: "more", ar: "أكثر" },
    { en: "natural", ar: "طبيعية" },
  ],
  [
    { en: "So", ar: "لذا" },
    { en: "take", ar: "خذ" },
    { en: "your", ar: "لك" },
    { en: "first", ar: "الأولى" },
    { en: "step,", ar: "خطوة" },
    { en: "and", ar: "و" },
    { en: "let", ar: "دع" },
    { en: "your", ar: "لك" },
    { en: "English", ar: "الإنجليزية" },
    { en: "grow", ar: "تنمو" },
    { en: "from", ar: "من" },
    { en: "here", ar: "هنا" },
  ],
];

/**
 * Writes OPENING_LESSON_WORD_TRANSLATIONS onto all 15 opening-lesson
 * sentences (5 sentences × 3 OPENING_LESSON_IDS) — a one-time data fill,
 * not an ongoing setting, so this is a single button rather than a form:
 * see the "Word-by-word translations" card in the onboarding-card page.
 * Safe to run again later (e.g. after a wording tweak) since it always
 * overwrites with the current OPENING_LESSON_WORD_TRANSLATIONS content.
 */
export async function applyOpeningLessonWordTranslations(): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();

  const updates = OPENING_LESSON_IDS.flatMap((lessonId) =>
    OPENING_LESSON_WORD_TRANSLATIONS.map((wordTranslations, index) =>
      supabase
        .from("sentences")
        .update({ word_translations: wordTranslations, updated_at: new Date().toISOString() })
        .eq("id", `${lessonId}-s${index + 1}`),
    ),
  );
  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);
  if (failed) {
    console.error("[admin] applyOpeningLessonWordTranslations: update failed", {
      code: failed.error?.code,
      message: failed.error?.message,
    });
    return { error: "Couldn't save the word translations. Please try again." };
  }

  void logAdminAction("onboarding_intro_card.word_translations_applied", "sentences", null, {
    lessonIds: OPENING_LESSON_IDS,
  });
  revalidatePath("/admin/onboarding-card");
  for (const lessonId of OPENING_LESSON_IDS) revalidatePath(`/learn/normal/${lessonId}`);
  return { success: "Word-by-word translations applied to all three starting levels." };
}
