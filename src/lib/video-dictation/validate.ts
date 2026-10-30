import type { VideoLesson } from "./types";
import { bareWord, splitWords } from "./words";

/**
 * Everything that must hold for a prepared video to be safe to show: timings that fit inside the clip
 * and never overlap, and a meaning for every word, in the order the typing screen counts its words
 * (a gloss shifted by one word would label every word after it wrongly). Returns the problems found;
 * an empty list means the video is sound. Run by the content test, so a bad file cannot be published.
 */
export function validateVideoLesson(lesson: VideoLesson): string[] {
  const errors: string[] = [];
  const fail = (message: string) => errors.push(`${lesson.id}: ${message}`);

  if (!/^[A-Za-z0-9_-]{11}$/.test(lesson.youtubeId)) fail("youtubeId must be 11 characters");
  if (!/^[a-z0-9-]+$/.test(lesson.id)) fail("id must be a lower-case slug");
  if (lesson.clipEndSeconds <= lesson.clipStartSeconds) fail("the clip must end after it starts");
  if (lesson.clipStartSeconds < 0) fail("the clip cannot start before 0");
  if (lesson.clipEndSeconds > lesson.durationSeconds + 0.5) fail("the clip runs past the video");
  if (lesson.sentences.length === 0) fail("a video needs sentences");

  const ids = new Set<string>();
  let previousEnd = lesson.clipStartSeconds;
  lesson.sentences.forEach((sentence, index) => {
    const label = `sentence ${index + 1}`;
    if (ids.has(sentence.id)) fail(`${label}: the id ${sentence.id} is used twice`);
    ids.add(sentence.id);
    if (sentence.endSeconds <= sentence.startSeconds) fail(`${label}: it must end after it starts`);
    if (sentence.startSeconds < lesson.clipStartSeconds - 0.01)
      fail(`${label}: it starts before the clip`);
    if (sentence.endSeconds > lesson.clipEndSeconds + 0.01)
      fail(`${label}: it ends after the clip`);
    if (sentence.startSeconds < previousEnd - 0.05)
      fail(`${label}: it overlaps the sentence before`);
    previousEnd = sentence.endSeconds;

    const words = splitWords(sentence.en);
    if (words.length === 0) fail(`${label}: no English text`);
    if (!sentence.ar.trim()) fail(`${label}: no Arabic translation`);
    if (sentence.wordTranslations.length !== words.length) {
      fail(`${label}: ${sentence.wordTranslations.length} meanings for ${words.length} words`);
      return;
    }
    words.forEach((word, position) => {
      const gloss = sentence.wordTranslations[position];
      if (!gloss) return;
      if (bareWord(gloss.en) !== bareWord(word))
        fail(`${label}: meaning ${position + 1} is for "${gloss.en}", the word is "${word}"`);
      if (!gloss.ar.trim()) fail(`${label}: no meaning for "${word}"`);
    });
  });
  return errors;
}
