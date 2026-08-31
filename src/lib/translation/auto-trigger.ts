import { after } from "next/server";

import { isSupportLocale } from "@/lib/i18n/locales";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { generateLessonTranslationDraft } from "@/lib/translation/generate";

/**
 * Fires best-effort AI translation generation for a lesson across every
 * enabled locale, deferred until after the triggering request's response
 * has already been sent (Next.js `after()`, confirmed available and stable
 * in the installed Next 15.5.23) — saveLesson's "Lesson saved" response is
 * never delayed by this.
 *
 * This is explicitly best-effort, not a durable job: `after()` runs inside
 * the same serverless invocation's lifetime, so if the process is recycled
 * or this throws before finishing, that attempt is simply lost — there is
 * no queue behind it, and nothing here should be read as claiming
 * otherwise. Recovery for lost or failed attempts is the scheduled sweep
 * endpoint (src/app/api/cron/translation-sweep/route.ts), a separate,
 * independently-triggered mechanism — not something this function does or
 * guarantees.
 *
 * Uses a service-role client rather than the triggering admin's session
 * client: this callback runs after the response, where the original
 * request's cookie/session context can no longer be relied on. The
 * caller (saveLesson, already requireAdmin()-gated before this is ever
 * invoked) is the authorization boundary — this function performs no
 * authorization check of its own, matching generateLessonTranslationDraft's
 * own "the caller decides" contract.
 *
 * Every enabled locale is targeted uniformly, including Arabic and
 * Spanish — not redundant, because generateLessonTranslationDraft already
 * skips any field whose current status is 'approved' (which Arabic, and
 * any Spanish field the admin just typed, always is immediately after
 * saveLesson) and never calls the AI provider at all when nothing is
 * eligible. A Spanish field the admin left blank (it's optional) is
 * exactly the case this usefully drafts. Locales are processed one at a
 * time, not in parallel, to stay gentle on provider rate limits — real
 * cost here is close to zero today since only ar/es are enabled and both
 * skip trivially; this matters once more locales exist.
 */
export function triggerAutomaticTranslation(lessonId: string): void {
  after(async () => {
    let supabase: ReturnType<typeof createServiceRoleClient>;
    try {
      supabase = createServiceRoleClient();
    } catch (err) {
      // Expected, not an error worth alarming over, until a service-role
      // key is actually configured for this environment (see
      // createServiceRoleClient's own doc comment) — auto-generation simply
      // doesn't run; the manual admin action and the sweep endpoint remain
      // the ways to generate translations either way.
      console.info("[translation] auto-trigger skipped — service-role client unavailable", {
        lessonId,
        reason: err instanceof Error ? err.message : String(err),
      });
      return;
    }

    const { data: locales, error } = await supabase
      .from("locales")
      .select("code")
      .eq("enabled", true);
    if (error) {
      console.error("[translation] auto-trigger: couldn't read enabled locales", {
        lessonId,
        error,
      });
      return;
    }

    for (const { code } of locales ?? []) {
      // A locale can exist in the database (Phase 6/7 onboarding) before
      // SupportLocale's compile-time union is widened to recognize it —
      // nothing this pipeline can safely act on until code catches up.
      if (!isSupportLocale(code)) continue;
      try {
        const outcome = await generateLessonTranslationDraft(supabase, lessonId, code);
        if (outcome.error) {
          console.error("[translation] auto-trigger generation issue", {
            lessonId,
            locale: code,
            error: outcome.error,
          });
        }
      } catch (err) {
        console.error("[translation] auto-trigger threw", { lessonId, locale: code, err });
      }
    }
  });
}
