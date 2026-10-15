/**
 * No lesson is ever repeated. A passage that tells the story another passage — or a Daily
 * Lesson, or a Story — already tells, that borrows its lines, that reuses its title or asks
 * its question teaches nothing new and shows the learner the same thing twice. This finds
 * those repeats, so they are caught when a passage is written (the authored set is checked by
 * a test, the admin's JSON import checks against everything already in the database) and
 * never reach a learner.
 *
 * Pure: it works on a plain fingerprint of a piece of content, so the same rules compare a
 * passage with a passage, a lesson or a book. What it can judge is wording and subject — the
 * title, the one-line premise, the lines, the questions and the words a story is made of. It
 * cannot judge a plot told in other words; that stays with whoever writes the passage, who
 * should read the neighbours first.
 */

/** What is compared of one piece of content. */
export interface ContentFingerprint {
  /** Where it lives, in words an author recognises: "Passage the-night-class", "Story “The Rumor”". */
  label: string;
  title: string;
  /** The one-line premise (a passage's summary, a lesson's description). May be empty. */
  summary: string;
  /** The English lines, in order. */
  lines: string[];
  /** The English questions asked. May be empty. */
  questions: string[];
}

export interface DuplicateFinding {
  a: string;
  b: string;
  /** Plain words: what the two share. */
  reason: string;
}

/** Words that carry no subject: leaving them out leaves what a text is about. */
const STOPWORDS = new Set(
  (
    "a about above after again all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just let like me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves " +
    "don doesn didn isn aren wasn weren won wouldn couldn shouldn haven hasn hadn ll ve re s t d m okay yes yeah please thank thanks oh well really maybe still even ever never always sometimes one two three four five first second next last good bad big little small new old much many get got go going gone went come came take took make made say said says tell told ask asked see saw look looked want wanted know thing things something nothing everything anything day time way people"
  ).split(/\s+/),
);

const ARTICLES = new Set(["the", "a", "an"]);

export function tokensOf(text: string): string[] {
  return (
    text
      .toLowerCase()
      .replace(/[’]/g, "'")
      .replace(/'s\b/g, "")
      .match(/[a-z]+(?:'[a-z]+)?/g) ?? []
  );
}

/** A title without its leading article and punctuation: "The Quiet Neighbor" and "Quiet Neighbor!" are one title. */
export function titleKey(title: string): string {
  const words = tokensOf(title);
  while (words.length > 1 && ARTICLES.has(words[0]!)) words.shift();
  return words.join(" ");
}

function contentWords(text: string): string[] {
  return tokensOf(text).filter((word) => word.length >= 4 && !STOPWORDS.has(word));
}

function jaccard<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const item of a) if (b.has(item)) shared += 1;
  return shared / (a.size + b.size - shared);
}

/** Runs of `size` consecutive words inside each line (never across two lines): what copied wording leaves behind. */
function shinglesOf(lines: readonly string[], size: number): Set<string> {
  const shingles = new Set<string>();
  for (const line of lines) {
    const words = tokensOf(line);
    for (let start = 0; start + size <= words.length; start += 1) {
      shingles.add(words.slice(start, start + size).join(" "));
    }
  }
  return shingles;
}

/** The words a content is most about: the commonest content words of its title and lines. */
function subjectOf(fingerprint: ContentFingerprint, size: number): Set<string> {
  const counts = new Map<string, number>();
  for (const word of contentWords([fingerprint.title, ...fingerprint.lines].join(" "))) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return new Set(
    [...counts]
      .sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))
      .slice(0, size)
      .map(([word]) => word),
  );
}

/** How alike two titles are, 0 to 1: the share of their words they have in common. */
function titleLikeness(a: string, b: string): number {
  return jaccard(new Set(titleKey(a).split(" ")), new Set(titleKey(b).split(" ")));
}

/** The levels above which two pieces of content count as the same. Chosen against the real content (see the tests): every pair already in the library sits well below them. */
export const DUPLICATE_LIMITS = {
  /** Titles sharing at least this share of their words (and at least two words each). */
  title: 0.6,
  /** Premises sharing at least this share of their subject words. */
  summary: 0.4,
  /** Shared four-word runs: at least this many, and this share of the shorter text's runs. */
  shingles: { count: 3, share: 0.04 },
  /** Subject: the commonest words of the two texts overlap by at least this share. */
  subject: 0.3,
  /** The size of a subject. */
  subjectSize: 25,
  /** A question counts as repeated only when it is at least this many words long. */
  questionWords: 6,
} as const;

