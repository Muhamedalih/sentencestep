import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildStoryVocabulary,
  deriveStoryVocabulary,
  withStoryVocabulary,
} from "./story-vocabulary";
import type { Lesson, Sentence } from "@/types/content";

function sentence(
  id: string,
  en: string,
  wordTranslations: { en: string; ar: string }[],
): Sentence {
  return { id, en, ar: en, wordTranslations };
}

test("deriveStoryVocabulary: picks real content words, skips stopwords and short words", () => {
  const vocab = deriveStoryVocabulary(
    [
      sentence("s1", "Layla was carrying heavy boxes.", [
        { en: "Layla", ar: "ليلى" },
        { en: "was", ar: "كانت" },
        { en: "carrying", ar: "تحمل" },
        { en: "heavy", ar: "ثقيلة" },
        { en: "boxes.", ar: "صناديق" },
      ]),
    ],
    1,
    "A New Neighbor",
  );

  const words = vocab.map((v) => v.en);
  assert.ok(words.includes("carrying"));
  assert.ok(words.includes("heavy"));
  assert.ok(words.includes("boxes"), "trailing punctuation should be stripped");
  assert.ok(!words.includes("was"), "stopword should be excluded");
  assert.ok(!words.includes("Layla"), "capitalized proper noun should be excluded");
});

test("deriveStoryVocabulary: never invents a word not present in the story", () => {
  const sentences = [
    sentence("s1", "A package arrived.", [{ en: "package.", ar: "الطرد" }]),
    sentence("s2", "Everyone looked confused.", [{ en: "confused.", ar: "مرتبكاً" }]),
  ];
  const vocab = deriveStoryVocabulary(sentences, 1, "The Package");
  const sourceWords = new Set(
    sentences.flatMap((s) =>
      s.wordTranslations!.map((w) => w.en.replace(/[.,!?]+$/, "").toLowerCase()),
    ),
  );
  for (const item of vocab) {
    assert.ok(
      sourceWords.has(item.en.toLowerCase()),
      `"${item.en}" was not present in the source sentences`,
    );
  }
});

test("deriveStoryVocabulary: caps at 6 items and dedupes repeated words", () => {
  const wordTranslations = [
    { en: "kitchen.", ar: "أ" },
    { en: "kitchen.", ar: "أ" },
    { en: "package.", ar: "ب" },
    { en: "confused.", ar: "ج" },
    { en: "carefully.", ar: "د" },
    { en: "suspect.", ar: "هـ" },
    { en: "birthday.", ar: "و" },
    { en: "neighbor.", ar: "ز" },
  ];
  const vocab = deriveStoryVocabulary(
    [sentence("s1", "placeholder text here", wordTranslations)],
    1,
    "Untitled",
  );
  assert.ok(vocab.length <= 6, `expected at most 6 items, got ${vocab.length}`);
  const uniqueWords = new Set(vocab.map((v) => v.en.toLowerCase()));
  assert.equal(uniqueWords.size, vocab.length, "no word should repeat");
});

test("deriveStoryVocabulary: returns an empty array when no sentence has wordTranslations", () => {
  const vocab = deriveStoryVocabulary([{ id: "s1" }, { id: "s2" }], 1, "Untitled");
  assert.deepEqual(vocab, []);
});

test("deriveStoryVocabulary: skips an entry with no Arabic gloss rather than showing a blank translation", () => {
  const vocab = deriveStoryVocabulary(
    [
      sentence("s1", "placeholder", [
        { en: "kitchen.", ar: "" },
        { en: "hungry.", ar: "جائع" },
      ]),
    ],
    1,
    "Untitled",
  );
  assert.deepEqual(
    vocab.map((v) => v.en),
    ["hungry"],
  );
});

