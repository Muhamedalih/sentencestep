// Runs the Stories content-quality audit (src/lib/admin/stories-quality.ts)
// against the current story library and prints a human-readable report.
// Advisory only — see that module's doc comment. Run with:
//   npx tsx scripts/audit-stories.ts
import { storyLessons } from "../src/data/lessons/stories";
import { auditCollectionDiversity, auditStory } from "../src/lib/admin/stories-quality";

const collection = auditCollectionDiversity(storyLessons);

console.log(`=== Stories collection diversity audit (${collection.totalStories} stories) ===\n`);

console.log(`Overused character names (threshold reached):`);
if (collection.overusedNames.length === 0) console.log("  none");
for (const { name, count } of collection.overusedNames) console.log(`  ${name}: ${count} stories`);

console.log(`\nRepeated verbatim openings (2+ stories):`);
if (collection.repeatedOpenings.length === 0) console.log("  none");
for (const { opening, lessonIds } of collection.repeatedOpenings) {
  console.log(`  "${opening}...": ${lessonIds.join(", ")}`);
}

console.log(
  `\nStories below the minimum sentence floor: ${collection.storiesBelowMinLength.join(", ") || "none"}`,
);
console.log(
  `Stories with a weak/generic ending: ${collection.storiesWithWeakEndings.join(", ") || "none"}`,
);
console.log(
  `Stories with a duplicate sentence: ${collection.storiesWithDuplicateSentences.join(", ") || "none"}`,
);

console.log(`\n=== Per-story flags (only stories with at least one flag) ===\n`);
let flaggedCount = 0;
for (const lesson of storyLessons) {
  const audit = auditStory(lesson);
  const flags: string[] = [];
  if (audit.hasWeakEnding) flags.push(`weak ending: "${audit.lastSentence}"`);
  if (audit.tellingSentences.length > 0)
    flags.push(`telling: ${audit.tellingSentences.length} sentence(s)`);
  if (audit.duplicateSentences.length > 0)
    flags.push(`duplicate sentences: ${audit.duplicateSentences.length}`);
  if (audit.vocabularyCount === 0) flags.push(`no derivable vocabulary (missing wordTranslations)`);

  if (flags.length > 0) {
    flaggedCount++;
    console.log(`${lesson.id} — "${lesson.title}"`);
    for (const f of flags) console.log(`    - ${f}`);
  }
}
console.log(`\n${flaggedCount} of ${storyLessons.length} stories have at least one advisory flag.`);
