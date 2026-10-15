/**
 * Checks that no lesson is repeated: every authored passage (src/data/passages) is compared
 * with every other passage, with every Daily Lesson and Story in the database (title, premise
 * and lines), with the passages already in the database that are not in the data files (an
 * admin's imports) and with the titles of the library's books. It reports what two pieces of
 * content share — the same title, the same premise, borrowed wording, the same subject, the
 * same question (the rules and their limits are in src/lib/passages/duplicates.ts) — and exits
 * with 1 when anything is found, so it gates the writing of new passages: run it before
 * inserting them.
 *
 * Read-only: it never writes anything.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/check-passage-duplicates.ts
 * Options:
 *   --only=<slug>   report only the findings that involve that passage
 *   --top=<n>       also print the n closest pairs by each measure (to judge the limits)
 */
import { createClient } from "@supabase/supabase-js";

import { PASSAGE_SEEDS } from "../src/data/passages";
import {
  DUPLICATE_LIMITS,
  describeFinding,
  findDuplicates,
  likenessOf,
} from "../src/lib/passages/duplicates";
import { loadLibraryFingerprints, seedFingerprint } from "../src/lib/passages/fingerprints";
import type { Database } from "../src/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (use --env-file=.env.local).",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const only = args.find((arg) => arg.startsWith("--only="))?.slice("--only=".length);
const top =
  Number(args.find((arg) => arg.startsWith("--top="))?.slice("--top=".length) ?? "0") || 0;

const supabase = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const library = await loadLibraryFingerprints(supabase);
  const authored = new Set(PASSAGE_SEEDS.map((seed) => seed.slug));
  const passages = PASSAGE_SEEDS.map(seedFingerprint);
  // A passage already in the database that the data files also hold is the same passage, not a repeat.
  const others = [
    ...library.passages.filter((passage) => !authored.has(passage.id)),
    ...library.others,
  ];

  console.log(
    `${passages.length} passage(s) against each other and against ${others.length} other pieces of content in the library.`,
  );

  if (top > 0) {
    const pairs = passages.flatMap((passage, index) =>
      [...passages.slice(index + 1), ...others].map((other) => ({
        a: passage.label,
        b: other.label,
        likeness: likenessOf(passage, other),
      })),
    );
    const show = (name: string, value: (pair: (typeof pairs)[number]) => number) => {
      console.log(`\nclosest by ${name}:`);
      for (const pair of [...pairs].sort((x, y) => value(y) - value(x)).slice(0, top)) {
        console.log(`  ${value(pair).toFixed(2)}  ${pair.a}  ~  ${pair.b}`);
      }
    };
    show("title", (pair) => pair.likeness.title);
    show("premise", (pair) => pair.likeness.premise);
    show("shared wording (share of the shorter text)", (pair) => pair.likeness.runShare);
    show("subject", (pair) => pair.likeness.subject);
    console.log(`\nlimits: ${JSON.stringify(DUPLICATE_LIMITS)}`);
  }

  const findings = findDuplicates(passages, others).filter(
    (finding) => !only || finding.a.includes(`(${only})`) || finding.b.includes(`(${only})`),
  );
  if (findings.length === 0) {
    console.log("\nNo lesson is repeated.");
    return;
  }
  console.log(`\n${findings.length} repeat(s) found:`);
  for (const finding of findings) console.log(`  - ${describeFinding(finding)}`);
  process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