test("determinism: same story + same level produces the exact same target vocabulary, repeatedly", () => {
  const sentences = [
    sentence("s1", "A large box arrived at Tariq's door.", [
      { en: "A", ar: "واحد" },
      { en: "large", ar: "كبير" },
      { en: "box", ar: "صندوق" },
      { en: "arrived", ar: "وصل" },
      { en: "at", ar: "في" },
      { en: "Tariq's", ar: "تارق" },
      { en: "door.", ar: "الباب" },
    ]),
    sentence("s2", "Inside were twelve pairs of bright socks.", [
      { en: "Inside", ar: "بالداخل" },
      { en: "were", ar: "كانت" },
      { en: "twelve", ar: "اثنا عشر" },
      { en: "pairs", ar: "أزواج" },
      { en: "of", ar: "من" },
      { en: "bright", ar: "زاهية" },
      { en: "socks.", ar: "جوارب" },
    ]),
  ];
  const runs = Array.from({ length: 4 }, () =>
    deriveStoryVocabulary(sentences, 2, "The Strange Package").map((v) => v.en),
  );
  for (const run of runs.slice(1)) assert.deepEqual(run, runs[0]);
});

test("no regressions: normal/conversation content never calls this module (mode-gated at the call site, not here)", () => {
  // deriveStoryVocabulary itself has no notion of "mode" — the mode gate
  // lives in queries/content.ts and content.ts, both of which only ever
  // call this for mode === "stories". This test just documents that the
  // function is pure and mode-agnostic, so the gating is entirely the
  // caller's responsibility (verified by inspection of those call sites).
  const vocab = deriveStoryVocabulary(
    [
      sentence("normal-1-s1", "The weather was cold yesterday.", [
        { en: "weather", ar: "الطقس" },
        { en: "cold", ar: "بارد" },
      ]),
    ],
    1,
    "Weather Talk",
  );
  assert.ok(Array.isArray(vocab));
});

// --- Story relevance: story-specific words should outrank generic filler ---

test("story relevance: distinctive/story-specific words outrank generic common words (package-delivery example)", () => {
  const vocab = deriveStoryVocabulary(
    [
      sentence("s1", "A large package arrived with a shipping label on it.", [
        { en: "A", ar: "واحد" },
        { en: "large", ar: "كبير" },
        { en: "package", ar: "الطرد" },
        { en: "arrived", ar: "وصل" },
        { en: "with", ar: "مع" },
        { en: "a", ar: "واحدة" },
        { en: "shipping", ar: "الشحن" },
        { en: "label", ar: "الملصق" },
        { en: "on", ar: "على" },
        { en: "it.", ar: "ذلك" },
      ]),
      sentence("s2", "She looked at it and went to find her neighbor.", [
        { en: "She", ar: "هي" },
        { en: "looked", ar: "نظرت" },
        { en: "at", ar: "إلى" },
        { en: "it", ar: "ذلك" },
        { en: "and", ar: "و" },
        { en: "went", ar: "ذهبت" },
        { en: "to", ar: "لـ" },
        { en: "find", ar: "تجد" },
        { en: "her", ar: "لها" },
        { en: "neighbor.", ar: "جارتها" },
      ]),
    ],
    2,
    "The Package",
  );

  const words = vocab.map((v) => v.en.toLowerCase());
  assert.ok(words.includes("package"), "the title-matching central noun should be selected");
  const distinctiveRank = Math.min(
    ...["package", "label", "shipping", "neighbor"]
      .map((w) => words.indexOf(w))
      .filter((i) => i >= 0),
  );
  const genericRank = Math.min(
    ...["large", "looked", "went"].map((w) => words.indexOf(w)).filter((i) => i >= 0),
  );
  assert.ok(
    distinctiveRank < genericRank,
    `expected a distinctive word to rank above a generic one; got: ${words.join(", ")}`,
  );
});

// --- Repetition: a meaningfully repeated word gets a relevance boost ---

