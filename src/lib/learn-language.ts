/**
 * The language a learner learns (permission germanTrack). English is the original; German rows live
 * beside it in the same tables, their ids starting with "de-" and their `lang` column set to 'de'.
 * The `en` columns keep holding the text the learner types or reads, whatever the language.
 */
export type TargetLanguage = "en" | "de";

export const TARGET_LANGUAGES: readonly TargetLanguage[] = ["en", "de"];

export const DEFAULT_TARGET_LANGUAGE: TargetLanguage = "en";

/** The prefix every German content id carries ("de-normal-1", "de-story-3-s2"). */
export const GERMAN_ID_PREFIX = "de-";

export function isTargetLanguage(value: string | null | undefined): value is TargetLanguage {
  return value === "en" || value === "de";
}

/** The language of a content id: German when it starts with "de-", English otherwise. */
export function languageOfContentId(id: string): TargetLanguage {
  return id.startsWith(GERMAN_ID_PREFIX) ? "de" : "en";
}

/** The BCP-47 tag the browser voice needs to read this language's text. */
export function speechLangFor(language: TargetLanguage): string {
  return language === "de" ? "de-DE" : "en-US";
}

/** Whether typing should accept the plain letter for ä ö ü ß (see german-typing.ts). */
export function foldsDiacritics(language: TargetLanguage): boolean {
  return language === "de";
}
