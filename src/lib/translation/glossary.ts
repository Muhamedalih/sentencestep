import type { GlossaryTerm } from "@/lib/translation/provider";

/**
 * A minimal, hand-maintained term list injected into every generation
 * prompt (see anthropic-provider.ts) — not a translation-memory system.
 * Deliberately a static array, not a database table, per the Phase 9
 * decision: this list is short and changes rarely enough that a config
 * file is simpler than admin CRUD for it right now. Revisit as a
 * `glossary_terms` table only if it grows large enough, or admins need to
 * edit it without a deploy, that a static file becomes the actual
 * bottleneck — neither is true yet.
 */
export const GLOSSARY: GlossaryTerm[] = [
  {
    term: "SentenceStep",
    rule: "preserve",
    note: "The product's own name — never translate or transliterate it.",
  },
  // Recurring character names confirmed directly in the seeded story
  // content (src/data/lessons/stories.ts) — proper names, never translated
  // as if they were common nouns, but may be transliterated into the
  // target script; "consistent" means whichever transliteration is chosen
  // must be used the same way every time the name appears.
  { term: "Layla", rule: "consistent" },
  { term: "Noor", rule: "consistent" },
  { term: "Ali", rule: "consistent" },
  { term: "Yusuf", rule: "consistent" },
];