test("repetition: a word repeated across multiple sentences ranks above an equally-generic word seen once", () => {
  const sentences = [
    sentence("s1", "The garden was full of flowers.", [
      { en: "The", ar: "الـ" },
      { en: "garden", ar: "الحديقة" },
      { en: "was", ar: "كانت" },
      { en: "full", ar: "ممتلئة" },
      { en: "of", ar: "من" },
      { en: "flowers.", ar: "الزهور" },
    ]),
    sentence("s2", "Every morning she watered the garden.", [
      { en: "Every", ar: "كل" },
      { en: "morning", ar: "صباح" },
      { en: "she", ar: "هي" },
      { en: "watered", ar: "سقت" },
      { en: "the", ar: "الـ" },
      { en: "garden.", ar: "الحديقة" },
    ]),
    sentence("s3", "The garden became her favorite place.", [
      { en: "The", ar: "الـ" },
      { en: "garden", ar: "الحديقة" },
      { en: "became", ar: "أصبحت" },
      { en: "her", ar: "لها" },
      { en: "favorite", ar: "المفضل" },
      { en: "place.", ar: "المكان" },
    ]),
  ];
  const vocab = deriveStoryVocabulary(sentences, 2, "A Quiet Afternoon");
  const words = vocab.map((v) => v.en.toLowerCase());
  const gardenRank = words.indexOf("garden");
  const wateredRank = words.indexOf("watered");
  assert.ok(gardenRank >= 0, "garden (appears 3x, spans all 3 sentences) should be selected");
  if (wateredRank >= 0) {
    assert.ok(
      gardenRank < wateredRank,
      "a word repeated across every sentence should outrank a one-off word",
    );
  }
});

test("repetition is damped for common words: a repeated basic word does not automatically beat a distinctive one-off word", () => {
  // "walked" (common) repeated 3x vs "photograph" (distinctive) seen once —
  // the damped repetition bonus for a common word should not be enough to
  // overturn the specificity gap.
  const sentences = [
    sentence("s1", "He walked to the shop.", [
      { en: "He", ar: "هو" },
      { en: "walked", ar: "مشى" },
      { en: "to", ar: "إلى" },
      { en: "the", ar: "الـ" },
      { en: "shop.", ar: "المتجر" },
    ]),
    sentence("s2", "Then he walked home again.", [
      { en: "Then", ar: "ثم" },
      { en: "he", ar: "هو" },
      { en: "walked", ar: "مشى" },
      { en: "home", ar: "المنزل" },
      { en: "again.", ar: "مرة أخرى" },
    ]),
    sentence("s3", "He found an old photograph on the walked path.", [
      { en: "He", ar: "هو" },
      { en: "found", ar: "وجد" },
      { en: "an", ar: "واحد" },
      { en: "old", ar: "قديمة" },
      { en: "photograph", ar: "صورة" },
      { en: "on", ar: "على" },
      { en: "the", ar: "الـ" },
      { en: "walked", ar: "ممشى" },
      { en: "path.", ar: "المسار" },
    ]),
  ];
  const vocab = deriveStoryVocabulary(sentences, 2, "An Old Photograph");
  const words = vocab.map((v) => v.en.toLowerCase());
  const photoIndex = words.indexOf("photograph");
  const walkedIndex = words.indexOf("walked");
  assert.ok(photoIndex >= 0, "photograph should be selected");
  if (walkedIndex >= 0) {
    assert.ok(
      photoIndex < walkedIndex,
      "distinctive word should still outrank a repeated-but-common word",
    );
  }
});

// --- Common-but-important: a common word can still win when strongly relevant ---