/** The raw measures two pieces of content are judged by (also what the audit script prints). */
export interface Likeness {
  sameTitle: boolean;
  /** 0 to 1: the share of their words two titles have in common (0 when either is a single word). */
  title: number;
  /** 0 to 1: the share of their subject words two premises have in common (0 when either is too short to judge). */
  premise: number;
  /** Runs of four words the two texts share, and that count as a share of the shorter text's runs. */
  sharedRuns: number;
  runShare: number;
  /** 0 to 1: the share of their commonest words two texts have in common (0 when either is too short to judge). */
  subject: number;
  /** The questions asked identically (long enough to mean something). */
  repeatedQuestions: string[];
}

export function likenessOf(a: ContentFingerprint, b: ContentFingerprint): Likeness {
  const keyA = titleKey(a.title);
  const keyB = titleKey(b.title);

  const premiseA = new Set(contentWords(a.summary));
  const premiseB = new Set(contentWords(b.summary));

  const runsA = shinglesOf(a.lines, 4);
  const runsB = shinglesOf(b.lines, 4);
  let sharedRuns = 0;
  for (const run of runsA) if (runsB.has(run)) sharedRuns += 1;

  const subjectA = subjectOf(a, DUPLICATE_LIMITS.subjectSize);
  const subjectB = subjectOf(b, DUPLICATE_LIMITS.subjectSize);

  const asked = new Set(
    a.questions
      .filter((question) => tokensOf(question).length >= DUPLICATE_LIMITS.questionWords)
      .map((question) => tokensOf(question).join(" ")),
  );

  return {
    sameTitle: keyA !== "" && keyA === keyB,
    title:
      keyA.split(" ").length >= 2 && keyB.split(" ").length >= 2
        ? titleLikeness(a.title, b.title)
        : 0,
    premise: premiseA.size >= 4 && premiseB.size >= 4 ? jaccard(premiseA, premiseB) : 0,
    sharedRuns,
    runShare: runsA.size > 0 && runsB.size > 0 ? sharedRuns / Math.min(runsA.size, runsB.size) : 0,
    subject: subjectA.size >= 10 && subjectB.size >= 10 ? jaccard(subjectA, subjectB) : 0,
    repeatedQuestions: b.questions.filter((question) => asked.has(tokensOf(question).join(" "))),
  };
}

/** Why two pieces of content are the same (empty: they are not). */
export function compareContent(a: ContentFingerprint, b: ContentFingerprint): string[] {
  const likeness = likenessOf(a, b);
  const reasons: string[] = [];
  if (likeness.sameTitle) reasons.push(`the same title, “${a.title}”`);
  else if (likeness.title >= DUPLICATE_LIMITS.title) {
    reasons.push(`almost the same title (“${a.title}” and “${b.title}”)`);
  }
  if (likeness.premise >= DUPLICATE_LIMITS.summary) reasons.push("the same one-line premise");
  if (
    likeness.sharedRuns >= DUPLICATE_LIMITS.shingles.count &&
    likeness.runShare >= DUPLICATE_LIMITS.shingles.share
  ) {
    reasons.push(`${likeness.sharedRuns} runs of four words in common — borrowed wording`);
  }
  if (likeness.subject >= DUPLICATE_LIMITS.subject) {
    reasons.push("the same subject: they are made of the same words");
  }
  if (likeness.repeatedQuestions.length > 0) {
    reasons.push(`the same question, “${likeness.repeatedQuestions[0]}”`);
  }
  return reasons;
}

/**
 * Every candidate set against everything it must not repeat. A candidate is compared with every
 * entry of `others` and with the candidates after it (so a set of new passages cannot repeat
 * itself either). Candidates and others may overlap in identity: a pair is only reported once.
 */
export function findDuplicates(
  candidates: readonly ContentFingerprint[],
  others: readonly ContentFingerprint[] = [],
): DuplicateFinding[] {
  const findings: DuplicateFinding[] = [];
  candidates.forEach((candidate, index) => {
    for (const other of [...candidates.slice(index + 1), ...others]) {
      if (other.label === candidate.label) continue;
      for (const reason of compareContent(candidate, other)) {
        findings.push({ a: candidate.label, b: other.label, reason });
      }
    }
  });
  return findings;
}

/** A finding as one sentence. */
export function describeFinding(finding: DuplicateFinding): string {
  return `${finding.a} and ${finding.b} have ${finding.reason}.`;
}
