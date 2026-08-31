// Diagnostic report for the Story Vocabulary feature
// (src/lib/content/story-vocabulary.ts) — CLI/test output only, no admin
// UI. Deliberately separate from scripts/audit-stories.ts (Story QA/
// diversity audit): this reports on vocabulary *selection quality* only,
// nothing about endings, names, or collection diversity. Run with:
//   npx tsx scripts/audit-story-vocabulary.ts
import { storyLessons } from "../src/data/lessons/stories";
import { buildStoryVocabulary } from "../src/lib/content/story-vocabulary";
import { difficultyForLevel } from "../src/lib/levels";

function occurrenceCount(story: (typeof storyLessons)[number], word: string): number {
  const lower = word.toLowerCase();
  let count = 0;
  for (const sentence of story.sentences) {
    for (const token of sentence.en.split(/\s+/)) {
      if (token.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, "").toLowerCase() === lower) count++;
    }
  }
  return count;
}

function titleContainsRelatedWord(title: string, word: string): boolean {
  const lower = word.toLowerCase();
  return title
    .toLowerCase()
    .split(/\s+/)
    .some((t) => {
      const clean = t.replace(/^[^a-z']+|[^a-z']+$/g, "");
      return (
        clean.length >= 4 && (clean === lower || clean.startsWith(lower) || lower.startsWith(clean))
      );
    });
}

console.log(`=== Story Vocabulary selection report (${storyLessons.length} stories) ===\n`);
console.log("Format: Story | Level | Selected words (occurrences, title-related?)\n");

let withVocab = 0;
let withoutVocab = 0;

for (const story of storyLessons) {
  const { vocabulary } = buildStoryVocabulary(story.sentences, story.level, story.title);
  const difficulty = difficultyForLevel(story.level);

  console.log(`${story.id} — "${story.title}" [${difficulty}, level ${story.level}]`);
  if (vocabulary.length === 0) {
    console.log("  (no target vocabulary — this story is missing wordTranslations)");
    withoutVocab++;
    console.log("");
    continue;
  }
  withVocab++;

  for (const item of vocabulary) {
    const count = occurrenceCount(story, item.en);
    const titleRelated = titleContainsRelatedWord(story.title, item.en);
    const notes = [`${count}x in story`, titleRelated ? "relates to title" : null]
      .filter(Boolean)
      .join(", ");
    console.log(`  - ${item.en.padEnd(16)} (${item.ar})  [${notes}]`);
  }
  console.log("");
}

console.log(
  `\n${withVocab} stories produced target vocabulary; ${withoutVocab} produced none (missing wordTranslations).`,
);