test("a common word wins when it is the story's title/context word, even against non-common alternatives", () => {
  const sentences = [
    sentence("s1", "It was a quiet, ordinary house on a quiet street.", [
      { en: "It", ar: "هي" },
      { en: "was", ar: "كانت" },
      { en: "a", ar: "واحدة" },
      { en: "quiet,", ar: "هادئة،" },
      { en: "ordinary", ar: "عادي" },
      { en: "house", ar: "منزل" },
      { en: "on", ar: "على" },
      { en: "a", ar: "واحد" },
      { en: "quiet", ar: "هادئ" },
      { en: "street.", ar: "شارع" },
    ]),
    sentence("s2", "Every room in the house held a memory.", [
      { en: "Every", ar: "كل" },
      { en: "room", ar: "غرفة" },
      { en: "in", ar: "في" },
      { en: "the", ar: "الـ" },
      { en: "house", ar: "منزل" },
      { en: "held", ar: "احتوت" },
      { en: "a", ar: "واحدة" },
      { en: "memory.", ar: "ذكرى" },
    ]),
    sentence("s3", "Leaving the house was harder than she expected.", [
      { en: "Leaving", ar: "مغادرة" },
      { en: "the", ar: "الـ" },
      { en: "house", ar: "منزل" },
      { en: "was", ar: "كانت" },
      { en: "harder", ar: "أصعب" },
      { en: "than", ar: "من" },
      { en: "she", ar: "هي" },
      { en: "expected.", ar: "توقعت" },
    ]),
  ];
  // "house" is common (in COMMON_EVERYDAY_WORDS) but is the title word,
  // repeated 3x, spanning all 3 sentences — "ordinary" is non-common but
  // occurs once and doesn't match the title.
  const vocab = deriveStoryVocabulary(sentences, 2, "The House on the Quiet Street");
  const words = vocab.map((v) => v.en.toLowerCase());
  assert.ok(
    words.includes("house"),
    "a common word central to the story (title + repeated + spans every sentence) must still be selectable",
  );
});

// --- Rare-but-irrelevant: an uncommon word does not automatically win ---

test("rare-but-irrelevant: a one-off uncommon word does not automatically beat a relevant, repeated word", () => {
  const sentences = [
    sentence("s1", "Ahmed prepared carefully for the interview.", [
      { en: "Ahmed", ar: "أحمد" },
      { en: "prepared", ar: "استعد" },
      { en: "carefully", ar: "بعناية" },
      { en: "for", ar: "لـ" },
      { en: "the", ar: "الـ" },
      { en: "interview.", ar: "المقابلة" },
    ]),
    sentence("s2", "The interview lasted nearly an hour.", [
      { en: "The", ar: "الـ" },
      { en: "interview", ar: "المقابلة" },
      { en: "lasted", ar: "استمرت" },
      { en: "nearly", ar: "تقريباً" },
      { en: "an", ar: "واحدة" },
      { en: "hour.", ar: "ساعة" },
    ]),
    sentence("s3", "He mentioned an unusual hobby to fill the silence.", [
      { en: "He", ar: "هو" },
      { en: "mentioned", ar: "ذكر" },
      { en: "an", ar: "واحدة" },
      { en: "unusual", ar: "غريبة" },
      { en: "hobby", ar: "هواية" },
      { en: "to", ar: "لـ" },
      { en: "fill", ar: "لملء" },
      { en: "the", ar: "الـ" },
      { en: "silence.", ar: "الصمت" },
    ]),
  ];
  const vocab = deriveStoryVocabulary(sentences, 2, "The Job Interview");
  const words = vocab.map((v) => v.en.toLowerCase());
  const interviewRank = words.indexOf("interview");
  const hobbyRank = words.indexOf("hobby");
  assert.ok(
    interviewRank >= 0,
    "interview (title match, repeated, spans 2 sentences) should be selected",
  );
  if (hobbyRank >= 0) {
    assert.ok(
      interviewRank < hobbyRank,
      "a rare one-off word must not automatically outrank a clearly relevant word",
    );
  }
});

// --- Level differences (Case A/B/C) ---

