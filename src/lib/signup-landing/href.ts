import { safeNextPath } from "@/lib/supabase/safe-redirect";

/**
 * Where a brand-new account lands after signing up from the first-run sign-up page (the
 * signupLanding permission): straight into the next lesson, instead of Home. The path is the lesson
 * player's own (`/learn/normal/<id>`, `/learn/stories/<id>`), and it still goes through the same
 * same-origin guard every `next` parameter goes through, so nothing but one of our own lesson
 * pages can ever come out of this. Null when the id is not a plain lesson id.
 */
export function signupLandingHref(mode: string, lessonId: string): string | null {
  if (mode !== "normal" && mode !== "stories") return null;
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(lessonId)) return null;
  const path = `/learn/${mode}/${lessonId}`;
  return safeNextPath(path) === path ? path : null;
}
