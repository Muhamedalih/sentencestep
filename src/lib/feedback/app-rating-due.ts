import { languageOfContentId } from "@/lib/learn-language";

/**
 * Whether finishing this lesson is the moment for the app's one-time rating card. Lessons are counted
 * per learned language (permission germanTrack), so a learner with an English history who tries German
 * is asked again about German. English: exactly the second lesson completed. German: the second or any
 * later one, so those who finished more before this rule are asked too; the card's own one-time flag
 * (see rating-storage.ts) keeps it to once.
 */
export function isAppRatingDue(
  completions: readonly { lessonId: string }[],
  lessonId: string,
): boolean {
  const language = languageOfContentId(lessonId);
  const count = completions.filter((c) => languageOfContentId(c.lessonId) === language).length;
  return language === "en" ? count === 2 : count >= 2;
}