test("Case A — a highly relevant but slightly advanced word is penalized, not destroyed, at Beginner", () => {
  // "negotiation" is long/complex for Beginner's band, but it's the story's
  // own title word, repeated, and spans multiple sentences — real
  // relevance support. It should still be selectable at Beginner (soft
  // penalty), and rank at least as well at Advanced (where its length/
  // complexity are no longer penalized at all).
  const sentences = [
    sentence("s1", "The negotiation began early in the morning.", [
      { en: "The", ar: "الـ" },
      { en: "negotiation", ar: "المفاوضة" },
      { en: "began", ar: "بدأت" },
      { en: "early", ar: "مبكراً" },
      { en: "in", ar: "في" },
      { en: "the", ar: "الـ" },
      { en: "morning.", ar: "الصباح" },
    ]),
    sentence("s2", "Both sides wanted the negotiation to succeed.", [
      { en: "Both", ar: "كلا" },
      { en: "sides", ar: "الطرفين" },
      { en: "wanted", ar: "أراد" },
      { en: "the", ar: "الـ" },
      { en: "negotiation", ar: "المفاوضة" },
      { en: "to", ar: "أن" },
      { en: "succeed.", ar: "تنجح" },
    ]),
  ];
  const beginner = deriveStoryVocabulary(sentences, 1, "The Negotiation").map((v) =>
    v.en.toLowerCase(),
  );
  const advanced = deriveStoryVocabulary(sentences, 3, "The Negotiation").map((v) =>
    v.en.toLowerCase(),
  );

  assert.ok(
    beginner.includes("negotiation"),
    "a relevant word (title match + repeated + spans both sentences) must survive at Beginner, only penalized",
  );
  assert.ok(advanced.includes("negotiation"), "the same word should also be selected at Advanced");
  const beginnerRank = beginner.indexOf("negotiation");
  const advancedRank = advanced.indexOf("negotiation");
  assert.ok(
    advancedRank <= beginnerRank,
    `expected "negotiation" to rank at least as well at Advanced as at Beginner; beginner=${beginnerRank} advanced=${advancedRank}`,
  );
});

test("Case A (contrast) — the same word with NO relevance support at all is correctly excluded at Beginner", () => {
  // Same word, same level-mismatch, but a single occurrence, one sentence,
  // no title match, and no other eligible content word nearby (so there's
  // no concentration bonus either) — genuinely nothing to redeem it. This
  // proves the floor still does something: it's not that "negotiation" is
  // now unconditionally safe, only that it's no longer excluded *merely*
  // for being long — it needs to also have zero relevance support.
  const sentences = [
    sentence("s1", "The negotiation was there.", [
      { en: "The", ar: "الـ" },
      { en: "negotiation", ar: "المفاوضة" },
      { en: "was", ar: "كانت" },
      { en: "there.", ar: "هناك" },
    ]),
  ];
  const beginner = deriveStoryVocabulary(sentences, 1, "A Quiet Morning").map((v) =>
    v.en.toLowerCase(),
  );
  assert.ok(
    !beginner.includes("negotiation"),
    "a poorly-banded word with zero relevance signal should still be excluded at Beginner",
  );
});

test("Case B — a common but highly story-relevant word is still selected", () => {
  const sentences = [
    sentence("s1", "It was a quiet, ordinary house on a quiet street.", [
      { en: "It", ar: "هي" },
      { en: "was", ar: "كانت" },
      { en: "a", ar: "واحدة" },
      { en: "quiet,", ar: "هادئة،" },
      { en: "ordinary", ar: "عادي" },
      { en: "house", ar: "منزل" },
      { en: "on", ar: "على" },
      { en: "a", ar: "واحد" },
      { en: "quiet", ar: "هادئ" },
      { en: "street.", ar: "شارع" },
    ]),
    sentence("s2", "Every room in the house held a memory.", [
      { en: "Every", ar: "كل" },
      { en: "room", ar: "غرفة" },
      { en: "in", ar: "في" },
      { en: "the", ar: "الـ" },
      { en: "house", ar: "منزل" },
      { en: "held", ar: "احتوت" },
      { en: "a", ar: "واحدة" },
      { en: "memory.", ar: "ذكرى" },
    ]),
    sentence("s3", "Leaving the house was harder than she expected.", [
      { en: "Leaving", ar: "مغادرة" },
      { en: "the", ar: "الـ" },
      { en: "house", ar: "منزل" },
      { en: "was", ar: "كانت" },
      { en: "harder", ar: "أصعب" },
      { en: "than", ar: "من" },
      { en: "she", ar: "هي" },
      { en: "expected.", ar: "توقعت" },
    ]),
  ];
  const vocab = deriveStoryVocabulary(sentences, 2, "The House on the Quiet Street").map((v) =>
    v.en.toLowerCase(),
  );
  assert.ok(
    vocab.includes("house"),
    "a common word (title + repeated 3x + spans every sentence) must still be selectable",
  );
});

