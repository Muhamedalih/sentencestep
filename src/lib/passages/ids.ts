/**
 * The ids a passage's rows are stored under — one place, so the insert script,
 * the audio script and the tests can never disagree about them. Every id is a
 * readable slug (passages use text primary keys, like lessons and books), which
 * keeps a row recognisable in the admin and makes a re-run of the insert script
 * a no-op instead of a duplicate.
 */

/** The passage id IS its slug, and its URL: /learn/passages/<slug>. */
export function passageIdFor(slug: string): string {
  return slug;
}

/** Parts are 1-based in ids ("…-p1") so they read the way a learner counts them. */
export function sectionIdFor(slug: string, sectionNumber: number): string {
  return `${slug}-p${sectionNumber}`;
}

export function sentenceIdFor(slug: string, sectionNumber: number, lineNumber: number): string {
  return `${slug}-p${sectionNumber}-l${lineNumber}`;
}

export function questionIdFor(slug: string, sectionNumber: number, questionNumber = 1): string {
  return `${slug}-p${sectionNumber}-q${questionNumber}`;
}

/** The Word Lists group made from a passage's words. */
export function wordGroupIdFor(slug: string): string {
  return `passage-${slug}`;
}

export function wordIdFor(slug: string, word: string): string {
  return `${wordGroupIdFor(slug)}-${word.trim().toLowerCase().replace(/\s+/g, "-")}`;
}

/** Whether a Word Lists group is the word lesson of a passage (its id is `passage-<slug>`, see wordGroupIdFor). */
export function isPassageWordGroupId(id: string): boolean {
  return id.startsWith("passage-");
}
