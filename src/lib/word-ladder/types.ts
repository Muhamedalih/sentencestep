import type { WordPos } from "@/types/word-lists";

/** One word of a topic as the ladder shows it: everything a round needs, worked out once so the screens only draw. */
export interface LadderWord {
  id: string;
  /** The word itself, lowercase: what is typed. */
  word: string;
  /** The short meaning in the learner's support language, and the line that explains it when there is one. */
  term: string;
  definition?: string;
  /** The context sentence with the word filled in (its first letter capital when it opens the sentence). */
  sentence: string;
  /** How the word sounds, bare IPA ("ænt"), and what kind of word it is. */
  ipa?: string | null;
  pos?: WordPos | null;
  /** Four terms for the meaning step, the right one among them (fewer when the topic has too few). */
  meaningOptions: string[];
  /** Four spellings for the listening step, the right one among them (fewer when no clean near miss exists). */
  spellingOptions: string[];
  /** Pre-resolved sound, when already known (see VocabularyWord.audioUrl). */
  audioUrl?: string | null;
}