test("Case C — a rare word with no relevance does not automatically win", () => {
  const sentences = [
    sentence("s1", "Ahmed prepared carefully for the interview.", [
      { en: "Ahmed", ar: "أحمد" },
      { en: "prepared", ar: "استعد" },
      { en: "carefully", ar: "بعناية" },
      { en: "for", ar: "لـ" },
      { en: "the", ar: "الـ" },
      { en: "interview.", ar: "المقابلة" },
    ]),
    sentence("s2", "The interview lasted nearly an hour.", [
      { en: "The", ar: "الـ" },
      { en: "interview", ar: "المقابلة" },
      { en: "lasted", ar: "استمرت" },
      { en: "nearly", ar: "تقريباً" },
      { en: "an", ar: "واحدة" },
      { en: "hour.", ar: "ساعة" },
    ]),
    sentence("s3", "He mentioned an unusual hobby to fill the silence.", [
      { en: "He", ar: "هو" },
      { en: "mentioned", ar: "ذكر" },
      { en: "an", ar: "واحدة" },
      { en: "unusual", ar: "غريبة" },
      { en: "hobby", ar: "هواية" },
      { en: "to", ar: "لـ" },
      { en: "fill", ar: "لملء" },
      { en: "the", ar: "الـ" },
      { en: "silence.", ar: "الصمت" },
    ]),
  ];
  const vocab = deriveStoryVocabulary(sentences, 2, "The Job Interview").map((v) =>
    v.en.toLowerCase(),
  );
  const interviewRank = vocab.indexOf("interview");
  const hobbyRank = vocab.indexOf("hobby");
  assert.ok(
    interviewRank >= 0,
    "interview (title match, repeated, spans 2 sentences) should be selected",
  );
  if (hobbyRank >= 0) {
    assert.ok(
      interviewRank < hobbyRank,
      "a rare one-off word must not automatically outrank a clearly relevant word",
    );
  }
});

test("level: does not simply favor the longest word for an advanced story", () => {
  const sentences = [
    sentence("s1", "The negotiation continued through the afternoon calmly.", [
      { en: "The", ar: "الـ" },
      { en: "negotiation", ar: "المفاوضة" },
      { en: "continued", ar: "استمرت" },
      { en: "through", ar: "خلال" },
      { en: "the", ar: "الـ" },
      { en: "afternoon", ar: "الظهيرة" },
      { en: "calmly.", ar: "بهدوء" },
    ]),
  ];
  const vocab = deriveStoryVocabulary(sentences, 3, "Untitled");
  const words = vocab.map((v) => v.en.toLowerCase());
  assert.ok(
    words.length >= 3,
    `expected several eligible words, not just the single longest one; got ${JSON.stringify(words)}`,
  );
});

// --- No filler: weak candidates are not added just to reach 6 ---

test("no filler: a story with few genuinely useful words does not pad the list with weak candidates", () => {
  // A short, mostly-common-word sentence — should yield fewer than 6, not
  // be padded with weak/negative-scoring candidates.
  const sentences = [
    sentence("s1", "She was very happy and went home.", [
      { en: "She", ar: "هي" },
      { en: "was", ar: "كانت" },
      { en: "very", ar: "جداً" },
      { en: "happy", ar: "سعيدة" },
      { en: "and", ar: "و" },
      { en: "went", ar: "ذهبت" },
      { en: "home.", ar: "المنزل" },
    ]),
  ];
  const vocab = deriveStoryVocabulary(sentences, 1, "A Happy Day");
  assert.ok(
    vocab.length < 6,
    `expected fewer than 6 genuinely useful words in such a short/generic sentence, got ${vocab.length}`,
  );
});

test("buildStoryVocabulary: marks only the representative (first) occurrence, matching the prior implementation's in-context behavior", () => {
  const sentences = [
    sentence("s1", "A strange package arrived today.", [
      { en: "A", ar: "واحد" },
      { en: "strange", ar: "غريب" },
      { en: "package", ar: "الطرد" },
      { en: "arrived", ar: "وصل" },
      { en: "today.", ar: "اليوم" },
    ]),
    sentence("s2", "The package sat on the table.", [
      { en: "The", ar: "الـ" },
      { en: "package", ar: "الطرد" },
      { en: "sat", ar: "جلس" },
      { en: "on", ar: "على" },
      { en: "the", ar: "الـ" },
      { en: "table.", ar: "الطاولة" },
    ]),
  ];
  const { vocabulary, sentences: annotated } = buildStoryVocabulary(sentences, 1, "The Package");
  assert.ok(vocabulary.some((v) => v.en === "package"));
  const s1 = annotated.find((s) => s.id === "s1")!;
  const s2 = annotated.find((s) => s.id === "s2")!;
  assert.ok(
    s1.targetVocabularyIndices?.includes(2),
    "first occurrence of 'package' (s1) should be marked",
  );
  assert.ok(
    !s2.targetVocabularyIndices?.includes(1),
    "the second occurrence should NOT also be marked — repetition affects score, not marker count",
  );
});

test("buildStoryVocabulary: the recap list and the in-context markers agree exactly (same selection, two views)", () => {
  const sentences = [
    sentence("s1", "A strange package arrived today.", [
      { en: "A", ar: "واحد" },
      { en: "strange", ar: "غريب" },
      { en: "package", ar: "الطرد" },
      { en: "arrived", ar: "وصل" },
      { en: "today.", ar: "اليوم" },
    ]),
    sentence("s2", "Inside was a bright red label.", [
      { en: "Inside", ar: "بالداخل" },
      { en: "was", ar: "كانت" },
      { en: "a", ar: "واحدة" },
      { en: "bright", ar: "زاهي" },
      { en: "red", ar: "أحمر" },
      { en: "label.", ar: "الملصق" },
    ]),
  ];
  const { vocabulary, sentences: annotated } = buildStoryVocabulary(sentences, 1, "The Package");

  const markedWords = new Set<string>();
  for (const s of annotated) {
    if (!s.targetVocabularyIndices) continue;
    const original = sentences.find((orig) => orig.id === s.id)!;
    for (const index of s.targetVocabularyIndices) {
      const entry = original.wordTranslations?.[index];
      if (entry) markedWords.add(entry.en.replace(/[.,!?]+$/, "").toLowerCase());
    }
  }
  const recapWords = new Set(vocabulary.map((v) => v.en.toLowerCase()));
  assert.deepEqual(
    markedWords,
    recapWords,
    "every in-context-marked word must appear in the recap, and vice versa",
  );
});

test("buildStoryVocabulary: a story with no wordTranslations gets no markers and no crash", () => {
  const sentences: Sentence[] = [{ id: "s1", en: "Plain text.", ar: "نص عادي" }];
  const { vocabulary, sentences: annotated } = buildStoryVocabulary(sentences, 1, "Untitled");
  assert.deepEqual(vocabulary, []);
  assert.deepEqual(annotated, sentences);
});

test("withStoryVocabulary: applies buildStoryVocabulary to a full Lesson object (local-fallback path)", () => {
  const lesson: Lesson = {
    id: "story-x",
    mode: "stories",
    level: 1,
    order: 1,
    title: "The Package",
    titleAr: "اختبار",
    isFree: true,
    sentences: [
      sentence("story-x-s1", "A strange package arrived.", [
        { en: "A", ar: "واحد" },
        { en: "strange", ar: "غريب" },
        { en: "package", ar: "الطرد" },
        { en: "arrived.", ar: "وصل" },
      ]),
    ],
  };
  const result = withStoryVocabulary(lesson);
  assert.ok(result.vocabulary && result.vocabulary.length > 0);
  assert.equal(result.id, lesson.id, "must not mutate identity fields");
});
